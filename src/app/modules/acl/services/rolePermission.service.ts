import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@src/app/base';
import { Repository } from 'typeorm';
import { RolePermission } from '../entities/rolePermission.entity';

@Injectable()
export class RolePermissionService extends BaseService<RolePermission> {
  constructor(
    @InjectRepository(RolePermission)
    public readonly repo: Repository<RolePermission>,
  ) {
    super(repo);
  }
}
