/**
 * Unit tests for UiStepperComponent.
 *
 * Retrofit test suite. Pins: .stepper wrapper, .step per entry with
 * 1-based numbering, .step-divider between steps (n-1 dividers),
 * .active / .done state classes, click emits (select) with index.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiStepperComponent } from './stepper.component';

@Component({
  standalone: true,
  imports: [UiStepperComponent],
  template: `<ui-stepper [steps]="steps" (select)="onSelect($event)" />`,
})
class HostComponent {
  steps = [
    { label: 'Submit', done: true },
    { label: 'Vetted', done: true },
    { label: 'Voted', active: true },
    { label: 'Funded' },
    { label: 'Settled' },
  ];
  lastSelected = -1;
  onSelect(i: number) { this.lastSelected = i; }
}

describe('UiStepperComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a .stepper wrapper', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.stepper')).toBeTruthy();
  });

  it('renders one .step per entry', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelectorAll('.step').length).toBe(5);
  });

  it('renders n-1 .step-divider between steps', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelectorAll('.step-divider').length).toBe(4);
  });

  it('numbers the steps 1-based in .step-num', async () => {
    const fixture = await renderHost();
    const nums = fixture.nativeElement.querySelectorAll('.step-num');
    expect(nums[0].textContent.trim()).toBe('1');
    expect(nums[1].textContent.trim()).toBe('2');
    expect(nums[2].textContent.trim()).toBe('3');
    expect(nums[3].textContent.trim()).toBe('4');
    expect(nums[4].textContent.trim()).toBe('5');
  });

  it('renders each step label text', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.textContent).toContain('Submit');
    expect(fixture.nativeElement.textContent).toContain('Vetted');
    expect(fixture.nativeElement.textContent).toContain('Voted');
    expect(fixture.nativeElement.textContent).toContain('Funded');
    expect(fixture.nativeElement.textContent).toContain('Settled');
  });

  it('applies .active to the step flagged active=true', async () => {
    const fixture = await renderHost();
    const steps = fixture.nativeElement.querySelectorAll('.step');
    expect(steps[2].classList.contains('active')).toBe(true);
    expect(steps[0].classList.contains('active')).toBe(false);
  });

  it('applies .done to each step flagged done=true', async () => {
    const fixture = await renderHost();
    const steps = fixture.nativeElement.querySelectorAll('.step');
    expect(steps[0].classList.contains('done')).toBe(true);
    expect(steps[1].classList.contains('done')).toBe(true);
    expect(steps[2].classList.contains('done')).toBe(false);
    expect(steps[3].classList.contains('done')).toBe(false);
    expect(steps[4].classList.contains('done')).toBe(false);
  });

  it('clicking a step emits (select) with the index', async () => {
    const fixture = await renderHost();
    const steps = fixture.nativeElement.querySelectorAll('.step');
    steps[3].click();
    expect(fixture.componentInstance.lastSelected).toBe(3);
  });
});