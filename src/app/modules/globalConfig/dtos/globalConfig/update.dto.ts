import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class GlobalConfigUpdateDTO {
  @ApiProperty({
    type: Number,
    required: false,
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  readonly otpExpiresInMin!: number;
}
