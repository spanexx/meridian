/**
 * Smoke test for vitest + Angular test-bed wiring.
 *
 * RED: written before running vitest, asserts the simplest possible
 * thing — that the test runner can instantiate a Component. If
 * vitest isn't installed or the analog plugin isn't wired, this fails
 * with an import or compilation error.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
  standalone: true,
  selector: 'app-smoke',
  template: '<span>smoke</span>',
})
class SmokeComponent {}

describe('vitest wiring', () => {
  it('boots the Angular test bed and renders a component', () => {
    const fixture = TestBed.createComponent(SmokeComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('smoke');
  });
});