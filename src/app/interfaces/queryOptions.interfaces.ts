import { DeepPartial, FindOptionsRelations, FindOptionsSelect } from 'typeorm';
import { IMultipleSort } from '../base';

export interface IFindBaseOptions<T> {
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
  SEARCH_TERMS?: string[];
}

export type IFindAllBaseFIlters<T> = DeepPartial<T> & {
  page?: number;
  limit?: number;
  searchTerm?: string;
  initialLoadIds?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: IMultipleSort['order'];
  sort?: IMultipleSort[];
};
