import { GlobalConfig } from '@src/app/modules/globalConfig/entities/globalConfig.entity';
import { DataSource } from 'typeorm';

export default class GlobalConfigSeeder {
  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<void> {
    const globalConfig = await this.dataSource.manager.find(GlobalConfig);
    if (globalConfig.length <= 0) {
      await this.dataSource.manager.save(GlobalConfig, {
        otpExpiresInMin: 5,
      } satisfies Partial<GlobalConfig>);
    }
  }
}
