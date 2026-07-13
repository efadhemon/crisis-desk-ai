import { ApiProperty } from '@nestjs/swagger';
import { BaseFilterDTO } from '@src/app/base/baseFilter.dto';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { ENUM_USER_TYPES } from '../../enums';

export class UserFilterDTO extends BaseFilterDTO {
  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBooleanString()
  isVerified?: boolean;

  @ApiProperty({
    type: String,
    required: false,
    enum: ENUM_USER_TYPES,
    example: ENUM_USER_TYPES.USER,
  })
  @IsOptional()
  @IsEnum(ENUM_USER_TYPES)
  readonly userType!: ENUM_USER_TYPES;

  @ApiProperty({
    type: String,
    required: false,
    description: `Roles as ["Internal", "Admin"]`,
  })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (_e) {
      throw new Error('Invalid JSON in roles query parameter');
    }
  })
  roles!: string[];
}
