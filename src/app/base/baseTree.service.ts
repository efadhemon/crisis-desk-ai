import { NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IFindBaseOptions } from '../interfaces';
import { BaseEntity } from './base.entity';
import { IBaseTreeService } from './base.interface';
import { BaseService } from './base.service';

export class BaseTreeService<T extends BaseEntity>
  extends BaseService<T>
  implements IBaseTreeService<T>
{
  constructor(
    repo: Repository<T>,
    protected dataSource: DataSource,
  ) {
    super(repo);
  }

  async getTrees(): Promise<T[]> {
    const treeRepo = this.dataSource.getTreeRepository(this.repo.target);
    const tree = await treeRepo.findTrees();
    return tree;
  }

  async createOneTreeBase(payload: T, _options: IFindBaseOptions<T>): Promise<T> {
    const { parent, ...rest } = payload as any;
    if (parent) {
      const parentCategory = await this.findOne({ where: { id: parent } });
      if (parentCategory) {
        const entity = this.repo.create({
          ...rest,
          parent: parentCategory,
        });
        return (await this.repo.save(entity)) as unknown as T;
      } else {
        throw new NotFoundException(`Parent with ID ${parent} not found`);
      }
    }
    const entity = this.repo.create(payload);
    return this.repo.save(entity);
  }
}
