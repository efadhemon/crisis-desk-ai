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
