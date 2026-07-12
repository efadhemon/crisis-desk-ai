import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class SocialAuthValidateDTO {
  @ApiProperty({
    type: String,
    required: true,
    example:
      'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6ImNjMWZmNGUxLTA0NGUtNDc0Zi1hMzVjLTVjYzllMjM4NTQ4MSIsInJlZGlyZWN0VXJsIjoiaHR0cDovL2xvY2FsaG9zdDo0MjAwIiwiY2xpZW50TmFtZSI6IkNsaWVudCAxIiwiaWF0IjoxNjg4NDEwNjI5LCJleHAiOjE2OTEwMDI2Mjl9.rPthPMjBMHcoEPh559j3FLzCbsbfD0nlhYVMZ3D9Im9VmbK_knqmBg3-dsMwYKYYHkSRQAfdAf-a_-Zv3h-xKw',
  })
  @IsNotEmpty()
  @IsString()
  readonly token!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'google',
  })
  @IsNotEmpty()
  @IsString()
  readonly provider: string;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly remember: boolean;

  @ApiProperty({
    type: Number,
    required: false,
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  readonly rememberDays: number;

  @ApiProperty({
    type: String,
    required: false,
    example: 'f2ad4b5a-07bf-478a-868d-3ac668c5a255',
  })
  @IsOptional()
  @IsUUID()
  readonly residentCountryId!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'f2ad4b5a-07bf-478a-868d-3ac668c5a255',
  })
  @IsOptional()
  @IsUUID()
  readonly assessmentDecisionId!: string;
}
