import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { IsNotEmptyArray } from '../decorators';

export class BaseBulkDeleteDTO {
  @ApiProperty({ required: true, type: [UUID], example: ['5', '6'] })
  @IsArray()
  @IsNotEmptyArray()
  ids: string[];
}
