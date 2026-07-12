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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@src/app/decorators/publicRoute.decorator';
import { SkipKeyCheck } from '@src/app/decorators/skipKeyCheck.decorator';
import { SuccessResponse } from '@src/app/types';
import { CreateReportDTO } from '../dtos/create-report.dto';
import { FilterReportDTO } from '../dtos/filter-report.dto';
import { UpdateReportStatusDTO } from '../dtos/update-status.dto';
import { Report } from '../entities/report.entity';
import { AdminGuard } from '../guards/admin.guard';
import { IReportStatsSummary, ReportService } from '../services/report.service';

@ApiTags('Reports')
@Public()
@SkipKeyCheck()
@Controller(Report.apiRouteName)
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new citizen report (AI triage + duplicate detection).' })
  async create(@Body() body: CreateReportDTO): Promise<SuccessResponse<Report>> {
    const report = await this.service.createReport(body);
    return new SuccessResponse('Report submitted successfully', report);
  }

  @Get()
  @ApiOperation({
    summary: 'List reports with filters (category, urgency, status, search, dates).',
  })
  async findAll(@Query() query: FilterReportDTO): Promise<SuccessResponse<Report[]>> {
    return this.service.listReports(query);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Analytics summary (totals + category/urgency breakdowns).' })
  async stats(): Promise<SuccessResponse<IReportStatsSummary>> {
    const summary = await this.service.getStatsSummary();
    return new SuccessResponse('Report statistics fetched successfully', summary);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single report by id.' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ): Promise<SuccessResponse<Report>> {
    const report = await this.service.getReport(id);
    return new SuccessResponse('Report fetched successfully', report);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a report status (admin).' })
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() body: UpdateReportStatusDTO,
  ): Promise<SuccessResponse<Report>> {
    const report = await this.service.updateStatus(id, body.status);
    return new SuccessResponse('Report status updated successfully', report);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a report (admin).' })
  async remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ): Promise<SuccessResponse> {
    return this.service.deleteReport(id);
  }
}
