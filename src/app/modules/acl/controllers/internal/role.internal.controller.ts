import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalRequestInterceptor } from '@src/app/interceptors';
import { SuccessResponse } from '@src/app/types';
import { ENUM_ACL_DEFAULT_ROLES } from '@src/shared';
import { FindOptionsRelations, Not } from 'typeorm';
import {
  CreateRoleDTO,
  FilterPermissionDTO,
  FilterRoleDTO,
  RemovePermissionsDTO,
  UpdateRoleDTO,
} from '../../dtos';
import { AddPermissionsDTO } from '../../dtos/role/addPermissions.dto';
import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';
import { RoleService } from '../../services/role.service';

@ApiTags('RBAC#Role')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@UseInterceptors(InternalRequestInterceptor)
@Controller(`internal/${Role.apiRouteName}`)
export class RoleInternalController {
  constructor(private readonly service: RoleService) {}
  RELATIONS: FindOptionsRelations<Role> = {};

  @Get()
  async findAll(@Query() query: FilterRoleDTO): Promise<SuccessResponse<Role[]>> {
    query['title'] = Not(ENUM_ACL_DEFAULT_ROLES.SUPER_ADMIN);
    return this.service.findAllBase(query, { relations: this.RELATIONS });
  }

  @Get(':id/available-permissions')
  async availablePermissions(
    @Param('id') id: string,
    @Query() query: FilterPermissionDTO,
  ): Promise<Permission[]> {
    return this.service.availablePermissions(id, query);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Role> {
    return this.service.findByIdBase(id, { relations: this.RELATIONS });
  }

  @Post()
  async createOne(@Body() body: CreateRoleDTO): Promise<Role> {
    const isExist = await this.service.findOneBase({ title: body.title });
    if (isExist) throw new ConflictException(`Role ${isExist.title} already exists!`);
    return this.service.createOneBase(body, { relations: this.RELATIONS });
  }

  @Post(':id/add-permissions')
  async addPermission(
    @Param('id') id: string,
    @Body() body: AddPermissionsDTO,
  ): Promise<Permission[]> {
    return this.service.addPermissions(id, body);
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() body: UpdateRoleDTO): Promise<Role> {
    const isExist = await this.service.isExist({ id });
    if (Object.values(ENUM_ACL_DEFAULT_ROLES).includes(isExist.title as any))
      throw new ForbiddenException(`Can not modify default role ${isExist.title}!`);
    return this.service.updateOneBase(id, body, { relations: this.RELATIONS });
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string): Promise<SuccessResponse> {
    const isExist = await this.service.isExist({ id });
    if (Object.values(ENUM_ACL_DEFAULT_ROLES).includes(isExist.title as any))
      throw new ForbiddenException(`Can not delete default role ${isExist.title}!`);
    return this.service.deleteOneBase(id);
  }

  @Delete(':id/remove-permissions')
  async removePermission(
    @Param('id') id: string,
    @Body() body: RemovePermissionsDTO,
  ): Promise<Permission[]> {
    return this.service.removePermissions(id, body);
  }
}
