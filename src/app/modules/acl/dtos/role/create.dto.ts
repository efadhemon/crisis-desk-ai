import { ApiProperty } from '@nestjs/swagger';
import { UniqueValidatorPipe } from '@src/app/pipes/uniqueValidator.pipe';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
} from 'class-validator';
import { FindOptionsWhere } from 'typeorm';
import { Role } from '../../entities/role.entity';

export class CreateRoleDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'Content Manager',
  })
  @IsNotEmpty()
  @IsString()
  @Validate(UniqueValidatorPipe<Role>, [
    Role,
    (args: ValidationArguments): FindOptionsWhere<Role> => {
      const dto = args.object as CreateRoleDTO;
      return {
        title: dto.title,
      };
    },
  ])
  readonly title!: string;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive: boolean = true;
}
