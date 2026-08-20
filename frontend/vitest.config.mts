/**
 * Vitest config — Angular 20 component testing.
 *
 * Uses @analogjs/vite-plugin-angular to compile standalone components
 * via the Angular compiler, jsdom for the DOM environment, and a
 * setup file that initializes the Angular test bed.
 *
 * Globals enabled so specs can use `describe/it/expect` without
 * explicit imports (matches the jasmine-style API the team is used
 * to from karma).
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    // BRIDGE 2026-08-21: default timeout was 5000ms and flaked 3 commits —
    // heavy page specs (landing, notifications, login + async data loads)
    // exceeded it under parallel-load CI/hook runs. 15s absorbs the
    // slowest component boots while still failing genuinely hung tests.
    testTimeout: 15_000,
  },
  define: {
    'import.meta.vitest': true,
  },
}));