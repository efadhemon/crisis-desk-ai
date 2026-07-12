import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileUploadHelper, IFileUploadResponse } from '@src/app/helpers/fileUpload.helper';
import { storageFileOptions } from '@src/shared';

@ApiTags('File Storage')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@Controller('internal/files')
export class FileStorageInternalController {
  constructor(private readonly fileUploadHelper: FileUploadHelper) {}

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: storageFileOptions,
      limits: { fileSize: 50 * 1024 * 1024 /* 50mb */ },
    }),
  )
  @Post()
  async uploadImage(@UploadedFiles() files: Express.Multer.File[]): Promise<IFileUploadResponse[]> {
    const uploadResponses: IFileUploadResponse[] = [];
    for (const file of files) {
      const uploadResponse = await this.fileUploadHelper.uploadFromPath({
        filePath: file.path,
        contentType: file.mimetype,
        isPublic: true,
      });
      uploadResponses.push(uploadResponse);
    }
    return uploadResponses;
  }
}
