import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { IFindBaseOptions } from '../interfaces';
import { GenericObject, SuccessResponse } from '../types';

export interface IBaseService<T> {
  findByIdBase(id: string, options?: IFindBaseOptions<T>): Promise<T>;

  isExist(filters: GenericObject): Promise<T>;

  findOneBase(filters: GenericObject, options?: IFindBaseOptions<T>): Promise<T>;

  findAllBase(filters: GenericObject, options?: IFindBaseOptions<T>): Promise<SuccessResponse<T[]>>;

  createOneBase(data: T, options?: IFindBaseOptions<T>): Promise<T>;

  updateOneBase(
    id: string,
    data: QueryDeepPartialEntity<T>,
    options?: IFindBaseOptions<T>,
  ): Promise<T>;

  deleteOneBase(id: string): Promise<SuccessResponse>;

  deleteBulkBase(id: string[]): Promise<SuccessResponse>;

  softDeleteOneBase(id: string): Promise<SuccessResponse>;

  recoverByIdBase(id: string, options?: IFindBaseOptions<T>): Promise<T>;
}

export interface IBaseTreeService<T> extends IBaseService<T> {
  getTrees(): Promise<T[]>;
  createOneTreeBase(payload: T, options: IFindBaseOptions<T>): Promise<T>;
}

export interface IMultipleSort {
  by: string;
  order: 'ASC' | 'DESC' | 'asc' | 'desc';
}
