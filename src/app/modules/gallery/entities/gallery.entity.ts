import { BaseEntity } from '@src/app/base';
import { AutoEntity } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Column } from 'typeorm';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class Gallery extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'gallery';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'gallery';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['title', 'altText', 'url'];

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 255, nullable: true })
  title?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 255, nullable: true })
  caption?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 255, nullable: true })
  source?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 255, nullable: true })
  altText?: string;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: false })
  url?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 255, nullable: false })
  key?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 50, nullable: false })
  mimetype?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 10, nullable: false })
  extension?: string;
}
