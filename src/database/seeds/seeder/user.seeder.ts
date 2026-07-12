import { BcryptHelper } from '@src/app/helpers';
import { User } from '@src/app/modules/user/entities/user.entity';
import { ENV } from '@src/env';
import { DataSource } from 'typeorm';

export default class UserSeeder {
  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<void> {
    const isSuperAdminExist = await this.dataSource.manager.findOne(User, {
      where: { email: ENV.seedData.superAdminEmail },
    });

    if (!isSuperAdminExist) {
      const bcryptHelper = new BcryptHelper();

      const password = await bcryptHelper.hash(ENV.seedData.superAdminPassword);

      await this.dataSource.manager.save(User, {
        email: ENV.seedData.superAdminEmail,
        username: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        password,
        isVerified: true,
      } satisfies Partial<User>);
    }
  }
}
