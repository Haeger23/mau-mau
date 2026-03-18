
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

## Version Management

**IMPORTANT: Before every `git push` to the `development` branch:**
1. Check current version in `package.json`
2. Increment version following Semantic Versioning (SemVer):
   - **MAJOR** (X.0.0): Breaking changes, incompatible API changes
   - **MINOR** (0.X.0): New features, backwards-compatible
   - **PATCH** (0.0.X): Bug fixes, backwards-compatible
3. Update version in TWO places:
   - `package.json` → `"version": "X.Y.Z"`
   - `src/app/app.html` → `<footer class="version">vX.Y.Z</footer>`
4. If unsure which increment to use, ASK the user before committing

**Current Version:** 0.5.0

## Branch Protection

**CRITICAL: The `main` branch is PROTECTED**
- ❌ NEVER push directly to `main`
- ✅ Always use Pull Requests from `development` or feature branches
- ✅ Direct pushes to `development` are allowed
- See `.github/BRANCH_PROTECTION.md` for details

**Workflow:**
1. Work on `development` or feature branches
2. Create PR to `main` when ready for production
3. Wait for CI/CD checks and approval
4. Merge via GitHub UI only
