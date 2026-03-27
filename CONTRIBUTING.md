# Contributing to Mau-Mau

## Branch Naming

Branches must follow this pattern: `<type>/<short-description>`

| Type | When to use |
|------|-------------|
| `feat/` | New feature or enhancement |
| `fix/` | Bug fix |
| `hotfix/` | Critical production fix (branch off `main`) |
| `chore/` | Tooling, deps, config — no production code change |
| `refactor/` | Code restructuring without behavior change |
| `docs/` | Documentation only |
| `test/` | Tests only |

**Examples:**
```
feat/queen-round-animation
fix/seven-card-chain-counter
hotfix/game-crash-on-mau
chore/update-angular-21
docs/turn-flow-diagram
```

Rules:
- Lowercase, hyphen-separated (`kebab-case`)
- Short and descriptive (2–5 words)
- No ticket numbers required, but allowed: `fix/123-draw-pile-empty`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, config |
| `refactor` | Refactoring |
| `test` | Adding or fixing tests |
| `docs` | Documentation |
| `style` | Formatting, whitespace |
| `perf` | Performance improvement |

**Scope** (optional) — the area of the codebase:

`game`, `rules`, `ai`, `ui`, `a11y`, `pwa`, `deps`, `ci`

**Examples:**
```
feat(rules): add chaining logic for seven card
fix(ai): prevent AI from playing Jack on Jack
chore(deps): update Angular to 21.2
test(game): add seeded test for full game round
docs(turn-flow): update state machine diagram
```

Rules:
- Present tense, imperative mood ("add" not "added" / "adds")
- Lowercase type and scope
- No period at the end of the subject line
- Keep subject under 72 characters
- Use body for "why", not "what"

## Branch Strategy

```
main          ← protected, PRs only, auto-deploys to production
 └── development  ← integration branch, direct pushes OK
       └── feat/your-feature  ← branch off here
```

- Feature branches → PR into `development`
- `development` → PR into `main` for releases
- Hotfixes → branch off `main`, PR back into both `main` and `development`

See [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md) for GitHub branch protection settings.

## Pull Requests

- Title follows the same Conventional Commits format: `feat(rules): add queen round`
- Target `development` for features/fixes, `main` only for releases or hotfixes
- PRs to `main` require 1 approval + all CI checks passing
- Merge strategy: **Squash and merge**

### Checklist before opening a PR

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Version bumped in `package.json` and `src/app/app.html` (see [VERSIONING.md](VERSIONING.md))
- [ ] No `console.log` left in production code
- [ ] Accessibility: component passes AXE checks

## Version Bumping

Bump the version **before every push to `development`** in two places:

1. `package.json` → `"version"` field
2. `src/app/app.html` → `<footer class="version">vX.Y.Z</footer>`

Follow SemVer — when in doubt, see [VERSIONING.md](VERSIONING.md).

## Local Setup

```bash
npm install
npm start          # dev server at http://localhost:4200/mau-mau
npm test           # unit tests (Vitest)
npx playwright test  # E2E tests (Playwright)
npm run lint       # ESLint
```

See [AGENTS.md](AGENTS.md) for the full coding style guide.
