import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Column } from 'typeorm';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class ApiKey extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'api_keys';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'api-keys';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['title'];

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: false })
  title?: string;

  @AutoIndex({ unique: true })
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: false })
  key?: string;
}
