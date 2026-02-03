import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

export class AceRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === 'A';
  }

  applyEffect(state: GameState, card: Card): GameState {
    const newState = { ...state };
    newState.activeAce = true; // This flag will be used by the turn logic to skip the next player
    return newState;
  }

  canPlay(card: Card, state: GameState): boolean {
    const currentPlayer = state.players[state.currentPlayerIndex];
    // An Ace cannot be played as the last card in hand.
    if (currentPlayer.hand.length === 1) {
      return false;
    }
    // Otherwise, standard play rules apply, which will be handled by a default rule.
    // This specific rule doesn't need to check for suit/rank match here.
    return true;
  }
}
