# Mau-Mau (Schweizer Regeln)

Ein vollständig funktionsfähiges Mau-Mau Kartenspiel mit den offiziellen Schweizer Regeln nach [mau-mau.ch](https://mau-mau.ch).

**Version:** 0.2.0 | [Versioning Guide](VERSIONING.md)

## Project Stats

| Version | Date | LOC (Produktion) | LOC (Tests) | Total LOC |
|---------|------|------------------|-------------|-----------|
| 0.2.0   | 8. Januar 2026 | 3.574 | 1.291 | 4.865 |

**Breakdown (v0.2.0):**
- TypeScript (Production): 2.513 Zeilen
- TypeScript (Tests): 1.291 Zeilen
- HTML: 243 Zeilen
- SCSS/CSS: 818 Zeilen

## Features

- 🎴 **Vollständige Schweizer Regeln**: Alle Regeln gemäß mau-mau.ch implementiert
- 🤖 **KI-Gegner**: Spiele gegen 1-4 Computer-Gegner mit intelligentem Verhalten
- 📝 **Regelwerk integriert**: Original §-Texte als Tooltips bei Chat-Nachrichten
- 🎯 **Strafkarten-System**: Verdeckte Strafkarten mit zeitbasierter Aufnahme
- 👥 **Ansagen**: Mau, Mau-Mau, Damenrunde starten/beenden
- ♠️ **Spezialregeln**: 7er-Ketten, Damenrunde, 10er-Replikator, Schweizer Ass-Regel
- 📱 **Responsive Design**: Optimiert für Desktop, Tablet und Mobile

## Development

### Setup

```bash
npm install
npm start
```

Navigate to `http://localhost:4200/`.

### Build

```bash
npm run build
```

### Tests ausführen

```bash
# Einmalig (empfohlen für lokale Entwicklung)
./run-tests.sh

# Watch Mode (automatisch bei Änderungen)
npm test

# Mit Coverage Report
npm test -- --coverage

# E2E Tests mit Playwright
npx playwright test

# E2E Tests im UI Mode (interaktiv)
npx playwright test --ui
```

**Test-Ergebnisse:**
- ✅ 90 Unit & Component Tests
- ✅ 12 E2E Tests (Playwright)
- ✅ Accessibility Tests (WCAG AA)
- ✅ Deterministisches Testing mit SeededRandom

## Testing Strategy

Dieses Projekt folgt einer strikten Test-Pyramide für maximale Code-Qualität und Wartbarkeit.

### Test-Pyramide

```
        /\
       /  \  E2E Tests (5%)
      /----\  ~10 Tests - Kritische User Flows
     /      \
    / Comp. \ Component Tests (25%)
   /  Tests  \ ~50 Tests - UI Logic & Integration
  /----------\
 /   Unit     \
/    Tests     \ Unit Tests (70%)
---------------  ~140 Tests - Business Logic
```

### Coverage Ziele

- **GameService**: 90%+ (Kernlogik)
- **Components**: 70%+
- **Models**: 100% (Interfaces)
- **Gesamt**: 80%+

### Testing Guidelines

#### 1. Unit Tests (Vitest)

**Was wird getestet:**
- Spielregeln-Logik (7er-Ketten, Damenrunde, Ass-Regel)
- Strafkarten-Berechnungen
- `canPlayCard()` für alle Kartentypen und Edge Cases
- `applyCardEffect()` mit 10er-Replikator
- Mau/Mau-Mau Validierungen
- KI-Entscheidungen (deterministisch mit Seed)

**Beispiel:**
```typescript
describe('GameService - 7er-Ketten', () => {
  it('akkumuliert Strafkarten korrekt', () => {
    service.setSeed(42); // Deterministisch
    service.startNewGame(setup);
    
    service.playCard(sevenOfHearts);
    expect(service.state().drawPenalty).toBe(2);
    
    service.playCard(sevenOfSpades);
    expect(service.state().drawPenalty).toBe(4);
  });
});
```

**Best Practices:**
- ✅ Teste Business Logic, nicht Implementation Details
- ✅ Ein Assert pro Test (oder eng verwandt)
- ✅ Arrange-Act-Assert Pattern
- ✅ Beschreibende Test-Namen: `it('verhindert Bube auf Bube')`
- ✅ Verwende Seeded Random für reproduzierbare Tests

#### 2. Component Tests (Vitest + Testing Library)

**Was wird getestet:**
- Signal-Updates triggern UI-Änderungen
- Event-Handling (Click, Input)
- Conditional Rendering (`@if`, `@for`)
- Input/Output Bindings
- Integration mit Services

**Beispiel:**
```typescript
describe('CardComponent', () => {
  it('zeigt Karte korrekt an', () => {
    const { fixture } = render(CardComponent, {
      componentInputs: {
        card: { rank: 'A', suit: 'hearts' },
        clickable: true
      }
    });
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('♥')).toBeInTheDocument();
  });
});
```

**Best Practices:**
- ✅ Teste User-Perspektive, nicht Implementierung
- ✅ Verwende `getByRole`, `getByLabelText` (Accessibility)
- ✅ Vermeide `querySelector` - nutze Testing Library Queries
- ✅ Teste Signals durch sichtbare Effekte

#### 3. E2E Tests (Playwright)

**Was wird getestet:**
- Happy Path: Komplettes Spiel durchspielen
- Kritische Regelketten (7er-Kette, Damenrunde)
- Strafkarten-System (zu früh/zu spät aufnehmen)
- Win Conditions mit korrekten Ansagen
- Responsive Breakpoints (Mobile, Tablet)

**Beispiel:**
```typescript
test('Spielt vollständiges Spiel und gewinnt', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('player-name-input').fill('TestSpieler');
  await page.getByTestId('start-game-btn').click();
  
  // Win Screen
  await expect(page.getByTestId('win-message')).toContainText('gewonnen');
});
```

**Best Practices:**
- ✅ Verwende `data-testid` für stabile Selektoren
- ✅ Auto-Waiting nutzen: `expect().toBeVisible()` wartet automatisch
- ✅ Keine hardcoded Timeouts: `await page.waitForTimeout(1000)` ❌
- ✅ Page Object Pattern für Wiederverwendbarkeit
- ✅ Screenshots bei Fehlern: `screenshot: 'only-on-failure'`

#### 4. Deterministisches Testing

**Problem:** KI-Entscheidungen und Kartenmischen sind zufällig → flaky tests

**Lösung:** Seeded Random Number Generator

```typescript
// src/utils/seeded-random.ts
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2**32;
    return this.seed / 2**32;
  }
}
```

**Verwendung:**
```typescript
// game.service.ts
export class GameService {
  private rng = new SeededRandom();
  
  setSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
  }
}

// In Tests
service.setSeed(42); // Immer gleiche Kartenverteilung
```

#### 5. Selector-Strategie

**Naming Convention für `data-testid`:**
- Komponenten: `{component}-{element}` → `card-hearts-7`, `suit-selector-hearts`
- Actions: `action-{verb}` → `action-draw`, `action-mau`, `action-end-turn`
- State: `{concept}-{property}` → `player-0-hand-size`, `game-status`

### Running Tests

```bash
# Empfohlen: Einmalige Ausführung mit automatischem Server-Start
./run-tests.sh

# Unit & Component Tests (Watch Mode)
npm test

# Unit & Component Tests (einmalig mit Coverage)
npm test -- --coverage

# E2E Tests
npx playwright test

# E2E Tests im UI Mode (interaktiv)
npx playwright test --ui

# E2E Tests für spezifische Datei
npx playwright test e2e/game-flow.spec.ts

# Einzelne Test-Datei (Unit/Component)
npm test -- game.service.spec.ts
```

**Test-Status:**
- ✅ **90/90** Unit & Component Tests bestehen
- ✅ **12/12** E2E Tests (Playwright)
- ✅ **Accessibility** Tests (WCAG AA mit axe-core)
- ✅ **Deterministisch** durch SeededRandom (Seed: 42)

### Continuous Integration

Tests laufen automatisch bei jedem Push via GitHub Actions (`.github/workflows/playwright.yml`):

**Pipeline:**
1. **Unit & Component Tests** (Vitest)
   - Alle 90 Tests ausgeführt
   - Coverage Report generiert
   - Upload zu Codecov

2. **E2E Tests** (Playwright)
   - Parallelisiert auf 3 Shards
   - Nur Chromium (CI-optimiert)
   - Artifacts bei Fehlern (Screenshots, Videos, Traces)

3. **Production Build**
   - Nur wenn Tests bestehen
   - Build-Artifacts archiviert

**Branches:** `main`, `master`, `mau-mau-schweiz`

**Verfügbare Reports:**
- Test-Ergebnisse: GitHub Actions Artifacts
- Playwright Report: `playwright-report-[1-3].zip`
- Coverage: Codecov (wenn konfiguriert)

## Architecture

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── card/                    # Einzelne Spielkarte
│   │   │   ├── card.component.ts
│   │   │   └── card.component.spec.ts (24 Tests)
│   │   ├── game-board/              # Hauptspiel-Component
│   │   │   ├── game-board.component.ts
│   │   │   ├── game-board.component.html
│   │   │   └── game-board.component.scss
│   │   ├── start-screen/            # Spielstart-Formular
│   │   │   ├── start-screen.component.ts
│   │   │   └── start-screen.component.spec.ts (20 Tests)
│   │   └── suit-selector/           # Farbwahl nach Bube
│   │       ├── suit-selector.component.ts
│   │       └── suit-selector.component.spec.ts (16 Tests)
│   ├── models/
│   │   ├── card.model.ts            # Card, Suit, Rank
│   │   ├── player.model.ts          # Player mit Strafkarten
│   │   └── game-state.model.ts      # GameState mit ChatMessage
│   ├── services/
│   │   ├── game.service.ts          # Komplette Spiellogik (1000+ LOC)
│   │   └── game.service.spec.ts     # (28 Tests - alle Regeln)
│   └── utils/
│       └── seeded-random.ts         # Deterministischer RNG (LCG)
├── e2e/
│   ├── game-flow.spec.ts            # Happy Path E2E (5 Tests)
│   ├── special-rules.spec.ts        # 7er, Damen, Bube (4 Tests)
│   └── accessibility.spec.ts        # WCAG AA Tests (3 Tests)
├── test/
│   └── setup.ts                     # Test Configuration
├── run-tests.sh                     # Test-Runner Script
└── playwright.config.ts             # Playwright Config
```

### Key Technologies

- **Angular 21** - Standalone Components, Signals
- **TypeScript** - Strict Mode
- **SCSS** - Component Styles
- **Vitest** - Unit & Component Tests
- **Playwright** - E2E Tests
- **GitHub Actions** - CI/CD

## Schweizer Mau-Mau Regeln

Die vollständige Implementierung der offiziellen Regeln von [mau-mau.ch](https://mau-mau.ch):

### Implementierte Sonderregeln

- **7er-Ketten**: Akkumuliert Strafkarten, bis jemand keine 7 mehr hat
- **8er**: Überspringt nächsten Spieler
- **10er-Replikator**: Kopiert Effekt der darunterliegenden Karte
- **Bube**: Farbwahl, "Bube auf Bube geht nicht"
- **Dame**: Damenrunde mit min. 2 Damen
- **Ass**: Spieler bleibt am Zug, kein Sieg mit Ass möglich
- **Strafkarten**: Verdeckt gelagert, aufnehmbar nach ordentlichem Zug
- **Mau/Mau-Mau**: Pflichtansagen bei letzter/vorletzter Karte

## License

MIT

## Contributing

Pull Requests sind willkommen! Bitte stelle sicher, dass:
- ✅ Alle Tests passen (`npm test && npm run e2e`)
- ✅ Coverage-Ziele erreicht werden (80%+)
- ✅ Code dem Style Guide folgt (siehe `AGENTS.md`)
- ✅ Neue Features mit Tests abgedeckt sind
- ✅ **Version korrekt erhöht** (siehe [VERSIONING.md](VERSIONING.md))
  - Update `package.json` und `src/app/app.html`
  - Folge Semantic Versioning (SemVer)
