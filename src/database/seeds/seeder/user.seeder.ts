import { BcryptHelper } from '@src/app/helpers';
import { User } from '@src/app/modules/user/entities/user.entity';
import { ENUM_USER_TYPES } from '@src/app/modules/user/enums';
import { ENV } from '@src/env';
import { DataSource } from 'typeorm';

export default class UserSeeder {
  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<void> {
    const existing = await this.dataSource.manager.findOne(User, {
      where: { email: ENV.seedData.superAdminEmail },
    });

    if (existing) {
      if (existing.userType !== ENUM_USER_TYPES.INTERNAL) {
        existing.userType = ENUM_USER_TYPES.INTERNAL;
        await this.dataSource.manager.save(User, existing);
      }
      return;
    }

    const bcryptHelper = new BcryptHelper();
    const password = await bcryptHelper.hash(ENV.seedData.superAdminPassword);

    await this.dataSource.manager.save(User, {
      email: ENV.seedData.superAdminEmail,
      username: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      userType: ENUM_USER_TYPES.INTERNAL,
      password,
      isVerified: true,
    } satisfies Partial<User>);
  }
}
