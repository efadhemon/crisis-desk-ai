import { Index, IndexOptions } from 'typeorm';
import { makeIndexName } from '../utils';

/**
 * A custom decorator that automatically generates a standardized index name
 * for TypeORM entities.
 *
 * It reads the `static readonly tableName` property from the entity class and
 * combines it with the column name(s) to produce a deterministic index name
 * following the pattern: `idx_[table_name]_[column_names]`.
 *
 * Can be used as either a **property decorator** (single-column index) or a
 * **class decorator** (composite index over multiple columns).
 *
 * @param columnsOrOptions - When used as a **class decorator**, pass an array
 *   of column names for a composite index. When used as a **property decorator**,
 *   pass optional `IndexOptions` (e.g., `{ unique: true }`).
 * @param maybeOptions - Optional `IndexOptions`, only used when `columnsOrOptions`
 *   is an array (composite / class-level usage).
 *
 * @throws {Error} If the target class does not have a
 *   `public static readonly tableName` property defined.
 *
 * @example
 * // --- Single-column index (property decorator) ---
 * ```ts
 * @AutoEntity()
 * export class UserInvoice extends BaseEntity {
 *   public static readonly tableName = 'user_invoices';
 *
 *   @AutoIndex({ unique: true })
 *   @Column()
 *   code: string;
 *   // generates: idx_user_invoices_code (unique)
 * }
 * ```
 *
 * @example
 * // --- Composite index (class decorator) ---
 * ```ts
 * @AutoEntity()
 * @AutoIndex(['source', 'sourceId'])
 * export class UserInvoice extends BaseEntity {
 *   public static readonly tableName = 'user_invoices';
 *   // generates: idx_user_invoices_source_source_id
 * }
 * ```
 *
 * @see {@link makeIndexName} for the naming convention details.
 * @see {@link https://typeorm.io/indices TypeORM Index Documentation}
 */
export function AutoIndex(
  columnsOrOptions?: string[] | IndexOptions,
  maybeOptions?: IndexOptions,
): PropertyDecorator & ClassDecorator {
  return (target: any, propertyKey?: string) => {
    // Determine if this is a single-column or composite index
    const isComposite = Array.isArray(columnsOrOptions);
    const columns = isComposite ? (columnsOrOptions as string[]) : [propertyKey as string];
    const options = isComposite ? maybeOptions : (columnsOrOptions as IndexOptions);

    // Get the Table Name
    // Class decorator → target is the constructor; Property decorator → target is the prototype
    const tableName = isComposite ? target.tableName : target.constructor.tableName;

    if (!tableName) {
      throw new Error(
        'The target class must have a public static readonly tableName property to use AutoIndex.',
      );
    }

    // Generate the standardized name
    const indexName = makeIndexName(tableName, ...columns);

    // Apply the original TypeORM Index decorator
    if (isComposite) {
      // Class-level decorator for composite indexes
      Index(indexName, columns, options)(target);
    } else {
      // Property-level decorator for single columns
      Index(indexName, options)(target, propertyKey!);
    }
  };
}
