import { Card, Suit } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

export class DefaultRule implements CardRule {
  isApplicable(card: Card): boolean {
    // This rule is always applicable as a fallback.
    return true;
  }

  applyEffect(state: GameState, card: Card): GameState {
    const newState = { ...state };
    // The default action is to clear any chosen suit from a previous Jack.
    newState.chosenSuit = null;
    return newState;
  }

  canPlay(card: Card, state: GameState): boolean {
    const topCard = state.discardPile[state.discardPile.length - 1];
    if (!topCard) {
      // This should not happen in a real game, but for safety.
      return true;
    }

    // If a suit was chosen from a Jack, the card must match that suit.
    if (state.chosenSuit) {
      return card.suit === state.chosenSuit;
    }

    // Standard rule: rank or suit must match.
    return card.rank === topCard.rank || card.suit === topCard.suit;
  }
}
