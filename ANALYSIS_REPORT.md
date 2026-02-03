# Deep Code Analysis Report
## Swiss Mau-Mau (Schweizer Regeln) - Angular 21 Implementation

**Analyzed by:** Claude Opus 4.5  
**Date:** February 3, 2026  
**Codebase Version:** 0.1.0

---

## Table of Contents
1. [Architecture Assessment](#1-architecture-assessment)
2. [Bug Analysis Report](#2-bug-analysis-report)
3. [Code Quality Improvements](#3-code-quality-improvements)
4. [Refactoring Recommendations](#4-refactoring-recommendations)
5. [Implementation Plan](#5-implementation-plan)
6. [Key Questions Answered](#6-key-questions-answered)

---

## 1. Architecture Assessment

### Overall Code Health Score: 5.5/10

| Category | Score | Notes |
|----------|-------|-------|
| Correctness | 4/10 | Critical bugs in turn flow, AI gets stuck |
| Maintainability | 5/10 | Large monolithic service, mixed concerns |
| Testability | 5/10 | Async timeouts make testing difficult |
| Readability | 6/10 | Good German documentation, but complex flow |
| Patterns | 6/10 | Rule Engine is good start, incomplete |
| Performance | 7/10 | Signals used correctly, no obvious issues |

### Main Architectural Strengths

1. **Signals for State Management**
   - Good use of Angular signals (`signal()`, `computed()`)
   - Immutable state updates via spreading: `this.gameState.set({ ...state })`
   - Read-only public state via `asReadonly()`

2. **Rule Engine Pattern (Partial)**
   - Clean interface definition (`CardRule`)
   - Separation of `isApplicable`, `applyEffect`, `canPlay`
   - Easy to add new rules

3. **German Documentation**
   - Comprehensive `RULE_EXPLANATIONS` with official rules
   - Good comments explaining Swiss Mau-Mau specifics
   - Clear rule keys for penalty system

4. **Player Model**
   - Well-structured penalty card system
   - Draw counters for validation
   - Mau/MauMau announcement tracking

### Main Architectural Weaknesses

1. **CRITICAL: Monolithic GameService (1,475 lines)**
   - Mixes: game state, rules, AI behavior, UI concerns, chat logging
   - Violates Single Responsibility Principle severely
   - Hard to test individual behaviors
   - High cognitive load to understand flow

2. **CRITICAL: Async Complexity Without Guards**
   - 12+ `setTimeout` calls scattered throughout
   - No mechanism to cancel pending timeouts
   - No guard against concurrent AI turns
   - Race conditions between state reads and writes

3. **Incomplete Rule Engine Usage**
   - `RuleEngine.applyAllEffects()` exists but is NOT USED
   - `applyCardEffect()` in GameService duplicates rule logic
   - `canPlay()` on rules is not called
   - Inconsistent: some validation in RuleEngine, some in GameService

4. **State Mutation Issues**
   - Multiple methods read state, mutate, then set
   - State can change between read and set (`const state = this.gameState()`)
   - No transaction/batch mechanism
   - `lastPlayerAction` state machine is implicit and fragile

5. **Turn Flow Confusion**
   - `endTurn()` vs `nextTurn()` responsibilities unclear
   - Multiple paths to advance turns
   - No explicit state machine for turn phases
   - Human vs AI flow handled with inline conditionals

---

## 2. Bug Analysis Report

### CRITICAL Bugs

#### BUG-001: AI Gets Stuck in Queen Round
**Severity:** Critical  
**Impact:** Game freezes, requires restart  
**Location:** `game.service.ts:aiPlay()` lines 982-1035

**Root Cause:**  
When a Queen Round is active and the human player cannot play (no Queen/10), they keep trying invalid cards. The test shows the player stuck in a loop trying to play "8 ♣️ Kreuz" during a Queen Round, accumulating 19 penalty cards.

The issue is that during a Queen Round:
1. Only Queens and 10s are valid
2. Human player has no valid cards
3. They cannot draw because `drawCard()` doesn't check if drawing is valid during Queen Round
4. They keep clicking cards → penalty → stuck

**Reproduction:**
1. AI starts Queen Round
2. Human has no Queen or 10
3. Human cannot escape the turn

**Fix Approach:**
```typescript
// In drawCard() - allow drawing during Queen Round if no valid cards
drawCard(): void {
  const state = this.gameState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Allow draw if player has no playable cards
  const hasPlayableCard = currentPlayer.hand.some(c => this.canPlayCard(c));
  
  // During Queen Round, player must be able to draw if stuck
  if (state.queenRoundActive && !hasPlayableCard) {
    // Allow draw to escape stuck state
  }
  // ... rest of logic
}
```

---

#### BUG-002: Turn Not Advancing After AI Penalty Pickup
**Severity:** Critical  
**Impact:** Game freezes  
**Location:** `game.service.ts:pickupPenaltyCards()` line 271-285

**Root Cause:**  
In `pickupPenaltyCards()`:
```typescript
if (!player.isHuman) {
  setTimeout(() => this.nextTurn(), 1000);
}
```
This calls `nextTurn()` but if the AI was the current player and pickup happened during their turn, the turn might not properly advance because `nextTurn()` only increments `currentPlayerIndex` once, but if `skipNext` is true, it increments twice - potentially skipping back to the AI.

**Fix Approach:**
Ensure `pickupPenaltyCards` sets `lastPlayerAction` properly and doesn't call `nextTurn()` directly - let the normal turn flow handle it.

---

#### BUG-003: Race Condition in AI Suit Selection After Jack
**Severity:** Critical  
**Impact:** Game can freeze or wrong suit chosen  
**Location:** `game.service.ts:playCard()` lines 603-623

**Root Cause:**
```typescript
if (!currentPlayer.isHuman) {
  setTimeout(() => {
    const currentState = this.gameState();
    if (!currentState.gameOver && !currentState.chosenSuit) {
      // ... choose suit
    }
  }, 500);
}
```
The setTimeout at 500ms can race with:
- Another `aiPlay()` being triggered (at 1000ms)
- State changes from other sources
- The game ending

If `aiPlay()` fires before suit is chosen, AI may try to play another card while waiting for suit selection.

**Fix Approach:**
Add a state flag `awaitingSuitChoice: boolean` to prevent other actions until suit is chosen.

---

### MAJOR Bugs

#### BUG-004: RuleEngine.applyAllEffects() Never Called
**Severity:** Major  
**Impact:** Code duplication, rule inconsistency  
**Location:** `rule-engine.service.ts` vs `game.service.ts:applyCardEffect()`

**Root Cause:**
The `RuleEngine` has `applyAllEffects()` method that applies all rule effects, but `game.service.ts` has its own `applyCardEffect()` switch statement that duplicates this logic. This means:
- Two places to maintain card effects
- Risk of them diverging
- Rule classes' `applyEffect` methods are mostly unused

**Fix Approach:**
Replace `applyCardEffect()` in GameService with call to `ruleEngine.applyAllEffects()`.

---

#### BUG-005: 9er-Basis Chain Effect Applied Twice
**Severity:** Major  
**Impact:** Wrong game state  
**Location:** `game.service.ts:endTurn()` lines 848-859

**Root Cause:**
When playing a 9 with additional cards, `applyCardEffect(topCard)` is called in `playCard()` at line 419. Then in `endTurn()` at line 851, `applyCardEffect(topCard)` is called AGAIN if `nineBaseActive`.

The intent is to delay effect until turn end, but the current code:
1. Applies effect immediately for 9-base multi-card play (line 419)
2. Applies effect again at turn end (line 851)

**Fix Approach:**
Only apply effect once - either track "effect pending" or skip immediate application for 9-base chains.

---

#### BUG-006: Missing Queen Round Escape Via Drawing
**Severity:** Major  
**Impact:** Player can get completely stuck  
**Location:** `game.service.ts:drawCard()`, `rule-engine.service.ts:isCardPlayable()`

**Root Cause:**
During a Queen Round, the rules say only Queens and 10s can be played. But what if a player has neither? The current code:
- Doesn't allow drawing as an escape
- Player must keep trying invalid cards (getting penalties)
- No way to end the Queen Round except waiting for starter

**Fix Approach:**
Allow drawing during Queen Round if player has no valid cards. This is consistent with "draw if you can't play" rule.

---

### MINOR Bugs

#### BUG-007: Mau Check Timing Issue
**Severity:** Minor  
**Impact:** Incorrect penalty timing  
**Location:** `game.service.ts:checkMauPenalty()` and `endTurn()`

**Root Cause:**
`checkMauPenalty()` is called in `endTurn()` after the draw counter checks. But "Mau" must be said BEFORE the turn ends (per Swiss rules). The current implementation checks at turn end, which is technically too late.

---

#### BUG-008: chosenSuit Not Reset Properly
**Severity:** Minor  
**Impact:** Possible wrong validation  
**Location:** Multiple places in `playCard()`

**Root Cause:**
The `chosenSuit` is reset in multiple places:
- Line 448: `if (!hasJack && state.chosenSuit)`
- In `applyCardEffect` for 7, 8 cards
- In various rule `applyEffect` methods

This scatter makes it hard to know when `chosenSuit` is actually cleared.

---

#### BUG-009: 10-Replicator Recursion Risk
**Severity:** Minor  
**Impact:** Potential infinite loop  
**Location:** `game.service.ts:applyCardEffect()` case '10', lines 718-728

**Root Cause:**
```typescript
case '10':
  // ...
  case '10':
    // 10 auf 10: Kopiere die Karte DARUNTER (rekursiv)
    const cardBelowBelow = state.discardPile[state.discardPile.length - 3];
    if (cardBelowBelow) {
      this.applyCardEffect(cardBelowBelow); // Recursive!
    }
```
If there are multiple 10s stacked, this could recurse deeply. There's no depth limit.

---

## 3. Code Quality Improvements

### Code Smells Found

| ID | Smell | Location | Description |
|----|-------|----------|-------------|
| CS-001 | God Class | `game.service.ts` | 1,475 lines, handles everything |
| CS-002 | Long Method | `playCard()` | ~200 lines, many branches |
| CS-003 | Long Method | `aiPlay()` | ~100 lines, complex flow |
| CS-004 | Feature Envy | `applyCardEffect()` | Duplicates RuleEngine logic |
| CS-005 | Primitive Obsession | Turn state | Uses strings instead of enum/union |
| CS-006 | Temporal Coupling | AI methods | Must call in specific order |
| CS-007 | Magic Numbers | setTimeout delays | 300, 400, 500, 600, 1000ms |
| CS-008 | Flag Arguments | `playCard(card, additionalCard?)` | Boolean-like behavior |

### SOLID Violations

#### Single Responsibility Principle (S)
**Violation:** `GameService` handles:
- Game state management
- Rule validation
- Rule effect application  
- AI decision making
- AI action execution
- Chat logging
- Timer/delay management
- Penalty assignment
- Turn flow control

**Impact:** Changes to AI behavior risk breaking rule logic.

#### Open/Closed Principle (O)
**Partial Compliance:** Rule Engine is extensible, but:
- Adding Queen rule requires changes to GameService too
- `applyCardEffect()` switch must be updated for new cards
- Turn flow conditions are hardcoded

#### Liskov Substitution Principle (L)
**Compliant:** Rule classes properly implement `CardRule` interface.

#### Interface Segregation Principle (I)
**Compliant:** `CardRule` interface is focused.

#### Dependency Inversion Principle (D)
**Violation:** 
- `GameService` creates `SeededRandom` directly
- AI logic is embedded, not injectable
- No abstraction for timing/delays

### Readability Issues

1. **Implicit State Machine**
   - `lastPlayerAction` values: `'play' | 'draw-complete' | 'awaiting-draw' | 'penalty-pickup' | null`
   - No diagram or documentation of valid transitions
   - Checked in multiple places with different subsets

2. **Scattered setTimeout Values**
   ```typescript
   setTimeout(..., 300);  // suit choice check
   setTimeout(..., 400);  // queen round announce + re-play
   setTimeout(..., 500);  // penalty pickup, suit selection
   setTimeout(..., 600);  // card play, draw
   setTimeout(..., 1000); // next turn, AI play
   ```
   No constants or rationale for these values.

---

## 4. Refactoring Recommendations

### High Priority (Fixes Critical Bugs)

#### REF-001: Add Queen Round Escape Mechanism
**What:** Allow drawing when stuck in Queen Round  
**Why:** Fixes BUG-001, prevents game freeze  
**Risk:** Low - adds escape hatch, doesn't change normal flow  
**Effort:** Small (2-3 hours)  
**Dependencies:** None

```typescript
// In canDrawCard() or drawCard()
if (state.queenRoundActive) {
  const hasValidCard = currentPlayer.hand.some(c => 
    c.rank === 'Q' || c.rank === '10'
  );
  if (!hasValidCard) {
    // Allow drawing to escape
    return true;
  }
}
```

---

#### REF-002: Add AI Turn Guard
**What:** Prevent concurrent AI turns with a flag  
**Why:** Fixes race conditions (BUG-002, BUG-003)  
**Risk:** Low - defensive check  
**Effort:** Small (1-2 hours)  
**Dependencies:** None

```typescript
private aiTurnInProgress = false;

aiPlay(): void {
  if (this.aiTurnInProgress) return; // Guard
  this.aiTurnInProgress = true;
  
  try {
    // ... existing logic
  } finally {
    // Reset at end of AI sequence
  }
}
```

---

#### REF-003: Add Suit Selection State
**What:** Add `awaitingSuitChoice: boolean` to GameState  
**Why:** Prevents actions while waiting for Jack suit  
**Risk:** Low - new state field  
**Effort:** Small (2 hours)  
**Dependencies:** None

---

### Medium Priority (Improves Maintainability)

#### REF-004: Extract AIService
**What:** Move all AI logic to `ai.service.ts`  
**Why:** Single responsibility, testable AI  
**Risk:** Medium - refactoring, need to maintain behavior  
**Effort:** Medium (1-2 days)  
**Dependencies:** REF-002

**New Service Structure:**
```typescript
@Injectable({ providedIn: 'root' })
export class AIService {
  private gameService = inject(GameService);
  
  playTurn(playerId: string): void { }
  chooseSuitStrategy(hand: Card[]): Suit { }
  shouldAnnounceQueenRound(hand: Card[]): boolean { }
  shouldSayMau(): boolean { }
}
```

---

#### REF-005: Use RuleEngine Consistently
**What:** Replace `applyCardEffect()` with `ruleEngine.applyAllEffects()`  
**Why:** Single source of truth for rules (fixes BUG-004)  
**Risk:** Medium - behavior change possible  
**Effort:** Medium (4-6 hours)  
**Dependencies:** None

---

#### REF-006: Explicit Turn State Machine
**What:** Model turn phases explicitly  
**Why:** Clearer flow, easier debugging  
**Risk:** Medium - changes turn logic  
**Effort:** Medium (1 day)  
**Dependencies:** None

```typescript
type TurnPhase = 
  | 'WAITING_FOR_ACTION'      // Player's turn started
  | 'CARD_PLAYED'             // Card on pile, effects pending
  | 'AWAITING_SUIT_CHOICE'    // Jack played, waiting for suit
  | 'DRAW_IN_PROGRESS'        // Drawing penalty cards
  | 'TURN_COMPLETE';          // Ready for nextTurn()

interface TurnState {
  phase: TurnPhase;
  pendingEffects: Card[];
  drawsRemaining: number;
}
```

---

### Low Priority (Nice-to-haves)

#### REF-007: Extract Constants
**What:** Move magic numbers to constants file  
**Why:** Easier tuning, clearer intent  
**Risk:** Low  
**Effort:** Small (1 hour)

```typescript
// timing.constants.ts
export const AI_TIMING = {
  SUIT_SELECTION_DELAY: 400,
  CARD_PLAY_DELAY: 600,
  TURN_ADVANCE_DELAY: 1000,
  PENALTY_PICKUP_DELAY: 500
} as const;
```

---

#### REF-008: Add Missing Rule Classes
**What:** Create `QueenRule`, `NineRule`, `TenRule`  
**Why:** Complete the pattern, remove switch statement  
**Risk:** Low  
**Effort:** Medium (4-6 hours)  
**Dependencies:** REF-005

---

#### REF-009: Add Turn Flow Diagram
**What:** Document state machine in README or separate doc  
**Why:** Onboarding, debugging  
**Risk:** None  
**Effort:** Small (2 hours)

---

## 5. Implementation Plan

### Phase 1: Critical Bug Fixes (No Refactoring)
**Duration:** 1-2 days  
**Goal:** Make the game playable without freezes

| Step | Task | Files | Time |
|------|------|-------|------|
| 1.1 | Add Queen Round escape (REF-001) | game.service.ts | 2h |
| 1.2 | Add AI turn guard (REF-002) | game.service.ts | 2h |
| 1.3 | Add suit selection state (REF-003) | game-state.model.ts, game.service.ts | 2h |
| 1.4 | Fix 9-base double effect (BUG-005) | game.service.ts | 1h |
| 1.5 | Test all fixes with E2E | e2e/*.spec.ts | 2h |

---

### Phase 2: Safe Refactorings
**Duration:** 2-3 days  
**Goal:** Improve structure without behavior changes

| Step | Task | Files | Time |
|------|------|-------|------|
| 2.1 | Extract timing constants (REF-007) | new: timing.constants.ts | 1h |
| 2.2 | Document turn flow (REF-009) | README.md or TURN_FLOW.md | 2h |
| 2.3 | Use RuleEngine.applyAllEffects (REF-005) | game.service.ts, rule-engine.service.ts | 4h |
| 2.4 | Add comprehensive unit tests | game.service.spec.ts | 4h |

---

### Phase 3: Architecture Improvements
**Duration:** 3-5 days  
**Goal:** Better separation of concerns

| Step | Task | Files | Time |
|------|------|-------|------|
| 3.1 | Extract AIService (REF-004) | new: ai.service.ts | 8h |
| 3.2 | Implement explicit turn state machine (REF-006) | game.service.ts, game-state.model.ts | 8h |
| 3.3 | Add missing rule classes (REF-008) | new: queen-rule.ts, nine-rule.ts, ten-rule.ts | 4h |
| 3.4 | Integration testing | e2e/*.spec.ts | 4h |

---

### Phase 4: Polish and Optimization
**Duration:** 1-2 days  
**Goal:** Final cleanup

| Step | Task | Files | Time |
|------|------|-------|------|
| 4.1 | Remove dead code | game.service.ts | 2h |
| 4.2 | Consistent language (all German or all English) | all | 2h |
| 4.3 | Performance profiling | - | 2h |
| 4.4 | Final E2E validation | e2e/*.spec.ts | 2h |

---

## 6. Key Questions Answered

### Q1: Is the Rule Engine pattern helping or hurting?
**Answer:** Helping conceptually, but underutilized.

The pattern is **good** because:
- Clean interface (`CardRule`)
- Easy to add new rules
- Separates validation from effects

But currently **hurting** because:
- `applyAllEffects()` is never called
- Logic duplicated in `applyCardEffect()` switch
- `canPlay()` on rules not integrated

**Recommendation:** Continue with Rule Engine, but actually USE it. Replace the switch statement with `ruleEngine.applyAllEffects()`.

---

### Q2: Should we separate AI into its own service?
**Answer:** Yes, strongly recommended.

Benefits:
- Testable AI strategies
- Configurable difficulty levels
- Clear responsibility separation
- Can mock AI for deterministic tests

The AI logic (80+ lines in `aiPlay()`) is self-contained and would be a clean extraction.

---

### Q3: Is setTimeout the right approach for AI delays?
**Answer:** No, but it works with guards.

Problems with current approach:
- No cancellation mechanism
- Race conditions
- Hard to test

Better alternatives:
1. **RxJS with delay/debounceTime** - Cancellable, composable
2. **requestAnimationFrame with timestamps** - Smoother, consistent
3. **State machine with timed transitions** - Explicit, testable

For now: Keep setTimeout but add guards and track pending timeouts for cancellation.

---

### Q4: Should turn phases be explicit state?
**Answer:** Yes, highly recommended.

Current implicit state machine causes:
- Multiple checks for "can I do X now?"
- Unclear turn boundaries
- Hard to debug frozen games

Explicit phases would:
- Make valid actions clear per phase
- Simplify conditional logic
- Enable better UI feedback
- Make E2E tests more reliable

---

### Q5: What's causing the AI to get stuck?
**Answer:** Multiple causes:

1. **Queen Round trap** - AI has no escape mechanism
2. **Race conditions** - Multiple setTimeout callbacks interfering
3. **Missing returns** - Some code paths don't advance the game
4. **State inconsistency** - Reading stale state after timeout

Primary fix: Add guards (REF-002, REF-003) and escape mechanism (REF-001).

---

### Q6: Are the Swiss Mau-Mau rules correctly implemented?
**Answer:** Mostly, with some edge cases missing.

**Correctly Implemented:**
- ✅ 7-chain penalty accumulation
- ✅ 8 skips next player
- ✅ Jack suit wish
- ✅ Jack on Jack forbidden
- ✅ Ace play again (can't be last card)
- ✅ 10 replicates card below
- ✅ Mau/MauMau announcements
- ✅ Queen Round concept

**Missing or Buggy:**
- ❌ Queen Round escape (no way out if stuck)
- ❌ 9-base chain effect timing
- ⚠️ 10 on Jack should be caught earlier
- ⚠️ Penalty card pickup timing nuances

---

## Appendix: setTimeout Call Map

| Location | Delay | Purpose | Risk |
|----------|-------|---------|------|
| `playCard()` line 485 | 1000ms | AI plays again after Ace | May overlap |
| `playCard()` line 608-623 | 500ms | AI chooses suit after Jack | Race with aiPlay |
| `pickupPenaltyCards()` line 283 | 1000ms | Next turn after pickup | May skip wrong |
| `aiPlay()` line 1000 | 300ms | Say Mau | Low risk |
| `aiPlay()` line 1005 | 300ms | Say MauMau | Low risk |
| `aiPlay()` line 1015 | 400ms | Announce Queen Round | Chains to 400ms |
| `aiPlay()` line 1020 | 400ms | End Queen Round | Low risk |
| `aiPlay()` line 1031 | 600ms | Play escape 7 | Overlaps? |
| `aiPlay()` line 1037 | 600ms | Play escape 10 | Overlaps? |
| `aiPlay()` line 1042 | 600ms | AI draw cards | Sequential |
| `aiPlay()` line 1070 | 600ms | Play Jack | Chains to 400ms |
| `aiPlay()` line 1087 | 600ms | Play normal card | Standard |
| `aiPlay()` line 1092 | 600ms | AI draw (no playable) | Standard |
| `aiDrawCards()` line 1112 | 300ms | Draw next card | Sequential loop |
| `aiDrawCards()` line 1119 | 500ms | End turn after drawing | Terminal |
| `nextTurn()` line 962 | 1000ms | Trigger AI play | Entry point |

**Total:** 15+ setTimeout calls with 6 different delay values.

---

## Summary

The codebase has a solid foundation with good use of Angular signals and a promising Rule Engine pattern. However, the monolithic `GameService` and scattered async logic create maintainability and correctness issues.

**Immediate Actions (This Week):**
1. Fix Queen Round escape mechanism
2. Add AI turn guards
3. Fix 9-base double effect

**Short Term (This Month):**
1. Use RuleEngine consistently
2. Extract AIService
3. Add explicit turn state machine

**Long Term:**
1. Complete Rule classes
2. Consider RxJS for timing
3. Comprehensive test coverage

The refactoring approach should be **incremental** - each change should be tested before the next. The current bugs are fixable without major rewrites.

---

*End of Analysis Report*
