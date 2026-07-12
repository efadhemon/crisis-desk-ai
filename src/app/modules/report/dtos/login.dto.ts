import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'admin@crisisdesk.ai',
    description: 'Admin email (configured via ADMIN_EMAIL).',
  })
  @IsString()
  @IsNotEmpty({ message: 'email is required.' })
  email!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'admin123',
    description: 'Admin password (configured via ADMIN_PASSWORD).',
  })
  @IsString()
  @IsNotEmpty({ message: 'password is required.' })
  password!: string;
}
