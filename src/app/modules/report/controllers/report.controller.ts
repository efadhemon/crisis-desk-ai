import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@src/app/decorators/publicRoute.decorator';
import {
  CacheInterceptor,
  CacheKey,
  CacheRevalidateKeys,
  CacheTTL,
  ENUM_CACHE_TTL,
} from '@src/app/modules/@cache';
import { SuccessResponse } from '@src/app/types';
import { CreateReportDTO } from '../dtos/create-report.dto';
import { FilterReportDTO } from '../dtos/filter-report.dto';
import { UpdateReportStatusDTO } from '../dtos/update-status.dto';
import { Report } from '../entities/report.entity';
import { IReportStatsSummary, ReportService } from '../services/report.service';

@ApiTags('Reports')
@Controller(Report.apiRouteName)
@UseInterceptors(CacheInterceptor)
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Public()
  @Post()
  @CacheRevalidateKeys('reports')
  @ApiOperation({ summary: 'Submit a new citizen report (AI triage + duplicate detection).' })
  async create(@Body() body: CreateReportDTO): Promise<SuccessResponse<Report>> {
    const report = await this.service.createReport(body);
    return new SuccessResponse('Report submitted successfully', report);
  }

  @Public()
  @Get()
  @CacheKey('reports')
  @CacheTTL(ENUM_CACHE_TTL.FIVE_MINUTES)
  @ApiOperation({
    summary: 'List reports with filters (category, urgency, status, search, dates).',
  })
  async findAll(@Query() query: FilterReportDTO): Promise<SuccessResponse<Report[]>> {
    return this.service.listReports(query);
  }

  @Public()
  @Get('stats/summary')
  @CacheKey('reports:stats')
  @CacheTTL(ENUM_CACHE_TTL.FIVE_MINUTES)
  @ApiOperation({ summary: 'Analytics summary (totals + category/urgency breakdowns).' })
  async stats(): Promise<SuccessResponse<IReportStatsSummary>> {
    const summary = await this.service.getStatsSummary();
    return new SuccessResponse('Report statistics fetched successfully', summary);
  }

  @Public()
  @Get(':id')
  @CacheKey('report:{id}')
  @CacheTTL(ENUM_CACHE_TTL.TEN_MINUTES)
  @ApiOperation({ summary: 'Get a single report by id.' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ): Promise<SuccessResponse<Report>> {
    const report = await this.service.getReport(id);
    return new SuccessResponse('Report fetched successfully', report);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @CacheRevalidateKeys('report:{id}', 'reports')
  @ApiOperation({ summary: 'Update a report status (admin).' })
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: UpdateReportStatusDTO,
  ): Promise<SuccessResponse<Report>> {
    const report = await this.service.updateStatus(id, body.status);
    return new SuccessResponse('Report status updated successfully', report);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @CacheRevalidateKeys('report:{id}', 'reports')
  @ApiOperation({ summary: 'Delete a report (admin).' })
  async remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ): Promise<SuccessResponse> {
    return this.service.deleteReport(id);
  }
}
