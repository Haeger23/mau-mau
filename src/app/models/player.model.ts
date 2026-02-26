import { Card } from './card.model';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isHuman: boolean;
  isActive: boolean;
  // Schweizer Mau-Mau: Strafkarten-System (deprecated - use separated stacks)
  penaltyCards: Card[];
  // Schweizer Mau-Mau: Strafkarten-Stapel (getrennt für UI)
  lockedPenaltyCards: Card[]; // Noch gesperrt - brauchen einen gültigen Zug
  pickupablePenaltyCards: Card[]; // Können aufgenommen werden
  requiredDrawCount: number;
  drawnThisTurn: number;
  // Schweizer Mau-Mau: Ansagen
  hasSaidMau: boolean;
  hasSaidMauMau: boolean;
  // Schweizer Mau-Mau: Damenrunde
  inQueenRound: boolean;
  isQueenRoundStarter: boolean;
}
