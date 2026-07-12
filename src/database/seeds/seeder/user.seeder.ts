import { BcryptHelper } from '@src/app/helpers';
import { Role } from '@src/app/modules/acl/entities/role.entity';
import { User } from '@src/app/modules/user/entities/user.entity';
import { UserRole } from '@src/app/modules/user/entities/userRole.entity';
import { ENV } from '@src/env';
import { ENUM_ACL_DEFAULT_ROLES } from '@src/shared';
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

      const createdAdminUser = await this.dataSource.manager.save(User, {
        email: ENV.seedData.superAdminEmail,
        username: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        password,
        isVerified: true,
      } satisfies Partial<User>);

      let superAdminRole = await this.dataSource.manager.findOne(Role, {
        where: {
          title: ENUM_ACL_DEFAULT_ROLES.SUPER_ADMIN,
        },
      });
      if (!superAdminRole) {
        superAdminRole = await this.dataSource.manager.save(Role, {
          title: ENUM_ACL_DEFAULT_ROLES.SUPER_ADMIN,
        } satisfies Partial<Role>);
      }
      let internalRole = await this.dataSource.manager.findOne(Role, {
        where: {
          title: ENUM_ACL_DEFAULT_ROLES.INTERNAL,
        },
      });
      if (!internalRole) {
        internalRole = await this.dataSource.manager.save(Role, {
          title: ENUM_ACL_DEFAULT_ROLES.INTERNAL,
        } satisfies Partial<Role>);
      }
      await this.dataSource.manager.save(UserRole, [
        {
          roleId: superAdminRole.id,
          userId: createdAdminUser?.id,
          isDefault: true,
        } satisfies Partial<UserRole>,
        {
          roleId: internalRole.id,
          userId: createdAdminUser?.id,
          isDefault: true,
        } satisfies Partial<UserRole>,
      ]);
    }
  }
}
