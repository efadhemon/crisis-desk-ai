import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { ReportController } from './controllers/report.controller';
import { Report } from './entities/report.entity';
import { AdminGuard } from './guards/admin.guard';
import { AdminAuthService } from './services/admin-auth.service';
import { AiService } from './services/ai.service';
import { DuplicateService } from './services/duplicate.service';
import { EmbeddingService } from './services/embedding.service';
import { ReportService } from './services/report.service';

const entities = [Report];
const services = [
  ReportService,
  AiService,
  EmbeddingService,
  DuplicateService,
  AdminAuthService,
  AdminGuard,
];
const controllers = [ReportController, AdminAuthController];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services],
  controllers: [...controllers],
  exports: [ReportService],
})
export class ReportModule {}
