import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

export class EightRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === '8';
  }

  applyEffect(state: GameState, card: Card): GameState {
    const newState = { ...state };
    newState.skipNext = true;
    // When an 8 is played, any suit wish from a Jack is cancelled.
    newState.chosenSuit = null;
    return newState;
  }

  canPlay(card: Card, state: GameState): boolean {
    // Standard play rules apply.
    return true;
  }
}
