import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpersModule } from '@src/app/helpers/helpers.module';

import { FileUploadController } from './controllers/fileUpload.controller';
import { GalleryController } from './controllers/gallery.controller';
import { Gallery } from './entities/gallery.entity';
import { GalleryService } from './services/gallery.service';

const entities = [Gallery];
const services = [GalleryService];
const subscribers = [];

const controllers = [FileUploadController, GalleryController];

const modules = [HelpersModule, HttpModule];

@Module({
  imports: [...modules, TypeOrmModule.forFeature([...entities])],
  providers: [...services, ...subscribers],
  exports: [...services, ...subscribers],
  controllers: [...controllers],
})
export class GalleryModule {}
