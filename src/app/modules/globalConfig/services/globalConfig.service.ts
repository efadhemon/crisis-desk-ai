import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalConfigUpdateDTO } from '../dtos/globalConfig/update.dto';
import { GlobalConfig } from '../entities/globalConfig.entity';

@Injectable()
export class GlobalConfigService {
  constructor(
    @InjectRepository(GlobalConfig)
    private readonly repo: Repository<GlobalConfig>,
  ) {}

  async getConfig(): Promise<GlobalConfig> {
    const config = await this.repo.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    if (!config) {
      throw new NotFoundException(
        'Configuration parameters are missing. Please check configurations !!!',
      );
    }
    return config;
  }

  async update(data: GlobalConfigUpdateDTO): Promise<GlobalConfig> {
    const config = await this.getConfig();
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    return this.repo.save({ id: config.id, ...data });
  }
}
