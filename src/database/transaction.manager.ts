import 'reflect-metadata';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

const TX_MANAGER_INDEX = Symbol('TX_MANAGER_INDEX');

/**
 * Default transaction timeout in milliseconds (30 seconds).
 * This prevents runaway transactions from holding database connections indefinitely.
 * Override per-method using @Transactional({ timeout: <ms> }) or set to 0 to disable.
 */
const DEFAULT_TRANSACTION_TIMEOUT_MS = 30_000;

/**
 * Options for the Transactional decorator
 */
export interface ITransactionalOptions {
  /**
   * Isolation level for the transaction.
   * Default: 'READ COMMITTED'
   */
  isolationLevel?: IsolationLevel;

  /**
   * Timeout in milliseconds. If the transaction takes longer, it will be rolled back.
   * Default: 30000 (30 seconds). Set to 0 to disable timeout.
   */
  timeout?: number;
}

/**
 * Parameter decorator: Marks the parameter where the EntityManager should be injected.
 * The decorated parameter will receive an EntityManager that is part of the transaction.
 *
 * @example
 * ```typescript
 * @Transactional()
 * async createUser(dto: CreateUserDto, @TxManager() manager?: EntityManager) {
 *   // Use manager for all database operations within this transaction
 *   await manager.save(User, dto);
 * }
 * ```
 */
export function TxManager(): ParameterDecorator {
  return function (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    if (propertyKey !== undefined) {
      Reflect.defineMetadata(TX_MANAGER_INDEX, parameterIndex, target, propertyKey);
    }
  };
}

/**
 * Helper function to safely release query runner
 */
async function safeReleaseQueryRunner(queryRunner: QueryRunner): Promise<void> {
  try {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  } catch (releaseError) {
    console.error('Failed to release query runner:', releaseError);
  }
}

/**
 * Helper function to get metadata, checking prototype chain
 */
function getTransactionMetadata(target: object, propertyKey: string): number | undefined {
  // First check own metadata
  let txManagerIndex: number | undefined = Reflect.getOwnMetadata(
    TX_MANAGER_INDEX,
    target,
    propertyKey,
  );

  // If not found, check prototype chain
  if (txManagerIndex === undefined) {
    let proto = Object.getPrototypeOf(target);
    while (proto && txManagerIndex === undefined) {
      txManagerIndex = Reflect.getOwnMetadata(TX_MANAGER_INDEX, proto, propertyKey);
      proto = Object.getPrototypeOf(proto);
    }
  }

  return txManagerIndex;
}

/**
 * Method decorator: Wraps the method in a database transaction and injects the EntityManager.
 *
 * Features:
 * - Automatic transaction management (begin, commit, rollback)
 * - Transaction propagation: if an EntityManager is already passed, it reuses the existing transaction
 * - Configurable isolation level
 * - Optional timeout support
 *
 * Requirements:
 * - The class must have `dataSource: DataSource` injected
 * - The method must have a parameter decorated with `@TxManager()`
 *
 * @param options - Configuration options for the transaction
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private dataSource: DataSource) {}
 *
 *   @Transactional({ isolationLevel: 'SERIALIZABLE' })
 *   async createUserWithProfile(dto: CreateUserDto, @TxManager() manager?: EntityManager) {
 *     const user = await manager.save(User, dto.user);
 *     await manager.save(Profile, { ...dto.profile, userId: user.id });
 *     return user;
 *   }
 * }
 * ```
 */
export function Transactional(
  options: ITransactionalOptions | IsolationLevel = 'READ COMMITTED',
): MethodDecorator {
  // Handle both old signature (just isolation level) and new options object
  const config: ITransactionalOptions =
    typeof options === 'string' ? { isolationLevel: options } : options;

  const isolationLevel = config.isolationLevel ?? 'READ COMMITTED';

  // Use default timeout unless explicitly set to 0 (disabled) or a custom value
  const timeout = config.timeout ?? DEFAULT_TRANSACTION_TIMEOUT_MS;

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    async function transactionalWrapper(this: any, ...args: any[]): Promise<any> {
      const dataSource: DataSource = this.dataSource || this.connection;
      if (!dataSource) {
        throw new Error(
          `DataSource not found on ${this.constructor.name}. ` +
            `Ensure 'private dataSource: DataSource' is injected.`,
        );
      }

      const txManagerIndex = getTransactionMetadata(target, methodName);
      if (txManagerIndex === undefined) {
        throw new Error(
          `@TxManager() decorator is missing on method '${methodName}' in class '${this.constructor.name}'`,
        );
      }

      // --- 1. CHECK FOR EXISTING TRANSACTION (Propagation Logic) ---
      const existingManager = args[txManagerIndex];

      // If a valid EntityManager with an active transaction was passed,
      // reuse it (transaction propagation)
      if (
        existingManager instanceof EntityManager &&
        existingManager.queryRunner?.isTransactionActive
      ) {
        return originalMethod.apply(this, args);
      }
      // -------------------------------------------------------------

      // --- 2. START NEW TRANSACTION (Root Logic) ---
      const queryRunner = dataSource.createQueryRunner();

      try {
        await queryRunner.connect();

        // Set PostgreSQL statement timeout if specified (this actually cancels queries on DB side)
        // timeout > 0 enables it, timeout === 0 disables it explicitly
        if (timeout > 0) {
          await queryRunner.query(`SET LOCAL statement_timeout = ${timeout}`);
        }

        await queryRunner.startTransaction(isolationLevel);

        // Inject the NEW manager into the arguments
        const newArgs = [...args];
        newArgs[txManagerIndex] = queryRunner.manager;

        const result = await originalMethod.apply(this, newArgs);

        if (queryRunner.isTransactionActive) {
          await queryRunner.commitTransaction();
        }

        return result;
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          try {
            await queryRunner.rollbackTransaction();
          } catch (rollbackError) {
            console.error(`Failed to rollback transaction in ${methodName}:`, rollbackError);
          }
        }
        throw error;
      } finally {
        await safeReleaseQueryRunner(queryRunner);
      }
    }

    // Preserve function name for debugging
    Object.defineProperty(transactionalWrapper, 'name', {
      value: `${methodName}$transactional`,
      configurable: true,
    });

    descriptor.value = transactionalWrapper;
    return descriptor;
  };
}
