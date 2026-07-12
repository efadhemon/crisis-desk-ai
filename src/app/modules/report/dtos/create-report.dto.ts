import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ENUM_REPORT_LANGUAGE } from '../enums';

export class CreateReportDTO {
  @ApiProperty({
    type: String,
    required: false,
    example: 'Emon',
    description: 'Optional reporter name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiProperty({
    type: String,
    required: false,
    example: '017xxxxxxxx',
    description: 'Optional reporter phone or email.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  contact?: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'Sylhet Bondor Bazar',
    description: 'Location text or coordinates. Required.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Location is required.' })
  location!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'There is a fire near a shop and people are trapped.',
    description: 'Original report text. Required.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required.' })
  description!: string;

  @ApiProperty({
    enum: ENUM_REPORT_LANGUAGE,
    required: false,
    example: ENUM_REPORT_LANGUAGE.BN,
    description: 'Language of the report: bn, en, or unknown.',
  })
  @IsOptional()
  @IsEnum(ENUM_REPORT_LANGUAGE, { message: 'language must be one of bn, en, unknown.' })
  language?: ENUM_REPORT_LANGUAGE;
}
