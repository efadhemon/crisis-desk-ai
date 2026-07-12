import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ENUM_REPORT_CATEGORY, ENUM_REPORT_STATUS, ENUM_REPORT_URGENCY } from '../enums';
import { Report } from '../entities/report.entity';
import { AiService } from './ai.service';
import { DuplicateService } from './duplicate.service';
import { EmbeddingService } from './embedding.service';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let aiService: { classify: jest.Mock };
  let embeddingService: { embed: jest.Mock };
  let duplicateService: { findDuplicate: jest.Mock; saveEmbedding: jest.Mock };
  let repo: {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const makeQb = (rows: Array<{ key: string; count: string }>) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  });

  beforeEach(async () => {
    aiService = { classify: jest.fn() };
    embeddingService = { embed: jest.fn() };
    duplicateService = { findDuplicate: jest.fn(), saveEmbedding: jest.fn() };
    repo = { count: jest.fn(), createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: getRepositoryToken(Report), useValue: repo },
        { provide: AiService, useValue: aiService },
        { provide: EmbeddingService, useValue: embeddingService },
        { provide: DuplicateService, useValue: duplicateService },
      ],
    }).compile();

    service = module.get(ReportService);
  });

  it('runs the full triage pipeline on create', async () => {
    aiService.classify.mockResolvedValue({
      category: ENUM_REPORT_CATEGORY.FIRE,
      urgency: ENUM_REPORT_URGENCY.CRITICAL,
      summary: 'summary',
      suggestedAction: 'act',
      confidence: 0.9,
      fallbackUsed: false,
    });
    embeddingService.embed.mockResolvedValue([0.1, 0.2]);
    duplicateService.findDuplicate.mockResolvedValue({
      possibleDuplicate: true,
      matchedReportId: 'match-1',
    });

    const created = { id: 'new-1', category: ENUM_REPORT_CATEGORY.FIRE } as Report;
    jest.spyOn(service, 'createOneBase').mockResolvedValue(created);

    const result = await service.createReport({
      location: 'Sylhet',
      description: 'fire and trapped people',
    });

    expect(aiService.classify).toHaveBeenCalled();
    expect(duplicateService.findDuplicate).toHaveBeenCalledWith(
      [0.1, 0.2],
      ENUM_REPORT_CATEGORY.FIRE,
    );
    expect(service.createOneBase).toHaveBeenCalledWith(
      expect.objectContaining({
        category: ENUM_REPORT_CATEGORY.FIRE,
        urgency: ENUM_REPORT_URGENCY.CRITICAL,
        possibleDuplicate: true,
        matchedReportId: 'match-1',
        status: ENUM_REPORT_STATUS.PENDING,
      }),
    );
    expect(duplicateService.saveEmbedding).toHaveBeenCalledWith('new-1', [0.1, 0.2]);
    expect(result).toBe(created);
  });

  it('skips saving embedding when none is produced', async () => {
    aiService.classify.mockResolvedValue({
      category: ENUM_REPORT_CATEGORY.OTHER,
      urgency: ENUM_REPORT_URGENCY.MEDIUM,
      summary: 's',
      suggestedAction: 'a',
      confidence: 0,
      fallbackUsed: true,
    });
    embeddingService.embed.mockResolvedValue(null);
    duplicateService.findDuplicate.mockResolvedValue({
      possibleDuplicate: false,
      matchedReportId: null,
    });
    jest.spyOn(service, 'createOneBase').mockResolvedValue({ id: 'n2' } as Report);

    await service.createReport({ location: 'x', description: 'y' });

    expect(duplicateService.saveEmbedding).not.toHaveBeenCalled();
  });

  it('builds the analytics summary', async () => {
    repo.count.mockResolvedValue(3);
    repo.createQueryBuilder
      .mockReturnValueOnce(makeQb([{ key: 'fire', count: '2' }]))
      .mockReturnValueOnce(
        makeQb([
          { key: 'critical', count: '1' },
          { key: 'medium', count: '2' },
        ]),
      )
      .mockReturnValueOnce(
        makeQb([
          { key: 'pending', count: '2' },
          { key: 'resolved', count: '1' },
        ]),
      );

    const summary = await service.getStatsSummary();

    expect(summary.totalReports).toBe(3);
    expect(summary.criticalReports).toBe(1);
    expect(summary.pendingReports).toBe(2);
    expect(summary.resolvedReports).toBe(1);
    expect(summary.categoryBreakdown.fire).toBe(2);
    expect(summary.categoryBreakdown.flood).toBe(0);
    expect(summary.urgencyBreakdown.critical).toBe(1);
  });
});
