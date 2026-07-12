import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex, AutoJoinColumn } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Type } from 'class-transformer';
import { Column, ManyToOne } from 'typeorm';
import { PermissionType } from './permissionType.entity';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class Permission extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'permissions';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'permissions';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['title'];

  @AutoIndex({ unique: true })
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: false })
  title?: string;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: true })
  permissionTypeId?: string;

  @ManyToOne(() => PermissionType, { onDelete: 'NO ACTION' })
  @AutoJoinColumn()
  @Type(() => PermissionType)
  permissionType?: PermissionType;

  isAlreadyAdded?: boolean;
}
