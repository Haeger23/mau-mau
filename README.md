# Mau-Mau (Schweizer Regeln)

A Swiss Mau-Mau card game built with Angular 21, implementing the official rules from [mau-mau.ch](https://mau-mau.ch). Supports 1–4 players (human + AI opponents) and runs as a PWA deployed at `/mau-mau`.

**Version:** 0.7.1

## Features

- Full Swiss rules: 7-chains, skip (8), suit-choice Jack, Dame round, 10-replicator, Swiss Ace
- AI opponents with deterministic seeded RNG
- Mau / Mau-Mau announcements enforced
- Responsive design (mobile, tablet, desktop)
- Accessible — passes WCAG AA / AXE checks

## Setup

```bash
npm install
npm start        # dev server → http://localhost:4200/mau-mau
```

## Commands

```bash
npm run build           # production build
npm test                # unit & component tests (Vitest)
npx playwright test     # E2E tests (Playwright)
npx playwright test --ui  # interactive E2E mode
npm run lint            # ESLint
```

## Project Structure

```
src/app/
├── components/     # card, game-board, start-screen, suit-selector,
│                   # exit-confirmation-dialog, feedback-button
├── models/         # card, player, game-state
├── rules/          # one file per card rule (7, 8, 9, 10, jack, queen, ace)
├── services/       # game.service, rule-engine.service, ai.service
└── utils/          # seeded-random (LCG)
e2e/                # Playwright specs
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit conventions, and the PR checklist.
See [AGENTS.md](AGENTS.md) for the full coding style guide.

## License

MIT
