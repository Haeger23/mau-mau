import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { CardRule } from './card-rule.interface';

/**
 * Schweizer Mau-Mau: 9er-Basis
 * When a 9 is played, the player can continue playing more cards of the same suit
 * in sequence. The effects of all cards are applied at the end of the turn.
 */
export class NineRule implements CardRule {
  isApplicable(card: Card): boolean {
    return card.rank === '9';
  }

  applyEffect(state: GameState, card: Card): GameState {
    const newState = { ...state };
    const currentPlayer = newState.players[newState.currentPlayerIndex];
    
    // Start 9-base chain - player can continue playing same-suit cards
    newState.nineBaseActive = true;
    newState.nineBaseSuit = card.suit;
    newState.nineBasePlayerId = currentPlayer.id;
    
    // Any suit wish from a Jack is cancelled when a 9 is played
    newState.chosenSuit = null;
    
    return newState;
  }

  canPlay(_card: Card, _state: GameState): boolean {
    // A 9 can be played following normal rules.
    // It starts a 9-base chain where the player can play more same-suit cards.
    return true;
  }
}
