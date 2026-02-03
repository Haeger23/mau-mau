import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

/**
 * Schweizer Mau-Mau: Damenrunde
 * Queens have no special effect on their own, but they are the only cards
 * (along with 10s) that can be played during an active Queen Round.
 */
export class QueenRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === 'Q';
  }

  applyEffect(state: GameState, card: Card): GameState {
    // Queens have no automatic effect.
    // The Queen Round is started/ended via announcements, not by playing a Queen.
    // When a Queen is played during a Queen Round, the player joins the round.
    // Any suit wish from a Jack is cancelled when a Queen is played.
    const newState = { ...state };
    newState.chosenSuit = null;
    return newState;
  }

  canPlay(card: Card, state: GameState): boolean {
    // Queens can always be played during a Queen Round.
    // During normal play, default matching rules apply.
    if (state.queenRoundActive) {
      return true;
    }
    // Default rules will handle suit/rank matching
    return true;
  }
}
