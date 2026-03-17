
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Testing

### Unit Tests — Vitest
- Runner: **Vitest** (`vitest`) with `jsdom` environment
- Coverage: **`@vitest/coverage-v8`** (run via `ng test`)
- Test files follow the `*.spec.ts` convention next to the source file
- Run all unit tests: `npm test`

### End-to-End Tests — Playwright
- Runner: **Playwright** (`@playwright/test`) — tests live in `e2e/`
- Browser: Chromium (Desktop Chrome)
- Accessibility assertions use **`@axe-core/playwright`**
- The dev server (`npm start`) is auto-started by Playwright if not already running
- Reports: HTML report (`playwright-report/`) + JUnit XML (`test-results/junit.xml`)
- Run E2E tests: `npx playwright test`

### Linting — ESLint
- Flat config (`eslint.config.js`) with `typescript-eslint` + `angular-eslint`
- Template accessibility rules enabled via `@angular-eslint/template/accessibility`
- Run lint: `npm run lint`
- Auto-fix: `npm run lint:fix`

## Available npm Scripts

| Script | Description |
|---|---|
| `npm start` | Start Angular dev server (`ng serve`) at `http://localhost:4200/mau-mau` |
| `npm run build` | Production build |
| `npm test` | Run unit tests via Vitest |
| `npm run lint` | Run ESLint across all TS and HTML files |
| `npm run lint:fix` | Run ESLint and auto-fix fixable issues |
| `npx playwright test` | Run E2E tests with Playwright |
