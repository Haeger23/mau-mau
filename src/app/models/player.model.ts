import { Card } from './card.model';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isHuman: boolean;
  isActive: boolean;
  // Schweizer Mau-Mau: Strafkarten-System
  penaltyCards: Card[];
  requiredDrawCount: number;
  drawnThisTurn: number;
  // Schweizer Mau-Mau: Ansagen
  hasSaidMau: boolean;
  hasSaidMauMau: boolean;
  // Schweizer Mau-Mau: Damenrunde
  inQueenRound: boolean;
  isQueenRoundStarter: boolean;
}
