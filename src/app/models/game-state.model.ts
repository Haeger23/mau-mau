import { Card, Suit } from './card.model';
import { Player } from './player.model';

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
  // Schweizer Mau-Mau: Zug-Status
  lastPlayerAction: 'play' | 'draw-complete' | 'awaiting-draw' | 'penalty-pickup' | null;
  // Schweizer Mau-Mau: Damenrunde
  queenRoundActive: boolean;
  queenRoundStarterId: string | null;
  queenRoundNeedsFirstQueen: boolean; // Nach Ankündigung: erste Karte MUSS Dame sein
  // 9er-Basis: sequentielles Ablegen gleicher Farbe in einem Zug
  nineBaseActive: boolean;
  nineBaseSuit: Suit | null;
  nineBasePlayerId: string | null;
}

export type GameAction = 
  | { type: 'PLAY_CARD'; card: Card; additionalCard?: Card }
  | { type: 'DRAW_CARD' }
  | { type: 'CHOOSE_SUIT'; suit: Suit }
  | { type: 'SAY_MAU' }
  | { type: 'NEXT_TURN' };
