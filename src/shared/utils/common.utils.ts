import { BadRequestException } from '@nestjs/common';
import dayjs from 'dayjs';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as QRCode from 'qrcode';
import { EXPERIENCE_OPTIONS } from '../constants/common.constants';

export const asyncForEach = async <T = any>(
  array: T[],
  callback: (item: T, index: number, self: T[]) => void,
): Promise<void> => {
  if (!Array.isArray(array)) {
    throw Error('Expected an array');
  }
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export const identifyIdentifier = (
  identifier: string,
): { key: 'email' | 'phoneNumber' | 'username'; value: string } => {
  const phoneNumberRegex = /^[\d\s().-]+$/;
  const usernameRegex = /^[a-z0-9]{3,16}$/; // Only lowercase letters and numbers (no underscores)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (phoneNumberRegex.test(identifier)) {
    return { key: 'phoneNumber', value: identifier };
  } else if (usernameRegex.test(identifier)) {
    return { key: 'username', value: identifier };
  } else if (emailRegex.test(identifier)) {
    return { key: 'email', value: identifier };
  } else {
    throw new BadRequestException('Invalid Identifier!!');
  }
};

export const getPaginationData = (payload: any): { skip: number; limit: number; page: number } => {
  let { page, limit } = payload;
  page = Number(page || 1);
  limit = Number(limit || 10);
  const skip = (page - 1) * limit;
  return { skip, limit, page };
};

export const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const isNumberArrayEqual = (array1: number[], array2: number[]): boolean => {
  array1 = array1.sort((x: number, y: number) => x - y);
  array2 = array2.sort((x: number, y: number) => x - y);

  return (
    Array.isArray(array1) &&
    Array.isArray(array2) &&
    array1.length === array2.length &&
    array1.every((val, index) => val === array2[index])
  );
};

export const unifyCombinationArray = (
  array: { combinations: number[]; goTo: number; id?: number }[],
): { combinations: number[]; goTo: number; id?: number }[] => {
  const uniqueArr = array.filter((item, index, self) => {
    const combination = item.combinations.slice().sort().join(',');
    return (
      index === self.findIndex((obj) => obj.combinations.slice().sort().join(',') === combination)
    );
  });
  return uniqueArr;
};

export function isArrayHasSameObject<T>(arr: T[], propertyKey: keyof T): boolean {
  const unique = [...new Set(arr.map((a) => a[propertyKey]))];
  if (unique.length === arr.length) {
    return false;
  }

  return true;
}
export const gen6digitOTP = (): number => {
  return Math.floor(100000 + Math.random() * 900000);
};

export const generateFilename = (file): string => {
  return `${Date.now()}${path.extname(file.originalname)}`;
};

export const storageFileOptions = diskStorage({
  destination: './uploads/temp',
  filename: (_req, file, callback) => {
    callback(null, generateFilename(file));
  },
});

export const getMatchedLogic = (logics: any[], providedCombination: number[]): [] => {
  let matchedLogic = null;
  try {
    logics.map((logic) => {
      const combinations = logic.combinations.map((c) => c.answerId);
      if (isNumberArrayEqual(combinations, providedCombination)) {
        matchedLogic = logic;
      }
    });
  } catch (error) {
    console.error('🚀 ~ getMatchedLogic ~ error:', error);
    matchedLogic = null;
  }

  return matchedLogic;
};

export function generateCode(prefix = ''): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const msec = String(now.getMilliseconds()).padStart(3, '0');
  return `${prefix}${year}${month}${date}${msec}`;
}

export const pick = (obj: object, keys: string[]): Record<string, any> => {
  return keys.reduce<{ [key: string]: unknown }>((finalObj, key) => {
    if (obj && Object.hasOwnProperty.call(obj, key)) {
      finalObj[key] = obj[key as keyof typeof obj];
    }
    return finalObj;
  }, {});
};

export function getTotalExperienceScore(
  experiences: { startDate: string; endDate: string | null }[],
): { label: string; key: string; score: number } {
  let totalMonths = 0;

  for (const exp of experiences) {
    const start = dayjs(exp.startDate);
    const end = exp.endDate ? dayjs(exp.endDate) : dayjs();

    if (start.isValid() && end.isValid() && end.isAfter(start)) {
      const months = end.diff(start, 'month', true); // fractional months
      totalMonths += Math.max(months, 0);
    }
  }

  const totalYears = totalMonths / 12;

  if (totalYears === 0) return EXPERIENCE_OPTIONS[0];
  if (totalYears > 0 && totalYears < 1) return EXPERIENCE_OPTIONS[1];
  if (totalYears >= 1 && totalYears < 3) return EXPERIENCE_OPTIONS[2];
  if (totalYears >= 3 && totalYears < 5) return EXPERIENCE_OPTIONS[3];
  if (totalYears >= 5 && totalYears < 8) return EXPERIENCE_OPTIONS[4];
  return EXPERIENCE_OPTIONS[5];
}

export function calculateMatchingPercentage(
  matchedProperties: number,
  totalProperties: number,
): number {
  if (totalProperties === 0) {
    return 0; // Avoid division by zero
  }
  const matchedPercentage = (matchedProperties / totalProperties) * 100;
  return Math.round(matchedPercentage);
}

export async function generateQrCode(text: string): Promise<any> {
  try {
    return await QRCode.toDataURL(text, { errorCorrectionLevel: 'H' });
  } catch (err) {
    console.error('===================>', err);
  }
}

/**
 * Converts a string from PascalCase or camelCase to snake_case.
 * Frequently used for database column names or object keys.
 * @param value - The string to convert.
 * @example 'UserProfile' -> 'user_profile'
 * @example 'ID123' -> 'id123'
 * @returns The lowercased string with underscores as delimiters.
 */
export function toSnakeCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Converts a string from PascalCase or camelCase to kebab-case.
 * Frequently used for CSS class names, URL slugs, or API route segments.
 * @param value - The string to convert.
 * @example 'AdminUser' -> 'admin-user'
 * @example 'userSettings' -> 'user-settings'
 * @returns The lowercased string with hyphens as delimiters.
 */
export function toKebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Converts a string from any case to regular case.
 * Frequently used for display purposes.
 * @param value - The string to convert.
 * @example 'AdminUser' -> 'admin user'
 * @example 'user_settings' -> 'user settings'
 * @returns The lowercased string with spaces as delimiters.
 */
export function toRegularCase(value: string): string {
  return value
    ?.replace(/[_\-]/g, ' ')
    ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    ?.toLowerCase()
    ?.split(' ')
    ?.filter(Boolean)
    ?.map((word) => word?.charAt(0)?.toUpperCase() + word?.slice(1))
    ?.join(' ');
}

/**
 * Generates a standardized foreign key name for database constraints.
 * Follows the pattern: fk_[table_name]_[column_name]
 * @param tableName - The name of the table containing the foreign key.
 * @param column - The column name (will be converted to snake_case).
 * @example makeForeignKeyName('orders', 'userId') -> 'fk_orders_user_id'
 * @returns A lowercased string formatted as a foreign key identifier.
 */
export function makeForeignKeyName(tableName: string, column: string): string {
  if (!tableName || !column) {
    throw new Error('Both tableName and column are required to generate a foreign key name.');
  }
  // We ensure both the table and column are snake_case for consistency
  return `fk_${toSnakeCase(tableName)}_${toSnakeCase(column)}`.toLowerCase().slice(0, 63);
}

/**
 * Generates a standardized index name for database optimization.
 * Supports composite indexes by joining multiple columns with underscores.
 * Follows the pattern: idx_[table_name]_[column1]_[column2]
 * @param tableName - The name of the table being indexed.
 * @param columns - One or more column names to be included in the index.
 * @example makeIndexName('users', 'email') -> 'idx_users_email'
 * @example makeIndexName('posts', 'authorId', 'createdAt') -> 'idx_posts_author_id_created_at'
 * @returns A lowercased string formatted as an index identifier.
 */
export function makeIndexName(tableName: string, ...columns: string[]): string {
  if (!tableName || columns.length === 0) {
    throw new Error('Table name and at least one column are required to generate an index name.');
  }
  // 1. Initial attempt using your original pattern
  const columnPart = columns.map(toSnakeCase).join('_');
  let indexName = `idx_${toSnakeCase(tableName)}_${columnPart}`.toLowerCase();
  // 2. If it's over 63 characters, apply the "shorter version" logic
  // because postgres index name max length is 63 characters
  if (indexName.length > 63) {
    // Remove _mapping/_mappings from table
    const cleanTable = toSnakeCase(tableName).replace(/_mappings?$/, '');
    // Remove _id from columns
    const cleanCols = columns.map((col) => toSnakeCase(col).replace(/_id$/, '')).join('_');

    indexName = `idx_${cleanTable}_${cleanCols}`.toLowerCase();
    // 3. Final safety slice if it's STILL over 63
    if (indexName.length > 63) {
      indexName = indexName.slice(0, 63).replace(/_$/, '');
    }
  }

  return indexName;
}
