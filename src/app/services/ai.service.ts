import { Injectable } from '@angular/core';
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
    const currentPlayer = state.players[state.currentPlayerIndex];

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

    // Safety check: Only if current player is AI
    if (currentPlayer.isHuman) {
      this.aiTurnInProgress = false;
      return;
    }

    // ========== STEP 1: Pickup penalty cards ==========
    // Only pick up cards that are pickupable (not locked)
    if (currentPlayer.pickupablePenaltyCards.length > 0) {
      setTimeout(() => {
        this.aiTurnInProgress = false; // Reset before action that may trigger next turn
        this.gameActions.pickupPenaltyCards(currentPlayer.id);
      }, AI_TIMING.PENALTY_PICKUP_DELAY);
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
        // Draw ONE card - drawCard() handles the turn ending automatically for AI
        // Don't call endTurn() here because drawCard() already does nextTurn() for AI
        setTimeout(() => {
          this.aiTurnInProgress = false; // Reset before action
          this.gameActions.drawCard();
          // After drawing, AI needs to end turn or play if possible
          // This is handled by drawCards() method, but Queen escape uses single drawCard
          // So we need to explicitly handle the flow:
          const newState = this.gameActions.getState();
          const player = newState.players[newState.currentPlayerIndex];
          const playable = player.hand.filter(c => this.gameActions.canPlayCard(c));
          if (playable.length > 0) {
            setTimeout(() => this.gameActions.triggerAIPlay(), AI_TIMING.TURN_DELAY);
          } else {
            setTimeout(() => this.gameActions.endTurn(), AI_TIMING.END_TURN_DELAY);
          }
        }, AI_TIMING.ACTION_DELAY);
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
   * Check and execute announcements (Mau-Mau, Queen Round)
   * Note: Mau is checked after playing a card in playBestCard()
   */
  private checkAnnouncements(player: Player, state: GameState): void {
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
        // IMPORTANT: Reset guard before re-triggering AI
        this.aiTurnInProgress = false;
        setTimeout(() => this.gameActions.triggerAIPlay(), AI_TIMING.QUEEN_ROUND_DELAY);
      }, AI_TIMING.QUEEN_ROUND_DELAY);
      return;
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
      setTimeout(() => {
        this.aiTurnInProgress = false; // Reset before playCard
        this.gameActions.playCard(seven);
      }, AI_TIMING.ACTION_DELAY);
    } else if (ten) {
      setTimeout(() => {
        this.aiTurnInProgress = false; // Reset before playCard
        this.gameActions.playCard(ten);
      }, AI_TIMING.ACTION_DELAY);
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

    // Queen Round strategy
    if (state.queenRoundActive) {
      const queens = playableCards.filter(c => c.rank === 'Q');
      const tens = playableCards.filter(c => c.rank === '10');

      // If first card of queen round MUST be a Queen, enforce it
      if (state.queenRoundNeedsFirstQueen && player.isQueenRoundStarter) {
        if (queens.length > 0) {
          cardToPlay = queens[0];
        } else {
          // No Queen available — should not happen (announceQueenRound validates this)
          // Fall back to default card
        }
      } else if (tens.length > 0 && this.rng.next() < 0.6) {
        // Prefer 10 (60% chance) to extend round
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
      const playerId = player.id;
      const wasQueenRoundStarter = state.queenRoundActive && player.isQueenRoundStarter;
      const playedQueen = cardToPlay.rank === 'Q';
      setTimeout(() => {
        // Reset guard BEFORE playCard, because playCard->endTurn will trigger next AI
        this.aiTurnInProgress = false;
        this.gameActions.playCard(cardToPlay);
        // Check Mau AFTER playing card (if hand reduced to 1)
        this.checkMauAfterPlay(playerId);
        // Check Queen Round end AFTER playing a Queen as starter
        if (wasQueenRoundStarter && playedQueen) {
          const postState = this.gameActions.getState();
          const postPlayer = postState.players.find(p => p.id === playerId);
          const remainingQueens = postPlayer?.hand.filter(c => c.rank === 'Q').length ?? 0;
          // End if no queens left (always) or probabilistically with 50% chance
          if (remainingQueens === 0 || this.rng.next() < 0.5) {
            setTimeout(() => this.gameActions.endQueenRound(), AI_TIMING.QUEEN_ROUND_DELAY);
          }
        }
      }, AI_TIMING.ACTION_DELAY);
    }
  }

  /**
   * Check and say Mau after playing a card (if hand has 1 card left)
   */
  private checkMauAfterPlay(playerId: string): void {
    const currentState = this.gameActions.getState();
    const player = currentState.players.find(p => p.id === playerId);
    if (player && player.hand.length === 1 && !player.hasSaidMau && this.rng.next() < 0.8) {
      // IMPORTANT: Don't call sayMau() because it uses currentPlayer (which might have changed after nextTurn)
      // Instead, directly call sayMauForPlayer with the specific player ID
      setTimeout(() => this.gameActions.sayMauForPlayer(playerId), AI_TIMING.ANNOUNCEMENT_DELAY);
    }
  }

  /**
   * Play Jack and choose optimal suit
   */
  private playJackWithSuitChoice(jack: Card, player: Player): void {
    const playerId = player.id;
    
    setTimeout(() => {
      // Reset guard BEFORE playCard
      this.aiTurnInProgress = false;
      this.gameActions.playCard(jack);
      
      // Check Mau AFTER playing Jack (if hand reduced to 1)
      this.checkMauAfterPlay(playerId);

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
    // Save activeAce state BEFORE drawing (it gets reset by drawCard)
    const wasActiveAce = state.activeAce;

    const drawNext = (count: number) => {
      if (count > 0) {
        this.gameActions.drawCard();
        setTimeout(() => drawNext(count - 1), AI_TIMING.DRAW_CARD_DELAY);
      } else {
        // All cards drawn
        if (wasDrawPenalty) {
          this.gameActions.resetDrawPenalty();
        }
        
        // If Ace was active, AI gets another turn instead of ending
        if (wasActiveAce) {
          this.aiTurnInProgress = false;
          setTimeout(() => this.gameActions.triggerAIPlay(), AI_TIMING.TURN_DELAY);
          return;
        }
        
        // After drawing, check if AI can now play a card
        const currentState = this.gameActions.getState();
        const currentPlayer = currentState.players[currentState.currentPlayerIndex];
        const playableCards = currentPlayer.hand.filter(card => this.gameActions.canPlayCard(card));
        
        if (playableCards.length > 0) {
          // AI can play a card after drawing - trigger another turn
          this.aiTurnInProgress = false;
          setTimeout(() => this.gameActions.triggerAIPlay(), AI_TIMING.TURN_DELAY);
        } else {
          // No playable card - end turn
          setTimeout(() => this.gameActions.endTurn(), AI_TIMING.END_TURN_DELAY);
        }
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
  sayMauForPlayer(playerId: string): void;
  sayMauMau(): void;
  announceQueenRound(): void;
  endQueenRound(): void;
  pickupPenaltyCards(playerId: string): void;
  canPlayCard(card: Card): boolean;
  triggerAIPlay(): void;
  resetDrawPenalty(): void;
}
