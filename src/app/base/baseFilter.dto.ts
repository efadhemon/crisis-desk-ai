import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  isUUID,
} from 'class-validator';
import { IsUUIDArray } from '../decorators';
import { IMultipleSort } from './base.interface';

enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
  asc = 'asc',
  desc = 'desc',
}

export class BaseFilterDTO {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'The page number',
    default: 1,
  })
  @IsOptional()
  @IsNumberString()
  readonly page?: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Limit the number of results',
    default: 10,
  })
  @IsOptional()
  @IsNumberString()
  readonly limit?: number;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: String,
    description: 'The search term',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly searchTerm?: string;

  @ApiProperty({
    type: String,
    description: new Date().toString(),
    required: false,
  })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiProperty({
    type: String,
    description: new Date().toString(),
    required: false,
  })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: JSON.stringify(['uid', 'uid']),
  })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      const data = JSON.parse(value);
      return data.map((item: any) => {
        const id = item?.toString();
        if (!isUUID(id)) {
          throw new Error('Invalid UUID in initialLoadIds');
        }
        return id;
      });
    } catch {
      throw new Error('Invalid JSON in initialLoadIds');
    }
  })
  @IsUUIDArray()
  readonly initialLoadIds?: string[];

  @ApiProperty({
    type: String,
    description: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly sortBy?: string;

  @ApiProperty({
    type: String,
    required: false,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  readonly sortOrder?: IMultipleSort['order'];

  @ApiProperty({
    type: Object,
    required: false,
    description: JSON.stringify([{ by: 'orderPriority', order: 'DESC' }]),
  })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error('Invalid JSON format in sort query');
    }
  })
  sort?: IMultipleSort[];
}

export class FilterBulkByIdsDTO {
  @ApiProperty({
    type: [String],
    description: `id array ['uuid','uuid']`,
    example: ['8ecf938a-b380-4279-8768-ed7743eb6f70'],
    required: true,
  })
  @IsNotEmpty()
  @IsUUIDArray()
  ids!: string[];
}
