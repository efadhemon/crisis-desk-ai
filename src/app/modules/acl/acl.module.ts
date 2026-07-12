import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyController } from './controllers/apiKey.controller';
import { PermissionController } from './controllers/permission.controller';
import { PermissionTypeController } from './controllers/permissionType.controller';
import { RoleController } from './controllers/role.controller';
import { ApiKey } from './entities/apiKey.entity';
import { Permission } from './entities/permission.entity';
import { PermissionType } from './entities/permissionType.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/rolePermission.entity';
import { ApiKeyService } from './services/apiKey.service';
import { PermissionService } from './services/permission.service';
import { PermissionTypeService } from './services/permissionType.service';
import { RoleService } from './services/role.service';
import { RolePermissionService } from './services/rolePermission.service';

const entities = [Role, Permission, PermissionType, RolePermission, ApiKey];
const services = [
  RoleService,
  PermissionService,
  PermissionTypeService,
  RolePermissionService,
  ApiKeyService,
];
const subscribers = [];
const controllers = [
  RoleController,
  PermissionController,
  PermissionTypeController,
  ApiKeyController,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services, ...subscribers],
  exports: [...services, ...subscribers],
  controllers: [...controllers],
})
export class AclModule {}
