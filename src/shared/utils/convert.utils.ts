import { SUPPORTED_LANGUAGES } from '../constants/common.constants';

export const toBool = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
};

export const toNumber = (value: any): number => {
  return Number(value);
};

export const toBase64 = (value: string): string => {
  if (!value) return '';
  return Buffer.from(value, 'utf-8').toString('base64');
};

export const decodeBase64S = (value: string): string => {
  if (!value) return '';
  return Buffer.from(value, 'base64').toString('utf-8')?.replace(/\\n/g, '\n');
};

export function objectToReadableKeyValueArray<T extends Record<string, any>>(
  obj: T,
): Array<Record<string, any>> {
  // Group properties by base name (without language suffix)
  const grouped: Record<string, Record<string, any>> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if the key ends with a supported language suffix
    const languageSuffix = SUPPORTED_LANGUAGES.find((lang) => key.endsWith(`_${lang}`));

    if (languageSuffix) {
      // Extract base key (remove language suffix)
      const baseKey = key.slice(0, -(languageSuffix.length + 1)); // +1 for underscore

      // Initialize group if not exists
      if (!grouped[baseKey]) {
        grouped[baseKey] = {};
      }

      // Convert to readable format
      const readableKey = baseKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());

      // Store both key and value with language suffix
      grouped[baseKey][`key_${languageSuffix}`] = readableKey;
      grouped[baseKey][`value_${languageSuffix}`] = value;
    } else {
      // Non-localized property - convert normally
      const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

      grouped[key] = { key: readableKey, value };
    }
  }

  // Convert grouped object to array
  return Object.values(grouped);
}
