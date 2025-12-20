import { Card } from './card.model';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isHuman: boolean;
  isActive: boolean;
}
