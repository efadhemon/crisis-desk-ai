import { TableColumnOptions } from 'typeorm';

export enum ENUM_COLUMN_TYPES {
  UUID = 'uuid',
  INT = 'int',
  BIGINT = 'bigint',
  FLOAT = 'float',
  TEXT = 'text',
  VARCHAR = 'varchar',
  VECTOR = 'vector',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIMESTAMP_UTC = 'timestamp without time zone',
  ENUM = 'enum',
  JSONB = 'jsonb',
  SIMPLE_ARRAY = 'simple-array',
}

export const defaultDateTimeColumns: TableColumnOptions[] = [
  {
    name: 'createdAt',
    type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC,
    default: 'NOW()',
    isNullable: true,
  },
  {
    name: 'updatedAt',
    type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC,
    isNullable: true,
  },
];

export const defaultColumns: TableColumnOptions[] = [];

export const defaultPrimaryColumn: TableColumnOptions = {
  name: 'id',
  type: ENUM_COLUMN_TYPES.UUID,
  isPrimary: true,
  generationStrategy: 'uuid',
  default: 'uuid_generate_v4()',
  isUnique: true,
};
