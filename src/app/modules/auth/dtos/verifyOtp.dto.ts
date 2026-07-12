import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class VerifyOtpDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'email/username/phonenumber',
  })
  @IsNotEmpty()
  @IsString()
  readonly identifier!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'hash string',
  })
  @IsNotEmpty()
  @IsString()
  readonly hash!: string;

  @ApiProperty({
    type: Number,
    required: true,
    example: 1234,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly otp!: number;

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
}
