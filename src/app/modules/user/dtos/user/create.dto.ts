import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ENUM_USER_TYPES } from '../../enums';

export class UserCreateDTO {
  @ApiProperty({
    type: String,
    required: true,
    enum: ENUM_USER_TYPES,
    example: ENUM_USER_TYPES.USER,
  })
  @IsNotEmpty()
  @IsEnum(ENUM_USER_TYPES)
  readonly userType!: ENUM_USER_TYPES;

  @ApiProperty({
    type: String,
    required: true,
    example: 'Emon',
  })
  @IsNotEmpty()
  @IsString()
  readonly firstName!: string;

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
    required: true,
    example: 'user@crisisdesk.com',
  })
  @IsNotEmpty()
  @IsString()
  readonly email!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: '01998200160',
  })
  @IsOptional()
  @IsString()
  readonly phoneNumber?: string;

  @ApiProperty({
    type: String,
    required: true,
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  readonly password?: string;
}
