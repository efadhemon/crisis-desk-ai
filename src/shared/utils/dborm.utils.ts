import { BaseEntity } from '@src/app/base';
import { IFindAllBaseFIlters, IFindBaseOptions } from '@src/app/interfaces';
import { SuccessResponse } from '@src/app/types';
import {
  Between,
  DataSource,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  Not,
  QueryRunner,
  Raw,
  Repository,
} from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { toNumber } from './convert.utils';

export const startTransaction = async (
  dataSource: DataSource,
  isolationLevel: IsolationLevel = 'READ COMMITTED',
): Promise<QueryRunner> => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction(isolationLevel);
  return queryRunner;
};

export const commitTransaction = async (
  queryRunner: QueryRunner,
  _timeout?: number,
): Promise<void> => {
  const timeout = _timeout ? _timeout : 1000 * 60;

  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Transaction timeout'));
    }, timeout);
  });
  try {
    await Promise.race([
      (async () => {
        await queryRunner.commitTransaction();
      })(),
      timeoutPromise,
    ]);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

export const rollbackTransaction = async (queryRunner: QueryRunner): Promise<void> => {
  try {
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
};

export const lockEntireTable = async (
  queryRunner: QueryRunner,
  tableName: string,
  lockMode:
    | 'ACCESS SHARE'
    | 'ROW SHARE'
    | 'ROW EXCLUSIVE'
    | 'SHARE UPDATE EXCLUSIVE'
    | 'SHARE'
    | 'SHARE ROW EXCLUSIVE'
    | 'EXCLUSIVE'
    | 'ACCESS SHARE'
    | 'ACCESS EXCLUSIVE',
): Promise<QueryRunner> => {
  await queryRunner.query(`LOCK TABLE "${tableName}" IN ${lockMode} MODE`);
  return queryRunner;
};

export async function findAllByRepo<T extends BaseEntity>(
  repo: Repository<T>,
  filters: IFindAllBaseFIlters<T>,
  options?: IFindBaseOptions<T>,
): Promise<SuccessResponse<T[]>> {
  const {
    page,
    limit,
    searchTerm,
    initialLoadIds,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    sort,
    ...queryOptions
  } = filters;

  // Handle initial load IDs
  let initialData: T[] = [];
  if (initialLoadIds && initialLoadIds.length) {
    initialData = await repo.find({
      where: {
        id: In(initialLoadIds) as any,
      },
      relations: options?.relations,
      select: options?.select,
    });

    // Exclude initialLoadIds from queryOptions
    queryOptions['id'] = Not(In(initialData.map((item) => item.id))) as any;
  }

  // Handle date range filtering
  if (startDate && endDate) {
    queryOptions['createdAt'] = Between(new Date(startDate), new Date(endDate)) as any;
  }

  // Handle JSONB filtering for createdBy.id (PostgreSQL)
  if (filters?.createdBy?.id) {
    queryOptions.createdBy = Raw(() => `"createdBy"->>'id' = :createdById`, {
      createdById: filters.createdBy.id,
    });
  }

  const relations = repo.metadata.relations.map((r) => r.propertyName);
  // TODO CHECK USE CASE
  // Object.keys(queryOptions).forEach((key) => {
  //   if (relations.includes(key) && isUuidValidator(queryOptions[key])) {
  //     queryOptions[key] = {
  //       id: queryOptions[key],
  //     };
  //   }
  // });

  const opts: FindManyOptions = {
    where: queryOptions as FindOptionsWhere<T>,
  };

  if (searchTerm && repo.target.valueOf().hasOwnProperty('SEARCH_TERMS')) {
    let SEARCH_TERMS = options?.SEARCH_TERMS || (repo.target.valueOf() as any)?.SEARCH_TERMS || [];

    if (Object.keys(queryOptions).length) {
      SEARCH_TERMS = SEARCH_TERMS.filter(
        (term: string) => !Object.keys(queryOptions).includes(term),
      );
    }

    const where = [];
    for (const term of SEARCH_TERMS) {
      // Check if the search term is a relation
      if (term?.includes('.')) {
        const [relation, field] = term.split('.');
        // Check if the relation is allowed
        if (!relations.includes(relation)) {
          continue;
        }
        where.push({
          ...queryOptions,
          [relation]: {
            [field]: ILike(`%${searchTerm}%`),
          },
        });
      } else if (term?.includes(':')) {
        const [field, property] = term.split(':');
        // search on jsonb property
        where.push({
          ...queryOptions,
          [field]: Raw((alias) => `${alias} ->> '${property}' ILIKE '%${searchTerm}%'`),
        });
      } else {
        where.push({
          ...queryOptions,
          [term]: ILike(`%${searchTerm}%`),
        });
      }
    }
    opts.where = where as FindManyOptions<T>['where'];
  }

  const skip = (page - 1) * limit;
  if (skip && !isNaN(skip)) opts.skip = skip;
  if (limit && !isNaN(limit)) opts.take = limit;

  if (options?.relations) opts.relations = options?.relations;

  // createdAt are always selected for default createdAt desc order
  if (options?.select) opts.select = { ...options?.select, createdAt: true };

  if (sortBy && sortOrder) {
    opts.order = {
      [sortBy]: sortOrder,
    };
  }

  if (sort) {
    const sortOrderBy = sort?.reduce((result, { by, order }) => {
      result[by] = order;
      return result;
    }, {});

    opts.order = sortOrderBy;
  }

  const [data, total] = await repo.findAndCount(opts);

  const combinedData = [...initialData, ...data];

  return new SuccessResponse<T[]>(`${repo.metadata.name} fetched successfully`, combinedData, {
    total: total,
    page: toNumber(page),
    limit: toNumber(limit),
    skip,
  });
}
