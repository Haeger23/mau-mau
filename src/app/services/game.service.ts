import { Injectable, signal } from '@angular/core';
import { Card, RANKS, SUITS, Suit, Rank } from '../models/card.model';
import { Player } from '../models/player.model';
import { GameState } from '../models/game-state.model';
import { SeededRandom } from '../../utils/seeded-random';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameState = signal<GameState>(this.createInitialState());
  private rng = new SeededRandom();

  // Public signals
  readonly state = this.gameState.asReadonly();

  /**
  * Sets seed for deterministic testing
  * @param seed - Random seed value
  */
  setSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
  }

  // Schweizer Mau-Mau: Original-Regeltexte von mau-mau.ch
  private readonly RULE_EXPLANATIONS: Record<string, string> = {
    'PENALTY_TOO_EARLY': '§4 STRAFKARTEN: Strafkarten werden, anders als Spielkarten nicht auf der Hand, sondern verdeckt auf dem Tisch am Platz des bestraften Spielers gelagert. Nach dem nächsten ordentlichen Zug des Spielers wandelt sich eine Strafkarte in eine aktive Spielkarte und darf somit auf die Hand aufgenommen werden.',
    'DRAW_TOO_FEW': '§2 SPIELPFLICHT / KARTE ZIEHEN: Fälschlicherweise zuviel gezogene Karten müssen als Strafkarten vor sich abgelegt werden.',
    'DRAW_TOO_MANY': '§2 SPIELPFLICHT / KARTE ZIEHEN: Fälschlicherweise zuviel gezogene Karten müssen als Strafkarten vor sich abgelegt werden.',
    'MAU_MISSED': '§10.A MAU: Der Spieler muss unmittelbar dann Mau sagen, sobald er lediglich eine aktive Karte auf der Hand hat. Dies kann mit dem Ablegen der vorletzten Karte geschehen, muss aber unbedingt vor dem Ende des ordentlichen Zuges des Spielers angemerkt werden. Falls nur noch eine Strafkarte vor dem Spieler liegt, muss nach dem regulären Zug Mau gesagt werden, also sobald die Strafkarte zur aktiven Karte wird.',
    'MAU_FALSE': '§10.A MAU: Falsche Mau-Ansage - Spieler hat nicht genau eine aktive Karte auf der Hand.',
    'MAUMAU_MISSED': '§10.B MAU-MAU: Der Ausruf Mau-Mau muss mit dem Ablegen eines Buben am Spielende ausgestoßen werden, ansonsten ist dieser Ausruf zu unterlassen.',
    'MAUMAU_FALSE': '§10.B MAU-MAU: Falsche Mau-Mau-Ansage - Spieler ist nicht am Ende des Spiels.',
    'QUEEN_MISSED': '§9.A DAMENRUNDE: Falls dies vergessen wird, ist dies entweder mit einer Strafkarte zu ahnden oder der Zug wird nicht als Starten einer Damenrunde gewertet.',
    'QUEEN_FALSE': '§9.A DAMENRUNDE: Falsche Damenrunde-Ansage - Spieler hat nicht mindestens zwei echte Damen auf der Hand.',
    'QUEEN_END_MISSED': '§9.A DAMENRUNDE: Falls ein Spieler vergisst eine Damenrunde zu beenden, muss ebenfalls eine Strafkarte gezogen werden.',
    'QUEEN_END_FALSE': '§9.A DAMENRUNDE: Nur der Spieler, welcher die Damenrunde gestartet hat, darf das Ende der Damenrunde ausrufen.',
    'ACE_LAST_CARD': 'ASS-REGEL: Durch die Pflicht des Spielens, kann ein Spiel nicht mit einem Ass beendet werden.',
    'JACK_REPLICATION': '§7 BUBE: Bube auf Bube stinkt! Eine 10 die einen Buben repliziert, verletzt diese Regel.',
    'SEVEN_ESCAPE': '§6 SIEBENER-KETTE: Ein Spieler kann einer Siebener-Strafe entkommen, indem er selbst eine 7 spielt. Alternativ kann auch eine 10 gespielt werden, die die 7 repliziert. Die Strafkarten akkumulieren sich dann (+2) und gehen an den nächsten Spieler weiter.'
  };

  private createInitialState(): GameState {
    return {
      players: [],
      currentPlayerIndex: 0,
      deck: [],
      discardPile: [],
      drawPenalty: 0,
      skipNext: false,
      activeAce: false,
      chosenSuit: null,
      gameOver: false,
      winner: null,
      lastPlayedCard: null,
      chatLog: [],
      lastPlayerAction: null,
      queenRoundActive: false,
      queenRoundStarterId: null
    };
  }

  private getRandomComputerNames(count: number): string[] {
    const availableNames = ['Lina', 'Robert', 'Titus', 'Fischi', 'Manu', 'Ole', 'Willi', 'Lukas', 'Hans'];
    const shuffled = [...availableNames].sort(() => this.rng.next() - 0.5);
    return shuffled.slice(0, count);
  }

  startNewGame(playerNames: string[] = ['Du', 'Computer 1', 'Computer 2']): void {
    const deck = this.createDeck();
    this.shuffleDeck(deck);

    // Ersetze Computer-Namen durch zufällige Namen
    const computerCount = playerNames.length - 1; // Alle außer "Du"
    const randomNames = this.getRandomComputerNames(computerCount);
    const finalNames = playerNames.map((name, index) => 
      index === 0 ? name : randomNames[index - 1] || name
    );

    const players: Player[] = finalNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      hand: [],
      isHuman: index === 0,
      isActive: index === 0,
      penaltyCards: [],
      requiredDrawCount: 0,
      drawnThisTurn: 0,
      hasSaidMau: false,
      hasSaidMauMau: false,
      inQueenRound: false,
      isQueenRoundStarter: false
    }));

    // Deal 5 cards to each player
    players.forEach(player => {
      for (let i = 0; i < 5; i++) {
        const card = deck.pop();
        if (card) player.hand.push(card);
      }
    });

    // Place first card on discard pile
    const firstCard = deck.pop();
    const discardPile = firstCard ? [firstCard] : [];

    this.gameState.set({
      players,
      currentPlayerIndex: 0,
      deck,
      discardPile,
      drawPenalty: 0,
      skipNext: false,
      activeAce: false,
      chosenSuit: null,
      gameOver: false,
      winner: null,
      lastPlayedCard: firstCard || null,
      chatLog: [{
        timestamp: new Date(),
        playerName: 'System',
        message: 'Spiel gestartet!',
        type: 'play'
      }],
      lastPlayerAction: null,
      queenRoundActive: false,
      queenRoundStarterId: null
    });
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          suit,
          rank,
          id: `${rank}-${suit}`
        });
      }
    }
    return deck;
  }

  private shuffleDeck(deck: Card[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  private addChatLog(
    playerName: string, 
    message: string, 
    type: 'play' | 'draw' | 'suit' | 'skip' | 'penalty' | 'win' | 'mau' | 'mau-mau' | 'queen-round' | 'queen-round-end' | 'penalty-early' | 'penalty-wrong-count' | 'penalty-mau-missed' | 'penalty-mau-false' | 'penalty-maumau-missed' | 'penalty-maumau-false' | 'penalty-queen-missed' | 'penalty-queen-false' | 'penalty-queen-end-false',
    ruleKey?: string
  ): void {
    const state = this.gameState();
    const chatMessage: any = {
      timestamp: new Date(),
      playerName,
      message,
      type
    };
    
    if (ruleKey && this.RULE_EXPLANATIONS[ruleKey]) {
      chatMessage.ruleExplanation = this.RULE_EXPLANATIONS[ruleKey];
      chatMessage.showExplanation = false;
    }
    
    state.chatLog.push(chatMessage);
    this.gameState.set({ ...state });
  }

  private assignPenaltyCards(playerId: string, count: number, reason: string, ruleKey: string): void {
    const state = this.gameState();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    // Ziehe Strafkarten vom Deck
    for (let i = 0; i < count; i++) {
      if (state.deck.length === 0) {
        this.reshuffleDeck();
        // Get updated state after reshuffle
        const updatedState = this.gameState();
        state.deck = updatedState.deck;
        state.discardPile = updatedState.discardPile;
      }
      const card = state.deck.pop();
      if (card) {
        player.penaltyCards.push(card);
      }
    }

    // Reset lastPlayerAction
    state.lastPlayerAction = null;

    // Log mit Regel-Erklärung
    this.addChatLog(
      player.name,
      `erhält ${count} Strafkarte(n): ${reason}`,
      'penalty',
      ruleKey
    );

    this.gameState.set({ ...state });
  }

  pickupPenaltyCards(playerId: string): void {
    const state = this.gameState();
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.penaltyCards.length === 0) return;

    // Prüfe ob Spieler einen gültigen Zug gemacht hat
    if (state.lastPlayerAction !== 'play' && 
        state.lastPlayerAction !== 'draw-complete' &&
        state.lastPlayerAction !== 'penalty-pickup') {
      // Zu früh aufgenommen - Strafe!
      this.assignPenaltyCards(
        playerId,
        1,
        'Strafkarten zu früh aufgenommen',
        'PENALTY_TOO_EARLY'
      );
      return;
    }

    // Verschiebe alle Strafkarten zur Hand
    const count = player.penaltyCards.length;
    player.hand.push(...player.penaltyCards);
    player.penaltyCards = [];

    this.addChatLog(
      player.name,
      `nimmt ${count} Strafkarte(n) auf`,
      'draw'
    );

    // Setze lastPlayerAction damit nextTurn() nicht erneut penalty auslöst
    state.lastPlayerAction = 'penalty-pickup';
    this.gameState.set({ ...state });
    
    // Nach Aufnahme: Zug beenden und nächster Spieler
    // Für KI automatisch, für Menschen manuell
    if (!player.isHuman) {
      setTimeout(() => this.nextTurn(), 1000);
    }
    // Hinweis: Menschlicher Spieler muss manuell "Zug beenden" klicken
  }

  private getCardDisplayName(card: Card): string {
    const suitNames: Record<string, string> = {
      'hearts': '♥️ Herz',
      'diamonds': '♦️ Karo',
      'clubs': '♣️ Kreuz',
      'spades': '♠️ Pik'
    };
    const rankNames: Record<string, string> = {
      '7': '7', '8': '8', '9': '9', '10': '10',
      'J': 'Bube', 'Q': 'Dame', 'K': 'König', 'A': 'Ass'
    };
    return `${rankNames[card.rank]} ${suitNames[card.suit]}`;
  }

  canPlayCard(card: Card): boolean {
    const state = this.gameState();
    const topCard = state.discardPile[state.discardPile.length - 1];

    if (!topCard) return false;

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

    // Bube kann auf alles gelegt werden (außer auf einen anderen Buben und bei Strafkarten)
    if (card.rank === 'J') return true;

    // Nach einem Buben: Nur Karten der gewählten Farbe
    if (state.chosenSuit) {
      return card.suit === state.chosenSuit;
    }

    // Standard: Farbe oder Wert muss übereinstimmen
    return card.suit === topCard.suit || card.rank === topCard.rank;
  }

  playCard(card: Card, additionalCard?: Card): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    // Remove card from player's hand
    const cardIndex = currentPlayer.hand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) return;
    
    currentPlayer.hand.splice(cardIndex, 1);
    
    // Wenn Spieler eine 7 oder 10 spielt während drawPenalty aktiv: Er entkommt der Strafe
    const isEscapingWith7 = (card.rank === '7' || card.rank === '10') && state.drawPenalty > 0;

    // Reset chosenSuit wenn eine Karte gelegt wird (außer bei Bube)
    const hasJack = card.rank === 'J';
    if (!hasJack && state.chosenSuit) {
      state.chosenSuit = null;
    }

    // Schweizer Mau-Mau: Ass-Regel - Spieler bleibt am Zug
    if (card.rank === 'A') {
      // Prüfe ob das die letzte Karte wäre
      if (currentPlayer.hand.length === 0) {
        // Ass als letzte Karte nicht erlaubt!
        currentPlayer.hand.push(card); // Gib Karte zurück
        this.assignPenaltyCards(
          currentPlayer.id,
          1,
          'Ass als letzte Karte nicht erlaubt',
          'ACE_LAST_CARD'
        );
        this.gameState.set({ ...state });
        return;
      }

      state.discardPile.push(card);
      state.lastPlayedCard = card;
      state.lastPlayerAction = 'play';
      this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)} - ist erneut am Zug`, 'play');
      this.gameState.set({ ...state });
      
      // Wenn KI Ass gespielt hat, triggere nochmal aiPlay()
      if (!currentPlayer.isHuman) {
        setTimeout(() => this.aiPlay(), 1000);
      }
      
      // Spieler bleibt am Zug - KEIN nextTurn()!
      return;
    }

    // Normale Karte
    state.discardPile.push(card);
    state.lastPlayedCard = card;
    state.lastPlayerAction = 'play';
    
    // Log nur wenn nicht 7er-Escape (wird in applyCardEffect geloggt)
    if (!isEscapingWith7) {
      this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)}`, 'play');
    }
    
    this.applyCardEffect(card);

    // Check for win condition
    if (currentPlayer.hand.length === 0) {
      // Prüfe Mau-Mau Ansage
      if (!currentPlayer.hasSaidMauMau) {
        this.assignPenaltyCards(
          currentPlayer.id,
          1,
          'Mau-Mau nicht gesagt',
          'MAUMAU_MISSED'
        );
        // Win verhindert - Spieler muss Strafe aufnehmen
        this.gameState.set({ ...state });
        return;
      }

      state.gameOver = true;
      state.winner = currentPlayer;
      this.addChatLog(currentPlayer.name, `hat gewonnen! 🎉`, 'win');
      this.gameState.set({ ...state });
      return;
    }

    // Prüfe Mau-Ansage nach Karte legen
    this.checkMauPenalty();
    this.checkMauMauPenalty();

    // Prüfe ob Damenrunde automatisch beendet werden sollte
    if (state.queenRoundActive && currentPlayer.isQueenRoundStarter) {
      const queenCount = currentPlayer.hand.filter(c => c.rank === 'Q').length;
      if (queenCount === 0) {
        // Starter hat alle Damen gespielt - Auto-Beendigung
        state.queenRoundActive = false;
        state.queenRoundStarterId = null;
        
        state.players.forEach(p => {
          p.inQueenRound = false;
          p.isQueenRoundStarter = false;
        });

        this.addChatLog(
          currentPlayer.name,
          'beendet die Damenrunde automatisch',
          'queen-round-end',
          'QUEEN_ROUND_ENDED'
        );
      }
    }

    // If Jack was played, don't proceed to next turn
    if (!hasJack) {
      // Für Menschen: Warte auf manuelles "Zug beenden"
      // Für KI: Automatisch weiter
      if (!currentPlayer.isHuman) {
        this.nextTurn();
      }
      // Menschlicher Spieler muss "Zug beenden" klicken
    } else {
      console.log('Bube gespielt von', currentPlayer.name, '- warte auf Farbwahl');
      
      if (!currentPlayer.isHuman) {
        setTimeout(() => {
          const currentState = this.gameState();
          if (!currentState.gameOver && !currentState.chosenSuit) {
            const player = currentState.players.find(p => p.id === currentPlayer.id);
            if (player) {
              const suitCounts = this.countSuits(player.hand);
              const suitEntries = Object.entries(suitCounts);
              const chosenSuit = suitEntries.length > 0 
                ? suitEntries.sort((a, b) => b[1] - a[1])[0][0] as Suit
                : 'hearts' as Suit;
              this.chooseSuit(chosenSuit);
            } else {
              this.chooseSuit('hearts' as Suit);
            }
          }
        }, 500);
      }
    }
  }

  private applyCardEffect(card: Card): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    switch (card.rank) {
      case '7':
        // 7er-Kette: Nächster Spieler muss 2 Karten ziehen (kann sich akkumulieren)
        // Wenn bereits eine 7er-Strafe aktiv ist, entkommt der Spieler durch die 7
        const wasEscaping = state.drawPenalty > 0;
        state.drawPenalty += 2;
        
        if (wasEscaping) {
          // Spieler entkommt der Strafe - reset counters
          currentPlayer.requiredDrawCount = 0;
          currentPlayer.drawnThisTurn = 0;
          this.addChatLog(currentPlayer.name, `spielt 7 und entkommt der Strafe! → +2 für nächsten Spieler (total: ${state.drawPenalty})`, 'play');
        } else {
          this.addChatLog(currentPlayer.name, `spielt 7 → nächster Spieler muss 2 Karten ziehen`, 'play');
        }
        break;
      
      case '8':
        // Nächster Spieler wird übersprungen
        state.skipNext = true;
        this.addChatLog(currentPlayer.name, 'lässt den nächsten Spieler aussetzen', 'skip');
        break;

      case '10':
        // 10er Replikator: Kopiert die Karte darunter
        const cardBelow = state.discardPile[state.discardPile.length - 2]; // Die Karte VOR der 10
        if (cardBelow) {
          const currentPlayer = state.players[state.currentPlayerIndex];
          
          // 10 auf Bube = Bube-Replikation = Bube auf Bube (VERBOTEN!)
          if (cardBelow.rank === 'J') {
            // Die 10 muss zurück auf die Hand
            const ten = state.discardPile.pop(); // Entferne die 10 vom Ablagestapel
            if (ten) {
              currentPlayer.hand.push(ten); // Zurück auf die Hand
            }
            
            this.addChatLog(currentPlayer.name, 'repliziert Bube (Bube auf Bube verboten!) - Karte zurück', 'penalty');
            this.assignPenaltyCards(
              currentPlayer.id,
              1,
              'Bube-Replikation nicht erlaubt (Bube auf Bube)',
              'JACK_REPLICATION'
            );
            
            // Zug ist ungültig - nächster Spieler
            // Für KI automatisch, für Menschen manuell
            if (!currentPlayer.isHuman) {
              setTimeout(() => this.nextTurn(), 1000);
            }
            break;
          }
          
          // Effekt der Karte darunter anwenden
          switch (cardBelow.rank) {
            case '7':
              const wasEscapingWith10 = state.drawPenalty > 0;
              state.drawPenalty += 2;
              if (wasEscapingWith10) {
                // 10 repliziert 7 während Strafe aktiv = Escape!
                currentPlayer.requiredDrawCount = 0;
                currentPlayer.drawnThisTurn = 0;
                this.addChatLog(currentPlayer.name, `repliziert die 7 und entkommt der Strafe! → +2 für nächsten Spieler (total: ${state.drawPenalty})`, 'play');
              } else {
                this.addChatLog(currentPlayer.name, 'repliziert die 7 → +2 Strafkarten', 'play');
              }
              break;
            
            case '8':
              state.skipNext = true;
              this.addChatLog(currentPlayer.name, 'repliziert die 8 → nächster Spieler überspringen', 'skip');
              break;
            
            case 'Q':
              // Spieler tritt der Damenrunde bei
              if (state.queenRoundActive) {
                currentPlayer.inQueenRound = true;
                this.addChatLog(currentPlayer.name, 'repliziert die Dame → tritt Damenrunde bei', 'queen-round');
              }
              break;
            
            case '10':
              // 10 auf 10: Kopiere die Karte DARUNTER (rekursiv)
              const cardBelowBelow = state.discardPile[state.discardPile.length - 3];
              if (cardBelowBelow) {
                this.addChatLog(currentPlayer.name, `repliziert die 10 → schaut weiter nach unten`, 'play');
                // Simuliere den Effekt der Karte darunter durch temporären State
                const temp = state.discardPile.pop(); // 10 entfernen
                this.applyCardEffect(cardBelowBelow); // Effekt rekursiv anwenden
                if (temp) state.discardPile.push(temp); // 10 zurücklegen
              }
              break;
            
            // Andere Karten haben keinen kopierbaren Effekt
            default:
              this.addChatLog(currentPlayer.name, `repliziert ${this.getCardDisplayName(cardBelow)} (kein Effekt)`, 'play');
              break;
          }
        }
        break;
      
      case 'J':
        // Spieler muss Farbe wählen - wird separat behandelt
        // chosenSuit wird in chooseSuit() gesetzt
        break;
      
      case 'A':
        // Bereits in playCard behandelt
        break;
    }

    this.gameState.set({ ...state });
  }

  chooseSuit(suit: Suit): void {
    const state = this.gameState();
    if (state.gameOver) {
      console.log('chooseSuit abgebrochen - Spiel vorbei');
      return;
    }
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    console.log('Farbwahl:', suit, 'von', currentPlayer.name);
    
    const suitNames: Record<string, string> = {
      'hearts': '♥️ Herz',
      'diamonds': '♦️ Karo',
      'clubs': '♣️ Kreuz',
      'spades': '♠️ Pik'
    };
    
    this.addChatLog(currentPlayer.name, `wünscht sich ${suitNames[suit]}`, 'suit');
    
    state.chosenSuit = suit;
    this.gameState.set({ ...state });
    
    // Für Menschen: Warte auf manuelles "Zug beenden"
    // Für KI: Automatisch weiter
    if (!currentPlayer.isHuman) {
      this.nextTurn();
    }
  }

  drawCard(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Beim ersten Ziehen: setze requiredDrawCount wenn 7er-Strafe aktiv
    if (currentPlayer.drawnThisTurn === 0 && state.drawPenalty > 0) {
      currentPlayer.requiredDrawCount = state.drawPenalty;
    }

    // Ziehe nur EINE Karte
    if (state.deck.length === 0) {
      this.reshuffleDeck();
      // Get updated state after reshuffle
      const updatedState = this.gameState();
      state.deck = updatedState.deck;
      state.discardPile = updatedState.discardPile;
    }
    const card = state.deck.pop();
    if (card) {
      currentPlayer.hand.push(card);
      currentPlayer.drawnThisTurn++;
    }

    // Log einzelne Karte
    this.addChatLog(currentPlayer.name, `zieht 1 Karte`, 'draw');

    // Prüfe ob genug gezogen wurde
    if (currentPlayer.requiredDrawCount > 0 && currentPlayer.drawnThisTurn >= currentPlayer.requiredDrawCount) {
      state.lastPlayerAction = 'draw-complete';
      this.addChatLog(
        currentPlayer.name,
        `hat ${currentPlayer.drawnThisTurn} Karte(n) gezogen`,
        'draw'
      );
    } else if (currentPlayer.requiredDrawCount === 0) {
      // Normales Ziehen ohne 7er-Strafe
      state.lastPlayerAction = 'draw-complete';
    }

    this.gameState.set({ ...state });

    // Prüfe, ob Spieler nach dem Ziehen noch legen kann (nur bei normalem Ziehen)
    if (currentPlayer.requiredDrawCount === 0) {
      const playableCards = currentPlayer.hand.filter(card => this.canPlayCard(card));
      if (playableCards.length > 0) {
        // Spieler bleibt am Zug
        if (!currentPlayer.isHuman) {
          const cardToPlay = playableCards[0];
          this.playCard(cardToPlay);
        }
      } else {
        // Keine passende Karte, Zug endet
        // Für KI automatisch, für Menschen manuell
        if (!currentPlayer.isHuman) {
          this.nextTurn();
        }
      }
    }
  }

  endTurn(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Prüfe Zieh-Counter
    const diff = currentPlayer.drawnThisTurn - currentPlayer.requiredDrawCount;

    if (diff < 0) {
      // Zu wenig gezogen
      this.assignPenaltyCards(
        currentPlayer.id,
        Math.abs(diff),
        `zu wenig gezogen (${currentPlayer.drawnThisTurn}/${currentPlayer.requiredDrawCount})`,
        'DRAW_TOO_FEW'
      );
    } else if (diff > 0) {
      // Zu viel gezogen
      this.assignPenaltyCards(
        currentPlayer.id,
        diff,
        `zu viel gezogen (${currentPlayer.drawnThisTurn}/${currentPlayer.requiredDrawCount})`,
        'DRAW_TOO_MANY'
      );
    }
    
    // Wenn Spieler die 7er-Strafe korrekt gezogen hat, reset drawPenalty
    if (currentPlayer.requiredDrawCount > 0 && 
        currentPlayer.drawnThisTurn === currentPlayer.requiredDrawCount &&
        state.drawPenalty > 0) {
      state.drawPenalty = 0;
    }

    // Reset Counter
    currentPlayer.drawnThisTurn = 0;
    currentPlayer.requiredDrawCount = 0;
    
    // drawPenalty darf NICHT hier zurückgesetzt werden!
    // Es wird nur zurückgesetzt wenn:
    // 1. Der Spieler die Strafe tatsächlich gezogen hat (siehe oben)
    // 2. Der Spieler mit einer 7 entkommen ist (dann bleibt es erhöht)
    // Wenn wir es hier zurücksetzen, kann der nächste Spieler die Strafe umgehen!

    this.gameState.set({ ...state });

    // Prüfe Mau-Penalty
    this.checkMauPenalty();
    this.checkMauMauPenalty();

    // Nächster Spieler
    this.nextTurn();
  }

  private reshuffleDeck(): void {
    const state = this.gameState();
    
    // Only reshuffle if there are cards in discard pile besides top card
    if (state.discardPile.length <= 1) {
      console.warn('Cannot reshuffle: Not enough cards in discard pile');
      return;
    }
    
    // Take all but top card from discard pile
    const topCard = state.discardPile.pop();
    state.deck = [...state.discardPile];
    state.discardPile = topCard ? [topCard] : [];
    
    this.shuffleDeck(state.deck);
    this.gameState.set({ ...state });
  }

  private nextTurn(): void {
    const state = this.gameState();

    // Handle skip
    if (state.skipNext) {
      state.skipNext = false;
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    }

    // Move to next player
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

    // Update active player
    state.players.forEach((p, i) => {
      p.isActive = i === state.currentPlayerIndex;
    });

    this.gameState.set({ ...state });

    // If next player is AI, play automatically after a delay
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer.isHuman && !state.gameOver) {
      setTimeout(() => this.aiPlay(), 1000);
    }
  }

  private aiPlay(): void {
    const state = this.gameState();
    if (state.gameOver) return; // Spiel ist vorbei
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    // Sicherheitscheck: Nur wenn aktueller Spieler KI ist
    if (currentPlayer.isHuman) return;

    // ========== SCHRITT 1: Strafkarten aufnehmen ==========
    // Prüfe ob Strafkarten vorhanden sind
    if (currentPlayer.penaltyCards.length > 0) {
      // KI nimmt Strafkarten auf, aber manchmal zu früh (30% Chance)
      const shouldForget = this.rng.next() < 0.3;
      
      if (shouldForget && state.lastPlayerAction === null) {
        // Zu früh aufgenommen!
        setTimeout(() => this.pickupPenaltyCards(currentPlayer.id), 500);
        return;
      } else if (state.lastPlayerAction === 'play' || 
                 state.lastPlayerAction === 'draw-complete' ||
                 state.lastPlayerAction === 'penalty-pickup') {
        // Korrekte Timing
        setTimeout(() => this.pickupPenaltyCards(currentPlayer.id), 500);
        return;
      }
    }

    // ========== SCHRITT 2: Ansagen prüfen ==========
    // Prüfe "Mau" (80% Chance bei 1 Karte)
    if (currentPlayer.hand.length === 1 && !currentPlayer.hasSaidMau && this.rng.next() < 0.8) {
      setTimeout(() => this.sayMau(), 300);
    }

    // Prüfe "Mau-Mau" (90% Chance bei 1 Karte)
    if (currentPlayer.hand.length === 1 && !currentPlayer.hasSaidMauMau && this.rng.next() < 0.9) {
      setTimeout(() => this.sayMauMau(), 300);
    }

    // Prüfe Damenrunde ankündigen (50% Chance bei 2+ Damen)
    const queenCount = currentPlayer.hand.filter(c => c.rank === 'Q').length;
    if (queenCount >= 2 && !state.queenRoundActive && this.rng.next() < 0.5) {
      setTimeout(() => this.announceQueenRound(), 400);
    }

    // Prüfe Damenrunde beenden (30% Chance wenn keine Damen mehr)
    if (state.queenRoundActive && currentPlayer.isQueenRoundStarter && queenCount === 0 && this.rng.next() < 0.3) {
      setTimeout(() => this.endQueenRound(), 400);
    }

    // ========== SCHRITT 3: Spielbare Karten prüfen ==========
    // Bei 7er-Strafe: Prüfe ob KI eine 7 oder 10 zum Aussteigen hat
    if (state.drawPenalty > 0) {
      // Bevorzuge 7, dann 10 (10 könnte Bube replizieren)
      const seven = currentPlayer.hand.find(c => c.rank === '7');
      const ten = currentPlayer.hand.find(c => c.rank === '10');
      
      if (seven) {
        // KI spielt die 7 um der Strafe zu entkommen
        setTimeout(() => this.playCard(seven), 600);
        return;
      } else if (ten) {
        // KI spielt die 10 um der Strafe zu entkommen (repliziert die 7)
        setTimeout(() => this.playCard(ten), 600);
        return;
      }
      // Keine 7 oder 10 → KI muss Strafkarten ziehen
      setTimeout(() => this.aiDrawCards(), 600);
      return;
    }

    // Ermittle alle spielbaren Karten
    const playableCards = currentPlayer.hand.filter(card => this.canPlayCard(card));

    if (playableCards.length > 0) {
      // Für den Computer: Wähle die erste spielbare Karte.
      const cardToPlay = playableCards[0];
      
      // Schweizer Ass-Regel: Prüfe ob Ass die letzte Karte wäre
      if (cardToPlay.rank === 'A' && currentPlayer.hand.length === 1) {
        // Ass als letzte Karte nicht spielen - ziehe stattdessen
        setTimeout(() => this.aiDrawCards(), 600);
        return;
      }

      // Bube-Logik mit Farbwahl
      if (cardToPlay.rank === 'J') {
        const playerId = currentPlayer.id;
        setTimeout(() => this.playCard(cardToPlay), 600);
        
        // Wähle Farbe basierend auf verbleibenden Karten
        setTimeout(() => {
          const currentState = this.gameState();
          if (currentState.gameOver) return;
          
          const currentPlayerNow = currentState.players.find(p => p.id === playerId);
          if (!currentPlayerNow) {
            this.chooseSuit('hearts' as Suit);
            return;
          }
          
          const suitCounts = this.countSuits(currentPlayerNow.hand);
          const suitEntries = Object.entries(suitCounts);
          const chosenSuit = suitEntries.length > 0 
            ? suitEntries.sort((a, b) => b[1] - a[1])[0][0] as Suit
            : 'hearts' as Suit;
          
          this.chooseSuit(chosenSuit);
        }, 1000);
      } else {
        setTimeout(() => this.playCard(cardToPlay), 600);
      }
    } else {
      // Keine spielbare Karte - manuelles Ziehen mit Fehlerchance
      setTimeout(() => this.aiDrawCards(), 600);
    }
  }

  /**
   * KI zieht Karten manuell (mit perfekter Genauigkeit in dieser Implementierung)
   * Wird aufgerufen wenn keine spielbare Karte vorhanden oder bei 7er-Strafe
   */
  private aiDrawCards(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Berechne benötigte Anzahl
    const requiredCount = state.drawPenalty > 0 ? state.drawPenalty : 1;
    const wasDrawPenalty = state.drawPenalty > 0;

    // Ziehe Karten einzeln
    const drawNext = (count: number) => {
      if (count > 0) {
        this.drawCard();
        setTimeout(() => drawNext(count - 1), 300);
      } else {
        // Alle Karten gezogen
        // Wenn Strafkarten gezogen wurden, reset drawPenalty
        if (wasDrawPenalty) {
          const currentState = this.gameState();
          currentState.drawPenalty = 0;
          this.gameState.set({ ...currentState });
        }
        
        // Beende Zug
        setTimeout(() => this.endTurn(), 500);
      }
    };

    drawNext(requiredCount);
  }

  private countSuits(cards: Card[]): Record<Suit, number> {
    return cards.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {} as Record<Suit, number>);
  }

  getCurrentPlayer(): Player | null {
    const state = this.gameState();
    return state.players[state.currentPlayerIndex] || null;
  }

  getTopCard(): Card | null {
    const state = this.gameState();
    return state.discardPile[state.discardPile.length - 1] || null;
  }

  // ========== ANSAGE-METHODEN ==========
  // Diese 4 Methoden können jederzeit vom Spieler aufgerufen werden

  /**
   * §9.A: "Mau"-Ansage wenn noch 2 Karten auf der Hand
   * Falsch-Ansage: +1 Strafkarte
   */
  sayMau(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.hasSaidMau) {
      // Bereits gesagt - ignoriere
      return;
    }

    // Prüfe ob Ansage korrekt ist (genau 1 Karte)
    if (currentPlayer.hand.length === 1) {
      currentPlayer.hasSaidMau = true;
      this.addChatLog(currentPlayer.name, 'sagt "Mau"', 'mau', 'MAU_SAID');
      this.gameState.set({ ...state });
    } else {
      // Falsch-Ansage: +1 Strafkarte
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        `"Mau" falsch gesagt (${currentPlayer.hand.length} Karten statt 1)`,
        'MAU_FALSE'
      );
    }
  }

  /**
   * §10.A: "Mau-Mau"-Ansage wenn noch 1 Karte auf der Hand
   * Falsch-Ansage: +1 Strafkarte
   */
  sayMauMau(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.hasSaidMauMau) {
      // Bereits gesagt - ignoriere
      return;
    }

    // Prüfe ob Ansage korrekt ist (genau 1 Karte)
    if (currentPlayer.hand.length === 1) {
      currentPlayer.hasSaidMauMau = true;
      this.addChatLog(currentPlayer.name, 'sagt "Mau-Mau"', 'mau-mau', 'MAUMAU_SAID');
      this.gameState.set({ ...state });
    } else {
      // Falsch-Ansage: +1 Strafkarte
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        `"Mau-Mau" falsch gesagt (${currentPlayer.hand.length} Karte(n) statt 1)`,
        'MAUMAU_FALSE'
      );
    }
  }

  /**
   * Damenrunde ankündigen
   * Bedingung: mindestens 2 Damen auf der Hand
   * Falsch-Ansage: +2 Strafkarten
   */
  announceQueenRound(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Wenn bereits eine Damenrunde aktiv ist - ignoriere
    if (state.queenRoundActive) {
      this.addChatLog(currentPlayer.name, 'kann keine neue Damenrunde starten - bereits aktiv', 'play');
      return;
    }

    // Zähle Damen auf der Hand
    const queenCount = currentPlayer.hand.filter(c => c.rank === 'Q').length;

    if (queenCount >= 2) {
      // Korrekte Ansage
      state.queenRoundActive = true;
      state.queenRoundStarterId = currentPlayer.id;
      currentPlayer.inQueenRound = true;
      currentPlayer.isQueenRoundStarter = true;
      
      this.addChatLog(
        currentPlayer.name, 
        'kündigt Damenrunde an', 
        'queen-round', 
        'QUEEN_ROUND_ANNOUNCED'
      );
      this.gameState.set({ ...state });
    } else {
      // Falsch-Ansage: +2 Strafkarten
      this.assignPenaltyCards(
        currentPlayer.id,
        2,
        `Damenrunde falsch angekündigt (nur ${queenCount} Dame(n) statt mind. 2)`,
        'QUEEN_ROUND_FALSE'
      );
    }
  }

  /**
   * Damenrunde beenden
   * Nur der Starter kann beenden
   * Falsch-Ansage wenn noch Damen auf der Hand: +2 Strafkarten
   */
  endQueenRound(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Prüfe ob überhaupt eine Damenrunde aktiv ist
    if (!state.queenRoundActive) {
      this.addChatLog(currentPlayer.name, 'kann keine Damenrunde beenden - keine aktiv', 'play');
      return;
    }

    // Nur der Starter kann die Damenrunde beenden
    if (!currentPlayer.isQueenRoundStarter) {
      this.addChatLog(
        currentPlayer.name, 
        'kann Damenrunde nicht beenden - nur der Starter darf das', 
        'play'
      );
      return;
    }

    // Prüfe ob noch Damen auf der Hand sind
    const queenCount = currentPlayer.hand.filter(c => c.rank === 'Q').length;

    if (queenCount === 0) {
      // Korrekt beendet
      state.queenRoundActive = false;
      state.queenRoundStarterId = null;
      
      // Alle Spieler aus der Damenrunde entfernen
      state.players.forEach(p => {
        p.inQueenRound = false;
        p.isQueenRoundStarter = false;
      });

      this.addChatLog(
        currentPlayer.name, 
        'beendet die Damenrunde', 
        'queen-round-end', 
        'QUEEN_ROUND_ENDED'
      );
      this.gameState.set({ ...state });
    } else {
      // Falsch beendet: noch Damen auf Hand -> +2 Strafkarten
      this.assignPenaltyCards(
        currentPlayer.id,
        2,
        `Damenrunde falsch beendet (noch ${queenCount} Dame(n) auf Hand)`,
        'QUEEN_ROUND_END_FALSE'
      );
    }
  }

  // ========== AUTOMATISCHE PENALTY-CHECKS ==========

  /**
   * §9.B: Prüft ob "Mau" gesagt werden musste
   * Wird aufgerufen nach playCard() und endTurn()
   */
  private checkMauPenalty(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Prüfe ob Spieler jetzt genau 1 Karte hat
    if (currentPlayer.hand.length === 1) {
      // Wurde "Mau" gesagt?
      if (!currentPlayer.hasSaidMau) {
        // Strafe: +1 Karte für vergessene Ansage
        this.assignPenaltyCards(
          currentPlayer.id,
          1,
          '"Mau" vergessen zu sagen',
          'MAU_MISSED'
        );
      }
    }

    // Wenn mehr als 1 Karte: Reset Mau-Flag
    if (currentPlayer.hand.length > 1) {
      currentPlayer.hasSaidMau = false;
    }
  }

  /**
   * §10.B: Prüft ob "Mau-Mau" gesagt werden musste
   * Wird aufgerufen nach playCard() und endTurn()
   */
  private checkMauMauPenalty(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Prüfe ob Spieler jetzt genau 1 Karte hat
    if (currentPlayer.hand.length === 1) {
      // Wurde "Mau-Mau" gesagt?
      if (!currentPlayer.hasSaidMauMau) {
        // Strafe: +1 Karte für vergessene Ansage
        this.assignPenaltyCards(
          currentPlayer.id,
          1,
          '"Mau-Mau" vergessen zu sagen',
          'MAUMAU_MISSED'
        );
      }
    }

    // Wenn mehr als 1 Karte: Reset Mau-Mau-Flag
    if (currentPlayer.hand.length > 1) {
      currentPlayer.hasSaidMauMau = false;
    }
  }
}
