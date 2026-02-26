import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

export class JackRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === 'J';
  }

  applyEffect(state: GameState, card: Card): GameState {
    const newState = { ...state };
    // The logic for choosing a suit is handled in the UI and passed to the service.
    // The service will set `chosenSuit`. This rule just marks that a choice is needed.
    // For now, we just clear any existing choice.
    newState.chosenSuit = null;
    return newState;
  }

  canPlay(card: Card, state: GameState): boolean {
    const topCard = state.discardPile[state.discardPile.length - 1];
    // Jack on Jack is not allowed.
    if (topCard && topCard.rank === 'J') {
      return false;
    }
    // A Jack cannot be played to escape a 7-chain penalty.
    if (state.drawPenalty > 0) {
      return false;
    }
    return true;
  }
}
