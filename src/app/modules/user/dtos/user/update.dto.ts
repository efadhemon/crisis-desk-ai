import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UserUpdateDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'Emon',
  })
  @IsOptional()
  @IsString()
  readonly firstName?: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'Hossain',
  })
  @IsOptional()
  @IsString()
  readonly lastName?: string;

  @ApiProperty({
    type: String,
    required: false,
    example: '01998200160',
  })
  @IsOptional()
  @IsString()
  readonly phoneNumber!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: '123456',
  })
  @IsOptional()
  @IsString()
  readonly password!: string;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive!: boolean;
}
