import { Injectable, inject } from '@angular/core';
import { Card, Suit } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { SeededRandom } from '../../utils/seeded-random';
import { AI_TIMING } from '../constants/timing.constants';

/**
 * AI Service - Handles all AI player decision-making and turn execution
 * 
 * Extracted from GameService to:
 * - Enable isolated testing of AI logic
 * - Support future difficulty levels
 * - Clear separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class AIService {
  private rng = new SeededRandom();
  private aiTurnInProgress = false;

  // Callbacks to GameService methods (set via init)
  private gameActions!: AIGameActions;

  /**
   * Sets seed for deterministic AI behavior (useful for testing)
   */
  setSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Initialize AI with game action callbacks
   * This avoids circular dependency between AIService and GameService
   */
  init(actions: AIGameActions): void {
    this.gameActions = actions;
  }

  /**
   * Reset the AI turn guard (call when starting new game)
   */
  resetGuard(): void {
    this.aiTurnInProgress = false;
  }

  /**
   * Check if AI turn is currently in progress
   */
  isInProgress(): boolean {
    return this.aiTurnInProgress;
  }

  /**
   * Main AI turn execution
   * Called when it's an AI player's turn
   */
  playTurn(state: GameState): void {
    // Guard: Prevent simultaneous AI turns
    if (this.aiTurnInProgress) {
      return;
    }
    this.aiTurnInProgress = true;

    if (state.gameOver) {
      this.aiTurnInProgress = false;
      return;
    }

    // Guard: Wait for suit choice after Jack
    if (state.awaitingSuitChoice) {
      this.aiTurnInProgress = false;
      return;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];

    // Safety check: Only if current player is AI
    if (currentPlayer.isHuman) {
      this.aiTurnInProgress = false;
      return;
    }

    // ========== STEP 1: Pickup penalty cards ==========
    if (currentPlayer.penaltyCards.length > 0) {
      setTimeout(() => this.gameActions.pickupPenaltyCards(currentPlayer.id), AI_TIMING.PENALTY_PICKUP_DELAY);
      return;
    }

    // ========== STEP 2: Check announcements ==========
    this.checkAnnouncements(currentPlayer, state);

    // ========== STEP 3: Handle draw penalty (7er-Strafe) ==========
    if (state.drawPenalty > 0) {
      this.handleDrawPenalty(currentPlayer, state);
      return;
    }

    // ========== STEP 4: Queen Round escape ==========
    if (state.queenRoundActive) {
      const hasQueenOrTen = currentPlayer.hand.some(c => c.rank === 'Q' || c.rank === '10');
      if (!hasQueenOrTen) {
        setTimeout(() => this.drawCards(state), AI_TIMING.ACTION_DELAY);
        return;
      }
    }

    // ========== STEP 5: Find and play card ==========
    const playableCards = currentPlayer.hand.filter(card => this.gameActions.canPlayCard(card));

    if (playableCards.length > 0) {
      this.playBestCard(playableCards, currentPlayer, state);
    } else {
      // No playable card - draw
      setTimeout(() => this.drawCards(state), AI_TIMING.ACTION_DELAY);
    }
  }

  /**
   * Check and execute announcements (Mau, Mau-Mau, Queen Round)
   */
  private checkAnnouncements(player: Player, state: GameState): void {
    // Check "Mau" (80% chance with 1 card)
    if (player.hand.length === 1 && !player.hasSaidMau && this.rng.next() < 0.8) {
      setTimeout(() => this.gameActions.sayMau(), AI_TIMING.ANNOUNCEMENT_DELAY);
    }

    // Check "Mau-Mau" (90% chance) only when hand is empty and last card was Jack
    const lastCard = state.discardPile[state.discardPile.length - 1];
    if (player.hand.length === 0 && lastCard?.rank === 'J' && !player.hasSaidMauMau && this.rng.next() < 0.9) {
      setTimeout(() => this.gameActions.sayMauMau(), AI_TIMING.ANNOUNCEMENT_DELAY);
    }

    // Check Queen Round announcement (50% chance with 2+ Queens)
    const queenCount = player.hand.filter(c => c.rank === 'Q').length;
    if (queenCount >= 2 && !state.queenRoundActive && state.drawPenalty === 0 && this.rng.next() < 0.5) {
      setTimeout(() => {
        this.gameActions.announceQueenRound();
        // After announcement, re-evaluate what to play
        setTimeout(() => this.gameActions.triggerAIPlay(), AI_TIMING.QUEEN_ROUND_DELAY);
      }, AI_TIMING.QUEEN_ROUND_DELAY);
      return;
    }

    // Check Queen Round end (if starter and last card was Queen)
    if (state.queenRoundActive && player.isQueenRoundStarter) {
      const lastWasQueen = lastCard?.rank === 'Q';
      if (lastWasQueen && this.rng.next() < 0.8) {
        setTimeout(() => this.gameActions.endQueenRound(), AI_TIMING.QUEEN_ROUND_DELAY);
      }
    }
  }

  /**
   * Handle 7er penalty - try to escape or draw
   */
  private handleDrawPenalty(player: Player, state: GameState): void {
    // Prefer 7, then 10 (10 might replicate Jack which is forbidden)
    const seven = player.hand.find(c => c.rank === '7');
    const ten = player.hand.find(c => c.rank === '10');

    if (seven) {
      setTimeout(() => this.gameActions.playCard(seven), AI_TIMING.ACTION_DELAY);
    } else if (ten) {
      setTimeout(() => this.gameActions.playCard(ten), AI_TIMING.ACTION_DELAY);
    } else {
      // No escape card - must draw penalty
      setTimeout(() => this.drawCards(state), AI_TIMING.ACTION_DELAY);
    }
  }

  /**
   * Choose and play the best card from playable options
   */
  private playBestCard(playableCards: Card[], player: Player, state: GameState): void {
    let cardToPlay = playableCards[0];

    // Queen Round strategy: prefer 10 (60% chance) to extend round
    if (state.queenRoundActive) {
      const queens = playableCards.filter(c => c.rank === 'Q');
      const tens = playableCards.filter(c => c.rank === '10');

      if (tens.length > 0 && this.rng.next() < 0.6) {
        cardToPlay = tens[0];
      } else if (queens.length > 0) {
        cardToPlay = queens[0];
      }
    }

    // Swiss Ace rule: Cannot play Ace as last card
    if (cardToPlay.rank === 'A' && player.hand.length === 1) {
      setTimeout(() => this.drawCards(state), AI_TIMING.ACTION_DELAY);
      return;
    }

    // Jack with suit choice
    if (cardToPlay.rank === 'J') {
      this.playJackWithSuitChoice(cardToPlay, player);
    } else {
      setTimeout(() => this.gameActions.playCard(cardToPlay), AI_TIMING.ACTION_DELAY);
    }
  }

  /**
   * Play Jack and choose optimal suit
   */
  private playJackWithSuitChoice(jack: Card, player: Player): void {
    const playerId = player.id;
    
    setTimeout(() => {
      this.gameActions.playCard(jack);

      // Choose suit based on remaining cards
      setTimeout(() => {
        const currentState = this.gameActions.getState();
        if (currentState.gameOver) return;

        const currentPlayer = currentState.players.find(p => p.id === playerId);
        if (!currentPlayer) {
          this.gameActions.chooseSuit('hearts');
          return;
        }

        const chosenSuit = this.chooseBestSuit(currentPlayer.hand);
        this.gameActions.chooseSuit(chosenSuit);
      }, AI_TIMING.SUIT_CHOICE_DELAY);
    }, AI_TIMING.ACTION_DELAY);
  }

  /**
   * Choose the suit that appears most often in hand
   */
  private chooseBestSuit(hand: Card[]): Suit {
    const suitCounts = this.countSuits(hand);
    const entries = Object.entries(suitCounts);
    
    if (entries.length === 0) {
      return 'hearts';
    }
    
    return entries.sort((a, b) => b[1] - a[1])[0][0] as Suit;
  }

  /**
   * Count cards per suit
   */
  private countSuits(cards: Card[]): Record<Suit, number> {
    return cards.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {} as Record<Suit, number>);
  }

  /**
   * Draw cards (for penalty or normal draw)
   */
  private drawCards(state: GameState): void {
    const requiredCount = state.drawPenalty > 0 ? state.drawPenalty : 1;
    const wasDrawPenalty = state.drawPenalty > 0;

    const drawNext = (count: number) => {
      if (count > 0) {
        this.gameActions.drawCard();
        setTimeout(() => drawNext(count - 1), AI_TIMING.DRAW_CARD_DELAY);
      } else {
        // All cards drawn
        if (wasDrawPenalty) {
          this.gameActions.resetDrawPenalty();
        }
        setTimeout(() => this.gameActions.endTurn(), AI_TIMING.END_TURN_DELAY);
      }
    };

    drawNext(requiredCount);
  }
}

/**
 * Interface for game actions that AI needs to call
 * Implemented by GameService
 */
export interface AIGameActions {
  getState(): GameState;
  playCard(card: Card): void;
  drawCard(): void;
  endTurn(): void;
  chooseSuit(suit: Suit): void;
  sayMau(): void;
  sayMauMau(): void;
  announceQueenRound(): void;
  endQueenRound(): void;
  pickupPenaltyCards(playerId: string): void;
  canPlayCard(card: Card): boolean;
  triggerAIPlay(): void;
  resetDrawPenalty(): void;
}
