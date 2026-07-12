import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyArray, IsUUIDArray } from '@src/app/decorators';

export class AddPermissionsDTO {
  @ApiProperty({
    type: [String],
    required: true,
    example: ['permission id 1', 'permission id 2'],
  })
  @IsNotEmptyArray()
  @IsUUIDArray()
  permissions!: any[];
}
