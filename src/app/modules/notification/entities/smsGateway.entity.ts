import { BaseEntity } from '@src/app/base';
import { AutoEntity, AutoIndex, AutoJoinColumn } from '@src/database/decorators';
import { ENUM_COLUMN_TYPES } from '@src/shared';
import { Type } from 'class-transformer';
import { Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE, ENUM_SMS_GATEWAY_REQUEST_METHOD } from '../enums';

@AutoEntity({ orderBy: { createdAt: 'DESC' } })
export class SmsGateway extends BaseEntity {
  /** PostgreSQL table name. */
  public static readonly tableName = 'sms_gateways';

  /** Internal REST resource segment (kebab-case). */
  public static readonly apiRouteName = 'sms-gateways';

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
    nullable: false,
  })
  requestMethod?: ENUM_SMS_GATEWAY_REQUEST_METHOD;

  @Column({
    type: ENUM_COLUMN_TYPES.TEXT,
    nullable: false,
  })
  requestEndpoint?: string;

  @Column({
    type: ENUM_COLUMN_TYPES.JSONB,
    nullable: true,
  })
  requestBody?: any;

  @AutoIndex()
  @Column({ type: ENUM_COLUMN_TYPES.UUID, nullable: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @AutoJoinColumn()
  @Type(() => User)
  user?: User;
}
