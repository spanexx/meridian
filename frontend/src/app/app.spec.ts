/**
 * Unit tests for AppComponent — root component.
 *
 * The router is shell-aware: the landing root, /login and /register are
 * shell-less (no ui-shell); every other route renders inside ui-shell.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

/** Minimal routable content so router.navigateByUrl() works in tests. */
@Component({ selector: 'stub-target', standalone: true, template: '' })
class StubTargetComponent {}

const TEST_ROUTES = [
  { path: '', pathMatch: 'full' as const, component: StubTargetComponent },
  { path: 'login', component: StubTargetComponent },
  { path: 'register', component: StubTargetComponent },
  { path: 'dashboard', component: StubTargetComponent },
];

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(TEST_ROUTES)],
    }).compileComponents();
  });

  it('mounts without error', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes a title signal (so consumers can detect a mounted App)', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance.title()).toBe('meridian');
  });

  it('renders ui-shell on a normal (shell-ful) route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-shell')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('omits ui-shell on the shell-less root (landing) route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-shell')).toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('omits ui-shell on the shell-less /login route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-shell')).toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('omits ui-shell on the shell-less /register route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/register');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-shell')).toBeNull();
  });
});
