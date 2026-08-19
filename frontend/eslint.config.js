/**
 * ESLint flat config — Angular 20 + typescript-eslint (industry standard).
 *
 * Rule sets: eslint recommended (JS) + typescript-eslint recommended/stylistic
 * (TS) + angular-eslint tsRecommended/templateRecommended (Angular).
 * Inline templates in .ts files are processed via processInlineTemplates
 * so template rules apply to `template:` strings too.
 *
 * Selector prefixes: 'app' (pages/components), 'ui' (primitives library),
 * 'stub' (test doubles in specs). Spec files are linted with the same
 * rules; vitest globals are fine because specs import their APIs.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: ['app', 'ui', 'stub'], style: 'kebab-case' },
      ],
      // Underscore-prefixed names are the deliberate "type-check only"
      // convention in specs and unused-callback params (e.g. `_client`,
      // `(req, next)` pairs where only next is used). Standard practice
      // is to ignore them — they document intent, not dead code.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);