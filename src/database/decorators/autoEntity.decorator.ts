import { Entity, EntityOptions } from 'typeorm';

/**
 * A custom class decorator that wraps the TypeORM `@Entity` decorator.
 *
 * Instead of passing the table name directly to `@Entity()`, `@AutoEntity`
 * reads the `static readonly tableName` property defined on the class itself.
 * This enforces a consistent pattern where every entity declares its own
 * table name as a static property, making it easily referenceable elsewhere
 * (e.g., in migrations, seeders, or naming utilities like `makeIndexName`).
 *
 * @param options - Optional `EntityOptions` passed through to the underlying
 *   TypeORM `@Entity()` decorator (e.g., `schema`, `orderBy`, `engine`).
 *
 * @throws {Error} If the decorated class does not have a
 *   `static readonly tableName` property defined.
 *
 * @example
 * ```ts
 * @AutoEntity()
 * export class UserInvoice extends BaseEntity {
 *   public static readonly tableName = 'user_invoices';
 *
 *   @Column()
 *   code: string;
 * }
 * ```
 *
 * @see {@link https://typeorm.io/entities TypeORM Entity Documentation}
 */
export function AutoEntity(options?: EntityOptions): ClassDecorator {
  return (target: any) => {
    const tableName = target.tableName;

    if (!tableName) {
      throw new Error(
        `@AutoEntity error: ${target.name} must have a "static readonly tableName" property defined.`,
      );
    }

    // Apply the original TypeORM @Entity decorator
    Entity(tableName, options)(target);
  };
}
