import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './controllers/report.controller';
import { Report } from './entities/report.entity';
import { AiService } from './services/ai.service';
import { DuplicateService } from './services/duplicate.service';
import { EmbeddingService } from './services/embedding.service';
import { ReportService } from './services/report.service';

const entities = [Report];
const services = [ReportService, AiService, EmbeddingService, DuplicateService];
const controllers = [ReportController];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services],
  controllers: [...controllers],
  exports: [ReportService],
})
export class ReportModule {}
