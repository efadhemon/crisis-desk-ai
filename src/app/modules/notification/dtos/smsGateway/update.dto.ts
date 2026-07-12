import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE,
  ENUM_SMS_GATEWAY_REQUEST_METHOD,
} from '../../enums';

export class SmsGatewayUpdateDTO {
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
    example: ENUM_SMS_GATEWAY_REQUEST_METHOD.GET,
  })
  @IsOptional()
  @IsEnum(ENUM_SMS_GATEWAY_REQUEST_METHOD)
  readonly requestMethod!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'xzy.com?username=abc&password=123&recipient={{recipient}}&message={{message}}',
    description: `
    This is the endpoint where the request will be sent. Actual recipient and message will be replaced by {{recipient}} and {{message}}
    Example For GET Method: https://xzy.com?username=abc&password=123&recipient={{recipient}}&message={{message}}
    Example For POST Method: https://xzy.com
    `,
  })
  @IsOptional()
  @IsString()
  readonly requestEndpoint!: string;

  @ApiProperty({
    type: Object,
    required: false,
    example: {
      username: 'abc',
      password: '123',
      recipient: '{{recipient}}',
      message: '{{message}}',
    },
  })
  @IsOptional()
  @IsObject()
  readonly requestBody!: any;

  @ApiProperty({
    type: String,
    required: false,
    example: 587,
  })
  @IsOptional()
  @IsUUID()
  readonly userId!: string;
}
