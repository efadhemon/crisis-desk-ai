import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'email/phonenumber/username',
  })
  @IsNotEmpty()
  @IsString()
  readonly identifier!: string;
}
