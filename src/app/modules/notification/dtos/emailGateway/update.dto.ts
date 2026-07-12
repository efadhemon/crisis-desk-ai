import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE } from '../../enums';

export class EmailGatewayUpdateDTO {
  @ApiProperty({ required: false, type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    type: String,
    required: false,
    example: 'Microsoft smtp server',
  })
  @IsOptional()
  @IsString()
  readonly title!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT,
  })
  @IsOptional()
  @IsEnum(ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE)
  readonly accountType!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'smtp',
  })
  @IsOptional()
  @IsString()
  readonly type!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'mail.samenits.net',
  })
  @IsOptional()
  @IsString()
  readonly host!: string;

  @ApiProperty({
    type: Number,
    required: false,
    example: 587,
  })
  @IsOptional()
  @IsNumber()
  readonly port!: number;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isSecure!: boolean;

  @ApiProperty({
    type: String,
    required: false,
    example: 'username',
  })
  @IsOptional()
  @IsString()
  readonly authUser!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'password',
  })
  @IsOptional()
  @IsString()
  readonly authPassword!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'sender@email.com',
  })
  @IsOptional()
  @IsEmail()
  readonly senderEmail!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'Uniclients',
  })
  @IsOptional()
  readonly senderLabel?: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 587,
  })
  @IsOptional()
  @IsUUID()
  readonly userId!: string;
}
