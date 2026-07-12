import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, Logger } from '@nestjs/common';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ENV } from '@src/env';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export enum ENUM_BINARY_FILE_FOLDERS {
  INVOICES = 'invoices',
  WORKER_CVS = 'worker-cvs',
  ACADEMY_CERTIFICATES = 'academy-certificates',
}

export enum ENUM_BINARY_FILE_TYPES {
  PDF = 'application/pdf',
}

export interface IFileUploadPayload {
  key: string;
  body: Buffer | Readable;
  contentType: string;
  isPublic: boolean;
}
export interface IFileUploadResponse {
  key: string;
  url: string;
}

export interface IObjectBufferResult {
  buffer: Buffer;
  contentType?: string;
}

/** No per-request timeout — large profile ZIP exports may take a long time. */
const S3_HTTP_HANDLER = new NodeHttpHandler({
  requestTimeout: 0,
  connectionTimeout: 0,
});

@Injectable()
export class FileUploadHelper {
  constructor() {
    this.cdnUrl = ENV.s3.cdnUrl;
    this.bucketName = ENV.s3.bucket;
    this.rootFolder = ENV.s3.rootFolder;

    this.client = new S3Client({
      region: ENV.s3.region,
      endpoint: `https://${ENV.s3.endpoint}`,
      credentials: {
        accessKeyId: ENV.s3.accessKey,
        secretAccessKey: ENV.s3.secretKey,
      },
      forcePathStyle: false,
      requestHandler: S3_HTTP_HANDLER,
    });

    // Temporary S3 Storage old for delete old data from space don't remove it without any discussion
    this.bucketNameOld = ENV.s3Old.bucket;
    this.oldClient = new S3Client({
      region: ENV.s3Old.region,
      endpoint: `https://${ENV.s3Old.endpoint}`,
      credentials: {
        accessKeyId: ENV.s3Old.accessKey,
        secretAccessKey: ENV.s3Old.secretKey,
      },
      forcePathStyle: false,
      requestHandler: S3_HTTP_HANDLER,
    });

    this.logger.log('File Upload helper initialized');
  }

  private readonly logger = new Logger(FileUploadHelper.name);
  private client: S3Client;
  private readonly cdnUrl: string;
  private readonly bucketName: string;
  private readonly rootFolder: string;

  // Temporary S3 Storage old for delete old data from space don't remove it without any discussion
  private bucketNameOld: string;
  private oldClient: S3Client;

  getPublicUrl(key: string): string {
    return `${this.cdnUrl}/${key}`;
  }

  /**
   * Extracts the S3 object key from a CDN/public URL produced by this helper.
   * Returns undefined when the URL does not belong to the configured CDN.
   */
  resolveStorageKeyFromUrl(fileUrl: string): string | undefined {
    if (!fileUrl?.trim()) return undefined;

    const normalized = fileUrl.trim();
    const cdnPrefix = `${this.cdnUrl.replace(/\/$/, '')}/`;
    if (normalized.startsWith(cdnPrefix)) {
      return decodeURIComponent(normalized.slice(cdnPrefix.length));
    }

    try {
      const parsed = new URL(normalized);
      const cdn = new URL(this.cdnUrl);
      if (parsed.hostname === cdn.hostname) {
        return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  /**
   * Returns a readable stream for an S3 object, trying the primary bucket first
   * then the legacy bucket.
   */
  async getObjectStream(key: string): Promise<Readable> {
    const { buffer } = await this.getObjectBuffer(key);
    return Readable.from(buffer);
  }

  /**
   * Reads an entire S3 object into memory. Prefer this for ZIP/archive assembly
   * so binary files (PDFs) are not truncated by partial stream reads.
   */
  async getObjectBuffer(key: string): Promise<IObjectBufferResult> {
    try {
      return await this.readObjectBufferFromClient(this.client, this.bucketName, key);
    } catch (_error) {
      this.logger.warn(`Primary getObject failed for ${key}, trying old storage`);
      return this.readObjectBufferFromClient(this.oldClient, this.bucketNameOld, key);
    }
  }

  getFolderByMimeType(mimetype: string): string {
    if (mimetype) return mimetype.split('/')[0] + 's';
    return 'assets';
  }

  getAbsolutePath(filePath: string): string {
    return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  }

  /**
   * Optimized upload with multipart support
   */
  async uploadFile(payload: IFileUploadPayload): Promise<IFileUploadResponse> {
    const { key, body, contentType, isPublic = true } = payload;

    let finalKey = key;

    // Ensure the key includes the environment prefix
    // Example:
    // key: "videos/output.mp4", env: "staging"
    // After: "staging/videos/output.mp4"
    if (!finalKey?.startsWith(`${ENV.env}/`) && ENV.env) {
      finalKey = `${ENV.env}/${finalKey}`;
    }

    // Ensure the key includes the root folder
    // Example:
    // key: "videos/output.mp4", rootFolder: "uploads"
    // After: "uploads/videos/output.mp4"
    if (!finalKey.startsWith(`${this.rootFolder}/`) && this.rootFolder) {
      finalKey = `${this.rootFolder}/${finalKey}`;
    }

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: finalKey,
          Body: body,
          ContentType: contentType,
          ACL: isPublic ? 'public-read' : 'private',
        },
        // Optimized: Enable multipart for files > 5MB
        queueSize: 4, // Number of concurrent parts
        partSize: 1024 * 1024 * 5, // 5MB per part
        leavePartsOnError: false, // Clean up parts on failure
      });

      await upload.done();
      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key: finalKey,
        url: this.getPublicUrl(finalKey),
      };
    } catch (error) {
      this.logger.error(`Upload failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Optimized upload with progress tracking and multipart support
   */
  async uploadFileWithProgress(
    payload: IFileUploadPayload & {
      onProgress?: (progress: number) => void;
    },
  ): Promise<IFileUploadResponse> {
    const { key, body, contentType, isPublic = true, onProgress } = payload;

    let finalKey = key;

    // Ensure the key includes the environment prefix
    // Example:
    // key: "videos/output.mp4", env: "staging"
    // After: "staging/videos/output.mp4"
    if (!finalKey?.startsWith(`${ENV.env}/`) && ENV.env) {
      finalKey = `${ENV.env}/${finalKey}`;
    }

    // Ensure the key includes the root folder
    // Example:
    // key: "videos/output.mp4", rootFolder: "uploads"
    // After: "uploads/videos/output.mp4"
    if (!finalKey.startsWith(`${this.rootFolder}/`) && this.rootFolder) {
      finalKey = `${this.rootFolder}/${finalKey}`;
    }

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: finalKey,
          Body: body,
          ContentType: contentType,
          ACL: isPublic ? 'public-read' : 'private',
        },
        // Optimized for large video files
        queueSize: 4, // Upload 4 parts concurrently
        partSize: 1024 * 1024 * 10, // 10MB per part (faster for large files)
        leavePartsOnError: false, // Clean up parts on failure
      });

      // Track progress
      if (onProgress) {
        upload.on('httpUploadProgress', (progress) => {
          if (progress.loaded && progress.total) {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            onProgress(percentage);
          }
        });
      }

      await upload.done();
      this.logger.log(`File uploaded successfully with progress tracking: ${finalKey}`);

      return {
        key: finalKey,
        url: this.getPublicUrl(finalKey),
      };
    } catch (error) {
      this.logger.error(`Upload with progress failed for ${key}:`, error);
      throw error;
    }
  }

  async uploadFromPath(payload: {
    filePath: string;
    contentType: string;
    isPublic: boolean;

    /**
     * Optional key for the uploaded file
     * if not provided, a key will be generated based on folder, timestamp and file extension
     * */
    key?: string;
  }): Promise<IFileUploadResponse> {
    const { filePath, contentType, key, isPublic = true } = payload;

    const absoluteFilePath = this.getAbsolutePath(filePath);
    try {
      const fileStream = fs.createReadStream(absoluteFilePath);
      const fileExtension = path.extname(absoluteFilePath);

      const folder = this.getFolderByMimeType(contentType);

      const finalKey = key ?? `${folder}/${Date.now()}${fileExtension}`;
      const uploadResult = await this.uploadFile({
        key: finalKey,
        body: fileStream,
        contentType,
        isPublic,
      });

      try {
        this.logger.log(`Deleting temp file ${absoluteFilePath}`);
        fs.unlinkSync(absoluteFilePath);
      } catch (error) {
        this.logger.warn(`Failed to delete temp file ${absoluteFilePath}:`, error);
      }

      return uploadResult;
    } catch (error) {
      this.logger.error(`Upload failed for ${absoluteFilePath}:`, error);
      throw error;
    }
  }

  public async uploadBinary(payload: {
    folder: ENUM_BINARY_FILE_FOLDERS;
    contentType: ENUM_BINARY_FILE_TYPES;
    binary: Buffer | Readable;
    fileName: string;
  }): Promise<IFileUploadResponse> {
    const { folder, fileName, binary, contentType } = payload;

    const key = `${folder}/${fileName}`;

    return this.uploadFile({ key, body: binary, contentType, isPublic: true });
  }

  async uploadFromUrl(fileUrl: string): Promise<IFileUploadResponse> {
    if (!fileUrl) {
      throw new Error('File URL is required');
    }

    // Fetch image as stream
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      // ...UNLIMITED_AXIOS_DOWNLOAD_CONFIG,
    });
    const contentType = response.headers['content-type']?.toString() ?? '';
    const extension = contentType.split('/')[1];

    return this.uploadBinary({
      folder: this.getFolderByMimeType(contentType) as ENUM_BINARY_FILE_FOLDERS,
      fileName: `${Date.now()}.${extension}`,
      binary: Buffer.from(response.data),
      contentType: contentType as ENUM_BINARY_FILE_TYPES,
    });
  }

  async deleteFile(key: string): Promise<void> {
    this.logger.log(`Deleting file: ${key}`);
    try {
      try {
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
      } catch (error) {
        this.logger.warn(`Primary delete failed for ${key}, trying old storage:`, error);
        // Try deleting from old storage as fallback
        await this.oldClient.send(
          new DeleteObjectCommand({
            Bucket: this.bucketNameOld,
            Key: key,
          }),
        );
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  async deleteFolder(folderKey: string): Promise<void> {
    const prefix = folderKey.endsWith('/') ? folderKey : `${folderKey}/`;
    let token: string | undefined;

    do {
      try {
        try {
          const list = await this.client.send(
            new ListObjectsV2Command({
              Bucket: this.bucketName,
              Prefix: prefix,
              ContinuationToken: token,
            }),
          );

          if (!list.Contents?.length) return;

          await this.client.send(
            new DeleteObjectsCommand({
              Bucket: this.bucketName,
              Delete: {
                Objects: list.Contents.map((obj) => ({
                  Key: obj.Key!,
                })),
              },
            }),
          );

          token = list.NextContinuationToken;
        } catch (error) {
          this.logger.warn(
            `Primary delete folder failed for ${folderKey}, trying old storage:`,
            error,
          );
          // Try deleting from old storage as fallback
          const list = await this.oldClient.send(
            new ListObjectsV2Command({
              Bucket: this.bucketNameOld,
              Prefix: prefix,
              ContinuationToken: token,
            }),
          );

          if (!list.Contents?.length) return;

          await this.oldClient.send(
            new DeleteObjectsCommand({
              Bucket: this.bucketNameOld,
              Delete: {
                Objects: list.Contents.map((obj) => ({
                  Key: obj.Key!,
                })),
              },
            }),
          );
          token = list.NextContinuationToken;
        }
      } catch (error) {
        this.logger.error(`Failed to delete folder ${folderKey}:`, error);
        throw error;
      }
    } while (token);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error: any) {
      if (error?.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /* ───────────────────────── DOWNLOAD (BUN SAFE) ───────────────────────── */
  /**
   * ⚠️ Avoid buffering large files in memory
   * Stream instead
   */
  async downloadToFile(key: string, destinationPath: string): Promise<void> {
    try {
      this.logger.log(`Downloading file: ${key}`);
      this.logger.log(`Saving to: ${destinationPath}`);

      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (!response.Body) {
        throw new Error(`Empty body for key: ${key}`);
      }

      await pipeline(response.Body as NodeJS.ReadableStream, fs.createWriteStream(destinationPath));
    } catch (error) {
      this.logger.error(`Download failed for ${key}:`, error);
      throw error;
    }
  }
  private async readObjectBufferFromClient(
    client: S3Client,
    bucket: string,
    key: string,
  ): Promise<IObjectBufferResult> {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty body for key: ${key}`);
    }

    const bytes = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      contentType: response.ContentType,
    };
  }
}
