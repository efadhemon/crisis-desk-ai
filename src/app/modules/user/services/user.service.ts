import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@src/app/base/base.service';
import {
  commitTransaction,
  rollbackTransaction,
  startTransaction,
} from '@src/shared/utils/dborm.utils';
import { isNotEmptyObject } from 'class-validator';
import { DataSource, FindOptionsRelations, Repository } from 'typeorm';
import { UserCreateDTO } from '../dtos/user/create.dto';
import { UserUpdateDTO } from '../dtos/user/update.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    public readonly repo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {
    super(repo);
  }

  async createUser(payload: UserCreateDTO, relations?: FindOptionsRelations<User>): Promise<User> {
    const { userType, ...restPayload } = payload;

    if (!userType) {
      throw new BadRequestException('User type is required');
    }

    const queryRunner = await startTransaction(this.dataSource);

    let createdUser: User = null;
    try {
      createdUser = await queryRunner.manager.save(User, {
        ...restPayload,
        userType: userType,
        isVerified: true,
      } satisfies User);

      await commitTransaction(queryRunner);
    } catch (error) {
      await rollbackTransaction(queryRunner);
      throw new BadRequestException(error.message || 'User not created');
    }

    const updatedUser = await this.findOne({
      where: {
        id: createdUser.id,
      },
      relations,
    });

    return updatedUser;
  }

  async updateUser(
    id: string | string,
    payload: UserUpdateDTO,
    relations: FindOptionsRelations<User>,
  ): Promise<User> {
    await this.isExist({ id: id as any });

    const { roles: _roles, ...userData } = payload;

    const queryRunner = await startTransaction(this.dataSource);

    try {
      if (isNotEmptyObject(userData)) {
        await queryRunner.manager.update(User, { id }, userData);
      }

      await commitTransaction(queryRunner);
    } catch (error) {
      await rollbackTransaction(queryRunner);
      throw new BadRequestException(error.message || 'User not updated');
    }

    const updatedUser = await this.findOne({
      where: { id: id },
      relations,
    });

    return updatedUser;
  }
}
