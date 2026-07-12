import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE } from '../../enums';

export class EmailGatewayCreateDTO {
  @ApiProperty({ required: false, type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    type: String,
    required: true,
    example: 'Microsoft smtp server',
  })
  @IsNotEmpty()
  @IsString()
  readonly title!: string;

  @ApiProperty({
    type: String,
    required: true,
    enum: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE,
    example: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT,
  })
  @IsNotEmpty()
  @IsEnum(ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE)
  readonly accountType!: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE;

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
    required: true,
    example: 'mail.samenits.net',
  })
  @IsNotEmpty()
  @IsString()
  readonly host!: string;

  @ApiProperty({
    type: Number,
    required: true,
    example: 587,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly port!: number;

  @ApiProperty({
    type: Boolean,
    required: true,
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  readonly isSecure!: boolean;

  @ApiProperty({
    type: String,
    required: true,
    example: 'username',
  })
  @IsNotEmpty()
  @IsString()
  readonly authUser!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  readonly authPassword!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'sender@email.com',
  })
  @IsNotEmpty()
  @IsEmail()
  readonly senderEmail!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'Wage',
  })
  @IsOptional()
  @IsString()
  readonly senderLabel!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 587,
  })
  @IsOptional()
  @IsUUID()
  readonly userId!: string;
}
