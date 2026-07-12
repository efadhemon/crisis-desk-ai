import { BaseFilterDTO } from '@src/app/base/baseFilter.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ENUM_REPORT_CATEGORY, ENUM_REPORT_STATUS, ENUM_REPORT_URGENCY } from '../enums';

export class FilterReportDTO extends BaseFilterDTO {
  @ApiProperty({
    enum: ENUM_REPORT_CATEGORY,
    required: false,
    description: 'Filter by issue category.',
  })
  @IsOptional()
  @IsEnum(ENUM_REPORT_CATEGORY)
  category?: ENUM_REPORT_CATEGORY;

  @ApiProperty({
    enum: ENUM_REPORT_URGENCY,
    required: false,
    description: 'Filter by urgency level.',
  })
  @IsOptional()
  @IsEnum(ENUM_REPORT_URGENCY)
  urgency?: ENUM_REPORT_URGENCY;

  @ApiProperty({
    enum: ENUM_REPORT_STATUS,
    required: false,
    description: 'Filter by report status.',
  })
  @IsOptional()
  @IsEnum(ENUM_REPORT_STATUS)
  status?: ENUM_REPORT_STATUS;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Free-text search across description, location, summary and name.',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
