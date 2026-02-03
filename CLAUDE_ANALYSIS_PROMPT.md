# Deep Code Analysis Prompt for Claude Opus 4.5

## Context
This is a Swiss Mau-Mau card game implementation built with Angular 21. The game implements the official Swiss Mau-Mau rules (Schweizer Regeln) from mau-mau.ch, which include complex special card interactions and penalty systems.

## Your Mission
Conduct a comprehensive analysis of the codebase with focus on:
1. **Code comprehensibility and maintainability** for human developers
2. **Identification and fixing of gameplay logic bugs**
3. **Application of established coding patterns and best practices**
4. **Ensuring consistent, predictable game behavior**

## Key Areas to Analyze

### 1. Game Logic Architecture (`src/app/services/game.service.ts`)
**Current State:**
- Recently refactored to use Rule Engine pattern
- ~1,500 lines of complex game state management
- Mixes synchronous state updates with asynchronous AI behavior (setTimeout)
- Complex turn flow with multiple exit points

**Questions to Answer:**
- Is the current architecture maintainable for a team of developers?
- Are the responsibilities clearly separated (game state, rules, AI, UI)?
- Could the asynchronous AI logic cause race conditions or stuck states?
- Is the state mutation pattern (signals with spreading) consistently applied?
- Are there hidden dependencies or implicit state requirements?

**Look for:**
- Unclear or misleading function names
- Functions that do too many things (violation of Single Responsibility)
- State mutations that happen in unexpected places
- Missing error handling or edge case coverage
- Inconsistent patterns (e.g., sometimes checking gameOver, sometimes not)

### 2. Rule Engine Implementation (`src/app/services/rule-engine.service.ts`, `src/app/rules/`)
**Current State:**
- New Rule Engine pattern with individual card rule classes
- RuleEngine centralizes card validation via `isCardPlayable()`
- Individual rule classes: Ace, Seven, Eight, Jack, Default
- **Missing:** Queen, Nine (9-base), Ten (10-replicator) rules

**Questions to Answer:**
- Does the Rule Engine pattern improve or complicate the codebase?
- Is the separation between validation (`canPlay`) and effects (`applyEffect`) clear?
- Should complex multi-card interactions (Queen rounds, 9-base chains) be in the Rule Engine?
- Are the rule classes testable in isolation?
- Is there a clear contract/interface that all rules follow?

**Look for:**
- Inconsistent implementation patterns across rule classes
- Rules that depend on other rules (circular dependencies)
- Complex game state that rules shouldn't need to know about
- Duplicate logic between RuleEngine and game.service

### 3. AI Behavior (`aiPlay()`, `aiDrawCards()` methods)
**Current Issues:**
- AI uses setTimeout for delays, creating async complexity
- Multiple return points without ensuring game continues
- Recently fixed: penalty card pickup, queen round timing, jack suit selection
- Still prone to getting stuck in certain game states

**Questions to Answer:**
- Should AI behavior be separated into its own service?
- Is the current timeout-based approach the right pattern?
- Are there any scenarios where the AI could get stuck in an infinite loop?
- Does the AI properly handle all game states (penalties, special rounds, etc.)?
- Is AI decision-making logic testable?

**Look for:**
- Missing `return` statements that let execution continue
- Race conditions between `aiPlay()` calls
- State checks that might fail in unexpected ways
- Unclear control flow (hard to trace what happens next)

### 4. State Management Pattern
**Current State:**
- Uses Angular signals for reactive state
- State mutations via `this.gameState.set({ ...state })`
- Complex nested state object (GameState)
- Some methods mutate then set, others create new objects

**Questions to Answer:**
- Is the state mutation pattern consistently applied?
- Are there any places where state is mutated without calling `set()`?
- Should we use `update()` instead of `set()` in some places?
- Is the state shape optimal, or could it be flattened/simplified?
- Are there derived states that should be `computed()` instead of stored?

**Look for:**
- Direct mutations of state properties
- Unnecessary state spreading (copying large objects)
- State that could be derived from other state
- Inconsistent state update patterns

### 5. Turn Flow and Game Phases
**Current Issues:**
- Complex turn flow with multiple phases: play card → choose suit → end turn → next turn → AI play
- Special handling for: Ace (play again), penalties, queen rounds, 9-base chains
- Multiple ways a turn can end
- Unclear when `endTurn()` vs `nextTurn()` should be called

**Questions to Answer:**
- Can the turn flow be represented as a clear state machine?
- Is it obvious when a player's turn is complete?
- Should turn phases be explicitly modeled in the state?
- Are there edge cases where the turn flow gets confused?

**Look for:**
- Places where turn flow is duplicated or inconsistent
- Missing transition guards (e.g., checking if action is valid in current phase)
- Unclear ownership (who is responsible for advancing the turn?)
- Potential for infinite loops or stuck states

### 6. Error Handling and Edge Cases
**Known Issues:**
- E2E tests reveal games can get stuck
- AI sometimes stops playing
- Rare race conditions in async operations
- Edge cases in penalty card system

**Questions to Answer:**
- Is there comprehensive error handling for invalid game states?
- What happens if the deck runs out of cards?
- What if AI tries to play a card that's no longer valid?
- Are all rule violations properly caught and penalized?

**Look for:**
- Missing null checks or undefined handling
- Assumptions about array lengths or state properties
- Silent failures (operations that fail without logging)
- Unhandled promise rejections or timeout errors

### 7. Code Readability and Documentation
**Questions to Answer:**
- Can a new developer understand the Swiss Mau-Mau rules from reading the code?
- Are the rule explanations (RULE_EXPLANATIONS) sufficient?
- Is the relationship between UI actions and game logic clear?
- Are function names self-documenting?

**Look for:**
- Magic numbers or strings without explanation
- Complex conditional logic without comments
- Abbreviations that aren't obvious (e.g., `queenRoundNeedsFirstQueen`)
- Missing JSDoc for complex functions
- German comments mixed with English code

## Specific Bugs to Investigate

### Known Issues:
1. **AI gets stuck** - Sometimes AI stops playing, game freezes (especially with penalties)
2. **7-escape tests timeout** - Tests waiting for 7-escape scenario never complete
3. **Autonomous validator fails** - Game completes but validation times out
4. **Penalty card timing** - Complex rules around when penalties can be picked up
5. **Queen round edge cases** - Starting/ending queen rounds has special timing rules
6. **9-base chain** - Complex multi-card playing with same suit, effect delayed until turn end
7. **10-replicator** - 10 copies the card below it, can cause "Jack on Jack" violation

### Reproduce and Fix:
- Start a game and observe AI behavior with penalties
- Check if all AI decision paths lead to game continuation
- Verify queen round start/end logic with multiple players
- Test 10-replicator on various card types (especially Jack)
- Ensure 9-base chain properly applies effects at turn end

## Deliverables

Please provide:

### 1. Architecture Assessment
- Overall code health score (1-10)
- Main architectural strengths
- Main architectural weaknesses
- Recommended refactoring approach (big-bang vs incremental)

### 2. Bug Analysis Report
- List all identified bugs with severity (Critical/Major/Minor)
- Root cause analysis for each bug
- Reproduction steps where applicable
- Recommended fix approach

### 3. Code Quality Improvements
- List of specific code smells found
- Violations of SOLID principles
- Missing or inappropriate design patterns
- Readability issues that should be addressed

### 4. Refactoring Recommendations
Prioritized list of refactorings:
- **High Priority**: Fixes critical bugs or major maintainability issues
- **Medium Priority**: Improves code quality significantly
- **Low Priority**: Nice-to-haves for polish

For each recommendation:
- What to change and why
- Expected impact (risk vs benefit)
- Estimated effort (small/medium/large)
- Dependencies (what needs to be done first)

### 5. Implementation Plan
Step-by-step plan to improve the codebase:
1. Critical bug fixes (no refactoring)
2. Safe refactorings that improve structure
3. Pattern applications and consistency improvements
4. Performance and optimization

## Analysis Approach

### Start Here:
1. Read `AGENTS.md` and `.github/copilot-instructions.md` for coding standards
2. Read `src/app/services/game.service.ts` completely - understand the full game flow
3. Read `src/app/models/*.ts` - understand the data structures
4. Read `src/app/services/rule-engine.service.ts` and `src/app/rules/*.ts`
5. Trace a complete game turn from player action → state update → AI response → next turn

### Then Investigate:
- Identify all state mutation points
- Map out all possible turn flow paths
- Find all setTimeout() calls and analyze their timing
- Check for consistent error handling patterns
- Look for code duplication and opportunities for extraction

### Finally Synthesize:
- What makes this code hard to understand?
- What patterns would make it clearer?
- What's the minimal set of changes to fix the bugs?
- What's the ideal end state for this codebase?

## Key Questions to Answer

1. **Is the Rule Engine pattern helping or hurting?** Should we continue down this path or revert?
2. **Should we separate AI into its own service?** Or keep it in game.service?
3. **Is setTimeout the right approach for AI delays?** Or should we use RxJS observables?
4. **Should turn phases be explicit state?** Or remain implicit in the control flow?
5. **What's causing the AI to get stuck?** Is it a logic bug or a timing issue?
6. **Are the Swiss Mau-Mau rules correctly implemented?** Do they match mau-mau.ch specifications?

## Success Criteria

Your analysis is successful if:
- ✅ A developer can read your report and understand the codebase architecture
- ✅ All identified bugs have clear reproduction steps and fix approaches
- ✅ Refactoring recommendations are specific and actionable
- ✅ The implementation plan is realistic and sequenced correctly
- ✅ Trade-offs between different approaches are clearly explained
- ✅ Code examples demonstrate better patterns where appropriate

## Additional Context

### Technology Stack:
- Angular 21 (standalone components, signals)
- TypeScript with strict type checking
- Vitest for unit tests
- Playwright for E2E tests

### Project Goals:
- Educational: Demonstrate Swiss Mau-Mau rules
- Fun: Enjoyable to play against AI
- Maintainable: Easy for others to contribute
- Correct: Rules must match official Swiss specification

### Constraints:
- Must maintain current UI/UX
- Cannot break existing passing tests
- Must work with current Angular 21 features
- Should stay performant (no noticeable lag)

---

## Ready to Begin?

Please start by reading the codebase and providing your comprehensive analysis following the structure above. Focus on clarity, actionability, and helping the development team make informed decisions about improving this codebase.
