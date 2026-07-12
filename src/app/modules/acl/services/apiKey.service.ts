import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@src/app/base';
import { Repository } from 'typeorm';
import { ApiKey } from '../entities/apiKey.entity';

@Injectable()
export class ApiKeyService extends BaseService<ApiKey> {
  constructor(
    @InjectRepository(ApiKey)
    public readonly repo: Repository<ApiKey>,
  ) {
    super(repo);
  }
}
