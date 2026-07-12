import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export const IS_NOT_NULL = 'isNotNull';

export function isNotNull(value: any): boolean {
  return value !== null;
}

export function IsNotNull(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: IS_NOT_NULL,
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          // Allow undefined (so the field can be optional) but reject null
          return isNotNull(value);
        },
        defaultMessage() {
          return '$property should not be null';
        },
      },
    });
  };
}
