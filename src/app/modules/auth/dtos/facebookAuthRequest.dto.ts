import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FacebookAuthRequestDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'http://localhost:4200',
  })
  @IsNotEmpty()
  @IsString()
  readonly webRedirectUrl!: string;
}
