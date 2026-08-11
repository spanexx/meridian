/**
 * Unit tests for AppComponent — root component.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { App } from './app';

describe('App', () => {
  it('mounts without error', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [RouterTestingModule, App],
    }).createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes a title signal (so consumers can detect a mounted App)', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [RouterTestingModule, App],
    }).createComponent(App);
    expect(fixture.componentInstance.title()).toBe('meridian');
  });
});
