import { ApiProperty } from '@nestjs/swagger';
import { BaseFilterDTO } from '@src/app/base';
import { IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class EmailGatewayFilterDTO extends BaseFilterDTO {
  @ApiProperty({
    type: Number,
    description: 'The page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  readonly page: number;

  @ApiProperty({
    type: Number,
    description: 'Limit the number of results',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  readonly limit: number;

  @ApiProperty({
    type: String,
    description: 'user id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  readonly userId!: any;
}
