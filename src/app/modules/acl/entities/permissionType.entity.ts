import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Column } from 'typeorm';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class PermissionType extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'permission_types';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'permission-types';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['title'];

  @AutoIndex({ unique: true })
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: false })
  title?: string;
}
