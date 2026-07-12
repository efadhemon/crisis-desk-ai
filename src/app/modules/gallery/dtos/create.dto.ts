import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGalleryDTO {
  @ApiProperty({
    type: String,
    required: true,
    example: 'title',
  })
  @IsNotEmpty()
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
  readonly altText?: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'url',
  })
  @IsNotEmpty()
  @IsString()
  readonly url!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'key',
  })
  @IsNotEmpty()
  @IsString()
  readonly key!: string;

  @ApiProperty({
    type: String,
    required: true,
    example: 'mimetype',
  })
  @IsNotEmpty()
  @IsString()
  readonly mimetype!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'extension',
  })
  @IsNotEmpty()
  @IsString()
  readonly extension!: string;

  @IsOptional()
  readonly createdBy!: any;
}
