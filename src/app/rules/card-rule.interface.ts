import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';

export interface CardRule {
  /**
   * Determines if this rule is applicable to the card being played.
   * @param card The card being played.
   * @param topCard The card on top of the discard pile.
   * @returns True if the rule applies, false otherwise.
   */
  isApplicable(card: Card, topCard: Card | null): boolean;

  /**
   * Applies the effect of the card rule to the game state.
   * @param state The current game state.
   * @param card The card that was played.
   * @returns The new, modified game state.
   */
  applyEffect(state: GameState, card: Card): GameState;

  /**
   * Determines if a card can be played according to this rule.
   * This is for validation before playing.
   * @param card The card to be played.
   * @param state The current game state.
   * @returns True if the card can be played, false otherwise.
   */
  canPlay(card: Card, state: GameState): boolean;
}
