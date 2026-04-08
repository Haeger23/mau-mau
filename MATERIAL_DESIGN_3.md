# Material Design 3 (MD3) Theming System

This document covers how Angular Material 3 (Material You) is used in the Mau-Mau project — which version, how the theme is configured, which color tokens are in use, and how to add new UI components consistently.

---

## Angular Material Version

**`@angular/material` v21** (MD3 API).

Angular Material 21 uses the M3 component API by default. All components are standalone (`mat-*` selectors). The legacy M2 API is not used.

---

## Theme Configuration

Theme is defined in **`src/theme.scss`**, imported by `src/styles.scss`:

```scss
@use '@angular/material' as mat;

@include mat.core();

$mau-mau-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$azure-palette,
    tertiary: mat.$red-palette,
  ),
  typography: (
    brand-family: 'Lato, sans-serif',
    plain-family: 'Lato, sans-serif',
  ),
  density: (
    scale: 0,
  )
));

:root {
  @include mat.all-component-themes($mau-mau-theme);
  // + custom token overrides (see below)
}
```

The theme uses the **light** color scheme with:
- **Primary palette:** Azure (overridden to black/white for Swiss minimalist style)
- **Tertiary palette:** Red (accent for Mau-Mau branding)
- **Typography:** Lato, sans-serif
- **Density:** 0 (default — no compacted spacing)

---

## MD3 Color Token Overrides

After applying `mat.all-component-themes()`, these MD3 system tokens are overridden in `:root` to match the Mau-Mau black/white/red branding:

| Token | Value | Usage |
|---|---|---|
| `--mat-sys-primary` | `#000000` | Primary actions, filled buttons |
| `--mat-sys-on-primary` | `#ffffff` | Text on primary surfaces |
| `--mat-sys-primary-container` | `#e6e6e6` | Light primary backgrounds |
| `--mat-sys-on-primary-container` | `#000000` | Text on primary containers |
| `--mat-sys-secondary` | `#5e5f61` | Secondary actions |
| `--mat-sys-on-secondary` | `#ffffff` | Text on secondary surfaces |
| `--mat-sys-secondary-container` | `#e2e2e4` | Secondary containers |
| `--mat-sys-on-secondary-container` | `#1a1c1e` | Text on secondary containers |
| `--mat-sys-tertiary` | `#ff0000` | Accent / error highlights (red suits, penalties) |
| `--mat-sys-on-tertiary` | `#ffffff` | Text on tertiary surfaces |
| `--mat-sys-tertiary-container` | `#ffdad6` | Light red containers |
| `--mat-sys-on-tertiary-container` | `#410002` | Text on tertiary containers |
| `--mat-sys-error` | `#ba1a1a` | Error states |
| `--mat-sys-on-error` | `#ffffff` | Text on error |
| `--mat-sys-error-container` | `#ffdad6` | Error container backgrounds |
| `--mat-sys-background` | `#ffffff` | App background |
| `--mat-sys-on-background` | `#000000` | Text on background |
| `--mat-sys-surface` | `#ffffff` | Card/dialog surfaces |
| `--mat-sys-on-surface` | `#000000` | Text on surfaces |
| `--mat-sys-surface-variant` | `#e2e2e4` | Chip/input background |
| `--mat-sys-on-surface-variant` | `#46484a` | Text on surface variant |
| `--mat-sys-outline` | `#76777a` | Borders, dividers |
| `--mat-sys-outline-variant` | `#c6c6c8` | Subtle borders |
| `--mat-sys-shadow` | `rgba(0,0,0,0.2)` | Elevation shadows |

---

## Custom Project Tokens (non-Material)

`src/styles.scss` also defines project-level CSS variables for spacing, typography, and borders. These do NOT override MD3 tokens but are used in custom component styles:

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#000000` | Used in custom (non-Material) button styles |
| `--color-secondary` | `#ffffff` | White backgrounds |
| `--color-accent` | `#ff0000` | Red suits, error highlights |
| `--spacing-xs/sm/md/lg/xl` | `0.333–2em` | Consistent spacing in components |
| `--border-width` | `0.167em` (≈2px) | All border widths |
| `--border-radius` | `0.333em` (≈4px) | All border radii |
| `--transition-base` | `200ms ease` | Standard transitions |

---

## Material Components in Use

| Component (selector) | Where used |
|---|---|
| `mat-form-field` / `mat-label` | Input fields (e.g., player name entry in StartScreen) |
| `mat-checkbox` | Player selection in StartScreen |
| `mat-icon` | Icons throughout GameBoard |
| `mat-dialog-content` / `mat-dialog-actions` | All dialog components (SuitSelector, ExitConfirmation, Feedback) |
| `mat-button-toggle` / `mat-button-toggle-group` | Suit selection in SuitSelectorDialogComponent |

Buttons (`mat-button`, `mat-raised-button`, `mat-flat-button`, `mat-stroked-button`, `mat-icon-button`, `mat-fab`) are used broadly across GameBoard and dialog components.

---

## How to Style New UI Elements

### Rule 1: Use `mat-*` components

Always use Angular Material components for interactive elements (buttons, inputs, dialogs, icons). Do not build custom button or input primitives.

```html
<!-- Correct -->
<button mat-flat-button color="primary">Play Card</button>

<!-- Avoid -->
<button class="custom-btn">Play Card</button>
```

### Rule 2: Apply colour via MD3 system tokens, not hardcoded hex

```scss
/* Correct */
.my-component {
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  border-color: var(--mat-sys-outline);
}

/* Avoid */
.my-component {
  background: #ffffff;
  color: #000000;
}
```

### Rule 3: Use project spacing tokens for layout

```scss
/* Correct */
.card-container {
  padding: var(--spacing-md);
  gap: var(--spacing-sm);
}
```

### Rule 4: Buttons

| Variant | When to use |
|---|---|
| `mat-flat-button` with `color="primary"` | Primary CTA (e.g., "End Turn", "Start Game") |
| `mat-stroked-button` | Secondary actions (e.g., "Draw Card") |
| `mat-icon-button` | Icon-only actions |
| `mat-fab` / `mat-mini-fab` | Floating actions (rare) |

### Rule 5: No `ngClass` / `ngStyle`

Use Angular `[class.something]="condition"` and `[style.property]="value"` bindings instead of `ngClass`/`ngStyle`.

---

## Theme Override Pattern

To override a specific component's MD3 token, use the component-scoped override pattern:

```scss
// Example: override button border radius project-wide
.mat-mdc-button, .mat-mdc-raised-button, .mat-mdc-outlined-button {
  border-radius: 4px !important;
}
```

Overrides live in `src/theme.scss` below the `@include mat.all-component-themes()` call.

---

## Adding a New Themed Component (Checklist)

1. Import the component from `@angular/material` and add it to the `imports` array of the standalone component.
2. Use `mat-*` selector in the template.
3. Style custom parts with `--mat-sys-*` tokens for colour, `--spacing-*` for layout.
4. Do not add new hex colour values — map to the nearest existing token.
5. Run `npm run lint` and `npx playwright test` to verify accessibility (AXE checks are included in E2E tests).
