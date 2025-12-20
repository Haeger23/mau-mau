import { Injectable, signal } from '@angular/core';
import { Card, RANKS, SUITS, Suit, Rank } from '../models/card.model';
import { Player } from '../models/player.model';
import { GameState } from '../models/game-state.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameState = signal<GameState>(this.createInitialState());

  // Public signals
  readonly state = this.gameState.asReadonly();

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
      chatLog: []
    };
  }

  private getRandomComputerNames(count: number): string[] {
    const availableNames = ['Lina', 'Robert', 'Titus', 'Fischi', 'Manu', 'Ole', 'Willi', 'Lukas', 'Hans', 'Sebi'];
    const shuffled = [...availableNames].sort(() => Math.random() - 0.5);
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
      isActive: index === 0
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
      }]
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
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  private addChatLog(playerName: string, message: string, type: 'play' | 'draw' | 'suit' | 'skip' | 'penalty' | 'win'): void {
    const state = this.gameState();
    state.chatLog.push({
      timestamp: new Date(),
      playerName,
      message,
      type
    });
    this.gameState.set({ ...state });
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

    // Bei Strafkarten (7er): Nur weitere 7er können gelegt werden
    // Diese Regel hat Vorrang vor allen anderen (auch vor Buben!)
    if (state.drawPenalty > 0) {
      return card.rank === '7';
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

    // Reset chosenSuit wenn eine Karte gelegt wird (außer bei Bube)
    // Die gewählte Farbe gilt nur für den NÄCHSTEN Zug, nicht dauerhaft
    const hasJack = card.rank === 'J' || additionalCard?.rank === 'J';
    if (!hasJack && state.chosenSuit) {
      state.chosenSuit = null;
    }

    // Handle Ace - requires additional card
    if (card.rank === 'A') {
      if (additionalCard) {
        const additionalIndex = currentPlayer.hand.findIndex(c => c.id === additionalCard.id);
        if (additionalIndex !== -1) {
          currentPlayer.hand.splice(additionalIndex, 1);
          state.discardPile.push(card, additionalCard);
          state.lastPlayedCard = additionalCard;
          // Log
          this.addChatLog(currentPlayer.name, 
            `spielt ${this.getCardDisplayName(card)} + ${this.getCardDisplayName(additionalCard)}`, 
            'play');
          // Apply effect of additional card
          this.applyCardEffect(additionalCard);
        }
      } else {
        // If no additional card and it's the last card, player can't win
        state.discardPile.push(card);
        state.lastPlayedCard = card;
        this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)}`, 'play');
      }
    } else {
      state.discardPile.push(card);
      state.lastPlayedCard = card;
      // Log
      this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)}`, 'play');
      // Apply card effects for non-Ace cards
      this.applyCardEffect(card);
    }

    // Check for win condition
    if (currentPlayer.hand.length === 0) {
      state.gameOver = true;
      state.winner = currentPlayer;
      this.addChatLog(currentPlayer.name, `hat gewonnen! 🎉`, 'win');
      this.gameState.set({ ...state });
      return;
    }

    // If Jack was played (either as main card or additional card), don't proceed to next turn
    // Otherwise, proceed to next turn
    if (!hasJack) {
      this.nextTurn();
    } else {
      console.log('Bube gespielt von', currentPlayer.name, '- warte auf Farbwahl');
      
      // Sicherheits-Timeout: Falls nach 3 Sekunden keine Farbwahl erfolgt, wähle automatisch
      if (!currentPlayer.isHuman) {
        setTimeout(() => {
          const currentState = this.gameState();
          // Nur wenn immer noch keine Farbe gewählt wurde und kein Spielende
          if (!currentState.gameOver && !currentState.chosenSuit) {
            console.warn('Notfall-Farbwahl für', currentPlayer.name, '- Timeout erreicht');
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
        }, 3000);
      }
    }
  }

  private applyCardEffect(card: Card): void {
    const state = this.gameState();

    switch (card.rank) {
      case '7':
        // Nächster Spieler muss 2 Karten ziehen (kann sich akkumulieren)
        state.drawPenalty += 2;
        break;
      
      case '8':
        // Nächster Spieler wird übersprungen
        state.skipNext = true;
        const currentPlayer = state.players[state.currentPlayerIndex];
        this.addChatLog(currentPlayer.name, 'lässt den nächsten Spieler aussetzen', 'skip');
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
    this.nextTurn();
  }

  drawCard(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Handle draw penalty from 7s
    const cardsToDraw = state.drawPenalty > 0 ? state.drawPenalty : 1;

    for (let i = 0; i < cardsToDraw; i++) {
      if (state.deck.length === 0) {
        this.reshuffleDeck();
      }
      const card = state.deck.pop();
      if (card) {
        currentPlayer.hand.push(card);
      }
    }

    // Log
    if (cardsToDraw > 1) {
      this.addChatLog(currentPlayer.name, `zieht ${cardsToDraw} Karten (Strafe)`, 'penalty');
    } else {
      this.addChatLog(currentPlayer.name, `zieht 1 Karte`, 'draw');
    }

    // Reset draw penalty after drawing
    if (state.drawPenalty > 0) {
      state.drawPenalty = 0;
    }

    this.gameState.set({ ...state });

    // Prüfe, ob Spieler nach dem Ziehen noch legen kann
    const playableCards = currentPlayer.hand.filter(card => this.canPlayCard(card));
    if (playableCards.length > 0) {
      // Spieler bleibt am Zug, UI muss passende Karten anzeigen
      // (Für KI: spiele direkt die erste passende Karte)
      if (!currentPlayer.isHuman) {
        const cardToPlay = playableCards[0];
        this.playCard(cardToPlay);
      }
      // Menschlicher Spieler: UI muss Auswahl ermöglichen
      // Kein nextTurn!
    } else {
      // Keine passende Karte, Zug endet
      this.nextTurn();
    }
  }

  private reshuffleDeck(): void {
    const state = this.gameState();
    
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

    // If there's a draw penalty, check if AI has a 7
    if (state.drawPenalty > 0) {
      const seven = currentPlayer.hand.find(c => c.rank === '7');
      if (seven) {
        this.playCard(seven);
        return;
      }
    }

    // Ermittle alle spielbaren Karten
    const playableCards = currentPlayer.hand.filter(card => this.canPlayCard(card));

    if (playableCards.length > 0) {
      // Für den Computer: Wähle die erste spielbare Karte.
      const cardToPlay = playableCards[0];
      if (cardToPlay.rank === 'A' && currentPlayer.hand.length > 1) {
        // Ass-Logik: Spiele das Ass mit einer zusätzlichen Karte
        const additionalCard = currentPlayer.hand.find(c => c.id !== cardToPlay.id);
        this.playCard(cardToPlay, additionalCard);
        
        // Wenn die zusätzliche Karte ein Bube ist, muss auch eine Farbe gewählt werden
        if (additionalCard?.rank === 'J') {
          const playerId = currentPlayer.id;
          const playerName = currentPlayer.name;
          setTimeout(() => {
            console.log('setTimeout für Farbwahl nach Ass+Bube wird ausgeführt für', playerName);
            const currentState = this.gameState();
            if (currentState.gameOver) return;
            
            const currentPlayerNow = currentState.players.find(p => p.id === playerId);
            if (!currentPlayerNow) return;
            
            const suitCounts = this.countSuits(currentPlayerNow.hand);
            const suitEntries = Object.entries(suitCounts);
            const chosenSuit = suitEntries.length > 0 
              ? suitEntries.sort((a, b) => b[1] - a[1])[0][0] as Suit
              : 'hearts' as Suit;
            
            console.log(playerName, 'wählt Farbe:', chosenSuit);
            this.chooseSuit(chosenSuit);
          }, 500);
        }
      } else if (cardToPlay.rank === 'J') {
        console.log(currentPlayer.name, 'spielt Bube');
        const playerId = currentPlayer.id; // Speichere ID statt Referenz
        const playerName = currentPlayer.name;
        this.playCard(cardToPlay);
        // Wähle Farbe basierend auf verbleibenden Karten
        setTimeout(() => {
          console.log('setTimeout für Farbwahl wird ausgeführt für', playerName, 'ID:', playerId);
          const currentState = this.gameState();
          if (currentState.gameOver) {
            console.log('Spiel vorbei - keine Farbwahl');
            return;
          }
          
          const currentPlayerNow = currentState.players.find(p => p.id === playerId);
          if (!currentPlayerNow) {
            console.error('Spieler nicht gefunden:', playerId, 'Verfügbare Spieler:', currentState.players.map(p => p.id));
            // Fallback: Wenn Spieler nicht gefunden, wähle Standardfarbe
            this.chooseSuit('hearts' as Suit);
            return;
          }
          
          const suitCounts = this.countSuits(currentPlayerNow.hand);
          const suitEntries = Object.entries(suitCounts);
          
          // Wenn noch Karten vorhanden: Wähle häufigste Farbe, sonst Standardfarbe
          const chosenSuit = suitEntries.length > 0 
            ? suitEntries.sort((a, b) => b[1] - a[1])[0][0] as Suit
            : 'hearts' as Suit; // Standardfarbe falls keine Karten mehr
          
          console.log(playerName, 'wählt Farbe:', chosenSuit);
          this.chooseSuit(chosenSuit);
        }, 500);
      } else {
        this.playCard(cardToPlay);
      }
    } else {
      // Keine spielbare Karte, ziehe eine Karte
      this.drawCard();
    }
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
}
