import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex, AutoJoinColumn } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Type } from 'class-transformer';
import { Column, ManyToOne } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class RolePermission extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'role_permissions';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'role-permissions';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = [];

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: false })
  roleId?: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @AutoJoinColumn()
  @Type(() => Role)
  role?: Role;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: false })
  permissionId?: string;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @AutoJoinColumn()
  @Type(() => Permission)
  permission?: Permission;
}
