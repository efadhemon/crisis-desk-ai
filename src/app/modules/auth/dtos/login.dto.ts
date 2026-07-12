import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class LoginDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'superadmin@wagehat.com',
  })
  @IsNotEmpty()
  @IsString()
  readonly identifier!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  readonly password!: string;

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

  @IsOptional()
  panel?: string;
}
