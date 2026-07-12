import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Column } from 'typeorm';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class Role extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'roles';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'roles';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['title'];

  @AutoIndex({ unique: true })
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: false })
  title?: string;

  isAlreadyAdded?: boolean;
}
