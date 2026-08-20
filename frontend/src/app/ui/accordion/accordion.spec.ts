/**
 * Unit tests for UiAccordionItemComponent.
 *
 * Retrofit test suite. Pins: .accordion-item wrapper, .accordion-toggle
 * with role=button + aria-expanded, body hidden by default, click
 * reveals body, chevron rotates on open.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiAccordionItemComponent } from './accordion.component';

@Component({
  standalone: true,
  imports: [UiAccordionItemComponent],
  template: `
    <ui-accordion-item [title]="title" [defaultOpen]="defaultOpen">
      <p>body content</p>
    </ui-accordion-item>
  `,
})
class HostComponent {
  title = 'Question';
  defaultOpen = false;
}

describe('UiAccordionItemComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a wrapper with .accordion-item class', async () => {
    const fixture = await renderHost();
    const item = fixture.nativeElement.querySelector('.accordion-item');
    expect(item).toBeTruthy();
  });

  it('renders the title text in the toggle', async () => {
    const fixture = await renderHost({ title: 'What is the pool?' });
    const toggle = fixture.nativeElement.querySelector('.accordion-toggle');
    expect(toggle.textContent).toContain('What is the pool?');
  });

  it('renders the toggle button', async () => {
    const fixture = await renderHost();
    const toggle = fixture.nativeElement.querySelector('.accordion-toggle');
    expect(toggle).toBeTruthy();
    expect(toggle.tagName).toBe('BUTTON');
  });

  it('hides the body when defaultOpen=false', async () => {
    const fixture = await renderHost({ defaultOpen: false });
    expect(fixture.nativeElement.querySelector('.accordion-body')).toBeNull();
  });

  it('shows the body when defaultOpen=true', async () => {
    const fixture = await renderHost({ defaultOpen: true });
    const body = fixture.nativeElement.querySelector('.accordion-body');
    expect(body).toBeTruthy();
    expect(body.textContent).toContain('body content');
  });

  it('sets aria-expanded=false when closed', async () => {
    const fixture = await renderHost({ defaultOpen: false });
    const toggle = fixture.nativeElement.querySelector('.accordion-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('sets aria-expanded=true when open', async () => {
    const fixture = await renderHost({ defaultOpen: true });
    const toggle = fixture.nativeElement.querySelector('.accordion-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking the toggle reveals the body when closed', async () => {
    const fixture = await renderHost({ defaultOpen: false });
    const toggle = fixture.nativeElement.querySelector('.accordion-toggle');
    toggle.click();
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.accordion-body');
    expect(body).toBeTruthy();
    expect(body.textContent).toContain('body content');
  });

  it('clicking the toggle hides the body when open', async () => {
    const fixture = await renderHost({ defaultOpen: true });
    const toggle = fixture.nativeElement.querySelector('.accordion-toggle');
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.accordion-body')).toBeNull();
  });

  it('chevron gets .open class when expanded', async () => {
    const fixture = await renderHost({ defaultOpen: true });
    const chevron = fixture.nativeElement.querySelector('.accordion-chevron');
    expect(chevron.classList.contains('open')).toBe(true);
  });

  it('chevron does not have .open class when collapsed', async () => {
    const fixture = await renderHost({ defaultOpen: false });
    const chevron = fixture.nativeElement.querySelector('.accordion-chevron');
    expect(chevron.classList.contains('open')).toBe(false);
  });

  it('ngOnInit() seeds open() from defaultOpen', () => {
    const fixture = TestBed.createComponent(UiAccordionItemComponent);
    fixture.componentRef.setInput('title', 'T');
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.open()).toBe(false);
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('onToggle() flips open() and emits openChange', () => {
    const fixture = TestBed.createComponent(UiAccordionItemComponent);
    fixture.componentRef.setInput('title', 'T');
    fixture.componentInstance.ngOnInit();
    const emitted: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance.onToggle();
    expect(fixture.componentInstance.open()).toBe(true);
    fixture.componentInstance.onToggle();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(emitted).toEqual([true, false]);
  });
});