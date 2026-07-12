import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex, AutoJoinColumn } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Type } from 'class-transformer';
import { Column, ManyToOne } from 'typeorm';
import { Role } from '../../acl/entities/role.entity';
import { User } from './user.entity';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
@AutoIndex(['userId', 'roleId'], { unique: true })
export class UserRole extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'user_roles';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'user-roles';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = [];

  @Column({ type: ENUM_COLUMN_TYPES.BOOLEAN, default: false })
  isDefault?: boolean;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: false })
  roleId?: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @AutoJoinColumn()
  @Type(() => Role)
  role?: Role;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: false })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @AutoJoinColumn()
  @Type(() => User)
  user?: User;
}
