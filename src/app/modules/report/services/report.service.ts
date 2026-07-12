import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@src/app/base';
import { IFindAllBaseFIlters } from '@src/app/interfaces';
import { SuccessResponse } from '@src/app/types';
import { Repository } from 'typeorm';
import { CreateReportDTO } from '../dtos/create-report.dto';
import { FilterReportDTO } from '../dtos/filter-report.dto';
import {
  ENUM_REPORT_CATEGORY,
  ENUM_REPORT_LANGUAGE,
  ENUM_REPORT_STATUS,
  ENUM_REPORT_URGENCY,
} from '../enums';
import { Report } from '../entities/report.entity';
import { AiService } from './ai.service';
import { DuplicateService } from './duplicate.service';
import { EmbeddingService } from './embedding.service';

export interface IReportStatsSummary {
  totalReports: number;
  criticalReports: number;
  pendingReports: number;
  resolvedReports: number;
  categoryBreakdown: Record<string, number>;
  urgencyBreakdown: Record<string, number>;
}

@Injectable()
export class ReportService extends BaseService<Report> {
  constructor(
    @InjectRepository(Report) private readonly reportRepo: Repository<Report>,
    private readonly aiService: AiService,
    private readonly embeddingService: EmbeddingService,
    private readonly duplicateService: DuplicateService,
  ) {
    super(reportRepo);
  }

  /** Submit a report: run AI triage, embed, detect duplicates, and persist. */
  async createReport(dto: CreateReportDTO): Promise<Report> {
    const language = dto.language ?? ENUM_REPORT_LANGUAGE.UNKNOWN;

    const ai = await this.aiService.classify({
      description: dto.description,
      location: dto.location,
      language,
    });

    const embedding = await this.embeddingService.embed(
      `${dto.description}\nLocation: ${dto.location}`,
    );

    const duplicate = await this.duplicateService.findDuplicate(embedding, ai.category);

    const created = await this.createOneBase({
      name: dto.name,
      contact: dto.contact,
      location: dto.location,
      description: dto.description,
      language,
      category: ai.category,
      urgency: ai.urgency,
      summary: ai.summary,
      suggestedAction: ai.suggestedAction,
      confidence: ai.confidence,
      possibleDuplicate: duplicate.possibleDuplicate,
      matchedReportId: duplicate.matchedReportId,
      status: ENUM_REPORT_STATUS.PENDING,
    });

    if (embedding) {
      await this.duplicateService.saveEmbedding(created.id, embedding);
    }

    return created;
  }

  /** List reports with filters + pagination. Maps `search` to the base search term. */
  async listReports(query: FilterReportDTO): Promise<SuccessResponse<Report[]>> {
    const { search, ...rest } = query;
    const filters = { ...rest } as IFindAllBaseFIlters<Report>;
    if (search) filters.searchTerm = search;
    return this.findAllBase(filters);
  }

  async getReport(id: string): Promise<Report> {
    const report = await this.findByIdBase(id);
    if (!report) throw new NotFoundException('Report not found.');
    return report;
  }

  async updateStatus(id: string, status: ENUM_REPORT_STATUS): Promise<Report> {
    const report = await this.findByIdBase(id);
    if (!report) throw new NotFoundException('Report not found.');
    return this.updateOneBase(id, { status });
  }

  async deleteReport(id: string): Promise<SuccessResponse> {
    const report = await this.findByIdBase(id);
    if (!report) throw new NotFoundException('Report not found.');
    return this.deleteOneBase(id);
  }

  async getStatsSummary(): Promise<IReportStatsSummary> {
    const totalReports = await this.reportRepo.count();

    const categoryMap = await this.groupCount('category');
    const urgencyMap = await this.groupCount('urgency');
    const statusMap = await this.groupCount('status');

    const categoryBreakdown: Record<string, number> = {};
    for (const category of Object.values(ENUM_REPORT_CATEGORY)) {
      categoryBreakdown[category] = categoryMap[category] ?? 0;
    }

    const urgencyBreakdown: Record<string, number> = {};
    for (const urgency of Object.values(ENUM_REPORT_URGENCY)) {
      urgencyBreakdown[urgency] = urgencyMap[urgency] ?? 0;
    }

    return {
      totalReports,
      criticalReports: urgencyMap[ENUM_REPORT_URGENCY.CRITICAL] ?? 0,
      pendingReports: statusMap[ENUM_REPORT_STATUS.PENDING] ?? 0,
      resolvedReports: statusMap[ENUM_REPORT_STATUS.RESOLVED] ?? 0,
      categoryBreakdown,
      urgencyBreakdown,
    };
  }

  private async groupCount(
    column: 'category' | 'urgency' | 'status',
  ): Promise<Record<string, number>> {
    const rows: Array<{ key: string; count: string }> = await this.reportRepo
      .createQueryBuilder('report')
      .select(`report.${column}`, 'key')
      .addSelect('COUNT(*)', 'count')
      .where(`report.${column} IS NOT NULL`)
      .groupBy(`report.${column}`)
      // Override the entity's default `orderBy: createdAt`, which is invalid with GROUP BY.
      .orderBy(`report.${column}`, 'ASC')
      .getRawMany();

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.key] = Number(row.count);
      return acc;
    }, {});
  }
}
