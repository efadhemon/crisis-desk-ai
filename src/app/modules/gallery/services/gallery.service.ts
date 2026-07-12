import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@src/app/base';
import { FileUploadHelper } from '@src/app/helpers/fileUpload.helper';
import { SuccessResponse } from '@src/app/types';
import { asyncForEach } from '@src/shared';
import {
  commitTransaction,
  rollbackTransaction,
  startTransaction,
} from '@src/shared/utils/dborm.utils';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { CreateGalleryDTO } from '../dtos/create.dto';
import { Gallery } from '../entities/gallery.entity';

@Injectable()
export class GalleryService extends BaseService<Gallery> {
  constructor(
    @InjectRepository(Gallery)
    public readonly repo: Repository<Gallery>,
    private readonly dataSource: DataSource,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {
    super(repo);
  }

  async findTypes(): Promise<any[]> {
    try {
      const query = `
        SELECT "mimetype", COUNT(id) AS "count"
        FROM ${Gallery.tableName}
        GROUP BY "mimetype"
      `;
      const types = await this.dataSource.query(query);
      return types;
    } catch {
      throw new NotFoundException('Types counts not found');
    }
  }

  async uploadFile(file: Express.Multer.File, createdBy?: any): Promise<SuccessResponse<Gallery>> {
    const queryRunner = await startTransaction(this.dataSource);

    let createdGallery = null;

    try {
      const fileData = await this.fileUploadHelper.uploadFromPath({
        filePath: file.path,
        contentType: file.mimetype,
        isPublic: true,
      });
      if (!fileData) {
        throw new Error('File not uploaded');
      }
      const extension = path.extname(file.path);

      const galleryData: CreateGalleryDTO = {
        title: file?.originalname?.replace(extension, ''),
        url: fileData?.url,
        key: fileData?.key,
        mimetype: file?.mimetype,
        extension: extension,
        createdBy: createdBy || null,
      };
      createdGallery = await queryRunner.manager.save(Object.assign(new Gallery(), galleryData));

      if (!createdGallery) {
        throw new Error('Gallery not created');
      }
      await commitTransaction(queryRunner);
      return createdGallery;
    } catch (error) {
      await rollbackTransaction(queryRunner);
      throw error;
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    createdBy?: any,
  ): Promise<SuccessResponse<Gallery[]>> {
    const queryRunner = await startTransaction(this.dataSource);

    const createdGalleryData = [];

    try {
      await asyncForEach(files, async (file) => {
        const extension = path.extname(file.path);

        const fileData = await this.fileUploadHelper.uploadFromPath({
          filePath: file.path,
          contentType: file.mimetype,
          isPublic: true,
        });

        const galleryData: CreateGalleryDTO = {
          title: file?.originalname?.replace(extension, ''),
          url: fileData?.url,
          key: fileData?.key,
          mimetype: file?.mimetype,
          extension: extension,
          createdBy: createdBy || null,
        };
        const createdGallery = await queryRunner.manager.save(
          Object.assign(new Gallery(), galleryData),
        );

        createdGalleryData.push(createdGallery);
      });

      if (!createdGalleryData?.length) {
        throw new Error('Gallery not created');
      }

      await commitTransaction(queryRunner);
    } catch (error) {
      await rollbackTransaction(queryRunner);
      throw error;
    }

    if (createdGalleryData) {
      return createdGalleryData as any;
    }
  }

  async removeGallery(id: string): Promise<SuccessResponse> {
    const deletedItem = await this.findByIdBase(id);
    try {
      await this.fileUploadHelper.deleteFile(deletedItem?.key);
      return this.deleteOneBase(id);
    } catch (error) {
      throw error;
    }
  }

  async bulkRemoveGallery(ids: string[]): Promise<SuccessResponse> {
    try {
      await asyncForEach(ids, async (id) => {
        const deletedItem = await this.findByIdBase(id);
        this.fileUploadHelper.deleteFile(deletedItem?.key);
      });
      return this.deleteBulkBase(ids);
    } catch (error) {
      throw error;
    }
  }
}
