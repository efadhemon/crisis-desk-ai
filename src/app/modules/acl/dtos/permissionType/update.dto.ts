import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionTypeDTO {
  @ApiProperty({
    type: String,
    required: false,
    example: 'Product Management',
  })
  @IsOptional()
  @IsString()
  readonly title!: string;

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
