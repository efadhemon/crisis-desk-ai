import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE } from '../../enums';

export class SmsGatewayParsedDataGetDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: '0123456789',
  })
  @IsNotEmpty()
  @IsString()
  readonly recipient!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'Hello World!',
  })
  @IsNotEmpty()
  @IsString()
  readonly message!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT,
  })
  @IsNotEmpty()
  @IsEnum(ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE)
  readonly accountType!: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE;

  @ApiProperty({
    type: String,
    required: false,
    example: 587,
  })
  @IsOptional()
  @IsUUID()
  readonly userId!: string;
}
