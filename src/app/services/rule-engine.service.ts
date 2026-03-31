import { Injectable } from '@angular/core';
import { Card } from '../models/card.model';
import { GameState } from '../models/game-state.model';
import { AceRule } from '../rules/ace-rule';
import { CardRule } from '../rules/card-rule.interface';
import { DefaultRule } from '../rules/default-rule';
import { EightRule } from '../rules/eight-rule';
import { JackRule } from '../rules/jack-rule';
import { NineRule } from '../rules/nine-rule';
import { QueenRule } from '../rules/queen-rule';
import { SevenRule } from '../rules/seven-rule';
import { TenRule } from '../rules/ten-rule';

@Injectable({
  providedIn: 'root',
})
export class RuleEngine {
  private rules: CardRule[];

  constructor() {
    // Rule chain order — order matters for applyAllEffects():
    //
    // SevenRule   — must come before DefaultRule; chains 7-penalty across players
    // EightRule   — must come before DefaultRule; sets skipNext flag
    // NineRule    — must come before DefaultRule; activates nineBase chain
    // TenRule     — after number rules (7/8/9) so Ten can replicate them
    // AceRule     — after number rules; sets activeAce (player stays active)
    // JackRule    — after AceRule; sets awaitingSuitChoice
    // QueenRule   — after all card-specific rules; enables queenRoundActive
    // DefaultRule — ALWAYS last; handles normal suit/rank matching
    //
    // To add a new rule: insert it BEFORE DefaultRule. If it interacts with
    // penalty state (drawPenalty), add it before TenRule. If it interacts with
    // the Queen Round, add it before QueenRule.
    this.rules = [
      new SevenRule(),
      new EightRule(),
      new NineRule(),
      new TenRule(),
      new AceRule(),
      new JackRule(),
      new QueenRule(),
      new DefaultRule(), // The default rule must always be last.
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

    // 10 auf Bube ist AUCH nicht erlaubt (10 würde den Buben replizieren = Bube auf Bube)
    if (topCard.rank === 'J' && card.rank === '10') {
      return false;
    }

    // 10er-Replikator: 10 kann auf alle anderen Karten gespielt werden
    // (Bube-Fall wurde oben schon abgefangen)
    if (card.rank === '10') return true;

    // Bube kann auf alles gelegt werden (außer auf einen anderen Buben und bei Strafkarten)
    if (card.rank === 'J') return true;

    // WICHTIG: Wenn die oberste Karte eine 10 ist, repliziert sie die Karte darunter
    // Bei mehreren 10ern übereinander müssen wir rekursiv nach unten suchen
    let cardToMatch = topCard;
    let searchIndex = state.discardPile.length - 1;
    
    // Rekursiv nach unten suchen bis wir eine Nicht-10 finden
    while (cardToMatch.rank === '10' && searchIndex > 0) {
      searchIndex--;
      cardToMatch = state.discardPile[searchIndex];
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
