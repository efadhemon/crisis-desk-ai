import { buildMessage, isString, ValidateBy, ValidationOptions } from 'class-validator';

export const IS_STRING_ARRAY = 'isStringArray';

export function isStringArray(value: unknown): boolean {
  let isOnlyString = true;
  if (!Array.isArray(value)) {
    return false;
  }
  value.forEach((item) => {
    if (!isString(item)) {
      isOnlyString = false;
    }
  });
  return isOnlyString;
}

export function IsStringArray(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_STRING_ARRAY,
      validator: {
        validate: (value, _args): boolean => isStringArray(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be an array of string',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
