/**
 * Vitest setup file for Angular component testing.
 *
 * Initializes the Angular test bed with the browser dynamic testing
 * platform so standalone components can be rendered in jsdom without
 * the full karma+jasmine stack.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import '@analogjs/vitest-angular/setup-zone';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);