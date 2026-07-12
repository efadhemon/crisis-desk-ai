import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGalleryDTO {
  @ApiProperty({
    type: String,
    required: false,
    example: 'title',
  })
  @IsOptional()
  @IsString()
  readonly title!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'alt text',
  })
  @IsOptional()
  @IsString()
  readonly caption?: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'alt text',
  })
  @IsOptional()
  @IsString()
  readonly source?: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'alt text',
  })
  @IsOptional()
  @IsString()
  readonly altText!: string;

  @IsOptional()
  @IsNumber()
  readonly updatedBy!: any;
}
