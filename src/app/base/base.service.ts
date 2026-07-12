import { NotFoundException } from '@nestjs/common';
import { BaseEntity, IBaseService } from '@src/app/base';
import { findAllByRepo } from '@src/shared/utils/dborm.utils';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  SaveOptions,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import isUuidValidator from 'validator/lib/isUUID';
import { IFindAllBaseFIlters, IFindBaseOptions } from '../interfaces';
import { SuccessResponse } from '../types';

export abstract class BaseService<T extends BaseEntity> implements IBaseService<T> {
  constructor(public readonly repo: Repository<T>) {}

  public async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repo.find(options);
  }

  public async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repo.count(options);
  }

  public async findOne(options?: FindOneOptions<T>): Promise<T> {
    return this.repo.findOne(options);
  }

  public async delete(
    criteria: string | string[] | number | number[] | Date | Date[] | FindOptionsWhere<T>,
  ): Promise<DeleteResult> {
    return this.repo.delete(criteria);
  }

  public async save(
    entities: T[],
    options?: SaveOptions & {
      reload: false;
    },
  ): Promise<T[]> {
    return this.repo.save(entities, options);
  }

  public async saveOne(
    entity: DeepPartial<T>,
    options?: SaveOptions & {
      reload: false;
    },
  ): Promise<DeepPartial<T>> {
    return this.repo.save(entity, options);
  }

  public async isExist(filters: Partial<T>, options?: IFindBaseOptions<T>): Promise<T> {
    const relations = options?.relations ?? {};
    const isExist = await this.repo.findOne({
      where: filters as FindOptionsWhere<T>,
      relations: relations,
    });
    let msg = '';
    if (filters?.id) {
      msg = `ID ${filters.id}`;
    }
    if (!isExist) {
      throw new NotFoundException(`${this.repo.metadata.name} With ${msg} Not Found`);
    }
    return isExist;
  }

  async findAllBase(
    filters: IFindAllBaseFIlters<T>,
    options?: IFindBaseOptions<T>,
  ): Promise<SuccessResponse<T[]>> {
    return findAllByRepo(this.repo, filters, options);
  }

  async findByIdBase(id: string, options?: IFindBaseOptions<T>): Promise<T> {
    const opts: FindOneOptions = {
      where: { id },
    };
    if (options?.select) opts.select = options?.select;
    if (options?.relations) opts.relations = options?.relations;

    return await this.repo.findOne(opts);
  }

  async findOneBase(filters: Partial<T>, options?: IFindBaseOptions<T>): Promise<T> {
    const relations = this.repo.metadata.relations.map((r) => r.propertyName);

    Object.keys(filters).forEach((key) => {
      if (relations.includes(key) && isUuidValidator(filters[key])) {
        filters[key] = {
          id: filters[key],
        };
      }
    });
    const opts: FindOneOptions = {
      where: {
        ...filters,
      },
    };
    if (options?.select) opts.select = options?.select;
    if (options?.relations) opts.relations = options?.relations;
    return await this.repo.findOne(opts);
  }

  /**
   * Build an entity with `repo.create(data)` then `save(entity)` — do not `save(data)` alone.
   *
   * `BaseEntity` sets `createdBy` in `@BeforeInsert`, which reads `authUser` from CLS
   * (`ClsUserInterceptor`). That hook runs on entity instances during `save`, not when
   * persisting a plain DTO. `repo.create()` materializes the instance so audit fields
   * are populated (same pattern as e.g. chat room creation).
   */
  async createOneBase(data: DeepPartial<T>, options?: IFindBaseOptions<T>): Promise<T> {
    const entity = this.repo.create(data);
    const created = await this.repo.save(entity);
    return await this.findByIdBase(created.id, options);
  }

  /**
   * Same as `createOneBase`: `create` + `save(entities)` so `@BeforeInsert` runs per row
   * and `createdBy` is set from CLS for bulk inserts.
   */
  async createBulkBase(data: DeepPartial<T>[]): Promise<SuccessResponse> {
    const entities = this.repo.create(data);
    await this.repo.save(entities);
    return new SuccessResponse('');
  }

  /**
   * Load the row, merge changes, and `save(entity)` — do not use `repo.update()`.
   *
   * `BaseEntity` sets `updatedBy` in `@BeforeUpdate`, which reads `authUser` from CLS
   * (`ClsUserInterceptor`). Those hooks run only on the entity lifecycle (`save` on an
   * instance). `repo.update(id, data)` issues a direct SQL UPDATE and skips listeners,
   * so audit columns stay null. Same pattern as services that load + mutate + save
   * (e.g. chat room status updates).
   */
  async updateOneBase(
    id: string,
    data: QueryDeepPartialEntity<T>,
    options?: IFindBaseOptions<T>,
  ): Promise<T> {
    const entity = await this.repo.findOne({ where: { id } as FindOptionsWhere<T> });
    if (!entity) throw new NotFoundException(`${this.repo.metadata.name} with ID ${id} not found`);

    Object.assign(entity, data);
    await this.repo.save(entity);
    return await this.findByIdBase(id, options);
  }

  async deleteOneBase(id: string): Promise<SuccessResponse> {
    await this.repo.delete(id);
    return new SuccessResponse(`${this.repo.metadata.name} deleted successfully`, null);
  }

  async deleteBulkBase(id: string[]): Promise<SuccessResponse> {
    await this.repo.delete(id);
    return new SuccessResponse(`${this.repo.metadata.name} deleted successfully`, null);
  }

  async softDeleteOneBase(id: string): Promise<SuccessResponse> {
    await this.repo.softRemove({ id } as DeepPartial<T>);
    return new SuccessResponse(`${this.repo.metadata.name} deleted successfully`, null);
  }

  async recoverByIdBase(id: string, options?: IFindBaseOptions<T>): Promise<T> {
    await this.repo.recover({ id } as DeepPartial<T>);
    return await this.findByIdBase(id, options);
  }
}
