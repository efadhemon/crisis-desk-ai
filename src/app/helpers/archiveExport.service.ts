import { Injectable, Logger } from '@nestjs/common';
import { FileUploadHelper } from '@src/app/helpers/fileUpload.helper';
import {
  IArchiveExportEntry,
  IArchiveExportOptions,
  IArchiveZipStreamResult,
} from '@src/app/types/archiveExport.types';
import { resolveArchiveEntryPath } from '@src/app/utils/fileExtension.util';
import { UNLIMITED_AXIOS_DOWNLOAD_CONFIG } from '@src/shared/constants/httpDownload.constants';
import { disableHttpRequestTimeouts } from '@src/shared/utils/httpServer.utils';
import type { Archiver } from 'archiver';
import * as archiverModule from 'archiver';

const ZipArchive = (
  archiverModule as typeof archiverModule & {
    ZipArchive: new (options?: { zlib?: { level?: number } }) => Archiver;
  }
).ZipArchive;
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class ArchiveExportService {
  constructor(private readonly fileUploadHelper: FileUploadHelper) {}

  private readonly logger = new Logger(ArchiveExportService.name);

  async createZipStream(
    entries: IArchiveExportEntry[],
    options?: IArchiveExportOptions,
  ): Promise<IArchiveZipStreamResult> {
    const archive = new ZipArchive({ zlib: { level: 6 } });
    let added = 0;
    let skipped = 0;
    let failed = 0;

    const finalize = async (): Promise<{ added: number; skipped: number; failed: number }> => {
      for (const entry of entries) {
        if (!entry.path?.trim()) {
          skipped++;
          continue;
        }

        try {
          const resolved = await this.resolveEntryBuffer(entry);
          if (!resolved?.buffer.length) {
            skipped++;
            continue;
          }
          const archivePath = resolveArchiveEntryPath(
            entry.path,
            resolved.buffer,
            resolved.contentType,
            entry.extension,
          );
          archive.append(resolved.buffer, { name: archivePath });
          added++;
        } catch (error) {
          failed++;
          this.logger.warn(`Skipping archive entry "${entry.path}": ${(error as Error).message}`);
          if (!options?.skipOnError) {
            archive.abort();
            throw error;
          }
        }
      }

      await archive.finalize();
      return { added, skipped, failed };
    };

    return { stream: archive, finalize };
  }

  async pipeZipToResponse(
    entries: IArchiveExportEntry[],
    res: Response,
    filename: string,
    options?: IArchiveExportOptions,
  ): Promise<{ added: number; skipped: number; failed: number }> {
    const { stream, finalize } = await this.createZipStream(entries, {
      skipOnError: true,
      ...options,
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    disableHttpRequestTimeouts(res.req, res);

    stream.on('error', (error) => {
      this.logger.error('Archive stream error', error);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });

    stream.pipe(res);
    return finalize();
  }

  private async resolveEntryBuffer(
    entry: IArchiveExportEntry,
  ): Promise<{ buffer: Buffer; contentType?: string } | null> {
    if (entry.key) {
      return this.fileUploadHelper.getObjectBuffer(entry.key);
    }

    if (entry.url) {
      const key = this.fileUploadHelper.resolveStorageKeyFromUrl(entry.url);
      if (key) {
        return this.fileUploadHelper.getObjectBuffer(key);
      }

      const response = await axios.get<ArrayBuffer>(entry.url, {
        responseType: 'arraybuffer',
        maxRedirects: 5,
        ...UNLIMITED_AXIOS_DOWNLOAD_CONFIG,
      });
      const contentType = response.headers['content-type'] as string | undefined;
      return {
        buffer: Buffer.from(response.data),
        contentType,
      };
    }

    return null;
  }
}
