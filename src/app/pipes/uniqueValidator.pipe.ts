import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource, EntitySchema, FindOptionsWhere } from 'typeorm';

export interface IUniqueValidationArguments<E> extends ValidationArguments {
  constraints: [
    EntitySchema<E>,
    ((validationArguments: ValidationArguments) => FindOptionsWhere<E>) | keyof E,
  ];
}

@ValidatorConstraint({
  name: 'UniqueValidatorPipe',
  async: true,
})
@Injectable()
export class UniqueValidatorPipe<T> implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  public async validate(_value: string, args: IUniqueValidationArguments<T>): Promise<boolean> {
    const [EntityClass, whereConditions] = args.constraints;
    const filters = typeof whereConditions === 'function' ? whereConditions(args) : whereConditions;

    const isExist = await this.dataSource.getRepository(EntityClass).findOne({
      where: filters as FindOptionsWhere<T>,
    });

    return isExist ? false : true;
  }

  public defaultMessage(args: ValidationArguments): string {
    return `${args.property} '${args.value}' already exists`;
  }
}
