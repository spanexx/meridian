---
topic: angular
severity: medium
related-to: tdd-enforcement/SKILL.md
---

# Page specs against existing Angular primitives

**One-line**: primitives like UiButtonComponent project content via `<ng-content>`, so the host element and the inner native element are separate DOM nodes — naïve text/aria-pressed queries silently fail.

## The trap

Writing a page-level test against an existing primitive without reading its template:

```ts
it('marks the active pill with aria-pressed=true', async () => {
  const root = (fixture.nativeElement as HTMLElement);
  const pill = root.querySelector('button[aria-pressed]');  // ← null
  expect(pill?.getAttribute('aria-pressed')).toBe('true');     // ← fails
});
```

The page uses `<ui-button variant="primary" [attr.aria-pressed]="...">` somewhere. But `UiButtonComponent`'s template is:

```ts
template: `
  <button [class]="hostClass()" [attr.aria-label]="ariaLabel || null">
    <ng-content />     ← the projected content goes here
  </button>
`,
```

`aria-pressed` was bound on the `<ui-button>` host, not the inner `<button>`. So `root.querySelector('button[aria-pressed]')` finds nothing — the projected `<ui-badge>` lives inside the inner `<button>`, not on it.

## Why this matters

A test that fails for the wrong reason (querying the wrong element) wastes time. You write the test, it fails, you assume the impl is wrong, you change the impl, the test still fails, you go around in circles. 30 minutes later you realize the page-level spec was looking at the wrong DOM node.

## The fix: read each primitive's template first

Before writing any page spec that exercises a primitive, read the primitive's `.component.ts` to see what wraps what. Two things to confirm:

1. **Where does projected content go?** For `UiButtonComponent`, the inner `<button>` — so the page's filter pill click handler needs to live on the *button*, which means passing the click via the primitive (which `UiButtonComponent` already does via `<ng-content>`).
2. **What attributes does the primitive forward?** If `UiButtonComponent` doesn't forward `[attr.aria-pressed]`, the page either picks a different primitive, uses raw `<button>`, or extends the primitive.

## The fix: use raw `<button>` for behavior the primitive doesn't expose

When the page needs a behavior the primitive doesn't expose (toggle pill with `aria-pressed`, checkbox, etc.), prefer raw markup over extending the primitive API:

```html
<button
  type="button"
  class="btn rounded-full px-3 py-1 text-xs"
  [class.btn-primary]="category() === cat"
  [class.btn-secondary]="category() !== cat"
  [attr.aria-pressed]="category() === cat"
  (click)="category.set(cat)"
>
  {{ cat }}
</button>
```

This is honest about what the page needs. Extending `UiButtonComponent` for one page pollutes its API for every other consumer.

## How to query in tests

For toggles / status filters / radio-like patterns where the primitive can't be used as-is:

```ts
function findButtonByLabel(
  buttons: HTMLButtonElement[],
  label: string,
): HTMLButtonElement | undefined {
  return buttons.find((b) => {
    let direct = '';
    for (const node of Array.from(b.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) direct += node.textContent;
    }
    return direct.trim() === label;
  });
}
```

Use **direct text nodes only** for matching. If a button renders `Pending (3)` (label + count span), `b.textContent` is `"Pending3"` and `getByRole({ name: 'Pending' })` is `"Pending (3)"`. Neither matches "Pending" exactly. Walk the childNodes and concatenate text-node values only.

Same applies to playwright e2e:

```ts
// Locator with `:text-is()` matches the literal text content of an element.
await expect(section.locator(`button:text-is("Pending")`).first()).toBeVisible();
```

Playwright's `:text-is()` and `:has-text()` differ — `:text-is` is exact; `:has-text` is substring.

## Real example from this session

`opportunities.page.spec.ts` test for status pills — initially used `getByRole({ name: 'Pending', exact: true })` and failed. The button's accessible name included the count span: "Pending (3)". Fix: use `:text-is()` or walk childNodes for direct text.

`executions.page.spec.ts` test for the badge variant — initially assumed `UiBadgeComponent` exposed an 'error' variant. It only exposes `UiBadgeVariant = 'neutral' | 'success' | 'warning' | 'info'`. Fixed by mapping "failed" → "warning" and adding a DISCOVERY comment in the page data.
