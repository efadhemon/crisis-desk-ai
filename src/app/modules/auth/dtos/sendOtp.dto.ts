import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ENUM_VERIFICATION_TYPES } from '../enums';

export class SendOtpDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'email/phonenumber',
  })
  @IsNotEmpty()
  @IsString()
  readonly identifier!: string;

  @ApiProperty({
    type: String,
    required: true,
    enum: ENUM_VERIFICATION_TYPES,
    example: Object.values(ENUM_VERIFICATION_TYPES).join(' / '),
  })
  @IsNotEmpty()
  @IsEnum(ENUM_VERIFICATION_TYPES)
  readonly verificationType!: ENUM_VERIFICATION_TYPES;
}
