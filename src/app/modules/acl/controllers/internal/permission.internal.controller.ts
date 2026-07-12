import {
  Body,
  Controller,
  Delete,
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
import { FindOptionsRelations } from 'typeorm';
import { CreatePermissionDTO, FilterPermissionDTO, UpdatePermissionDTO } from '../../dtos';
import { Permission } from '../../entities/permission.entity';
import { PermissionService } from '../../services/permission.service';

@ApiTags('RBAC#Permission')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@UseInterceptors(InternalRequestInterceptor)
@Controller(`internal/${Permission.apiRouteName}`)
export class PermissionInternalController {
  constructor(private readonly service: PermissionService) {}
  // RELATIONS = ['permissionType'];
  RELATIONS: FindOptionsRelations<Permission> = { permissionType: true };

  @Get()
  async findAll(@Query() query: FilterPermissionDTO): Promise<SuccessResponse<Permission[]>> {
    return this.service.findAllBase(query, { relations: this.RELATIONS });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Permission> {
    return this.service.findByIdBase(id, { relations: this.RELATIONS });
  }

  @Post()
  async createOne(@Body() body: CreatePermissionDTO): Promise<Permission> {
    return this.service.createOneBase(body, { relations: this.RELATIONS });
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() body: UpdatePermissionDTO): Promise<Permission> {
    return this.service.updateOneBase(id, body, { relations: this.RELATIONS });
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string): Promise<SuccessResponse> {
    return this.service.deleteOneBase(id);
  }
}
