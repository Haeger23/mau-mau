import { Card, Suit } from './card.model';
import { Player } from './player.model';

/**
 * Explicit turn phase state machine.
 * Replaces ambiguous string-based lastPlayerAction with typed phases.
 */
export type TurnPhase = 
  | 'WAITING_FOR_ACTION'      // Turn started, player can play or draw
  | 'CARD_PLAYED'             // Card played, may need suit choice or can end
  | 'AWAITING_SUIT_CHOICE'    // Jack played, must choose suit
  | 'SUIT_CHOSEN'             // Suit chosen, can end turn
  | 'DRAWING'                 // Drawing cards (penalty or normal)
  | 'DRAW_COMPLETE'           // Drawing done, can play or end
  | 'TURN_ENDING';            // Processing turn end

export interface ChatMessage {
  timestamp: Date;
  playerName: string;
  message: string;
  type: 'play' | 'draw' | 'suit' | 'skip' | 'penalty' | 'win' | 'mau' | 'mau-mau' | 'queen-round' | 'queen-round-end' | 'penalty-early' | 'penalty-wrong-count' | 'penalty-mau-missed' | 'penalty-mau-false' | 'penalty-maumau-missed' | 'penalty-maumau-false' | 'penalty-queen-missed' | 'penalty-queen-false' | 'penalty-queen-end-false';
  ruleExplanation?: string;
  showExplanation?: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  drawPenalty: number; // For accumulating 7s
  skipNext: boolean; // For 8s
  activeAce: boolean; // For Ace requirement
  chosenSuit: Suit | null; // For Jack suit selection
  gameOver: boolean;
  winner: Player | null;
  lastPlayedCard: Card | null;
  chatLog: ChatMessage[];
  // Turn phase state machine
  turnPhase: TurnPhase;
  // Schweizer Mau-Mau: Zug-Status (deprecated - use turnPhase)
  lastPlayerAction: 'play' | 'draw-complete' | 'awaiting-draw' | 'penalty-pickup' | null;
  // Schweizer Mau-Mau: Damenrunde
  queenRoundActive: boolean;
  queenRoundStarterId: string | null;
  queenRoundNeedsFirstQueen: boolean; // Nach Ankündigung: erste Karte MUSS Dame sein
  queenRoundEndedThisTurn: boolean; // Ob endQueenRound() in diesem Zug aufgerufen wurde
  // 9er-Basis: sequentielles Ablegen gleicher Farbe in einem Zug
  nineBaseActive: boolean;
  nineBaseSuit: Suit | null;
  nineBasePlayerId: string | null;
  // Bube: Warte auf Farbwahl
  awaitingSuitChoice: boolean;
}

export type GameAction = 
  | { type: 'PLAY_CARD'; card: Card; additionalCard?: Card }
  | { type: 'DRAW_CARD' }
  | { type: 'CHOOSE_SUIT'; suit: Suit }
  | { type: 'SAY_MAU' }
  | { type: 'NEXT_TURN' };
