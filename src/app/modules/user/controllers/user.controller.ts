import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@src/app/decorators';
import { IAuthUser } from '@src/app/interfaces';
import { FilterRoleDTO } from '@src/app/modules/acl/dtos';
import { Role } from '@src/app/modules/acl/entities/role.entity';
import { SuccessResponse } from '@src/app/types';
import { FindOptionsRelations, In } from 'typeorm';
import { UserCreateDTO } from '../dtos/user/create.dto';
import { UserFilterBulkByIdsDTO, UserFilterDTO } from '../dtos/user/filter.dto';
import { UserUpdateDTO } from '../dtos/user/update.dto';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';

@ApiTags('User')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@Controller(User.apiRouteName)
export class UserController {
  constructor(private readonly service: UserService) {}

  RELATIONS: FindOptionsRelations<User> = {
    userRoles: {
      role: true,
    },
  };

  @Get()
  async findAll(@Query() query: UserFilterDTO): Promise<SuccessResponse<User[]>> {
    if (query.roles && query.roles.length > 0) {
      query['userRoles'] = {
        role: {
          title: In(query.roles) as any,
        },
      };
      delete query.roles;
    }
    return this.service.findAllBase(query, { relations: this.RELATIONS });
  }

  @Get('me')
  async me(@AuthUser() authUser: IAuthUser): Promise<User> {
    return this.service.findByIdBase(authUser.id, {
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  @Post('bulk-by-ids')
  async findBulkByIds(@Body() payload: UserFilterBulkByIdsDTO): Promise<SuccessResponse<User[]>> {
    return this.service.findAllBase({ id: In(payload.ids) as any }, { relations: this.RELATIONS });
  }

  @Get(':id/available-roles')
  async availableRoles(@Param('id') id: string, @Query() query: FilterRoleDTO): Promise<Role[]> {
    return this.service.availableRoles(id, query);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<User> {
    return this.service.findByIdBase(id, { relations: this.RELATIONS });
  }

  @Post()
  async createOne(@Body() body: UserCreateDTO): Promise<User> {
    return this.service.createUser(body, this.RELATIONS);
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() body: UserUpdateDTO): Promise<User> {
    return this.service.updateUser(id, body, this.RELATIONS);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string | string): Promise<SuccessResponse> {
    return this.service.deleteOneBase(id as any);
  }
}
