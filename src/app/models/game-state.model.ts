import { Card, Suit } from './card.model';
import { Player } from './player.model';

export interface ChatMessage {
  timestamp: Date;
  playerName: string;
  message: string;
  type: 'play' | 'draw' | 'suit' | 'skip' | 'penalty' | 'win';
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
}

export type GameAction = 
  | { type: 'PLAY_CARD'; card: Card; additionalCard?: Card }
  | { type: 'DRAW_CARD' }
  | { type: 'CHOOSE_SUIT'; suit: Suit }
  | { type: 'SAY_MAU' }
  | { type: 'NEXT_TURN' };
