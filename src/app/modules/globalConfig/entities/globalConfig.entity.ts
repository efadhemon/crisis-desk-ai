import { BaseEntity } from '@src/app/base';
import { AutoEntity } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Column } from 'typeorm';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class GlobalConfig extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'global_configs';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'global-configs';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = [];

  @Column({
    type: ENUM_COLUMN_TYPES.INT,
    nullable: false,
    default: 5,
    comment: 'OTP expiration time in minutes for generated authentication OTP',
  })
  otpExpiresInMin?: number;
}
