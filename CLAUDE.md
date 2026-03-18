# Mau-Mau — Claude Code Context

## Project Overview

This is a Swiss Mau-Mau card game built with Angular 21. It implements the official Swiss rules from mau-mau.ch, supports 1–4 players (human + AI opponents), and runs as a PWA deployed at `/mau-mau`.

## Key Architecture

**Services (core logic):**
- [game.service.ts](src/app/services/game.service.ts) — central state machine using Angular signals; all game state lives here
- [rule-engine.service.ts](src/app/services/rule-engine.service.ts) — chain-of-responsibility pattern validating/applying card rules
- [ai.service.ts](src/app/services/ai.service.ts) — deterministic AI with seeded RNG and realistic timing

**State shape:** [game-state.model.ts](src/app/models/game-state.model.ts) — understand this before touching game logic

**Card rules** live in [src/app/rules/](src/app/rules/) — one file per rule (seven, eight, nine, ten, jack, queen, ace, default).

**Main UI:** [game-board.component.ts](src/app/components/game-board/game-board.component.ts)

## Coding Conventions

See [AGENTS.md](AGENTS.md) for the full style guide. Key points:
- Angular 21 standalone components, `OnPush` change detection
- Signals everywhere — no `mutate`, use `update`/`set`
- `input()`/`output()` functions, not decorators
- `inject()` for DI, not constructor injection
- Native control flow (`@if`, `@for`) — no `*ngIf`/`*ngFor`
- `class` bindings — no `ngClass`/`ngStyle`
- All components must pass AXE accessibility checks

## Testing

- **Unit/component:** Vitest + jsdom (`npm test`)
- **E2E:** Playwright in `e2e/` (`npx playwright test`)
- **Accessibility:** `@axe-core/playwright` in E2E tests
- Deterministic testing uses `SeededRandom` (LCG) — call `gameService.setSeed()` to control shuffle/AI
- Test IDs follow `{component}-{element}` pattern (e.g. `card-hearts-7`)

## Swiss Mau-Mau Rules Summary

| Card | Effect |
|------|--------|
| 7 | Next player draws +2 (chains: 7 on 7 = +4, etc.) |
| 8 | Next player is skipped |
| 9 | Allows sequential same-suit plays |
| 10 | Replicates the card below it |
| Jack | Player chooses the new suit (no Jack-on-Jack) |
| Queen | Triggers "Dame Round" — only Queens and 10s playable |
| Ace | Current player stays active; can't win with an Ace |

Players must announce "Mau" on their second-to-last card and "Mau-Mau" when playing their last.

## Version Bumping

**Before every push to `development`**, bump the version in **two** places:
1. `package.json` → `"version"` field
2. `src/app/app.html` → `<footer class="version">vX.Y.Z</footer>`

Follow SemVer: `PATCH` for fixes, `MINOR` for new features, `MAJOR` for breaking changes. If unsure, ask before committing. Use the `/commit-staged` skill — it handles the bump automatically with `-patch`, `-minor`, or `-major` flags.

## Branch Strategy

- `main` — protected, PRs only (never push directly)
- `development` — integration branch, direct pushes allowed
- Feature branches off `development`

## Key Docs

- [AGENTS.md](AGENTS.md) — coding conventions & style guide (read this first)
- [docs/TURN_FLOW.md](docs/TURN_FLOW.md) — state machine diagram, AI turn logic, race condition guards
- [VERSIONING.md](VERSIONING.md) — SemVer guide
- [MATERIAL_DESIGN_3.md](MATERIAL_DESIGN_3.md) — MD3 theming system
