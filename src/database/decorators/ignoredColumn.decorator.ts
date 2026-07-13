import { getMetadataArgsStorage } from 'typeorm';
import { makeIndexName } from '../utils';

/** Entity constructor with optional `static tableName` (see `@AutoEntity`). */
type EntityConstructor = (new (...args: never[]) => object) & { tableName?: string };

export type IgnoredColumnMeta = {
  /** Entity class that owns the property. */
  target: EntityConstructor;
  /** Property name on the entity (e.g. `embedding`). */
  propertyName: string;
  /** Database column name (defaults to the property name). */
  columnName: string;
  /** Table name from `static tableName` when available. */
  tableName?: string;
  /**
   * Index name that is also managed outside TypeORM (e.g. HNSW).
   * Defaults to `makeIndexName(tableName, columnName)` when tableName is known.
   */
  indexName?: string;
};

const ignoredColumns: IgnoredColumnMeta[] = [];

/**
 * Marks a property as a DB column that TypeORM must not schema-manage.
 *
 * Registers the property as a TypeORM `virtual-property` so it is excluded from
 * CREATE/ALTER during schema sync, and records metadata so
 * `migration.generate.ts` can strip DROP/ADD of the real column and its index.
 *
 * Use for columns that exist only via hand-written SQL (e.g. pgvector).
 *
 * @example
 * ```ts
 * @IgnoredColumn()
 * embedding?: number[] | null;
 * ```
 */
export function IgnoredColumn({
  name,
  indexName,
}: { name?: string; indexName?: string } = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;
    const columnName = name ?? propertyName;
    const ctor = target.constructor as EntityConstructor;
    const tableName = ctor.tableName;
    const resolvedIndexName =
      indexName ?? (tableName ? makeIndexName(tableName, columnName) : undefined);

    ignoredColumns.push({
      target: ctor,
      propertyName,
      columnName,
      tableName,
      indexName: resolvedIndexName,
    });

    getMetadataArgsStorage().columns.push({
      target: ctor,
      propertyName,
      mode: 'virtual-property',
      options: { insert: false, update: false, select: false, name: columnName },
    });
  };
}

/** Returns all `@IgnoredColumn` registrations (populated when entities load). */
export function getIgnoredColumns(): readonly IgnoredColumnMeta[] {
  return ignoredColumns;
}

/** Tokens used to strip matching `queryRunner.query(...)` calls from generated migrations. */
export function getIgnoredMigrationTokens(): string[] {
  const tokens = new Set<string>();
  for (const col of ignoredColumns) {
    tokens.add(col.columnName);
    if (col.indexName) tokens.add(col.indexName);
  }
  return [...tokens];
}
