import { buildMessage, ValidateBy } from 'class-validator';

export const CAN_NOT_HAVE_DUPLICATE_COMBINATION = 'canNotHaveDuplicateCombination';

function isValidated(value: any[]): boolean {
  let validated = false;

  if (value && value.length > 0) {
    const combinations = value.map((a) => {
      if (a.combinations && a.combinations.length > 0) {
        return a.combinations.map((c) => c.answer);
      }
      return [];
    });
    const sortedArr = combinations.map((subArr) => subArr.sort());
    const stringified = sortedArr.map((subArr) => JSON.stringify(subArr));
    const unique = new Set(stringified);
    const hasDuplicate = unique.size !== combinations.length;
    if (hasDuplicate) {
      validated = false;
    } else {
      validated = true;
    }
  }
  return validated;
}

export function CanNotHaveDuplicateCombination(): PropertyDecorator {
  return ValidateBy({
    name: CAN_NOT_HAVE_DUPLICATE_COMBINATION,
    validator: {
      validate: (value): boolean => isValidated(value),
      defaultMessage: buildMessage(
        (eachPrefix) => eachPrefix + '$property can not have duplicate combination',
      ),
    },
  });
}
