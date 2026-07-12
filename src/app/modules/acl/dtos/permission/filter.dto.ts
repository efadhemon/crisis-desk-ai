import { ApiProperty } from '@nestjs/swagger';
import { BaseFilterDTO } from '@src/app/base/baseFilter.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class FilterPermissionDTO extends BaseFilterDTO {
  @ApiProperty({
    type: String,
    description: 'permission type id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  readonly permissionTypeId!: string;
}
