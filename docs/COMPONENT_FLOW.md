# Component Data-Flow: GameService → Signals → Components

This document answers _"if I change signal X, which components re-render?"_ without reading all component files.

## OnPush Change Detection

All components use `changeDetection: ChangeDetectionStrategy.OnPush`.

**Rule:** A component only re-renders when a signal it reads (directly or via `computed()`) changes. Mutations via `.update()`/`.set()` on a signal automatically schedule re-renders in all consumers. Never mutate signal values in-place — always call `.set()` or `.update()`.

---

## Render Tree

```
AppComponent                    (no GameService dependency)
├── StartScreenComponent        (reads: getAvailablePlayerNames())
│   └── MobileWarningDialogComponent   (dialog, no GameService)
├── GameBoardComponent          (heavy GameService consumer — see table below)
│   ├── CardComponent           (pure presentational, no GameService)
│   ├── SuitSelectorDialogComponent    (dialog, no GameService)
│   └── ExitConfirmationDialogComponent (dialog, no GameService)
└── FeedbackButtonComponent     (no GameService)
    └── FeedbackDialogComponent (dialog, no GameService)
```

`AppComponent` switches between `StartScreenComponent` and `GameBoardComponent` based on route or game state — it does not inject `GameService` itself.

---

## Signal Consumption Table

| Component | GameService signals/computed read | GameService methods called |
|---|---|---|
| **AppComponent** | — | — |
| **StartScreenComponent** | — | `getAvailablePlayerNames()` |
| **GameBoardComponent** | `state` (full `GameState` signal), `computed(() => state().players.find(p => p.isHuman))` → `humanPlayer`, `computed(() => state().players.filter(p => !p.isHuman))` → `opponentPlayers`, `computed(() => getTopCard())` → `topCard` | See methods table below |
| **CardComponent** | — (receives `card` as `input()`) | — |
| **SuitSelectorComponent** | — (receives `suit` as `input()`) | — |
| **SuitSelectorDialogComponent** | — | — |
| **ExitConfirmationDialogComponent** | — | — |
| **FeedbackButtonComponent** | — | — |
| **FeedbackDialogComponent** | — | — |

---

## GameBoardComponent — Methods Called

| Method | When triggered |
|---|---|
| `startNewGame(playerNames)` | Player clicks "Start Game" on the start screen |
| `canPlayCard(card)` | Each card render (determines playable highlight) |
| `playCard(card)` | Human clicks a card |
| `playInvalidCard(card)` | Human clicks an invalid card (penalty flow) |
| `drawCard()` | Human clicks "Draw" button |
| `canEndTurnNow()` | Called before `endTurn()` to check validity |
| `endTurn()` | Human clicks "End Turn" |
| `endTurnTooEarly()` | Human clicks "End Turn" when not allowed |
| `sayMau()` | Human clicks "Mau" button |
| `sayMauMau()` | Human clicks "Mau-Mau" button |
| `announceQueenRound()` | Human clicks "Damenrunde" button |
| `endQueenRound()` | Human clicks "Damenrunde beenden" button |
| `pickupPenaltyCards(playerId)` | Human clicks "Strafkarten aufnehmen" |
| `pickupSinglePenaltyCard(playerId, cardId, isPickupable)` | Human clicks an individual penalty card |
| `chooseSuit(suit)` | Human picks a suit in `SuitSelectorDialogComponent` |
| `getAvailablePlayerNames()` | Once during component init (not a signal read) |
| `getTopCard()` | Inside `computed()` — re-evaluates on every state change |

---

## Which Components Re-render When Signal X Changes?

Because only `GameBoardComponent` reads `GameService.state`, **only it (and its computed properties) re-renders** when any `GameState` field changes.

| State field changed | Re-renders |
|---|---|
| `state().players` | `GameBoardComponent` → `humanPlayer`, `opponentPlayers` computed |
| `state().discardPile` | `GameBoardComponent` → `topCard` computed |
| `state().drawPenalty` | `GameBoardComponent` |
| `state().gameOver` | `GameBoardComponent` |
| `state().turnPhase` | `GameBoardComponent` |
| `state().queenRoundActive` | `GameBoardComponent` |
| Any other `GameState` field | `GameBoardComponent` |
| `player.hand` changes | `GameBoardComponent` → `humanPlayer` computed → card list re-renders → `CardComponent` inputs updated |

`CardComponent`, `SuitSelectorComponent`, and all dialog components are pure/presentational — they only re-render when their `input()` values change, which happens when `GameBoardComponent` passes them new values.

---

## Adding a New Component

1. Inject `GameService` only if the component needs to read state or trigger actions.
2. If it only displays data, pass it via `input()` from `GameBoardComponent` — do not add a new `GameService` injection.
3. Use `computed()` for derived values (e.g., filtering a player's hand) — do not use getters or method calls in templates.
4. All components must use `ChangeDetectionStrategy.OnPush`.
