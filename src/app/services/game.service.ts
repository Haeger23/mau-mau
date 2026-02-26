import { Injectable, signal, inject } from '@angular/core';
import { Card, RANKS, SUITS, Suit, Rank } from '../models/card.model';
import { Player } from '../models/player.model';
import { GameState } from '../models/game-state.model';
import { SeededRandom } from '../../utils/seeded-random';
import { RuleEngine } from './rule-engine.service';
import { AIService, AIGameActions } from './ai.service';
import { AI_TIMING } from '../constants/timing.constants';

@Injectable({
  providedIn: 'root'
})
export class GameService implements AIGameActions {
  private gameState = signal<GameState>(this.createInitialState());
  private rng = new SeededRandom();
  private ruleEngine = inject(RuleEngine);
  private aiService = inject(AIService);

  // Public signals
  readonly state = this.gameState.asReadonly();

  constructor() {
    // Initialize AI service with callbacks to this service
    this.aiService.init(this);
  }

  /**
  * Sets seed for deterministic testing
  * @param seed - Random seed value
  */
  setSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
    this.aiService.setSeed(seed);
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
    'QUEEN_NOT_PLAYED': '§9.A DAMENRUNDE: Eine Damenrunde muss mit einer echten Dame beginnen. Eine 10 (Replikator) zählt hier nicht!',
    'QUEEN_END_MISSED': '§9.A DAMENRUNDE: Falls ein Spieler vergisst eine Damenrunde zu beenden, muss ebenfalls eine Strafkarte gezogen werden.',
    'QUEEN_END_FALSE': '§9.A DAMENRUNDE: Nur der Spieler, welcher die Damenrunde gestartet hat, darf das Ende der Damenrunde ausrufen.',
    'QUEEN_FORGOT_TO_END': '§9.A DAMENRUNDE: Eine Damenrunde muss mit einer echten Dame beendet werden. Eine 10 (Replikator) zählt hier nicht!',
    'ACE_LAST_CARD': 'ASS-REGEL: Durch die Pflicht des Spielens, kann ein Spiel nicht mit einem Ass beendet werden.',
    'JACK_REPLICATION': '§7 BUBE: Bube auf Bube geht nicht! Eine 10 die einen Buben repliziert, verletzt diese Regel.',
    'SEVEN_ESCAPE': '§6 SIEBENER-KETTE: Ein Spieler kann einer Siebener-Strafe entkommen, indem er selbst eine 7 spielt. Alternativ kann auch eine 10 gespielt werden, die die 7 repliziert. Die Strafkarten akkumulieren sich dann (+2) und gehen an den nächsten Spieler weiter.',
    'INVALID_CARD_PLAYED': '§2 SPIELPFLICHT: Eine ungültige Karte wurde gespielt. Die Karte passt nicht auf die ausliegende Karte.',
    'TURN_ENDED_TOO_EARLY': '§2 SPIELPFLICHT: Der Zug wurde vorzeitig beendet. Es fehlt noch eine Aktion (z.B. Karte spielen, Karten ziehen, Mau sagen).',
    'PENALTY_SKIPPED_NO_CARDS': '§4 STRAFKARTEN: Wenn der Nachziehstapel leer ist und keine Karten mehr nachgemischt werden können, entfällt die Strafe. Dies kann passieren wenn viele Spieler am Tisch sind und viele Karten auf den Händen bzw. als Strafkarten verteilt wurden.'
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
      turnPhase: 'WAITING_FOR_ACTION',
      lastPlayerAction: null,
      queenRoundActive: false,
      queenRoundStarterId: null,
      queenRoundNeedsFirstQueen: false,
      queenRoundStartedThisTurn: false,
      queenRoundEndedThisTurn: false,
      nineBaseActive: false,
      nineBaseSuit: null,
      nineBasePlayerId: null,
      awaitingSuitChoice: false
    };
  }

  getAvailablePlayerNames(): Array<{name: string, image: string}> {
    return [
      { name: 'Hans', image: '/images/players/hans.webp' },
      { name: 'Lina', image: '/images/players/lina.webp' },
      { name: 'Lukas', image: '/images/players/lukas.webp' },
      { name: 'Manu', image: '/images/players/manuel.webp' },
      { name: 'Max', image: '/images/players/max.webp' },
      { name: 'Ole', image: '/images/players/ole.webp' },
      { name: 'Robert', image: '/images/players/robert.webp' },
      { name: 'Sebastian', image: '/images/players/sebastian.webp' },
      { name: 'Titus', image: '/images/players/titus.webp' },
      { name: 'Willi', image: '/images/players/willi.webp' }
    ];
  }

  private getRandomComputerNames(count: number, excludeName?: string): string[] {
    let availablePlayers = this.getAvailablePlayerNames();
    
    // Entferne gewählten Spielernamen aus der Liste
    if (excludeName) {
      availablePlayers = availablePlayers.filter(player => player.name.toLowerCase() !== excludeName.toLowerCase());
    }
    
    const shuffled = [...availablePlayers].sort(() => this.rng.next() - 0.5);
    return shuffled.slice(0, count).map(player => player.name);
  }

  startNewGame(playerNames: string[] = ['Du', 'Computer 1', 'Computer 2']): void {
    // Reset AI guard bei neuem Spiel
    this.aiService.resetGuard();
    
    const deck = this.createDeck();
    this.shuffleDeck(deck);

    // Ersetze Computer-Namen durch zufällige Namen (ohne den Spielernamen)
    const playerName = playerNames[0];
    const computerCount = playerNames.length - 1; // Alle außer Spieler
    const randomNames = this.getRandomComputerNames(computerCount, playerName);
    const finalNames = playerNames.map((name, index) => 
      index === 0 ? name : randomNames[index - 1] || name
    );

    // Zufälligen Startspieler wählen
    const startingPlayerIndex = Math.floor(this.rng.next() * finalNames.length);

    const players: Player[] = finalNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      hand: [],
      isHuman: index === 0,
      isActive: index === startingPlayerIndex,
      penaltyCards: [], // deprecated - kept for backward compat
      lockedPenaltyCards: [],
      pickupablePenaltyCards: [],
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

    // Place first card on discard pile (reshuffle if Jack)
    let firstCard = deck.pop();
    while (firstCard && firstCard.rank === 'J') {
      // Bube als Startkarte nicht erlaubt — zurücklegen und neu mischen
      deck.push(firstCard);
      this.shuffleDeck(deck);
      firstCard = deck.pop();
    }
    const discardPile = firstCard ? [firstCard] : [];

    // Startkarten-Effekte ermitteln
    let startDrawPenalty = 0;
    let startSkipNext = false;
    let startActiveAce = false;
    if (firstCard) {
      switch (firstCard.rank) {
        case '7':
          startDrawPenalty = 2;
          break;
        case '8':
          startSkipNext = true;
          break;
        case 'A':
          startActiveAce = true;
          break;
        // Q, 9, 10, K: kein Starteffekt
      }
    }

    const startingPlayer = players[startingPlayerIndex];
    this.gameState.set({
      players,
      currentPlayerIndex: startingPlayerIndex,
      deck,
      discardPile,
      drawPenalty: startDrawPenalty,
      skipNext: startSkipNext,
      activeAce: startActiveAce,
      chosenSuit: null,
      gameOver: false,
      winner: null,
      lastPlayedCard: firstCard || null,
      chatLog: [
        {
          timestamp: new Date(),
          playerName: 'System',
          message: 'Spiel gestartet!',
          type: 'play'
        },
        ...(firstCard ? [{
          timestamp: new Date(),
          playerName: 'System',
          message: `Startkarte: ${this.getCardDisplayName(firstCard)}`,
          type: 'play' as const
        }] : []),
        {
          timestamp: new Date(),
          playerName: 'System',
          message: `${startingPlayer.name} beginnt`,
          type: 'play' as const
        }
      ],
      turnPhase: 'WAITING_FOR_ACTION',
      lastPlayerAction: null,
      queenRoundActive: false,
      queenRoundStarterId: null,
      queenRoundNeedsFirstQueen: false,
      queenRoundStartedThisTurn: false,
      queenRoundEndedThisTurn: false,
      nineBaseActive: false,
      nineBaseSuit: null,
      nineBasePlayerId: null,
      awaitingSuitChoice: false
    });

    // Wenn KI als erstes dran ist, automatisch starten
    if (!startingPlayer.isHuman) {
      setTimeout(() => this.triggerAIPlay(), AI_TIMING.TURN_DELAY);
    }
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

    let actualCount = 0;
    
    // Ziehe Strafkarten vom Deck
    for (let i = 0; i < count; i++) {
      // Prüfe ob Deck leer ist
      if (state.deck.length === 0) {
        // Versuche nachzumischen
        this.reshuffleDeck();
        // Get updated state after reshuffle
        const updatedState = this.gameState();
        state.deck = updatedState.deck;
        state.discardPile = updatedState.discardPile;
      }
      
      // Wenn Deck immer noch leer ist (alle Karten verteilt), entfällt die Strafe
      if (state.deck.length === 0) {
        // Keine Karten mehr verfügbar - Strafe entfällt für restliche Karten
        break;
      }
      
      const card = state.deck.pop();
      if (card) {
        // Neue Strafkarten gehen zu lockedPenaltyCards
        // Sie werden erst nach einem gültigen Zug zu pickupablePenaltyCards
        player.lockedPenaltyCards.push(card);
        player.penaltyCards.push(card); // deprecated - für Rückwärtskompatibilität
        actualCount++;
      }
    }

    // Reset lastPlayerAction and turnPhase
    state.lastPlayerAction = null;
    state.turnPhase = 'WAITING_FOR_ACTION';

    // Log mit Regel-Erklärung
    if (actualCount === 0) {
      // Strafe komplett entfallen - keine Karten mehr
      this.addChatLog(
        player.name,
        `hat Glück gehabt! 🍀 Strafe entfällt (${reason}) - der Nachziehstapel ist leer`,
        'play',
        'PENALTY_SKIPPED_NO_CARDS'
      );
    } else if (actualCount < count) {
      // Strafe teilweise entfallen
      this.addChatLog(
        player.name,
        `erhält ${actualCount} von ${count} Strafkarte(n): ${reason} (Rest entfällt - keine Karten mehr)`,
        'penalty',
        ruleKey
      );
    } else {
      // Volle Strafe
      this.addChatLog(
        player.name,
        `erhält ${count} Strafkarte(n): ${reason}`,
        'penalty',
        ruleKey
      );
    }

    this.gameState.set({ ...state });
  }

  /**
   * Nimmt eine einzelne Strafkarte auf
   * @param playerId ID des Spielers
   * @param cardId ID der aufzunehmenden Karte
   * @param isPickupable true wenn aus pickupablePenaltyCards, false wenn aus lockedPenaltyCards
   */
  pickupSinglePenaltyCard(playerId: string, cardId: string, isPickupable: boolean): void {
    const state = this.gameState();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    if (isPickupable) {
      // Aufnehmbare Karte - erlaubt
      const cardIndex = player.pickupablePenaltyCards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;
      
      const card = player.pickupablePenaltyCards.splice(cardIndex, 1)[0];
      player.hand.push(card);
      
      this.addChatLog(player.name, 'nimmt 1 Strafkarte auf', 'draw');
    } else {
      // Gesperrte Karte - Strafe für zu frühes Aufnehmen
      this.assignPenaltyCards(
        playerId,
        1,
        'Strafkarten zu früh aufgenommen',
        'PENALTY_TOO_EARLY'
      );
      return;
    }
    
    // Update deprecated penaltyCards array
    player.penaltyCards = [...player.lockedPenaltyCards, ...player.pickupablePenaltyCards];
    
    this.gameState.set({ ...state });
  }

  pickupPenaltyCards(playerId: string): void {
    const state = this.gameState();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Nur pickupable Karten aufnehmen
    if (player.pickupablePenaltyCards.length === 0) {
      // Keine aufnehmbaren Karten - Strafe wenn locked vorhanden
      if (player.lockedPenaltyCards.length > 0) {
        this.assignPenaltyCards(
          playerId,
          1,
          'Strafkarten zu früh aufgenommen',
          'PENALTY_TOO_EARLY'
        );
      }
      return;
    }

    // Verschiebe alle aufnehmbaren Strafkarten zur Hand
    const count = player.pickupablePenaltyCards.length;
    player.hand.push(...player.pickupablePenaltyCards);
    player.pickupablePenaltyCards = [];
    
    // Update deprecated penaltyCards array
    player.penaltyCards = [...player.lockedPenaltyCards, ...player.pickupablePenaltyCards];

    this.addChatLog(
      player.name,
      `nimmt ${count} Strafkarte(n) auf`,
      'draw'
    );

    this.gameState.set({ ...state });
    
    // Nach Aufnahme: KI setzt ihren Zug fort
    if (!player.isHuman) {
      this.aiService.resetGuard();
      setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.PENALTY_PICKUP_DELAY);
    }
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
    return `${suitNames[card.suit]} ${rankNames[card.rank]}`;
  }

  canPlayCard(card: Card): boolean {
    // Use the RuleEngine for card validation
    const state = this.gameState();
    console.log(`[canPlayCard] Checking card ${card.rank} ${card.suit}, chosenSuit is: ${state.chosenSuit}`);
    return this.ruleEngine.isCardPlayable(card, state);
  }

  playCard(card: Card, additionalCard?: Card | Card[]): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    // DAMENRUNDE REGEL: Nach Ankündigung MUSS erste Karte eine ECHTE Dame sein
    // (10 als Replikator zählt hier NICHT - Damenrunde muss mit Dame beginnen!)
    if (state.queenRoundNeedsFirstQueen && currentPlayer.isQueenRoundStarter) {
      if (card.rank !== 'Q') {
        // Karte zurück auf die Hand
        this.assignPenaltyCards(
          currentPlayer.id,
          1,
          'Damenrunde muss mit einer echten Dame beginnen (keine 10!)',
          'QUEEN_NOT_PLAYED'
        );
        // Damenrunde abbrechen
        state.queenRoundActive = false;
        state.queenRoundStarterId = null;
        state.queenRoundNeedsFirstQueen = false;
        currentPlayer.inQueenRound = false;
        currentPlayer.isQueenRoundStarter = false;
        this.gameState.set({ ...state });
        
        // Für KI: Triggere erneut den KI-Zug nach kurzer Verzögerung
        if (!currentPlayer.isHuman) {
          this.aiService.resetGuard();
          setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
        }
        return;
      }
      // Dame oder 10 wurde gespielt - Flag zurücksetzen
      state.queenRoundNeedsFirstQueen = false;
    }
    
    // Remove card from player's hand
    const cardIndex = currentPlayer.hand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) return;
    
    currentPlayer.hand.splice(cardIndex, 1);

    // Aktive 9er-Basis-Kette: gleiche Farbe erlaubt, Effekt verzögert bis Zugende
    if (state.nineBaseActive && state.nineBasePlayerId === currentPlayer.id) {
      if (card.suit !== state.nineBaseSuit) {
        // Ungültig: andere Farbe während 9er-Kette
        currentPlayer.hand.push(card);
        this.assignPenaltyCards(
          currentPlayer.id,
          1,
          '9er-Basis: Nur Karten der gleichen Farbe erlaubt',
          'NINE_INVALID_SUIT'
        );
        this.gameState.set({ ...state });
        return;
      }

      // Karte ablegen, Effekt NICHT anwenden (wird beim Zugende angewendet)
      state.discardPile.push(card);
      state.lastPlayedCard = card;
      state.lastPlayerAction = 'play';
      state.turnPhase = 'CARD_PLAYED';
      this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)}`, 'play');
      this.gameState.set({ ...state });
      return;
    }
    
    // 9ER BASISKARTE: Mehrere Karten gleicher Farbe können zusammen gespielt werden
    if (card.rank === '9' && additionalCard) {
      const additionalCards = Array.isArray(additionalCard) ? additionalCard : [additionalCard];
      
      // Validiere: Alle zusätzlichen Karten müssen die gleiche Farbe wie die 9 haben
      const allSameSuit = additionalCards.every(c => c.suit === card.suit);
      
      if (!allSameSuit) {
        // Ungültige Kombination - Karte zurück, Strafe
        currentPlayer.hand.push(card);
        this.assignPenaltyCards(
          currentPlayer.id,
          1,
          '9er-Basis: Nicht alle Karten haben die gleiche Farbe',
          'NINE_INVALID_SUIT'
        );
        this.gameState.set({ ...state });
        return;
      }
      
      // Entferne alle zusätzlichen Karten von der Hand
      additionalCards.forEach(addCard => {
        const idx = currentPlayer.hand.findIndex(c => c.id === addCard.id);
        if (idx !== -1) {
          currentPlayer.hand.splice(idx, 1);
        }
      });
      
      // Lege die 9 zuerst ab
      state.discardPile.push(card);
      
      // Dann alle zusätzlichen Karten
      additionalCards.forEach(addCard => {
        state.discardPile.push(addCard);
      });
      
      // Die oberste Karte ist relevant für den nächsten Spieler
      const topCard = additionalCards[additionalCards.length - 1];
      state.lastPlayedCard = topCard;
      state.lastPlayerAction = 'play';
      state.turnPhase = 'CARD_PLAYED';
      
      const cardsPlayed = additionalCards.length + 1;
      this.addChatLog(
        currentPlayer.name,
        `spielt ${cardsPlayed} Karten mit 9er-Basis (oberste: ${this.getCardDisplayName(topCard)})`,
        'play'
      );
      
      // State MUSS gesetzt werden BEVOR applyCardEffect aufgerufen wird
      this.gameState.set({ ...state });
      
      // Wende den Effekt der OBERSTEN Karte an (nicht der 9)
      const nineBaseMoveValid = this.applyCardEffect(topCard);
      
      // If move was invalid (e.g., 10 replicated Jack), player stays active
      if (!nineBaseMoveValid) {
        // Für KI: Triggere erneut den KI-Zug nach kurzer Verzögerung
        if (!currentPlayer.isHuman) {
          this.aiService.resetGuard();
          setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
        }
        // Spieler bleibt am Zug - KEIN nextTurn()
        return;
      }
      
      // State nach Effekt holen
      const stateAfterEffect = this.gameState();
      const currentPlayerAfter = stateAfterEffect.players[stateAfterEffect.currentPlayerIndex];
      
      // Jack als letzte Karte: auf "Mau-Mau" warten, Spiel noch nicht beenden
      if (currentPlayerAfter.hand.length === 0 && topCard.rank === 'J') {
        this.addChatLog(currentPlayerAfter.name, 'letzte Karte war Bube – warte auf "Mau-Mau"', 'mau-mau');
        this.gameState.set({ ...stateAfterEffect });
        return;
      }

      // Mau-Ansage nicht sofort prüfen – erst beim Zugende
      // Gewinnbedingung wird in endTurn() geprüft

      // Zug beenden (für alle Spieler)
      this.endTurn();
      return;
    }
    
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
      state.turnPhase = 'CARD_PLAYED';
      state.activeAce = true; // Spieler muss noch eine Aktion machen
      this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)} - ist erneut am Zug`, 'play');
      this.gameState.set({ ...state });
      
      // Wenn KI Ass gespielt hat, triggere nochmal aiPlay()
      if (!currentPlayer.isHuman) {
        // WICHTIG: Guard zurücksetzen, damit KI wieder spielen kann
        this.aiService.resetGuard();
        setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
      }
      
      // Spieler bleibt am Zug - KEIN nextTurn()!
      return;
    }

    // Normale Karte
    state.discardPile.push(card);
    state.lastPlayedCard = card;
    state.lastPlayerAction = 'play';
    state.turnPhase = 'CARD_PLAYED';
    
    // Merke activeAce VOR applyCardEffect, um 10-repliziertes-Ass zu erkennen
    const wasActiveAceBefore = state.activeAce;
    // Wenn eine Karte nach einem Ass gespielt wird, reset activeAce
    if (state.activeAce) {
      state.activeAce = false;
    }

    // Log nur wenn nicht 7er-Escape (wird in applyCardEffect geloggt)
    if (!isEscapingWith7) {
      // Bei 8er: Kombiniere mit Skip-Info
      if (card.rank === '8') {
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        const nextPlayer = state.players[nextPlayerIndex];
        this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)}, ${nextPlayer.name} setzt aus`, 'skip');
      } else {
        this.addChatLog(currentPlayer.name, `spielt ${this.getCardDisplayName(card)}`, 'play');
      }
    }
    // Wenn 9 alleine gespielt wurde: starte 9er-Basis-Kette
    if (card.rank === '9' && !additionalCard) {
      state.nineBaseActive = true;
      state.nineBaseSuit = card.suit;
      state.nineBasePlayerId = currentPlayer.id;
      // State früh committen, damit nach playCard() sofort sichtbar
      this.gameState.set({ ...state });
    }

    const moveValid = this.applyCardEffect(card);

    // If move was invalid (e.g., 10 replicated Jack), player stays active
    if (!moveValid) {
      // Für KI: Triggere erneut den KI-Zug nach kurzer Verzögerung
      if (!currentPlayer.isHuman) {
        this.aiService.resetGuard();
        setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
      }
      // Spieler bleibt am Zug - KEIN nextTurn()
      return;
    }

    // 10 hat Ass repliziert → Spieler bleibt am Zug (wie bei direkt gespieltem Ass)
    if (state.activeAce && !wasActiveAceBefore) {
      this.gameState.set({ ...state });
      if (!currentPlayer.isHuman) {
        this.aiService.resetGuard();
        setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
      }
      return;
    }

    // Jack als letzte Karte: auf "Mau-Mau" warten, Spiel noch nicht beenden
    if (currentPlayer.hand.length === 0 && card.rank === 'J') {
      this.addChatLog(currentPlayer.name, 'letzte Karte war Bube – warte auf "Mau-Mau"', 'mau-mau');
      this.gameState.set({ ...state });
      return;
    }

    // Mau-Ansage nicht sofort prüfen – erst beim Zugende
    // Gewinnbedingung wird in endTurn() geprüft

    // If Jack was played, don't proceed to next turn
    if (!hasJack) {
      // Für Menschen: Warte auf manuelles "Zug beenden"
      // Für KI: Automatisch endTurn() aufrufen (inkl. Penalty-/Gewinnprüfung)
      if (!currentPlayer.isHuman) {
        console.log(`[playCard] AI ${currentPlayer.name} finished playing ${card.rank}, calling endTurn()`);
        this.endTurn();
      }
      // Menschlicher Spieler muss "Zug beenden" klicken
    } else {
      // Markiere dass Farbwahl erwartet wird
      const jackState = this.gameState();
      jackState.awaitingSuitChoice = true;
      jackState.turnPhase = 'AWAITING_SUIT_CHOICE';
      this.gameState.set({ ...jackState });
      
      // AI suit choice is handled by AIService.playJackWithSuitChoice()
      // Human players use the SuitSelectorComponent
    }
  }

  /**
   * Apply the effect of a card
   * @returns true if the move was valid, false if the card was returned to hand
   */
  private applyCardEffect(card: Card): boolean {
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
        // Ermittle den Namen des nächsten Spielers
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        const nextPlayer = state.players[nextPlayerIndex];
        // Kein separater Log - wird beim playCard combined
        break;

      case '9':
        // 9er Basiskarte: Wird in playCard() durch additionalCard Parameter behandelt
        // Wenn die 9 alleine gespielt wird, hat sie keinen speziellen Effekt
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
            
            // Erst State committen mit der zurückgegebenen Karte
            this.gameState.set({ ...state });
            
            this.addChatLog(currentPlayer.name, 'repliziert Bube (Bube auf Bube verboten!) - Karte zurück', 'penalty');
            this.assignPenaltyCards(
              currentPlayer.id,
              1,
              'Bube-Replikation nicht erlaubt (Bube auf Bube)',
              'JACK_REPLICATION'
            );
            
            // Ungültiger Zug - Spieler bleibt am Zug und muss weiterspielen
            // Return false to indicate invalid move
            // State wurde bereits durch assignPenaltyCards() mit turnPhase='WAITING_FOR_ACTION' committed
            return false;
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
              // Kein separater Log - wird kombiniert angezeigt
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
            
            case 'A':
              state.activeAce = true;
              this.addChatLog(currentPlayer.name, `repliziert ${this.getCardDisplayName(cardBelow)} - ist erneut am Zug`, 'play');
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
    return true; // Valid move
  }

  chooseSuit(suit: Suit): void {
    const state = this.gameState();
    if (state.gameOver) {
      return;
    }
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    const suitNames: Record<string, string> = {
      'hearts': '♥️ Herz',
      'diamonds': '♦️ Karo',
      'clubs': '♣️ Kreuz',
      'spades': '♠️ Pik'
    };
    
    this.addChatLog(currentPlayer.name, `wünscht sich ${suitNames[suit]}`, 'suit');
    
    state.chosenSuit = suit;
    state.awaitingSuitChoice = false; // Farbwahl abgeschlossen
    state.turnPhase = 'SUIT_CHOSEN';
    console.log(`[chooseSuit] Setting chosenSuit to: ${suit}`);
    this.gameState.set({ ...state });
    console.log(`[chooseSuit] After set, chosenSuit is: ${this.gameState().chosenSuit}`);
    
    // Für Menschen: Warte auf manuelles "Zug beenden"
    // Für KI: Automatisch endTurn() (inkl. Penalty-/Gewinnprüfung)
    if (!currentPlayer.isHuman) {
      this.endTurn();
    }
  }

  drawCard(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Nur 1 Karte ziehen erlaubt (ohne 7er-Strafe) - jede weitere = Strafkarte
    if (state.turnPhase === 'DRAW_COMPLETE' && currentPlayer.requiredDrawCount === 0 && state.drawPenalty === 0) {
      this.assignPenaltyCards(currentPlayer.id, 1, 'Nur 1 Karte ziehen erlaubt', 'DRAW_TOO_MANY');
      return;
    }

    // DAMENRUNDE ESCAPE: Wenn Damenrunde aktiv und Spieler keine Dame/10 hat,
    // darf er ziehen um dem "stuck" Zustand zu entkommen
    if (state.queenRoundActive) {
      const hasQueenOrTen = currentPlayer.hand.some(c => c.rank === 'Q' || c.rank === '10');
      if (!hasQueenOrTen) {
        // Spieler hat keine gültige Karte - Ziehen erlaubt als Escape
        this.addChatLog(currentPlayer.name, 'hat keine Dame/10 - zieht Karte', 'draw');
      }
    }
    
    // Wenn nach einem Ass gezogen wird, reset activeAce
    if (state.activeAce) {
      state.activeAce = false;
    }

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
      // Ziehpflicht erfüllt: Zug bleibt beim Spieler, Beschränkung fällt weg
      state.lastPlayerAction = 'draw-complete';
      state.turnPhase = 'DRAW_COMPLETE';
      state.drawPenalty = 0; // Beschränkung (nur 7/10) sofort aufheben
      currentPlayer.requiredDrawCount = 0; // Weitere Logik soll wie normales Ziehen reagieren
      this.addChatLog(
        currentPlayer.name,
        `hat ${currentPlayer.drawnThisTurn} Karte(n) gezogen`,
        'draw'
      );
    } else if (currentPlayer.requiredDrawCount === 0) {
      // Normales Ziehen ohne 7er-Strafe
      state.lastPlayerAction = 'draw-complete';
      state.turnPhase = 'DRAW_COMPLETE';
    }

    this.gameState.set({ ...state });

    // Prüfe, ob Spieler nach dem Ziehen noch legen kann (nur bei normalem Ziehen)
    // WICHTIG: Für KI wird dies vom AI-Service gesteuert, nicht hier!
    // Diese Logik ist nur für menschliche Spieler relevant (UI-Feedback)
    if (currentPlayer.requiredDrawCount === 0 && currentPlayer.isHuman) {
      const playableCards = currentPlayer.hand.filter(card => this.canPlayCard(card));
      if (playableCards.length === 0) {
        // Keine passende Karte - Mensch muss manuell "Zug beenden" klicken
        // (turnPhase ist bereits 'DRAW_COMPLETE', also kann er das)
      }
      // Wenn spielbar: Mensch kann entscheiden ob spielen oder beenden
    }
  }

  endTurn(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // WICHTIG: Gültiger Zug wurde abgeschlossen
    // Verschiebe alle locked Strafkarten zu pickupable für DIESEN Spieler
    if (currentPlayer.lockedPenaltyCards.length > 0) {
      currentPlayer.pickupablePenaltyCards.push(...currentPlayer.lockedPenaltyCards);
      currentPlayer.lockedPenaltyCards = [];
      // Update deprecated array
      currentPlayer.penaltyCards = [...currentPlayer.lockedPenaltyCards, ...currentPlayer.pickupablePenaltyCards];
    }

    // 9er-Basis-Kette: Wende Effekt der obersten Karte zuerst an und beende die Kette
    if (state.nineBaseActive && state.nineBasePlayerId === currentPlayer.id) {
      const topCard = state.discardPile[state.discardPile.length - 1];
      if (topCard) {
        this.applyCardEffect(topCard);
      }
      state.nineBaseActive = false;
      state.nineBaseSuit = null;
      state.nineBasePlayerId = null;
      this.gameState.set({ ...state });
    }

    // Prüfe Zieh-Counter nur wenn eine Ziehpflicht bestand
    if (currentPlayer.requiredDrawCount > 0) {
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

    // Prüfe Mau-Mau: Wenn Hand leer und letzte Karte war Bube, aber keine Ansage
    const lastCard = state.discardPile[state.discardPile.length - 1];
    const wasJack = lastCard && lastCard.rank === 'J';
    if (currentPlayer.hand.length === 0 && wasJack && !currentPlayer.hasSaidMauMau) {
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        'Mau-Mau nicht gesagt (letzte Karte war Bube)',
        'MAUMAU_MISSED'
      );
      // Kein Sieg – durch Strafe wieder Karten auf der Hand
      this.gameState.set({ ...state });
    }

    // DAMENRUNDE: Prüfe ob Starter vergessen hat zu beenden
    // Nur wenn Damenrunde noch aktiv UND in diesem Zug nicht beendet wurde
    const endTurnState = this.gameState();
    const endTurnPlayer = endTurnState.players[endTurnState.currentPlayerIndex];
    if (endTurnState.queenRoundActive && endTurnPlayer.isQueenRoundStarter && !endTurnState.queenRoundEndedThisTurn && !endTurnState.queenRoundStartedThisTurn) {
      this.assignPenaltyCards(
        endTurnPlayer.id,
        1,
        'Damenrunde nicht beendet',
        'QUEEN_FORGOT_TO_END'
      );

      endTurnState.queenRoundActive = false;
      endTurnState.queenRoundStarterId = null;
      endTurnState.queenRoundNeedsFirstQueen = false;

      endTurnState.players.forEach(p => {
        p.inQueenRound = false;
        p.isQueenRoundStarter = false;
      });

      this.addChatLog(
        endTurnPlayer.name,
        'hat Damenrunde nicht beendet - automatisch beendet',
        'queen-round-end',
        'QUEEN_ROUND_AUTO_ENDED'
      );

      this.gameState.set({ ...endTurnState });
    }

    // Gewinnbedingung: Hand leer UND keine Strafkarten übrig
    const winCheckState = this.gameState();
    const winCheckPlayer = winCheckState.players[winCheckState.currentPlayerIndex];
    if (winCheckPlayer.hand.length === 0
        && winCheckPlayer.lockedPenaltyCards.length === 0
        && winCheckPlayer.pickupablePenaltyCards.length === 0) {
      winCheckState.gameOver = true;
      winCheckState.winner = winCheckPlayer;
      this.addChatLog(winCheckPlayer.name, 'hat gewonnen! 🎉', 'win');
      this.gameState.set({ ...winCheckState });
      return; // Kein nextTurn — Spiel ist vorbei
    }

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
    console.log(`[nextTurn] Before nextTurn, chosenSuit is: ${state.chosenSuit}`);

    // Reset turn phase and lastPlayerAction for new turn
    state.turnPhase = 'WAITING_FOR_ACTION';
    state.lastPlayerAction = null;
    state.activeAce = false; // Reset Ass-Flag für nächsten Spieler
    state.queenRoundStartedThisTurn = false; // Reset für nächsten Zug
    state.queenRoundEndedThisTurn = false; // Reset Damenrunde-Flag für nächsten Zug

    // Handle skip: skip next player and move to player after
    // In 2-player game: skip advances by 1 (to the other player, who then gets skipped)
    // In 3+ player game: skip advances by 2 (skip next, play the one after)
    if (state.skipNext) {
      state.skipNext = false;
      if (state.players.length === 2) {
        // 2-player: advance by 1, then the skipped player's turn is simply skipped
        // The player who played 8 already ended their turn, so next player is skipped
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      } else {
        // 3+ players: advance by 2 to skip next player
        state.currentPlayerIndex = (state.currentPlayerIndex + 2) % state.players.length;
      }
    } else {
      // Move to next player
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    }

    // Update active player
    state.players.forEach((p, i) => {
      p.isActive = i === state.currentPlayerIndex;
    });

    this.gameState.set({ ...state });
    console.log(`[nextTurn] After nextTurn, chosenSuit is: ${this.gameState().chosenSuit}`);

    // If next player is AI, play automatically after a delay
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer.isHuman && !state.gameOver) {
      // Reset guard before next AI turn
      this.aiService.resetGuard();
      setTimeout(() => this.triggerAIPlay(), AI_TIMING.TURN_DELAY);
    } else {
      // Human player or game over - reset guard
      this.aiService.resetGuard();
    }
  }

  /**
   * Trigger AI to play (called by AIService or internally)
   */
  triggerAIPlay(): void {
    this.aiService.playTurn(this.gameState());
  }

  /**
   * Get current game state (for AIGameActions interface)
   */
  getState(): GameState {
    return this.gameState();
  }

  /**
   * Reset draw penalty (for AIGameActions interface)
   */
  resetDrawPenalty(): void {
    const state = this.gameState();
    state.drawPenalty = 0;
    this.gameState.set({ ...state });
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
   * §9.A: "Mau"-Ansage wenn noch 1 Karte auf der Hand
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
   * Say "Mau" for a specific player (used by AI)
   * This is needed because sayMau() uses currentPlayer which might have changed after nextTurn()
   */
  sayMauForPlayer(playerId: string): void {
    const state = this.gameState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return;

    if (player.hasSaidMau) {
      // Bereits gesagt - ignoriere
      return;
    }

    // Prüfe ob Ansage korrekt ist (genau 1 Karte)
    if (player.hand.length === 1) {
      player.hasSaidMau = true;
      this.addChatLog(player.name, 'sagt "Mau"', 'mau', 'MAU_SAID');
      this.gameState.set({ ...state });
    } else {
      // Falsch-Ansage: +1 Strafkarte
      this.assignPenaltyCards(
        playerId,
        1,
        `"Mau" falsch gesagt (${player.hand.length} Karten statt 1)`,
        'MAU_FALSE'
      );
    }
  }

  /**
   * §10.A: "Mau-Mau"-Ansage NUR wenn letzte Karte ein Bube war
   * Darf NICHT gesagt werden wenn letzte Karte kein Bube ist
   * Falsch-Ansage: +1 Strafkarte
   */
  sayMauMau(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.hasSaidMauMau) {
      // Bereits gesagt - ignoriere
      return;
    }

    // Prüfe: Nur erlaubt wenn Hand leer UND letzte gespielte Karte war Bube
    const lastCard = state.discardPile[state.discardPile.length - 1];
    const wasJack = lastCard && lastCard.rank === 'J';
    
    if (currentPlayer.hand.length === 0 && wasJack) {
      // Korrekt: Hand leer und Bube als letzte Karte
      currentPlayer.hasSaidMauMau = true;
      this.addChatLog(currentPlayer.name, 'sagt "Mau-Mau"', 'mau-mau', 'MAUMAU_SAID');
      // Jetzt Sieg auslösen
      state.gameOver = true;
      state.winner = currentPlayer;
      this.addChatLog(currentPlayer.name, `hat gewonnen! 🎉`, 'win');
      this.gameState.set({ ...state });
    } else {
      // Falsch-Ansage: +1 Strafkarte
      let reason = '';
      if (currentPlayer.hand.length > 0) {
        reason = `Hand nicht leer (${currentPlayer.hand.length} Karte(n))`;
      } else if (!wasJack) {
        reason = 'Letzte Karte war kein Bube';
      }
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        `"Mau-Mau" falsch gesagt: ${reason}`,
        'MAUMAU_FALSE'
      );
    }
  }

  /**
   * Damenrunde ankündigen
   * Bedingung: mindestens 2 Damen auf der Hand UND mindestens eine Dame muss spielbar sein
   * Falsch-Ansage: +1 Strafkarte
   */
  announceQueenRound(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Wenn bereits eine Damenrunde aktiv ist
    if (state.queenRoundActive) {
      this.addChatLog(currentPlayer.name, 'versucht Damenrunde zu starten - bereits aktiv!', 'penalty');
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        'Damenrunde bereits aktiv',
        'QUEEN_FALSE'
      );
      // Für KI: Triggere erneut den KI-Zug
      if (!currentPlayer.isHuman) {
        this.aiService.resetGuard();
        setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
      }
      return;
    }

    // Zähle Damen auf der Hand
    const queens = currentPlayer.hand.filter(c => c.rank === 'Q');
    const queenCount = queens.length;

    if (queenCount < 2) {
      // Falsch-Ansage: nicht genug Damen
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        `Damenrunde falsch angekündigt (nur ${queenCount} Dame(n) statt mind. 2)`,
        'QUEEN_FALSE'
      );
      // Für KI: Triggere erneut den KI-Zug
      if (!currentPlayer.isHuman) {
        this.aiService.resetGuard();
        setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
      }
      return;
    }

    // Prüfe ob mindestens eine Dame spielbar ist
    // Wichtig: Wir prüfen die Standard-Spielbarkeit OHNE Damenrunden-Regeln
    const topCard = state.discardPile[state.discardPile.length - 1];
    
    // Rekursiv nach der echten Karte suchen (falls 10er-Replikation)
    let cardToMatch = topCard;
    let searchIndex = state.discardPile.length - 1;
    while (cardToMatch && cardToMatch.rank === '10' && searchIndex > 0) {
      searchIndex--;
      cardToMatch = state.discardPile[searchIndex];
    }
    
    // Prüfe ob eine Dame spielbar ist:
    // - Bei chosenSuit: Dame muss diese Farbe haben
    // - Sonst: Dame muss Farbe oder Rang (Q) mit cardToMatch teilen
    const hasPlayableQueen = queens.some(queen => {
      if (state.chosenSuit) {
        return queen.suit === state.chosenSuit;
      }
      // Dame passt wenn Farbe übereinstimmt (Rang Q auf Q wäre eh erlaubt)
      return queen.suit === cardToMatch?.suit || cardToMatch?.rank === 'Q';
    });

    if (!hasPlayableQueen) {
      // Falsch-Ansage: keine Dame passt auf den Stapel
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        'Damenrunde falsch angekündigt (keine Dame passt auf den Stapel)',
        'QUEEN_FALSE'
      );
      // Für KI: Triggere erneut den KI-Zug
      if (!currentPlayer.isHuman) {
        this.aiService.resetGuard();
        setTimeout(() => this.aiService.playTurn(this.gameState()), AI_TIMING.TURN_DELAY);
      }
      return;
    }

    // Korrekte Ansage
    state.queenRoundActive = true;
    state.queenRoundStarterId = currentPlayer.id;
    state.queenRoundNeedsFirstQueen = true; // Nächste Karte MUSS Dame sein
    state.queenRoundStartedThisTurn = true; // Startzug — kein Ende-Check in endTurn()
    currentPlayer.inQueenRound = true;
    currentPlayer.isQueenRoundStarter = true;
    
    this.addChatLog(
      currentPlayer.name, 
      'kündigt Damenrunde an', 
      'queen-round', 
      'QUEEN_ROUND_ANNOUNCED'
    );
    this.gameState.set({ ...state });
  }

  /**
   * Damenrunde beenden
   * Nur der Starter kann beenden
   * Regel: Muss mit Dame begonnen UND mit Dame beendet werden
   * (Spieler entscheidet selbst, wieviele Damen/10er er zwischendurch spielt)
   */
  endQueenRound(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Prüfe ob überhaupt eine Damenrunde aktiv ist
    if (!state.queenRoundActive) {
      this.addChatLog(currentPlayer.name, 'versucht Damenrunde zu beenden - keine aktiv!', 'penalty');
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        'Keine aktive Damenrunde',
        'QUEEN_END_FALSE'
      );
      return;
    }

    // Nur der Starter kann die Damenrunde beenden
    if (!currentPlayer.isQueenRoundStarter) {
      this.addChatLog(
        currentPlayer.name, 
        'versucht Damenrunde zu beenden - nur Starter darf das!', 
        'penalty'
      );
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        'Nur Starter darf Damenrunde beenden',
        'QUEEN_END_FALSE'
      );
      return;
    }

    // Prüfe ob die letzte gespielte Karte eine Dame war
    const lastPlayedCard = state.discardPile[state.discardPile.length - 1];
    const endedWithQueen = lastPlayedCard && lastPlayedCard.rank === 'Q';

    if (endedWithQueen) {
      // Korrekt beendet: mit Dame begonnen UND mit Dame beendet
      state.queenRoundActive = false;
      state.queenRoundStarterId = null;
      state.queenRoundNeedsFirstQueen = false;
      state.queenRoundEndedThisTurn = true;

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
      // Falsch beendet: letzte Karte war keine Dame -> +1 Strafkarte
      this.assignPenaltyCards(
        currentPlayer.id,
        1,
        'Damenrunde muss mit einer Dame beendet werden',
        'QUEEN_END_FALSE'
      );
    }
  }

  // ========== AUTOMATISCHE PENALTY-CHECKS ==========

  /**
   * §9.B: Prüft ob "Mau" gesagt werden musste
   * Wird aufgerufen nach playCard() und endTurn()
   * REGEL: "Mau" bei 1 Karte übrig
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



  // ========== UX: INVALID MOVES ==========

  /**
   * Spieler versucht eine ungültige Karte zu spielen
   * Karte bleibt auf der Hand, Spieler bekommt Strafkarte
   */
  playInvalidCard(card: Card): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    this.addChatLog(
      currentPlayer.name,
      `versucht ${this.getCardDisplayName(card)} zu spielen - ungültiger Zug!`,
      'penalty'
    );
    
    this.assignPenaltyCards(
      currentPlayer.id,
      1,
      'Ungültige Karte gespielt',
      'INVALID_CARD_PLAYED'
    );
  }

  /**
   * Prüft ob der Zug jetzt beendet werden kann
   * Wird vor endTurn() aufgerufen
   * Uses turnPhase state machine with fallback to lastPlayerAction
   */
  canEndTurnNow(): boolean {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    // Ass-Regel: Wenn activeAce true ist, muss noch eine weitere Aktion gemacht werden
    if (state.activeAce) {
      return false;
    }
    
    // Primary check: turnPhase state machine
    const validEndPhases: string[] = ['CARD_PLAYED', 'SUIT_CHOSEN', 'DRAW_COMPLETE'];
    if (validEndPhases.includes(state.turnPhase)) {
      return true;
    }
    
    // Fallback: legacy lastPlayerAction check (deprecated)
    // 1. lastPlayerAction ist 'play' (Karte wurde gespielt)
    // 2. lastPlayerAction ist 'draw-complete' (alle Karten gezogen)
    // 3. lastPlayerAction ist 'penalty-pickup' (Strafkarten aufgenommen)
    return state.lastPlayerAction === 'play' ||
           state.lastPlayerAction === 'draw-complete' ||
           state.lastPlayerAction === 'penalty-pickup' ||
           (currentPlayer.drawnThisTurn > 0 && 
            currentPlayer.requiredDrawCount > 0 && 
            currentPlayer.drawnThisTurn >= currentPlayer.requiredDrawCount);
  }

  /**
   * Spieler versucht Zug zu früh zu beenden
   * Bekommt Strafkarte und Zug wird NICHT beendet
   */
  endTurnTooEarly(): void {
    const state = this.gameState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    let reason = 'Zug vorzeitig beendet';
    
    // Gib spezifischen Grund
    if (state.lastPlayerAction === null || state.lastPlayerAction === 'awaiting-draw') {
      reason = 'Noch keine Aktion durchgeführt (Karte spielen oder ziehen)';
    } else if (currentPlayer.requiredDrawCount > 0 && currentPlayer.drawnThisTurn < currentPlayer.requiredDrawCount) {
      reason = `Zu wenig Karten gezogen (${currentPlayer.drawnThisTurn}/${currentPlayer.requiredDrawCount})`;
    }
    
    this.addChatLog(
      currentPlayer.name,
      `versucht Zug zu beenden - ${reason}`,
      'penalty'
    );
    
    this.assignPenaltyCards(
      currentPlayer.id,
      1,
      reason,
      'TURN_ENDED_TOO_EARLY'
    );
  }
}

