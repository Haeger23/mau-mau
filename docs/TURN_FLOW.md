# Turn Flow State Machine

This document describes the turn flow logic in the Swiss Mau-Mau game, including the `TurnPhase` state machine, penalty card lifecycle, AI logic, and concurrency guards.

---

## TurnPhase State Machine

> **Source of truth:** `turnPhase` (type: `TurnPhase` in `game-state.model.ts`)
> **Deprecated:** `lastPlayerAction` — still written in parallel for backward compatibility but must not be read by new code. Read `turnPhase` instead.

### Phase Values and Transitions

| Phase | Meaning | What can happen next |
|---|---|---|
| `WAITING_FOR_ACTION` | Turn just started — player can play or draw | Play a card → `CARD_PLAYED`; Draw a card → `DRAW_COMPLETE` |
| `CARD_PLAYED` | A card was placed on the discard pile | If Jack: auto-transitions to `AWAITING_SUIT_CHOICE`; otherwise: human clicks "End Turn" → `TURN_ENDING`; AI calls `endTurn()` automatically |
| `AWAITING_SUIT_CHOICE` | Jack played — must choose a suit before anything else | `chooseSuit()` → `SUIT_CHOSEN`; all other actions blocked |
| `SUIT_CHOSEN` | Suit chosen after Jack — can end turn | Human clicks "End Turn" → `TURN_ENDING`; AI calls `endTurn()` automatically |
| `DRAWING` | Currently drawing cards (not used as a set state; the service goes directly to `DRAW_COMPLETE`) | Each `drawCard()` call; last call → `DRAW_COMPLETE` |
| `DRAW_COMPLETE` | Drawing finished — can play drawn card or end turn | Play a card → `CARD_PLAYED`; End turn → `TURN_ENDING` |
| `TURN_ENDING` | `endTurn()` is processing (checks penalties, win condition) | → `nextTurn()` → resets to `WAITING_FOR_ACTION` for next player |

### State Transition Diagram

```
START GAME / nextTurn()
        │
        ▼
WAITING_FOR_ACTION
   │              │
   │ playCard()   │ drawCard()
   ▼              ▼
CARD_PLAYED    DRAW_COMPLETE ──────────────────────── endTurn() ──► TURN_ENDING
   │    │          │    │                                               │
   │    │ (Jack)   │    │ playCard()                                    │
   │    ▼          │    ▼                                               │
   │  AWAITING_    │  CARD_PLAYED ──────── endTurn() ─────────────────►│
   │  SUIT_CHOICE  │                                                    │
   │    │          │                                                    │
   │    │chooseSuit│                                                    │
   │    ▼          │                                                    │
   │  SUIT_CHOSEN ─┼───────────── endTurn() ────────────────────────►  │
   │               │                                                    │
   │ endTurn()     │                                                    ▼
   └───────────────┴─────────────────────────────────────────► nextTurn() → WAITING_FOR_ACTION
```

### Where `turnPhase` Is Set in Code

| Code location | Sets `turnPhase` to |
|---|---|
| `createInitialState()` | `WAITING_FOR_ACTION` |
| `startGame()` | `WAITING_FOR_ACTION` |
| `nextTurn()` | `WAITING_FOR_ACTION` |
| `assignPenaltyCards()` | `WAITING_FOR_ACTION` (penalty mid-turn resets the phase) |
| `playCard()` — normal card | `CARD_PLAYED` |
| `playCard()` — 9-chain extension | `CARD_PLAYED` |
| `playCard()` — Ace | `CARD_PLAYED` |
| `playCard()` — Jack | `AWAITING_SUIT_CHOICE` (via `awaitingSuitChoice = true`) |
| `chooseSuit()` | `SUIT_CHOSEN` |
| `drawCard()` — quota fulfilled | `DRAW_COMPLETE` |
| `drawCard()` — normal single draw | `DRAW_COMPLETE` |

### When to Read Each Field

- **Read `turnPhase`** for all turn-flow decisions in new code (e.g., in `canEndTurn()`, in component button visibility).
- **`lastPlayerAction`** is still written alongside `turnPhase` for backward compatibility but carries no additional information. Do not introduce new reads of it. It will be removed in a future cleanup.

---

## Penalty Card Lifecycle

Each `Player` has three penalty-card fields:

| Field | Status | Purpose |
|---|---|---|
| `lockedPenaltyCards` | **Active** | Newly assigned penalties — cannot be picked up yet |
| `pickupablePenaltyCards` | **Active** | Unlocked penalties — player must pick these up |
| `penaltyCards` | **Deprecated** | Legacy mirror of the combined above arrays — kept for backward compat only |

### Lifecycle: How Cards Move Between Arrays

```
Rule violation / 7-penalty
        │
        ▼
  lockedPenaltyCards          ← assigned here by assignPenaltyCards()
        │
        │  After player completes a valid turn (endTurn())
        ▼
  pickupablePenaltyCards      ← moved here in endTurn() before nextTurn()
        │
        │  Player calls pickupPenaltyCards() or pickupSinglePenaltyCard()
        ▼
     player.hand              ← cards become active hand cards
```

**Detailed rules:**

1. **Entering `lockedPenaltyCards`:** `assignPenaltyCards()` pushes cards from the deck directly into `lockedPenaltyCards`. The deprecated `penaltyCards` array is updated in parallel.

2. **Moving `locked → pickupable`:** At the start of `endTurn()`, the service moves all cards from `lockedPenaltyCards` into `pickupablePenaltyCards`. This means: *a player who receives a penalty in turn N can first pick up the cards at the beginning of turn N+1*.

3. **Picking up:** `pickupPenaltyCards(playerId)` moves all `pickupablePenaltyCards` into `player.hand`. `pickupSinglePenaltyCard()` moves one card. Both update the deprecated `penaltyCards` array.

4. **Penalty for picking up too early:** If a player tries to pick up cards that are still in `lockedPenaltyCards` (not yet unlocked), `assignPenaltyCards()` is called with 1 penalty card and rule key `PENALTY_TOO_EARLY`.

### Win Condition

A player wins when **all three** of the following are true at the end of `endTurn()`:

```
player.hand.length === 0
  AND player.lockedPenaltyCards.length === 0
  AND player.pickupablePenaltyCards.length === 0
```

> **Important:** The deprecated `penaltyCards` array is NOT checked for the win condition. Only the two active arrays matter.

---

## Rule Engine Order

`rule-engine.service.ts` chains rules in this sequence when `applyAllEffects()` is called:

```
SevenRule → EightRule → NineRule → TenRule → AceRule → JackRule → QueenRule → DefaultRule
```

**Why this order matters:**

- Specific-card rules (Seven, Eight, Nine …) must run **before** `DefaultRule`, which serves as the catch-all.
- `TenRule` is placed after number rules (7, 8, 9) so the Ten can replicate any of them.
- `JackRule` is after `AceRule` because both affect whose turn continues.
- `QueenRule` is last before `DefaultRule` because the Queen Round affects all subsequent turns.
- `DefaultRule` must always be last — it handles normal suit/rank matching.

> When adding a new card rule, add it **before `DefaultRule`**. If it interacts with penalty or special-round state, add it before the relevant rule (e.g., before `QueenRule` if it interacts with the Queen Round).

---

## Nine Rule — Sequential Same-Suit Play

### What It Does

When a 9 is played, the player **may continue playing additional cards of the same suit in the same turn**. The 9 activates a "nine base" (Neun-Basis) chain:

1. Player plays a 9 of, e.g., Hearts.
2. `nineBaseActive = true`, `nineBaseSuit = 'hearts'`, `nineBasePlayerId = <id>`.
3. Player may now play any number of additional Hearts cards.
4. Each additional card is placed on the discard pile immediately; its effect is **not** applied until `endTurn()`.
5. When the player ends their turn (`endTurn()`), the effect of the **top card** on the discard pile is applied once.
6. `nineBaseActive`, `nineBaseSuit`, `nineBasePlayerId` are reset to null/false.

### Answers to Common Questions

1. **Who can play next during a nine base?** Only the same player who played the 9 (`nineBasePlayerId`). The turn does not pass.
2. **How many cards can be chained?** As many same-suit cards as the player has. There is no upper limit.
3. **When does the nine base expire?** At `endTurn()` — it is always cleared when the player ends their turn.
4. **Can the nine base chain with other special cards?** Yes. E.g., playing 9♥ → 7♥ is valid. The 7 is placed on the pile, but its penalty effect is applied only at `endTurn()` (top card effect). The 7 penalty is then passed to the *next* player.
5. **What if the player has no more same-suit cards?** The player simply ends their turn. There is no penalty for stopping the chain early.
6. **Does `nineBasePlayerId` restrict who can extend the chain?** Yes — `isCardPlayable()` in `rule-engine.service.ts` checks `nineBasePlayerId === currentPlayer.id`. Other players cannot play into the chain.

### `nineBaseActive` Lifecycle

```
playCard(9)
  → nineBaseActive = true
  → nineBaseSuit = card.suit
  → nineBasePlayerId = currentPlayer.id

playCard(same-suit card)   [nineBaseActive === true]
  → card placed on pile (effect deferred)

endTurn()
  → applyCardEffect(topCard)  ← effect of the last chained card
  → nineBaseActive = false
  → nineBaseSuit = null
  → nineBasePlayerId = null
```

**Interaction with Jack's `chosenSuit`:** When a 9 is played, `chosenSuit` is reset to `null` (Jack wish is cancelled).

---

## AI Logic

The full AI implementation is in `src/app/services/ai.service.ts`.

### Decision Sequence (`playTurn()`)

When it is an AI player's turn, `AIService.playTurn(state)` runs the following steps **in order**:

1. **Guard check** — if `aiTurnInProgress === true`, return immediately.
2. **Game-over check** — if `state.gameOver`, reset guard and return.
3. **Suit-choice guard** — if `state.awaitingSuitChoice`, reset guard and return.
4. **Human check** — if `currentPlayer.isHuman`, reset guard and return.
5. **Pick up penalty cards** — if `pickupablePenaltyCards.length > 0`, schedule `pickupPenaltyCards()` after delay, then return. AI *always* picks up immediately.
6. **Announcements** — check for Mau-Mau (90% probability) and Queen Round announcement (50% probability).
7. **Seven penalty** — if `drawPenalty > 0`, try to play 7, then 10; otherwise draw all penalty cards.
8. **Queen Round escape** — if `queenRoundActive` and AI has no Queen/10, draw one card then re-evaluate.
9. **Play best card** — `playBestCard()` (see below).
10. **No playable card** — `drawCards()` then re-evaluate or end turn.

### Card Selection (`playBestCard()`)

```
if queenRoundActive:
  if queenRoundNeedsFirstQueen and player is starter → must play Queen
  else prefer 10 (60% chance) over Queen

if selected card is Ace AND it's the last card in hand:
  → draw instead (Swiss Ace rule: cannot win with Ace)

if selected card is Jack:
  → play Jack, then chooseBestSuit() after SUIT_CHOICE_DELAY
    → choose suit that appears most often in remaining hand

otherwise:
  → play first playable card
  → check Mau after playing (if hand drops to 1 card: 80% chance to say Mau)
  → if Queen Round starter played a Queen: end round if no Queens left OR 50% chance
```

### Hardcoded Probabilities

| Probability | Value | Rationale |
|---|---|---|
| Say Mau (hand → 1 card) | 80% | Simulates realistic human forgetfulness |
| Say Mau-Mau (Jack last card) | 90% | AI is slightly more reliable on Mau-Mau |
| Announce Queen Round | 50% | Moderate aggression |
| Prefer 10 over Queen in Queen Round | 60% | 10 extends the round advantageously |
| End Queen Round after playing a Queen | 50% (unless no Queens left) | Balanced strategy |

---

## Concurrency Guards

### `aiTurnInProgress` Flag

**Purpose:** Prevents multiple overlapping AI turns caused by `setTimeout` chains.

**Lifecycle:**

| Event | Value set |
|---|---|
| `playTurn()` enters (passes all guards) | `true` |
| `playTurn()` blocked by guard | unchanged (early return) |
| Before `pickupPenaltyCards()` fires | `false` (reset before the action) |
| Before `playCard()` fires | `false` (reset before the action) |
| `resetGuard()` called by `GameService` | `false` |
| After drawing all cards → re-trigger AI | `false` → re-enters `playTurn()` |

**Critical rule:** Reset `aiTurnInProgress = false` **before** calling any game action, not after. The game action may chain synchronously into the next AI turn (via `nextTurn()` → `triggerAIPlay()`), and resetting after would block that re-entry.

**Stuck guard:** If `aiTurnInProgress` is never reset (e.g., unhandled exception), the AI is permanently blocked. `resetGuard()` is called by `GameService` after `pickupPenaltyCards()` completes and when starting a new game.

### `awaitingSuitChoice` Flag

**Purpose:** Prevents turn advancement while a Jack's suit selection is pending.

**Lifecycle:**

| Event | Value |
|---|---|
| Jack is played (`playCard()`) | `true` |
| `chooseSuit()` is called | `false` |
| New game starts | `false` (initial state) |

`AIService.playTurn()` checks `awaitingSuitChoice` at the start and returns early if true. This prevents the AI from starting a new turn while the current player is choosing a suit.

---

## Common Scenarios

### Scenario: Player plays a 7
1. `playCard(seven)` → `turnPhase = 'CARD_PLAYED'`
2. `applyCardEffect()` → `drawPenalty += 2`
3. `endTurn()` → `nextTurn()` → `turnPhase = 'WAITING_FOR_ACTION'`
4. Next player must play 7/10 or draw penalty cards

### Scenario: AI plays a Jack
1. AI selects Jack as best play
2. `aiTurnInProgress = false` → `playCard(jack)` fires after `ACTION_DELAY`
3. `playCard`: `awaitingSuitChoice = true`, `turnPhase = 'AWAITING_SUIT_CHOICE'`
4. `chooseSuit(bestSuit)` fires after `SUIT_CHOICE_DELAY`
5. `chooseSuit()`: sets `chosenSuit`, clears `awaitingSuitChoice`, `turnPhase = 'SUIT_CHOSEN'`
6. AI calls `endTurn()` → `nextTurn()` → `turnPhase = 'WAITING_FOR_ACTION'`

### Scenario: Queen Round
1. Player announces "Damenrunde" with ≥2 Queens → `queenRoundActive = true`
2. Only Queens and 10s playable; starter must play real Queen first
3. Starter ends round via `endQueenRound()` after playing a Queen
4. Player with no Q/10 must draw (escape mechanism)

### Scenario: Winning with Penalty Cards
1. Player plays last hand card — `hand.length === 0`
2. But `lockedPenaltyCards.length > 0` or `pickupablePenaltyCards.length > 0` → **no win yet**
3. Player must pick up penalty cards, play them off hand
4. Only when all three arrays empty → **WIN**

---

## Timing Constants

All AI delays are defined in `src/app/constants/timing.constants.ts` under `AI_TIMING`.

| Constant | When used |
|---|---|
| `ANNOUNCEMENT_DELAY` | Before Mau/Mau-Mau announcements |
| `QUEEN_ROUND_DELAY` | Before Queen Round actions |
| `PENALTY_PICKUP_DELAY` | Before AI picks up penalty cards |
| `ACTION_DELAY` | Before playing or drawing a card |
| `DRAW_CARD_DELAY` | Between drawing multiple cards |
| `END_TURN_DELAY` | Before ending turn |
| `SUIT_CHOICE_DELAY` | Before choosing suit after Jack |
| `TURN_DELAY` | Between turns (for re-trigger) |
