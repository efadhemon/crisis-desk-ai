import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePermissionDTO {
  @ApiProperty({
    type: String,
    required: false,
    example: 'catalogs.create',
  })
  @IsOptional()
  @IsString()
  readonly title!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'permission type id',
  })
  @IsOptional()
  @IsUUID()
  readonly permissionTypeId!: string;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive: boolean = true;

  @IsOptional()
  readonly updatedBy!: any;
}
