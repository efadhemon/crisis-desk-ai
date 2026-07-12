import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE,
  ENUM_SMS_GATEWAY_REQUEST_METHOD,
} from '../../enums';

export class SmsGatewayCreateDTO {
  @ApiProperty({ required: false, type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    type: String,
    required: true,
    example: 'SSL SMS Gateway',
  })
  @IsNotEmpty()
  @IsString()
  readonly title!: string;

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
    required: true,
    example: ENUM_SMS_GATEWAY_REQUEST_METHOD.GET,
  })
  @IsNotEmpty()
  @IsEnum(ENUM_SMS_GATEWAY_REQUEST_METHOD)
  readonly requestMethod!: ENUM_SMS_GATEWAY_REQUEST_METHOD;

  @ApiProperty({
    type: String,
    required: true,
    example: 'xzy.com?username=abc&password=123&recipient={{recipient}}&message={{message}}',
    description: `
    This is the endpoint where the request will be sent. Actual recipient and message will be replaced by {{recipient}} and {{message}}
    Example For GET Method: https://xzy.com?username=abc&password=123&recipient={{recipient}}&message={{message}}
    Example For POST Method: https://xzy.com
    `,
  })
  @IsNotEmpty()
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
