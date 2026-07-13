import tsEsLintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import tsEslint from 'typescript-eslint';
import entityValidatorRules from './eslint-local-rules/entity-validator.js';

const baseRules = tsEslint.configs.recommended
  .map((config) => config.rules)
  .filter(Boolean)
  .reduce((acc, curr) => ({ ...acc, ...curr }), {});

export default [
  eslintConfigPrettier,
  {
    ignores: ['.github/*', 'dist/*', 'docs/*', 'node_modules/*'],
  },
  {
    name: 'ts/default',
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        // tsconfigRootDir: '.',
      },
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      '@typescript-eslint': tsEsLintPlugin,
      prettier: eslintPluginPrettier,
      'unused-imports': unusedImports,
    },
    rules: {
      ...baseRules,

      // ❌ Disallow console logs except warn/error/info
      // Example: console.log('debug'); ❌  console.error('fail'); ✅
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'table'] }],

      // ❌ Disallow variable shadowing
      // Example: let x = 1; function() { let x = 2; } ❌
      'no-shadow': 'error',

      // ✅ Disable regular unused-vars rule (TS / unused-imports handle this better)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // ❌ Remove unused imports; flag unused vars (ignores _prefix)
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // ❌ Prettier formatting enforced via ESLint
      'prettier/prettier': 'error',

      // ❌ Duplicate class members disallowed
      // Example: class A { method() {} method() {} } ❌
      'no-dupe-class-members': 'error',

      // ❌ Using "any" is discouraged
      // Example: function test(arg: any) ❌
      '@typescript-eslint/no-explicit-any': 'off',

      // ❌ Prevent empty functions unless constructor or method
      // Example: function() {} ❌ class A { constructor() {} } ✅
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors', 'methods'] }],

      // ❌ Disallow `this` outside of class context
      '@typescript-eslint/no-invalid-this': 'error',

      // ❌ Disallow "const self = this" pattern
      '@typescript-eslint/no-this-alias': 'error',

      // ❌ Avoid classes with unnecessary constructors
      '@typescript-eslint/no-useless-constructor': 'error',

      // ✅ Enforce function return types
      // Example: function add(): number { return 2; }
      // '@typescript-eslint/explicit-function-return-type': [
      //   'error',
      //   {
      //     allowExpressions: true,
      //     allowTypedFunctionExpressions: true,
      //     allowHigherOrderFunctions: true,
      //   },
      // ],

      // ✅ Force access modifiers (public/private/protected)
      // Example: class A { private name: string; }

      //! '@typescript-eslint/explicit-member-accessibility': 'off',

      // '@typescript-eslint/explicit-member-accessibility': [
      //   'error',
      //   {
      //     accessibility: 'no-public',
      //     overrides: {
      //       constructors: 'no-public',
      //       properties: 'off',
      //       parameterProperties: 'off',
      //     },
      //   },
      // ],

      // ✅ Consistent ordering of members in class
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'protected-instance-field',
            'constructor',
            'private-instance-field',
            'public-instance-field',
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],

      // ✅ Naming convention for interfaces, classes, etc.
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'classMethod',
          format: ['camelCase'],
        },
        {
          selector: 'parameterProperty',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],

      // ✅ Prefer function types over interfaces for functions
      // Example: type Handler = () => void; ✅ interface Handler { (): void; } ❌
      '@typescript-eslint/prefer-function-type': 'error',

      // ✅ Enforce camelCase with some flexibility
      camelcase: ['error', { properties: 'never' }],
    },
  },
  {
    name: 'local/entity-validation',
    files: ['src/**/*.entity.ts'],
    plugins: {
      'local-rules': {
        rules: entityValidatorRules,
      },
    },
    rules: {
      'local-rules/entity-blueprint-validation': 'error',
    },
  },
];
