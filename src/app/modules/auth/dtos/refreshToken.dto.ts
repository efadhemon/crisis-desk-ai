import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class RefreshTokenDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'refresh token',
  })
  @IsNotEmpty()
  @IsString()
  readonly refreshToken!: string;

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
