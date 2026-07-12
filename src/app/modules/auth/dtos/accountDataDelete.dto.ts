import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AccountDataDeleteDTO {
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
    required: false,
    example: 'google/facebook',
  })
  @IsOptional()
  @IsString()
  readonly provider: string = 'system';

  @IsOptional()
  isActive?: boolean = true;
}
