import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex, AutoJoinColumn } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Type } from 'class-transformer';
import { Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE } from '../enums';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class EmailGateway extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'email_gateways';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'email-gateways';

  /** Fields searched when `searchTerm` is provided to findAllBase. */
  public static readonly SEARCH_TERMS: string[] = ['title'];

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 225,
    nullable: false,
  })
  title?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 50,
    nullable: false,
    default: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT,
  })
  accountType?: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 50,
    nullable: true,
  })
  type?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 100,
    nullable: false,
  })
  host?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.INT,
    nullable: false,
  })
  port?: number;

  @Column({
    type: ENUM_COLUMN_TYPES.BOOLEAN,
    nullable: false,
  })
  isSecure?: boolean;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 100,
    nullable: false,
  })
  authUser?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 100,
    nullable: false,
  })
  authPassword?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 100,
    nullable: false,
  })
  senderEmail?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.VARCHAR,
    length: 100,
    nullable: true,
  })
  senderLabel?: string;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @AutoJoinColumn()
  @Type(() => User)
  user?: User;
}
