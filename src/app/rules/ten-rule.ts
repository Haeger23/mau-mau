import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

/**
 * Schweizer Mau-Mau: 10er-Replikator
 * A 10 copies the effect of the card below it in the discard pile.
 * Exception: A 10 cannot copy a Jack (Bube).
 * 
 * Note: The actual replication logic is handled in GameService.applyCardEffect()
 * because it requires recursive rule application. This rule class handles
 * the basic validation and marks the state for replication.
 */
export class TenRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === '10';
  }

  applyEffect(state: GameState, card: Card): GameState {
    // The actual 10-replication effect is handled in GameService.applyCardEffect()
    // because it needs to recursively apply the effect of the card below.
    // This rule just resets the suit choice if any.
    const newState = { ...state };
    newState.chosenSuit = null;
    return newState;
  }

  canPlay(card: Card, state: GameState): boolean {
    const topCard = state.discardPile[state.discardPile.length - 1];
    
    // Cannot play a 10 to replicate a Jack - that's forbidden
    if (topCard?.rank === 'J') {
      return false;
    }
    
    // 10s can be played during Queen Round (they replicate Queen effect)
    if (state.queenRoundActive) {
      return true;
    }
    
    // Otherwise, normal matching rules apply
    return true;
  }
}
