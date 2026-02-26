import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

export class SevenRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === '7';
  }

  applyEffect(state: GameState, card: Card): GameState {
    const newState = { ...state };
    newState.drawPenalty += 2;
    // When a 7 is played, any suit wish from a Jack is cancelled.
    newState.chosenSuit = null;
    return newState;
  }

  canPlay(card: Card, state: GameState): boolean {
    // A 7 can always be played on another 7 to pass on the penalty.
    // It can also be played if there is a draw penalty active (to pass it on).
    // Otherwise, default rules apply. This check is better handled in a central engine.
    // For now, we assume if it's a 7, it's a candidate for play.
    return true;
  }
}
