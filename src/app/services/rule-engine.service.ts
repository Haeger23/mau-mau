import { Injectable } from '@angular/core';
import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { AceRule } from '../rules/ace-rule';
import { CardRule } from '../rules/card-rule.interface';
import { DefaultRule } from '../rules/default-rule';
import { EightRule } from '../rules/eight-rule';
import { JackRule } from '../rules/jack-rule';
import { SevenRule } from '../rules/seven-rule';

@Injectable({
  providedIn: 'root',
})
export class RuleEngine {
  private rules: CardRule[];

  constructor() {
    // The order is important. More specific rules should come before general ones.
    this.rules = [
      new SevenRule(),
      new EightRule(),
      new AceRule(),
      new JackRule(),
      // ... other rules like Queen, Ten, etc. will be added here
      new DefaultRule(), // The default rule should always be last.
    ];
  }

  /**
   * Determines if a card is valid to play in the current game state.
   * @param card The card to validate.
   * @param state The current game state.
   * @returns True if the card is playable, false otherwise.
   */
  isCardPlayable(card: Card, state: GameState): boolean {
    const topCard = state.discardPile[state.discardPile.length - 1];

    if (!topCard) return false;

    // Aktive 9er-Basis-Kette: aktueller Spieler darf beliebig viele Karten derselben Farbe legen
    if (state.nineBaseActive && state.nineBasePlayerId === state.players[state.currentPlayerIndex].id) {
      return card.suit === state.nineBaseSuit;
    }

    // Bei Strafkarten (7er): Nur weitere 7er oder 10er (replizieren die 7) können gelegt werden
    // Diese Regel hat Vorrang vor allen anderen (auch vor Buben!)
    if (state.drawPenalty > 0) {
      return card.rank === '7' || card.rank === '10';
    }

    // Damenrunde: Nur Damen oder 10er sind erlaubt
    if (state.queenRoundActive) {
      return card.rank === 'Q' || card.rank === '10';
    }

    // Bube auf Bube ist nicht erlaubt
    if (topCard.rank === 'J' && card.rank === 'J') {
      return false;
    }

    // 10er-Replikator: 10 kann IMMER gespielt werden (repliziert die ausliegende Karte)
    // Ausnahme: Nicht auf Bube (siehe oben) und nicht bei Strafkarten/Damenrunde (siehe oben)
    if (card.rank === '10') return true;

    // Bube kann auf alles gelegt werden (außer auf einen anderen Buben und bei Strafkarten)
    if (card.rank === 'J') return true;

    // WICHTIG: Wenn die oberste Karte eine 10 ist, repliziert sie die Karte darunter
    // Also müssen wir gegen die Karte darunter prüfen, nicht gegen die 10
    let cardToMatch = topCard;
    if (topCard.rank === '10' && state.discardPile.length >= 2) {
      cardToMatch = state.discardPile[state.discardPile.length - 2];
    }

    // Nach einem Buben: Nur Karten der gewählten Farbe
    if (state.chosenSuit) {
      return card.suit === state.chosenSuit;
    }

    // Standard: Farbe oder Wert muss übereinstimmen
    return card.suit === cardToMatch.suit || card.rank === cardToMatch.rank;
  }

  /**
   * Applies all relevant card effects for a played card to the game state.
   * @param card The card that was played.
   * @param state The current game state.
   * @returns The new game state after effects have been applied.
   */
  applyAllEffects(card: Card, state: GameState): GameState {
    let newState = { ...state };
    const topCard = state.discardPile[state.discardPile.length - 1];

    for (const rule of this.rules) {
      if (rule.isApplicable(card, topCard)) {
        newState = rule.applyEffect(newState, card);
      }
    }
    return newState;
  }
}
