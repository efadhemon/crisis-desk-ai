import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex, AutoJoinColumn } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Type } from 'class-transformer';
import { Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ENUM_NOTIFICATION_TYPE } from '../enums';
import { IEmailAttachment } from '../interfaces';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class EmailNotification extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'email_notifications';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'email-notifications';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['title'];

  @Column({ type: ENUM_COLUMN_TYPES.BOOLEAN, default: false })
  isSuccess?: boolean;

  @AutoIndex()
  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 100,
    nullable: false,
  })
  type?: ENUM_NOTIFICATION_TYPE;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 225,
    nullable: false,
  })
  title?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 225,
    nullable: false,
  })
  recipient?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 225,
    nullable: false,
  })
  subject?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.TEXT,
    nullable: true,
  })
  body?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.JSONB,
    nullable: true,
  })
  attachments?: IEmailAttachment[];

  @Column({
    type: ENUM_COLUMN_TYPES.JSONB,
    nullable: true,
  })
  gatewayResponse?: any;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @AutoJoinColumn()
  @Type(() => User)
  user?: User;
}
