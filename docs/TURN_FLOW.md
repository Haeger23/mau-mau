# Turn Flow State Machine

This document describes the turn flow logic in the Swiss Mau-Mau game, including all player actions, AI behavior, and state transitions.

## Overview

The game uses a state machine approach where `lastPlayerAction` tracks what happened last, allowing proper sequencing of actions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GAME STATE MACHINE                          │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │  START   │
                              │  GAME    │
                              └────┬─────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │    currentPlayerIndex = 0    │
                    │    lastPlayerAction = null   │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
              ┌────────────────────────────────────────┐
              │              PLAYER TURN               │
              │                                        │
              │  ┌──────────────────────────────────┐  │
              │  │ penaltyCards on table?           │  │
              │  │ → Can pickup (OPTIONAL)          │  │
              │  │ → Cannot WIN until picked up!    │  │
              │  └──────────────────────────────────┘  │
              │                                        │
              │  ┌──────────────────────────────────┐  │
              │  │ Check drawPenalty > 0            │  │
              │  │ (7er-Strafe)?                    │  │
              │  └──────────────┬───────────────────┘  │
              │                 │                      │
              │       ┌─────────┴─────────┐            │
              │       │ YES              │ NO          │
              │       ▼                   ▼            │
              │ ┌───────────────┐  ┌───────────────┐   │
              │ │ Must play 7   │  │ NORMAL TURN   │   │
              │ │ or 10, or     │  │               │   │
              │ │ draw penalty  │  │               │   │
              │ └───────┬───────┘  └───────┬───────┘   │
              │         │                  │           │
              │         ▼                  ▼           │
              │    ┌─────────────────────────────────┐ │
              │    │         ACTION PHASE           │ │
              │    └─────────────────────────────────┘ │
              └────────────────────────────────────────┘
```

## State: `lastPlayerAction`

| Value             | Description                                      |
|-------------------|--------------------------------------------------|
| `null`            | Turn just started, no action taken yet           |
| `'play'`          | Player played a card                             |
| `'draw'`          | Player drew a single card                        |
| `'draw-complete'` | Player finished drawing all required cards       |
| `'penalty-pickup'`| Player picked up their penalty cards             |

## Turn Flow Sequence

### 1. Turn Start
```
nextTurn() is called:
  1. Increment currentPlayerIndex (wrap around)
  2. Reset lastPlayerAction to null
  3. If AI player → trigger aiPlay() after TURN_DELAY
```

### 2. Penalty Cards (Optional Pickup)
```
If player.penaltyCards.length > 0:
  → Player CAN pickup penalty cards (optional)
  → Penalty cards sit on table until picked up
  → IMPORTANT: Player cannot WIN while penalty cards exist!
  → After pickup: penaltyCards → hand (become active cards)
  → Sets lastPlayerAction = 'penalty-pickup'
  
Strategy: Player may delay pickup, but must eventually
pick up all penalty cards before winning the game.
```

### 3. Draw Penalty Check (7er-Strafe)
```
If state.drawPenalty > 0:
  → Player can:
    a) Play a 7 → escapes, adds +2 to drawPenalty
    b) Play a 10 → replicates top card's effect
    c) Draw drawPenalty cards → resets drawPenalty to 0
```

### 4. Queen Round Check
```
If state.queenRoundActive:
  → Player can ONLY play Queen or 10
  → If no Queen/10 available → must draw
```

### 5. Normal Play Options
```
Player can:
  a) Play a valid card → playCard()
  b) Draw a card → drawCard()
  c) End turn (if drew this turn) → endTurn()
```

## AI Turn Flow (`aiPlay()`)

```
aiPlay() execution order:

1. GUARD CHECK
   if (aiTurnInProgress) return;
   aiTurnInProgress = true;

2. PENALTY CARDS (AI always picks up immediately)
   if (penaltyCards.length > 0)
     → pickupPenaltyCards() → return
   Note: AI always picks up, but human can delay strategically

3. ANNOUNCEMENTS
   - Check "Mau" (80% chance at 1 card)
   - Check "Mau-Mau" (90% chance when hand empty after Jack)
   - Check "Damenrunde" announcement (50% with 2+ Queens)
   - Check "Damenrunde" end (80% after playing Queen)

4. SEVEN PENALTY HANDLING
   if (drawPenalty > 0)
     → Try to play 7 or 10 to escape
     → Otherwise: aiDrawCards()

5. QUEEN ROUND ESCAPE
   if (queenRoundActive && no Queen/10)
     → aiDrawCards() to escape

6. PLAY CARD
   Find playable cards, with strategy:
   - During queenRound: prefer 10 (60%) over Queen
   - Avoid Ace as last card (Swiss rule)
   - Jack: also choose suit after playing

7. NO PLAYABLE CARD
   → aiDrawCards()
```

## Card Effects (via applyCardEffect)

| Rank | Effect                                                |
|------|-------------------------------------------------------|
| 7    | Next player draws +2 (cumulative)                     |
| 8    | Next player skips their turn                          |
| 9    | Reverses play direction (toggleable base for +1/+2)   |
| 10   | Replicates the effect of the card below               |
| J    | Player chooses suit; blocks play-on-Jack              |
| Q    | Enables "Damenrunde" announcement option              |
| K    | No special effect                                     |
| A    | Player takes another turn (can't be last card)        |

## Key State Fields

The game state is defined in `src/app/models/game-state.model.ts`.

Key fields for turn flow:
- `currentPlayerIndex` - Whose turn it is
- `lastPlayerAction` - What happened last (see table above)
- `drawPenalty` - Cumulative 7er penalty
- `queenRoundActive` - Queen round mode
- `chosenSuit` - Jack's chosen suit
- `awaitingSuitChoice` - Waiting for Jack suit selection

Player state is defined in `src/app/models/player.model.ts`.

Key fields:
- `hand` - Active cards in hand
- `penaltyCards` - Penalties on table (not yet picked up)
- `drawnThisTurn` / `requiredDrawCount` - Draw tracking
- `hasSaidMau` / `hasSaidMauMau` - Announcement tracking
- `isQueenRoundStarter` - Started the current queen round

See the source files for complete definitions.

## Timing Constants

All AI delays are defined in `src/app/constants/timing.constants.ts`.

The constants control delays for:
- Mau/Mau-Mau announcements
- Queen round actions
- Picking up penalty cards
- Playing/drawing cards
- Between turns
- Between drawing multiple cards
- Before ending turn
- Choosing suit after Jack

See the source file for current values.

## Race Condition Guards

### `aiTurnInProgress` Flag
Prevents multiple simultaneous AI turns from setTimeout overlap:
```typescript
private aiTurnInProgress = false;

private aiPlay(): void {
  if (this.aiTurnInProgress) return;
  this.aiTurnInProgress = true;
  // ... AI logic ...
}
```

### `awaitingSuitChoice` State
Prevents turn advancement while waiting for Jack's suit choice:
```typescript
// In playCard() when Jack is played:
state.awaitingSuitChoice = true;

// In chooseSuit():
state.awaitingSuitChoice = false;
// Only then proceed with nextTurn()
```

## Common Scenarios

### Scenario: Player plays a 7
1. `playCard(seven)` called
2. `applyCardEffect()` → `state.drawPenalty += 2`
3. `nextTurn()` → next player's turn
4. Next player must play 7/10 or draw penalty cards

### Scenario: AI plays a Jack
1. `aiPlay()` detects Jack is best play
2. `setTimeout(() => playCard(jack), ACTION_DELAY)`
3. Inside playCard: `awaitingSuitChoice = true`
4. `setTimeout(() => chooseSuit(bestSuit), SUIT_CHOICE_DELAY)`
5. `chooseSuit()` sets suit, clears flag, calls `nextTurn()`

### Scenario: Queen Round
1. Player announces "Damenrunde" with 2+ Queens
2. `queenRoundActive = true`, `isQueenRoundStarter = true`
3. Only Queens and 10s can be played
4. Starter can end round after playing a Queen
5. If player has no Q/10 → must draw (escape mechanism)

### Scenario: Winning with Penalty Cards
1. Player plays last card from hand
2. Player says "Mau" or "Mau-Mau" (if Jack)
3. **BUT** if `penaltyCards.length > 0`:
   - Game does NOT end
   - Player must eventually pick up penalty cards
   - Penalty cards become active hand cards
   - Player must then play all those cards to win
4. Only when `hand.length === 0 AND penaltyCards.length === 0` → WIN
