import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.output/**', '.wxt/**', 'dist/**', 'graphify-out/**', 'node_modules/**', 'playwright-report/**', 'test-results/**']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error'
    }
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-empty-pattern': 'off'
    }
  },
  {
    files: ['site/public/sw.js'],
    languageOptions: {
      globals: {
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        self: 'readonly',
        URL: 'readonly'
      }
    }
  }
);
