import { ApiKey } from '@src/app/modules/acl/entities/apiKey.entity';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export default class ApiKeySeeder {
  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<void> {
    const existingKeys = await this.dataSource.manager.findOne(ApiKey, {
      where: { title: 'Core Panel', isActive: true },
    });
    if (!existingKeys) {
      const apiKey: string = uuidv4();
      console.warn('🚀 ~ ApiKeySeeder ~ run ~ apiKey:', apiKey);
      const newKey = this.dataSource.manager.create(ApiKey, {
        title: 'Core Panel',
        key: apiKey,
      });
      await this.dataSource.manager.save(ApiKey, newKey);
      console.info('✅ Core Panel API key seeded.');
    }
  }
}
