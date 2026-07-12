'use strict';

const path = require('path');

/**
 * Module-level maps to track unique values across files within a single lint run.
 *
 * NOTE: ESLint processes files independently, so cross-file uniqueness detection
 * is best-effort. These maps persist for the lifetime of the ESLint process.
 * For guaranteed cross-file uniqueness, consider a separate validation script.
 *
 * We clear the maps via a flag on each fresh ESLint invocation (CLI), but in
 * long-lived editor sessions the maps accumulate across files which is the
 * desired behavior for catching duplicates.
 */
const tableNames = new Map();
const apiRouteNames = new Map();

/**
 * Safely extracts a literal string value from an AST property node.
 * Returns undefined for computed keys/non-literal values.
 */
function getLiteralValue(propNode) {
  if (!propNode || !propNode.value) return undefined;
  // Handle Literal nodes (string, number)
  if (propNode.value.type === 'Literal' && typeof propNode.value.value === 'string') {
    return propNode.value.value;
  }
  return undefined;
}

/**
 * Gets the property name from an AST key node.
 * Returns undefined for computed property names.
 */
function getPropertyName(propNode) {
  if (!propNode || !propNode.key) return undefined;
  if (propNode.key.type === 'Identifier' && !propNode.computed) {
    return propNode.key.name;
  }
  if (propNode.key.type === 'Literal') {
    return String(propNode.key.value);
  }
  return undefined;
}

/**
 * The set of custom decorators that mark a class (or its members) as a
 * "managed" entity. Validation only runs when at least one of these
 * decorators is present on the class or any of its property members.
 */
const CUSTOM_DECORATORS = new Set(['AutoEntity', 'AutoIndex', 'AutoJoinColumn']);

/**
 * Returns the plain identifier name for a decorator node.
 * Handles both `@AutoEntity` (Identifier) and `@AutoEntity()` (CallExpression).
 */
function getDecoratorName(decoratorNode) {
  const expr = decoratorNode.expression;
  if (!expr) return undefined;
  if (expr.type === 'Identifier') return expr.name;
  if (expr.type === 'CallExpression' && expr.callee?.type === 'Identifier') {
    return expr.callee.name;
  }
  return undefined;
}

/**
 * Returns true if the class declaration (or any of its property members)
 * carries at least one of the custom decorators defined in CUSTOM_DECORATORS.
 */
function hasCustomDecorators(classNode) {
  // Class-level decorators, e.g. @AutoEntity()
  const classDecorators = classNode.decorators ?? [];
  if (classDecorators.some((d) => CUSTOM_DECORATORS.has(getDecoratorName(d)))) {
    return true;
  }

  // Member-level decorators, e.g. @AutoIndex(), @AutoJoinColumn()
  return classNode.body.body.some((member) => {
    const memberDecorators = member.decorators ?? [];
    return memberDecorators.some((d) => CUSTOM_DECORATORS.has(getDecoratorName(d)));
  });
}

/**
 * Checks if a value is unique in the given map, reports if duplicate.
 */
function checkUniqueness(context, map, propNode, propName, value, className, fileName) {
  if (map.has(value) && map.get(value) !== className) {
    context.report({
      node: propNode,
      messageId: 'duplicateValue',
      data: { propName, value, fileName },
    });
  } else {
    map.delete(value);
    map.set(value, className);
  }
}

module.exports = {
  'entity-blueprint-validation': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ensure unique tableName, apiRouteName for each entity, and enforce presence of SEARCH_TERMS in *.entity.ts files',
        category: 'Best Practices',
      },
      schema: [],
      messages: {
        duplicateValue: '{{propName}} value "{{value}}" is duplicated in file "{{fileName}}".',
        missingProp:
          'Entity in file "{{fileName}}" must have a public static readonly "{{propName}}" property.',
        invalidFile: 'Entities must be in files named *.entity.ts',
      },
    },
    create(context) {
      return {
        Program(node) {
          const fileName = path.basename(context.getFilename());

          // Check if file follows the *.entity.ts convention
          if (!fileName.endsWith('.entity.ts') || fileName === 'base.entity.ts') {
            return; // Skip non-entity files
          }

          // Look for class declarations
          node.body.forEach((item) => {
            const statement = item?.declaration ?? item;
            if (statement?.type === 'ClassDeclaration') {
              // Only validate classes that use at least one custom decorator
              // (AutoEntity, AutoIndex, or AutoJoinColumn).
              if (!hasCustomDecorators(statement)) {
                return;
              }

              const className = statement.id.name;

              const staticProps = statement.body.body.filter(
                (n) => n.type === 'PropertyDefinition' && n.static === true,
              );

              // --- Check tableName ---
              const tableNameProp = staticProps.find(
                (prop) => getPropertyName(prop) === 'tableName',
              );
              if (!tableNameProp) {
                context.report({
                  node: statement,
                  messageId: 'missingProp',
                  data: { fileName, propName: 'tableName' },
                });
              } else {
                const tableNameValue = getLiteralValue(tableNameProp);
                if (tableNameValue != null) {
                  checkUniqueness(
                    context,
                    tableNames,
                    tableNameProp,
                    'tableName',
                    tableNameValue,
                    className,
                    fileName,
                  );
                }
              }

              // --- Check apiRouteName ---
              const apiRouteNameProp = staticProps.find(
                (prop) => getPropertyName(prop) === 'apiRouteName',
              );
              if (!apiRouteNameProp) {
                context.report({
                  node: statement,
                  messageId: 'missingProp',
                  data: { fileName, propName: 'apiRouteName' },
                });
              } else {
                const apiRouteNameValue = getLiteralValue(apiRouteNameProp);
                if (apiRouteNameValue != null) {
                  checkUniqueness(
                    context,
                    apiRouteNames,
                    apiRouteNameProp,
                    'apiRouteName',
                    apiRouteNameValue,
                    className,
                    fileName,
                  );
                }
              }

              // --- Check SEARCH_TERMS (presence only, no uniqueness) ---
              const searchTermsProp = staticProps.find(
                (prop) => getPropertyName(prop) === 'SEARCH_TERMS',
              );
              if (!searchTermsProp) {
                context.report({
                  node: statement,
                  messageId: 'missingProp',
                  data: { fileName, propName: 'SEARCH_TERMS' },
                });
              }
            }
          });
        },
      };
    },
  },
};
