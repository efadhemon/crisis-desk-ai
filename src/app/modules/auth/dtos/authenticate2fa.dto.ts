import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Authenticate2faDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: '147852',
  })
  @IsNotEmpty()
  @IsString()
  readonly code!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'email | phoneNumber',
  })
  @IsNotEmpty()
  @IsString()
  readonly identifier!: string;
}
