import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ENUM_REPORT_STATUS } from '../enums';

export class UpdateReportStatusDTO {
  @ApiProperty({
    enum: ENUM_REPORT_STATUS,
    required: true,
    example: ENUM_REPORT_STATUS.ASSIGNED,
    description: 'New status: pending, in_review, assigned, resolved, or rejected.',
  })
  @IsNotEmpty({ message: 'status is required.' })
  @IsEnum(ENUM_REPORT_STATUS, {
    message: 'status must be one of pending, in_review, assigned, resolved, rejected.',
  })
  status!: ENUM_REPORT_STATUS;
}
