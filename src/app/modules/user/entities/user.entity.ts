import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Type } from 'class-transformer';
import { Column, OneToMany } from 'typeorm';
import { ENUM_AUTH_PROVIDERS, ENUM_USER_TYPES } from '../enums';
import { UserRole } from './userRole.entity';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class User extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'users';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'users';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['fullName', 'username', 'email', 'phoneNumber'];

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: false })
  userType?: ENUM_USER_TYPES;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: true })
  firstName?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: true })
  lastName?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 225, nullable: true })
  fullName?: string;

  @AutoIndex({ unique: true })
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 100, nullable: true })
  username?: string;

  @AutoIndex({ unique: true })
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 150, nullable: true })
  email?: string;

  @AutoIndex({ unique: true })
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: true })
  avatar?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 50, default: ENUM_AUTH_PROVIDERS.SYSTEM })
  authProvider?: string;

  @Column({ type: ENUM_COLUMN_TYPES.JSONB, default: {}, select: false })
  authProviderMetaInfo?: any;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: true, select: false })
  password?: string;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: true })
  twoFactorSecret?: string;

  @Column({ type: ENUM_COLUMN_TYPES.BOOLEAN, nullable: true, default: false })
  isTwoFactorEnabled?: boolean;

  @Column({ type: ENUM_COLUMN_TYPES.BOOLEAN, nullable: true, default: false })
  isVerified?: boolean;

  @OneToMany(() => UserRole, (e) => e.user)
  @Type(() => UserRole)
  userRoles?: UserRole[];
}
