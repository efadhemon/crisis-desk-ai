import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpersModule } from '@src/app/helpers/helpers.module';

import { FileStorageInternalController } from './controllers/internal/fileUpload.internal.controller';
import { GalleryInternalController } from './controllers/internal/gallery.internal.controller';
import { Gallery } from './entities/gallery.entity';
import { GalleryService } from './services/gallery.service';

const entities = [Gallery];
const services = [GalleryService];
const subscribers = [];

const internalControllers = [FileStorageInternalController, GalleryInternalController];

const modules = [HelpersModule, HttpModule];

@Module({
  imports: [...modules, TypeOrmModule.forFeature([...entities])],
  providers: [...services, ...subscribers],
  exports: [...services, ...subscribers],
  controllers: [...internalControllers],
})
export class GalleryModule {}
