# Step-by-Step Fix Prompts

Use these prompts sequentially to fix all bugs and issues identified in the analysis. Each prompt is self-contained and builds on the previous fixes.

---

## Phase 1: Critical Bug Fixes (No Refactoring)

### Prompt 1.1 - Fix Queen Round Escape Mechanism
```
BUG FIX: Queen Round Escape

Problem: Players get stuck during a Queen Round if they have no Queen or 10 in hand. They cannot draw cards to escape, leading to infinite penalty loops.

Location: `src/app/services/game.service.ts` - `drawCard()` method

Fix Required:
1. In `drawCard()`, check if a Queen Round is active
2. If active, check if current player has any valid cards (Queen or 10)
3. If no valid cards, allow drawing to escape the stuck state
4. After drawing, the player should be able to end their turn normally

Also check: The AI's `aiPlay()` and `aiDrawCards()` methods need the same escape logic - if AI has no Queen/10 during Queen Round, it should draw instead of getting stuck.

Test: Start a game, wait for AI to start Queen Round, ensure human player can draw cards if they have no Queen or 10.
```

---

### Prompt 1.2 - Add AI Turn Guard
```
BUG FIX: AI Race Condition Guard

Problem: Multiple setTimeout callbacks can trigger `aiPlay()` concurrently, causing race conditions and game freezes.

Location: `src/app/services/game.service.ts` - `aiPlay()` method and related AI methods

Fix Required:
1. Add a private flag `private aiTurnInProgress = false;`
2. At the start of `aiPlay()`, check if flag is true - if so, return early
3. Set flag to true at the beginning of AI turn
4. Reset flag to false when AI turn is complete (before calling `nextTurn()`)
5. Also reset flag in `nextTurn()` before triggering next AI play
6. Handle edge cases: reset flag if game ends, if AI gets stuck, etc.

Important: The flag should be reset in a `finally`-like manner to prevent permanent lockout.

Test: Play several games rapidly, verify AI never gets stuck in concurrent turn execution.
```

---

### Prompt 1.3 - Add Suit Selection State
```
BUG FIX: Suit Selection Race Condition

Problem: After AI plays a Jack, the 500ms setTimeout for suit selection can race with the 1000ms `aiPlay()` trigger, causing wrong behavior.

Location: 
- `src/app/models/game-state.model.ts` - Add new state field
- `src/app/services/game.service.ts` - Use the field

Fix Required:
1. Add `awaitingSuitChoice: boolean` to `GameState` interface
2. Initialize it to `false` in `createInitialState()`
3. In `playCard()` when Jack is played, set `awaitingSuitChoice = true`
4. In `chooseSuit()`, set `awaitingSuitChoice = false`
5. In `aiPlay()`, check at the start - if `awaitingSuitChoice` is true, return early (don't start new actions)
6. In `canPlayCard()`, consider returning false if awaiting suit choice
7. Update UI to show suit selector is required (game-board component)

Test: Have AI play Jack, verify suit is chosen before any other action happens.
```

---

### Prompt 1.4 - Fix 9-Base Double Effect
```
BUG FIX: 9er-Basis Chain Effect Applied Twice

Problem: When playing a 9 with additional cards, `applyCardEffect()` is called twice - once in `playCard()` and again in `endTurn()`.

Location: `src/app/services/game.service.ts`
- `playCard()` around line 419 (effect applied for multi-card play)
- `endTurn()` around line 851 (effect applied again)

Fix Required:
1. Add a flag to track if effect was already applied: `nineBaseEffectApplied: boolean` in GameState
2. In `playCard()` when 9-base multi-card is played:
   - Set `nineBaseEffectApplied = true` after calling `applyCardEffect(topCard)`
3. In `endTurn()` when checking nineBaseActive:
   - Only call `applyCardEffect()` if `nineBaseEffectApplied === false`
   - Reset `nineBaseEffectApplied = false` when ending 9-base chain

Alternative simpler fix:
- In `playCard()` for 9-base multi-card: DON'T call `applyCardEffect()` immediately
- Let `endTurn()` be the ONLY place where 9-base effects are applied
- This matches the rule intent: "effect delayed until turn end"

Test: Play a 9 with additional cards (e.g., 9 + 7), verify the +2 penalty is only applied once.
```

---

### Prompt 1.5 - Fix Penalty Pickup Turn Flow
```
BUG FIX: Turn Not Advancing After AI Penalty Pickup

Problem: In `pickupPenaltyCards()`, calling `nextTurn()` directly for AI can cause issues with `skipNext` flag, potentially skipping the wrong player.

Location: `src/app/services/game.service.ts` - `pickupPenaltyCards()` method

Fix Required:
1. Don't call `nextTurn()` directly from `pickupPenaltyCards()`
2. Instead, after picking up penalty cards, the AI should continue with `aiPlay()` logic
3. The turn should only advance when the AI has completed a valid action (play or draw)
4. Update the flow:
   - AI picks up penalty cards → sets `lastPlayerAction = 'penalty-pickup'`
   - AI then decides: play a card OR draw a card
   - After that action, turn advances normally

Current problematic code:
```typescript
if (!player.isHuman) {
  setTimeout(() => this.nextTurn(), 1000);
}
```

Should become:
```typescript
if (!player.isHuman) {
  // Continue AI turn - let aiPlay handle the next action
  setTimeout(() => this.aiPlay(), 500);
}
```

Test: Give AI penalty cards, verify turn advances correctly to next player after AI completes their action.
```

---

## Phase 2: Safe Refactorings

### Prompt 2.1 - Extract Timing Constants
```
REFACTOR: Extract Magic Numbers to Constants

Problem: setTimeout delays (300, 400, 500, 600, 1000ms) are scattered throughout the code with no explanation.

Create new file: `src/app/constants/timing.constants.ts`

Content:
```typescript
export const AI_TIMING = {
  /** Delay before AI says Mau/MauMau */
  ANNOUNCEMENT_DELAY: 300,
  
  /** Delay before AI announces/ends Queen Round */
  QUEEN_ROUND_DELAY: 400,
  
  /** Delay for penalty card pickup */
  PENALTY_PICKUP_DELAY: 500,
  
  /** Delay before AI plays a card or draws */
  ACTION_DELAY: 600,
  
  /** Delay before next turn / AI play trigger */
  TURN_DELAY: 1000,
  
  /** Delay between drawing multiple cards */
  DRAW_CARD_DELAY: 300,
  
  /** Delay after drawing before ending turn */
  END_TURN_DELAY: 500
} as const;
```

Then update `game.service.ts` to import and use these constants instead of magic numbers.

Test: Run game, verify timing feels the same as before.
```

---

### Prompt 2.2 - Document Turn Flow
```
DOCUMENTATION: Create Turn Flow Diagram

Create new file: `TURN_FLOW.md`

Document the state machine for turn phases:
1. List all possible values of `lastPlayerAction`
2. Document valid transitions between states
3. Show which actions are valid in each state
4. Include both human and AI player flows
5. Document Queen Round special states
6. Document 7-chain penalty states

Include ASCII diagram showing:
- Turn start → Play card OR Draw card
- After play → End turn (or choose suit if Jack)
- After draw → Play card OR End turn
- Penalty flow
- Queen Round flow

This helps future developers understand the complex turn logic.
```

---

### Prompt 2.3 - Use RuleEngine Consistently
```
REFACTOR: Replace applyCardEffect() with RuleEngine

Problem: `game.service.ts` has `applyCardEffect()` switch statement that duplicates logic in `RuleEngine.applyAllEffects()`.

Location: 
- `src/app/services/game.service.ts` - `applyCardEffect()` method
- `src/app/services/rule-engine.service.ts` - `applyAllEffects()` method

Fix Required:
1. Review what `applyCardEffect()` does that `applyAllEffects()` doesn't:
   - Chat logging (should stay in GameService)
   - 10-replicator recursive logic
   - Escape detection for 7-chain
   
2. Update `applyAllEffects()` to return additional info:
   - What effect was applied
   - Whether escape happened
   - What needs to be logged

3. Replace `applyCardEffect()` body with:
   ```typescript
   const newState = this.ruleEngine.applyAllEffects(card, state);
   this.gameState.set(newState);
   // Handle logging based on what changed
   ```

4. Move any remaining game-specific logic (like chat logging) outside the rule engine

Keep the rule engine focused on state transformation, keep GameService responsible for orchestration and side effects.

Test: Play all card types, verify effects work the same as before.
```

---

### Prompt 2.4 - Add Unit Tests for Game Service
```
TESTING: Add Comprehensive Unit Tests

Location: `src/app/services/game.service.spec.ts`

Add tests for:

1. Basic game flow:
   - `startNewGame()` creates correct initial state
   - `drawCard()` adds card to hand
   - `playCard()` removes card from hand and adds to discard pile
   - `nextTurn()` advances to next player

2. Special cards:
   - 7 adds drawPenalty
   - 8 sets skipNext
   - Jack requires suit choice
   - Ace keeps player's turn
   - 10 replicates card below (except Jack)

3. Queen Round:
   - Announcing with 2+ Queens works
   - Announcing with <2 Queens gives penalty
   - Only Queen/10 playable during round
   - Drawing allowed when stuck
   - Only starter can end round

4. Penalty system:
   - Too early pickup gives penalty
   - Correct pickup works
   - Mau missed gives penalty
   - Invalid card gives penalty

5. AI behavior:
   - AI plays valid card when available
   - AI draws when no valid card
   - AI escapes 7-chain when possible
   - AI handles Queen Round

Use `beforeEach` to set up fresh game state with `setSeed()` for deterministic tests.
```

---

## Phase 3: Architecture Improvements

### Prompt 3.1 - Extract AI Service
```
REFACTOR: Extract AI Logic to Separate Service

Create new file: `src/app/services/ai.service.ts`

Move all AI-related logic from `game.service.ts`:
- `aiPlay()` method
- `aiDrawCards()` method
- AI decision-making for suit choice
- AI probability for Mau/MauMau/Queen Round announcements

New AIService structure:
```typescript
@Injectable({ providedIn: 'root' })
export class AIService {
  private gameService = inject(GameService);
  private rng = new SeededRandom();
  private aiTurnInProgress = false;

  setSeed(seed: number): void { }
  
  playTurn(): void { }
  
  private chooseBestCard(hand: Card[], state: GameState): Card | null { }
  
  private chooseSuitStrategy(hand: Card[]): Suit { }
  
  private shouldAnnounceQueenRound(hand: Card[], state: GameState): boolean { }
  
  private shouldSayMau(handSize: number): boolean { }
  
  private shouldSayMauMau(): boolean { }
  
  private drawCards(count: number): void { }
}
```

Update `game.service.ts`:
- Remove AI methods
- Inject AIService
- In `nextTurn()`, call `aiService.playTurn()` instead of `setTimeout(() => this.aiPlay(), ...)`

Benefits:
- Testable AI in isolation
- Can mock AI for deterministic E2E tests
- Clear separation of concerns
- Easy to add difficulty levels later
```

---

### Prompt 3.2 - Implement Explicit Turn State Machine
```
REFACTOR: Add Explicit Turn Phase State

Update `src/app/models/game-state.model.ts`:

```typescript
export type TurnPhase = 
  | 'WAITING_FOR_ACTION'      // Turn started, player can play or draw
  | 'CARD_PLAYED'             // Card played, may need suit choice or can end
  | 'AWAITING_SUIT_CHOICE'    // Jack played, must choose suit
  | 'SUIT_CHOSEN'             // Suit chosen, can end turn
  | 'DRAWING'                 // Drawing cards (penalty or normal)
  | 'DRAW_COMPLETE'           // Drawing done, can play or end
  | 'TURN_ENDING';            // Processing turn end

export interface GameState {
  // ... existing fields ...
  turnPhase: TurnPhase;
  // Remove: lastPlayerAction (replaced by turnPhase)
}
```

Update `game.service.ts`:
1. Replace all `lastPlayerAction` checks with `turnPhase` checks
2. Add phase transitions in each method:
   - `playCard()`: WAITING → CARD_PLAYED (or AWAITING_SUIT_CHOICE if Jack)
   - `chooseSuit()`: AWAITING_SUIT_CHOICE → SUIT_CHOSEN
   - `drawCard()`: WAITING/DRAW_COMPLETE → DRAWING → DRAW_COMPLETE
   - `endTurn()`: any valid end state → TURN_ENDING → (next player) WAITING

3. Add validation: each method checks if current phase allows the action

4. Update UI to show current phase (optional, helpful for debugging)

Benefits:
- Clear what actions are valid at any time
- Easier to debug stuck games
- Better E2E test assertions
```

---

### Prompt 3.3 - Add Missing Rule Classes
```
REFACTOR: Complete the Rule Engine Pattern

Create new rule files:

1. `src/app/rules/queen-rule.ts`:
```typescript
export class QueenRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === 'Q';
  }
  
  applyEffect(state: GameState, card: Card): GameState {
    // Player joins queen round if active
    // No other effect
    return state;
  }
  
  canPlay(card: Card, state: GameState): boolean {
    // Queens can be played during queen round
    // Normal play rules otherwise
    return true;
  }
}
```

2. `src/app/rules/nine-rule.ts`:
```typescript
export class NineRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === '9';
  }
  
  applyEffect(state: GameState, card: Card): GameState {
    // Start 9-base chain
    return {
      ...state,
      nineBaseActive: true,
      nineBaseSuit: card.suit,
      nineBasePlayerId: state.players[state.currentPlayerIndex].id
    };
  }
  
  canPlay(card: Card, state: GameState): boolean {
    return true;
  }
}
```

3. `src/app/rules/ten-rule.ts`:
```typescript
export class TenRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === '10';
  }
  
  applyEffect(state: GameState, card: Card): GameState {
    // Replicate card below
    const cardBelow = state.discardPile[state.discardPile.length - 2];
    if (!cardBelow) return state;
    
    // Check for Jack replication (forbidden)
    if (cardBelow.rank === 'J') {
      // This should be caught in validation, not here
      return state;
    }
    
    // Apply effect of card below
    // This needs access to other rules - consider passing rule engine
    return state;
  }
  
  canPlay(card: Card, state: GameState): boolean {
    const topCard = state.discardPile[state.discardPile.length - 1];
    // Can't play 10 to replicate Jack
    if (topCard?.rank === 'J') return false;
    // 10 can always be played otherwise
    return true;
  }
}
```

Update `rule-engine.service.ts` to include new rules in the array.

Test: All card types should work correctly with the new rule classes.
```

---

## Phase 4: Polish and Optimization

### Prompt 4.1 - Remove Dead Code
```
CLEANUP: Remove Unused Code

Search `game.service.ts` for:
1. Unused private methods
2. Commented-out code blocks
3. Console.log statements (except for errors)
4. Duplicate logic that's now in RuleEngine
5. Unused imports

Check:
- Is `applyCardEffect()` still needed after RuleEngine integration?
- Are there methods that are never called?
- Remove any TODO comments that are now done

Run tests after each removal to ensure nothing breaks.
```

---

### Prompt 4.2 - Consistent Language
```
CLEANUP: Standardize Code Language

Decision: Keep comments and logs in German (matches target audience and rule references).

But ensure:
1. All variable names are in English
2. All interface/type names are in English
3. Function names are in English
4. German is only in:
   - RULE_EXPLANATIONS
   - Chat log messages
   - UI text
   - Code comments explaining Swiss rules

Fix any inconsistencies found.
```

---

### Prompt 4.3 - E2E Test Improvements
```
TESTING: Fix and Improve E2E Tests

Update `e2e/` tests:

1. `seven-escape-test.spec.ts`:
   - Use seeded random for deterministic card distribution
   - Create specific scenario where 7-escape is guaranteed
   - Reduce timeout, add better assertions

2. `autonomous-game-validator.spec.ts`:
   - Add explicit waits for game state changes
   - Validate turn phase transitions
   - Check for stuck states (same player multiple times without action)

3. Add new test: `queen-round.spec.ts`:
   - Test Queen Round announcement
   - Test escape mechanism (drawing when stuck)
   - Test ending Queen Round
   - Test penalties for wrong actions

4. Add new test: `ai-behavior.spec.ts`:
   - Verify AI doesn't get stuck
   - Verify AI makes valid moves
   - Verify AI timing is consistent

Make tests more reliable by:
- Using data-testid attributes consistently
- Waiting for specific state changes, not arbitrary timeouts
- Adding retry logic for flaky interactions
```

---

## Verification Checklist

After completing all phases, verify:

- [ ] Game can be played from start to finish without freezing
- [ ] AI never gets stuck
- [ ] Queen Round can be escaped by drawing
- [ ] 7-chain penalty works correctly
- [ ] Jack suit selection works without race conditions
- [ ] All E2E tests pass
- [ ] No console errors during gameplay
- [ ] Code coverage increased
- [ ] No TypeScript compilation warnings

---

## Quick Reference: Bug → Prompt Mapping

| Bug ID | Description | Fix Prompt |
|--------|-------------|------------|
| BUG-001 | AI stuck in Queen Round | 1.1 |
| BUG-002 | Turn not advancing after penalty | 1.5 |
| BUG-003 | Race condition in suit selection | 1.2, 1.3 |
| BUG-004 | RuleEngine not used | 2.3 |
| BUG-005 | 9-base double effect | 1.4 |
| BUG-006 | Queen Round no escape | 1.1 |
| BUG-007 | Mau timing | 3.2 |
| BUG-008 | chosenSuit reset | 2.3 |
| BUG-009 | 10-replicator recursion | 3.3 |

---

*Use these prompts in order. Each builds on the previous fixes.*
