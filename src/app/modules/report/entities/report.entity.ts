import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex, IgnoredColumn } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Column } from 'typeorm';
import {
  ENUM_REPORT_CATEGORY,
  ENUM_REPORT_LANGUAGE,
  ENUM_REPORT_STATUS,
  ENUM_REPORT_URGENCY,
} from '../enums';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class Report extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'reports';

  /** REST resource segment used by the controller (kept in sync via @Controller). */
  public static readonly apiRouteName = 'reports';

  /** Fields searched when `searchTerm`/`search` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['description', 'location', 'summary', 'name'];

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 150, nullable: true })
  name?: string;

  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 150, nullable: true })
  contact?: string;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: false })
  location?: string;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: false })
  description?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 20,
    default: ENUM_REPORT_LANGUAGE.UNKNOWN,
  })
  language?: ENUM_REPORT_LANGUAGE;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 30, nullable: true })
  category?: ENUM_REPORT_CATEGORY;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.VARCHAR, length: 20, nullable: true })
  urgency?: ENUM_REPORT_URGENCY;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: true })
  summary?: string;

  @Column({ type: ENUM_COLUMN_TYPES.TEXT, nullable: true })
  suggestedAction?: string;

  @Column({ type: ENUM_COLUMN_TYPES.FLOAT, nullable: true })
  confidence?: number;

  @Column({ type: ENUM_COLUMN_TYPES.BOOLEAN, default: false })
  possibleDuplicate?: boolean;

  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: true })
  matchedReportId?: string;

  @AutoIndex()
  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 20,
    default: ENUM_REPORT_STATUS.PENDING,
  })
  status?: ENUM_REPORT_STATUS;

  /** Managed outside TypeORM (pgvector + HNSW). See `@IgnoredColumn`. */
  @IgnoredColumn()
  embedding?: number[] | null;
}
