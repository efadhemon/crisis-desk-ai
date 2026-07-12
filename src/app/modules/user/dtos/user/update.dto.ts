import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class UserRolesUpdateDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: '7efe629c-3e94-4fa7-a26d-7c5216e41d93',
  })
  @IsUUID()
  @IsNotEmpty()
  readonly role!: any;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isDeleted!: boolean;
}

export class UserUpdateDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'Zahid',
  })
  @IsOptional()
  @IsString()
  readonly firstName?: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'Hassan',
  })
  @IsOptional()
  @IsString()
  readonly lastName?: string;

  @ApiProperty({
    type: String,
    required: false,
    example: '01636476123',
  })
  @IsOptional()
  @IsString()
  readonly phoneNumber!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: '123456',
  })
  @IsOptional()
  @IsString()
  readonly password!: string;

  @ApiProperty({
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive!: boolean;

  @ApiProperty({
    type: [UserRolesUpdateDTO],
    required: false,
    example: [
      {
        role: '7efe629c-3e94-4fa7-a26d-7c5216e41d93',
      },
      {
        role: '7efe629c-3e94-4fa7-a26d-7c5216e41d93',
        isDeleted: true,
      },
    ],
  })
  @ValidateNested()
  @Type(() => UserRolesUpdateDTO)
  @IsOptional()
  readonly roles!: UserRolesUpdateDTO[];
}
