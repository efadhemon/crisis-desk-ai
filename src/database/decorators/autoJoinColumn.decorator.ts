import { JoinColumn, JoinColumnOptions } from 'typeorm';
import { makeForeignKeyName } from '../utils';

/**
 * A custom property decorator that wraps the TypeORM `@JoinColumn` decorator.
 *
 * It automatically generates:
 * 1. A **column name** — defaults to `<propertyKey>Id` if `options.name` is
 *    not explicitly provided (e.g., property `currency` → column `currencyId`).
 * 2. A **foreign key constraint name** — following the standardized pattern
 *    `fk_[table_name]_[column_name]` via the {@link makeForeignKeyName} utility.
 *
 * This ensures that every relation in the codebase has a predictable,
 * human-readable foreign key constraint name in the database schema.
 *
 * @param options - Optional `JoinColumnOptions` passed through to the underlying
 *   TypeORM `@JoinColumn()`. If `name` is provided, it will be used as the
 *   column name instead of the auto-generated one.
 *
 * @throws {Error} If the target class does not have a
 *   `public static readonly tableName` property defined.
 *
 * @example
 * ```ts
 * @AutoEntity()
 * export class UserInvoice extends BaseEntity {
 *   public static readonly tableName = 'user_invoices';
 *
 *   @ManyToOne(() => Currency, { onDelete: 'NO ACTION' })
 *   @AutoJoinColumn()
 *   currency?: Currency;
 *   // generates: name = 'currencyId', foreignKeyConstraintName = 'fk_user_invoices_currency_id'
 * }
 * ```
 *
 * @example
 * ```ts
 * // With an explicit column name override:
 * @ManyToOne(() => User)
 * @AutoJoinColumn({ name: 'owner_id' })
 * owner?: User;
 * // generates: name = 'owner_id', foreignKeyConstraintName = 'fk_<table>_owner_id'
 * ```
 *
 * @see {@link makeForeignKeyName} for the naming convention details.
 * @see {@link https://typeorm.io/relations#joincolumn-options TypeORM JoinColumn Documentation}
 */
export function AutoJoinColumn(options?: JoinColumnOptions): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    // Get the current table name from the static property
    const tableName = (target.constructor as any).tableName;

    if (!tableName) {
      throw new Error(
        'The target class must have a public static readonly tableName property to use AutoJoinColumn.',
      );
    }

    // Determine the column name (e.g., 'userId' or 'user_id')
    // If 'name' isn't provided, we assume propertyKey + 'Id' (standard practice)
    const columnName = options?.name || `${String(propertyKey)}Id`;

    // Build the standardized Foreign Key name
    const foreignKeyName = makeForeignKeyName(tableName, columnName);

    // Apply the original TypeORM JoinColumn with our automated names
    JoinColumn({
      ...options,
      name: columnName,
      foreignKeyConstraintName: foreignKeyName,
    })(target, propertyKey);
  };
}
