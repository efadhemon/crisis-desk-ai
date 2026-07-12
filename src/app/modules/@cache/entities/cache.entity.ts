import { AutoEntity } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class Cache {
  /** PostgreSQL table name. */
  public static readonly tableName = 'caches';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'caches';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = [];

  @PrimaryColumn({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 255 })
  key: string;

  @Column({ type: ENUM_COLUMN_TYPES.JSONB, nullable: false })
  value: any;

  @Column({
    type: ENUM_COLUMN_TYPES.FLOAT,
    nullable: false,
    comment: 'TTL as a timestamp in seconds',
  })
  ttl: number;

  @CreateDateColumn({ type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC })
  createdAt?: Date;

  @UpdateDateColumn({ type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC })
  updatedAt?: Date;

  @DeleteDateColumn({ type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC, select: false })
  deletedAt?: Date;
}
