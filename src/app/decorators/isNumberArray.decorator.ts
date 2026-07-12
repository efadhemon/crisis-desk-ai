import { buildMessage, isNumber, ValidateBy, ValidationOptions } from 'class-validator';

export const IS_NUMBER_ARRAY = 'isNumberArray';

export function isNumberArray(value: unknown): boolean {
  let isOnlyNumber = true;
  if (!Array.isArray(value)) {
    return false;
  }
  value.forEach((item) => {
    if (!isNumber(item)) {
      isOnlyNumber = false;
    }
  });
  return isOnlyNumber;
}

export function IsNumberArray(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_NUMBER_ARRAY,
      validator: {
        validate: (value, _args): boolean => isNumberArray(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be an array of number',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
