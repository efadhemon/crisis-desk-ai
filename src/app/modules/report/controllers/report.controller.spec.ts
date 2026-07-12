import { Test, TestingModule } from '@nestjs/testing';
import { SuccessResponse } from '@src/app/types';
import { ENUM_REPORT_CATEGORY, ENUM_REPORT_STATUS, ENUM_REPORT_URGENCY } from '../enums';
import { Report } from '../entities/report.entity';
import { AdminGuard } from '../guards/admin.guard';
import { ReportService } from '../services/report.service';
import { ReportController } from './report.controller';

describe('ReportController', () => {
  let controller: ReportController;
  let service: {
    createReport: jest.Mock;
    listReports: jest.Mock;
    getReport: jest.Mock;
    updateStatus: jest.Mock;
    deleteReport: jest.Mock;
    getStatsSummary: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createReport: jest.fn(),
      listReports: jest.fn(),
      getReport: jest.fn(),
      updateStatus: jest.fn(),
      deleteReport: jest.fn(),
      getStatsSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: service }],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ReportController);
  });

  it('wraps a created report in a SuccessResponse', async () => {
    const report = { id: 'r1', category: ENUM_REPORT_CATEGORY.FIRE } as Report;
    service.createReport.mockResolvedValue(report);

    const res = await controller.create({ location: 'Sylhet', description: 'fire' });

    expect(res).toBeInstanceOf(SuccessResponse);
    expect(res.success).toBe(true);
    expect(res.data).toBe(report);
  });

  it('returns the analytics summary', async () => {
    const summary = {
      totalReports: 1,
      criticalReports: 1,
      pendingReports: 1,
      resolvedReports: 0,
      categoryBreakdown: {},
      urgencyBreakdown: {},
    };
    service.getStatsSummary.mockResolvedValue(summary);

    const res = await controller.stats();

    expect(res.data).toBe(summary);
  });

  it('updates a report status', async () => {
    const report = { id: 'r1', status: ENUM_REPORT_STATUS.ASSIGNED } as Report;
    service.updateStatus.mockResolvedValue(report);

    const res = await controller.updateStatus('r1', { status: ENUM_REPORT_STATUS.ASSIGNED });

    expect(service.updateStatus).toHaveBeenCalledWith('r1', ENUM_REPORT_STATUS.ASSIGNED);
    expect(res.data).toBe(report);
  });

  it('delegates deletion to the service', async () => {
    const deleteResponse = new SuccessResponse('Report deleted successfully', null);
    service.deleteReport.mockResolvedValue(deleteResponse);

    const res = await controller.remove('r1');

    expect(service.deleteReport).toHaveBeenCalledWith('r1');
    expect(res).toBe(deleteResponse);
  });

  it('lists reports via the service', async () => {
    const list = new SuccessResponse<Report[]>('ok', [
      { id: 'r1', urgency: ENUM_REPORT_URGENCY.HIGH } as Report,
    ]);
    service.listReports.mockResolvedValue(list);

    const res = await controller.findAll({} as never);

    expect(res).toBe(list);
  });
});
