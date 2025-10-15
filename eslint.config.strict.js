// ESLint Configuration - Flat Config Format (ESLint v9+)
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  // Base configuration for all files
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'error',

      // General rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Allow console for server-side code
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',

      // Code style
      'object-shorthand': 'error',
      'prefer-template': 'error',
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': 'error',
    },
  },

  // Configuration files
  {
    files: ['**/*.config.js', '**/*.config.ts', '**/eslint.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.min.js',
      'public/**',
      '.turbo/**',
      '.husky/**',
      // Don't ignore config files
      '!*.config.js',
      '!*.config.ts',
      '!eslint.config.js',
    ],
  },
];
