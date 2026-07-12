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
import { AuthUser } from '@src/app/decorators';
import { InternalRequestInterceptor } from '@src/app/interceptors';
import { IAuthUser } from '@src/app/interfaces';
import { FilterRoleDTO } from '@src/app/modules/acl/dtos';
import { Role } from '@src/app/modules/acl/entities/role.entity';
import { SuccessResponse } from '@src/app/types';
import { FindOptionsRelations, In } from 'typeorm';
import { UserCreateDTO } from '../../dtos/user/create.dto';
import { UserFilterBulkByIdsDTO, UserFilterDTO } from '../../dtos/user/filter.dto';
import { UserUpdateDTO } from '../../dtos/user/update.dto';
import { User } from '../../entities/user.entity';
import { UserService } from '../../services/user.service';

@ApiTags('User')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@UseInterceptors(InternalRequestInterceptor)
@Controller(`internal/${User.apiRouteName}`)
export class UserInternalController {
  constructor(private readonly service: UserService) {}

  RELATIONS: FindOptionsRelations<User> = {
    userRoles: {
      role: true,
    },
  };

  @Get()
  async findAll(@Query() query: UserFilterDTO): Promise<SuccessResponse<User[]>> {
    // If the query has a 'roles' field, we need to filter users by their roles
    // This assumes that the 'roles' field is an array of role titles
    // and that the User entity has a relation to UserRoles which in turn has a relation to Role.
    if (query.roles && query.roles.length > 0) {
      query['userRoles'] = {
        role: {
          title: In(query.roles) as any, // Use In to query by multiple roles
        },
      };
      delete query.roles; // Remove roles from the query to avoid confusion
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

  //   @Post('recover/:id')
  //   async recoverById(@Param('id') id: string): Promise<User> {
  //     return this.service.recoverByIdBase(id);
  //   }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() body: UserUpdateDTO): Promise<User> {
    return this.service.updateUser(id, body, this.RELATIONS);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string | string): Promise<SuccessResponse> {
    return this.service.deleteOneBase(id as any);
  }

  //   @Delete('soft/:id')
  //   async softDeleteOne(@Param('id') id: string): Promise<SuccessResponse> {
  //     return this.service.softDeleteOneBase(id);
  //   }
}
