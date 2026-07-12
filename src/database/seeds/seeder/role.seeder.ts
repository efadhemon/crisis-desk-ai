import { Role } from '@src/app/modules/acl/entities/role.entity';
import { ENUM_ACL_DEFAULT_ROLES } from '@src/shared';
import { DataSource } from 'typeorm';

export default class RoleSeeder {
  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<void> {
    const isSuperAdminRoleExist = await this.dataSource.manager.findOne(Role, {
      where: { title: ENUM_ACL_DEFAULT_ROLES.SUPER_ADMIN },
    });

    if (!isSuperAdminRoleExist) {
      await this.dataSource.manager.save(
        Object.assign(new Role(), {
          title: ENUM_ACL_DEFAULT_ROLES.SUPER_ADMIN,
        }),
      );
    }

    const isInternalRoleExist = await this.dataSource.manager.findOne(Role, {
      where: { title: ENUM_ACL_DEFAULT_ROLES.INTERNAL },
    });

    if (!isInternalRoleExist) {
      await this.dataSource.manager.save(
        Object.assign(new Role(), {
          title: ENUM_ACL_DEFAULT_ROLES.INTERNAL,
        }),
      );
    }

    const isUserRoleExist = await this.dataSource.manager.findOne(Role, {
      where: { title: ENUM_ACL_DEFAULT_ROLES.USER },
    });

    if (!isUserRoleExist) {
      await this.dataSource.manager.save(
        Object.assign(new Role(), {
          title: ENUM_ACL_DEFAULT_ROLES.USER,
        }),
      );
    }

    const isEmployerRoleExist = await this.dataSource.manager.findOne(Role, {
      where: { title: ENUM_ACL_DEFAULT_ROLES.EMPLOYER },
    });

    if (!isEmployerRoleExist) {
      await this.dataSource.manager.save(
        Object.assign(new Role(), {
          title: ENUM_ACL_DEFAULT_ROLES.EMPLOYER,
        }),
      );
    }

    const isLawyerRoleExist = await this.dataSource.manager.findOne(Role, {
      where: { title: ENUM_ACL_DEFAULT_ROLES.LAWYER },
    });

    if (!isLawyerRoleExist) {
      await this.dataSource.manager.save(
        Object.assign(new Role(), {
          title: ENUM_ACL_DEFAULT_ROLES.LAWYER,
        }),
      );
    }

    const isProviderRoleExist = await this.dataSource.manager.findOne(Role, {
      where: { title: ENUM_ACL_DEFAULT_ROLES.PROVIDER },
    });

    if (!isProviderRoleExist) {
      await this.dataSource.manager.save(
        Object.assign(new Role(), {
          title: ENUM_ACL_DEFAULT_ROLES.PROVIDER,
        }),
      );
    }
  }
}
