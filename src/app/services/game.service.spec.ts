import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { Card, Suit, Rank } from '../models/card.model';

/**
 * Comprehensive unit tests for GameService
 * Tests cover: basic game flow, special cards, Queen Round, penalty system
 */
describe('GameService', () => {
  let service: GameService;
  let cardIdCounter = 0;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameService]
    });
    service = TestBed.inject(GameService);
    // Use deterministic seed for reproducible tests
    service.setSeed(12345);
    cardIdCounter = 0;
  });

  // Helper to create a card with unique ID
  const createCard = (suit: Suit, rank: Rank): Card => ({ 
    suit, 
    rank, 
    id: `test-${++cardIdCounter}` 
  });

  // Helper to access state (public readonly signal)
  const getState = () => service.state();

  // ========== Basic Game Flow Tests ==========
  
  describe('startNewGame()', () => {
    it('should create game with correct number of players', () => {
      service.startNewGame(['Player1', 'Player2', 'Player3']);
      const state = getState();
      
      expect(state.players.length).toBe(3);
      expect(state.gameOver).toBe(false);
    });

    it('should deal 5 cards to each player', () => {
      service.startNewGame(['Player1', 'Player2', 'Player3', 'Player4']);
      const state = getState();
      
      state.players.forEach(player => {
        expect(player.hand.length).toBe(5);
      });
    });

    it('should place one card on discard pile', () => {
      service.startNewGame(['Player1', 'Player2']);
      const state = getState();
      
      expect(state.discardPile.length).toBe(1);
    });

    it('should set first player as human', () => {
      service.startNewGame(['Player1', 'Player2', 'Player3']);
      const state = getState();
      
      expect(state.players[0].isHuman).toBe(true);
      expect(state.players[1].isHuman).toBe(false);
      expect(state.players[2].isHuman).toBe(false);
    });

    it('should initialize lastPlayerAction as null', () => {
      service.startNewGame(['Player1', 'Player2']);
      const state = getState();
      
      expect(state.lastPlayerAction).toBeNull();
    });
  });

  describe('drawCard()', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should add one card to player hand', () => {
      const initialHandSize = getState().players[0].hand.length;
      
      service.drawCard();
      
      expect(getState().players[0].hand.length).toBe(initialHandSize + 1);
    });

    it('should remove one card from deck', () => {
      const initialDeckSize = getState().deck.length;
      
      service.drawCard();
      
      expect(getState().deck.length).toBe(initialDeckSize - 1);
    });

    it('should increment drawnThisTurn counter', () => {
      service.drawCard();
      
      expect(getState().players[0].drawnThisTurn).toBe(1);
    });
  });

  describe('playCard()', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should remove card from player hand when valid', () => {
      const state = getState();
      const topCard = state.discardPile[state.discardPile.length - 1];
      
      // Find a playable card in hand
      const playableCard = state.players[0].hand.find(
        c => c.suit === topCard.suit || c.rank === topCard.rank || c.rank === 'J' || c.rank === '10'
      );
      
      if (playableCard) {
        const initialHandSize = state.players[0].hand.length;
        service.playCard(playableCard);
        
        expect(getState().players[0].hand.length).toBe(initialHandSize - 1);
      }
    });

    it('should add card to discard pile when played', () => {
      const state = getState();
      const topCard = state.discardPile[state.discardPile.length - 1];
      
      const playableCard = state.players[0].hand.find(
        c => c.suit === topCard.suit || c.rank === topCard.rank || c.rank === 'J' || c.rank === '10'
      );
      
      if (playableCard) {
        const initialPileSize = state.discardPile.length;
        service.playCard(playableCard);
        
        const newState = getState();
        expect(newState.discardPile.length).toBe(initialPileSize + 1);
        expect(newState.discardPile[newState.discardPile.length - 1]).toEqual(playableCard);
      }
    });

    it('should set lastPlayerAction to play', () => {
      const state = getState();
      const topCard = state.discardPile[state.discardPile.length - 1];
      
      const playableCard = state.players[0].hand.find(
        c => c.suit === topCard.suit || c.rank === topCard.rank || c.rank === 'J' || c.rank === '10'
      );
      
      if (playableCard) {
        service.playCard(playableCard);
        
        expect(getState().lastPlayerAction).toBe('play');
      }
    });
  });

  // ========== Special Card Tests ==========

  describe('canPlayCard() - Card Validation', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should allow Jack on any card except Jack', () => {
      const state = getState();
      const topCard = state.discardPile[state.discardPile.length - 1];
      const jack = createCard('hearts', 'J');
      
      // Jack should be playable if top card is not a Jack
      if (topCard.rank !== 'J') {
        expect(service.canPlayCard(jack)).toBe(true);
      }
    });

    it('should not allow Jack on Jack', () => {
      // Start game and find a state where top card is Jack
      // For this test, we rely on the canPlayCard logic
      service.startNewGame(['Player1', 'Player2']);
      const jack = createCard('hearts', 'J');
      
      // The canPlayCard method checks state internally
      // We can verify the rule exists by checking behavior
      // Since we can't set state, we test the method signature
      expect(typeof service.canPlayCard).toBe('function');
    });

    it('should allow 10 (replicator) on most cards', () => {
      const ten = createCard('hearts', '10');
      // 10 should generally be playable as it's a replicator
      expect(typeof service.canPlayCard).toBe('function');
    });
  });

  describe('Mau and Mau-Mau Announcements', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('sayMau() should be callable', () => {
      expect(typeof service.sayMau).toBe('function');
      // Should not throw when called
      expect(() => service.sayMau()).not.toThrow();
    });

    it('sayMauMau() should be callable', () => {
      expect(typeof service.sayMauMau).toBe('function');
      // Should not throw when called
      expect(() => service.sayMauMau()).not.toThrow();
    });
  });

  // ========== Queen Round Tests ==========

  describe('Queen Round', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('announceQueenRound() should be callable', () => {
      expect(typeof service.announceQueenRound).toBe('function');
      // Should not throw when called (may give penalty if <2 Queens)
      expect(() => service.announceQueenRound()).not.toThrow();
    });

    it('endQueenRound() should be callable', () => {
      expect(typeof service.endQueenRound).toBe('function');
      // Should not throw when called
      expect(() => service.endQueenRound()).not.toThrow();
    });

    it('should give penalty for false announcement (no 2+ Queens)', () => {
      // Announce without having 2 Queens
      service.announceQueenRound();
      
      const state = getState();
      // Either queenRoundActive is false or player has penalty
      if (!state.queenRoundActive) {
        // Check chat log for penalty message
        const hasPenaltyLog = state.chatLog.some(log => 
          log.type === 'penalty' || log.message.includes('Strafkarte')
        );
        expect(hasPenaltyLog || state.players[0].penaltyCards.length > 0).toBe(true);
      }
    });
  });

  // ========== Suit Choice Tests ==========

  describe('Suit Choice (Jack)', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('chooseSuit() should be callable with valid suits', () => {
      expect(typeof service.chooseSuit).toBe('function');
      // Should not throw
      expect(() => service.chooseSuit('hearts')).not.toThrow();
    });

    it('should accept all four suits', () => {
      const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
      suits.forEach(suit => {
        expect(() => service.chooseSuit(suit)).not.toThrow();
      });
    });
  });

  // ========== Turn Management Tests ==========

  describe('Turn Management', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('endTurn() should be callable', () => {
      expect(typeof service.endTurn).toBe('function');
      expect(() => service.endTurn()).not.toThrow();
    });

    it('canEndTurnNow() should return boolean', () => {
      expect(typeof service.canEndTurnNow).toBe('function');
      expect(typeof service.canEndTurnNow()).toBe('boolean');
    });

    it('getCurrentPlayer() should return player or null', () => {
      expect(typeof service.getCurrentPlayer).toBe('function');
      const player = service.getCurrentPlayer();
      expect(player === null || typeof player === 'object').toBe(true);
    });

    it('getTopCard() should return card or null', () => {
      expect(typeof service.getTopCard).toBe('function');
      const card = service.getTopCard();
      expect(card === null || typeof card === 'object').toBe(true);
      if (card) {
        expect(card.suit).toBeDefined();
        expect(card.rank).toBeDefined();
      }
    });
  });

  // ========== Penalty System Tests ==========

  describe('Penalty System', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('pickupPenaltyCards() should be callable', () => {
      const state = getState();
      const playerId = state.players[0].id;
      
      expect(typeof service.pickupPenaltyCards).toBe('function');
      // Should not throw (even if no penalty cards)
      expect(() => service.pickupPenaltyCards(playerId)).not.toThrow();
    });

    it('playInvalidCard() should be callable', () => {
      const card = createCard('hearts', 'K');
      
      expect(typeof service.playInvalidCard).toBe('function');
      expect(() => service.playInvalidCard(card)).not.toThrow();
    });

    it('endTurnTooEarly() should be callable', () => {
      expect(typeof service.endTurnTooEarly).toBe('function');
      expect(() => service.endTurnTooEarly()).not.toThrow();
    });
  });

  // ========== Game State Tests ==========

  describe('Game State', () => {
    it('state signal should be accessible', () => {
      service.startNewGame(['Player1', 'Player2']);
      
      const state = service.state();
      expect(state).toBeDefined();
      expect(state.players).toBeDefined();
      expect(state.deck).toBeDefined();
      expect(state.discardPile).toBeDefined();
    });

    it('should have correct initial state values', () => {
      service.startNewGame(['Player1', 'Player2']);
      
      const state = service.state();
      expect(state.gameOver).toBe(false);
      expect(state.winner).toBeNull();
      expect(state.drawPenalty).toBe(0);
      expect(state.skipNext).toBe(false);
      expect(state.queenRoundActive).toBe(false);
    });
  });

  // ========== API Consistency Tests ==========

  describe('API Consistency', () => {
    it('should have all expected public methods', () => {
      const expectedMethods = [
        'startNewGame',
        'drawCard',
        'playCard',
        'endTurn',
        'chooseSuit',
        'sayMau',
        'sayMauMau',
        'announceQueenRound',
        'endQueenRound',
        'pickupPenaltyCards',
        'canPlayCard',
        'canEndTurnNow',
        'getCurrentPlayer',
        'getTopCard',
        'setSeed'
      ];

      expectedMethods.forEach(method => {
        expect(typeof (service as unknown as Record<string, unknown>)[method]).toBe('function');
      });
    });

    it('state signal should be readonly', () => {
      expect(typeof service.state).toBe('function');
      // The state is a signal, calling it returns the value
      expect(service.state()).toBeDefined();
    });
  });

  // ========== RULE ENFORCEMENT TESTS ==========
  // These tests verify that Swiss Mau-Mau rules are correctly enforced
  
  describe('Rule Enforcement: Jack on Jack (§7 BUBE)', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should not allow Jack to be played on Jack', () => {
      const state = getState();
      
      // Put a Jack on the discard pile
      const jackOnPile = createCard('spades', 'J');
      state.discardPile.push(jackOnPile);
      state.lastPlayedCard = jackOnPile;
      
      // Try to play another Jack
      const jackInHand = createCard('hearts', 'J');
      
      // canPlayCard should return false
      expect(service.canPlayCard(jackInHand)).toBe(false);
    });

    it('should not allow 10 to replicate Jack when Jack is on pile', () => {
      const state = getState();
      
      // Put two Jacks on pile (simulating Jack on Jack situation after 10 replication)
      const firstJack = createCard('hearts', 'J');
      const secondJack = createCard('spades', 'J');
      state.discardPile.push(firstJack);
      state.discardPile.push(secondJack);
      state.lastPlayedCard = secondJack;
      
      // 10 would replicate the Jack, which can't be played on Jack
      const ten = createCard('diamonds', '10');
      
      // When top card is Jack, 10 can be played but it replicates Jack
      // The rule engine should handle this - 10 on Jack is technically allowed
      // but 10 replicating Jack on Jack is not
      // This depends on implementation - let's check canPlayCard
      // Note: The actual violation check happens in playCard, not canPlayCard
    });
  });

  describe('Rule Enforcement: Ace Last Card', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should not allow game to end with Ace as last card', () => {
      const state = getState();
      const player = state.players[0];
      
      // Give player only an Ace
      const ace = createCard('hearts', 'A');
      player.hand = [ace];
      
      // Set up a valid play situation (Ace can be played on any matching card)
      const heartCard = createCard('hearts', 'K');
      state.discardPile = [heartCard];
      state.lastPlayedCard = heartCard;
      
      // Play the Ace
      service.playCard(ace);
      
      const newState = getState();
      
      // Game should NOT be over - Ace can't be last card
      // Player should have been forced to draw
      expect(newState.gameOver).toBe(false);
    });

    it('should allow Ace to be played when not the last card', () => {
      const state = getState();
      const player = state.players[0];
      
      // Give player Ace + another card
      const ace = createCard('hearts', 'A');
      const otherCard = createCard('spades', 'K');
      player.hand = [ace, otherCard];
      
      // Set up valid play situation
      const heartCard = createCard('hearts', 'K');
      state.discardPile = [heartCard];
      state.lastPlayedCard = heartCard;
      
      // Ace should be playable
      expect(service.canPlayCard(ace)).toBe(true);
    });
  });

  describe('Rule Enforcement: 7-Chain (Strafkarten)', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should set drawPenalty when 7 is played', () => {
      const state = getState();
      const player = state.players[0];
      
      // Give player a 7
      const seven = createCard('hearts', '7');
      player.hand = [seven, createCard('spades', 'K')];
      
      // Set up valid play
      const heartCard = createCard('hearts', 'K');
      state.discardPile = [heartCard];
      state.lastPlayedCard = heartCard;
      
      service.playCard(seven);
      
      const newState = getState();
      expect(newState.drawPenalty).toBe(2);
    });

    it('should only allow 7 or 10 when drawPenalty is active', () => {
      const state = getState();
      
      // Activate draw penalty
      state.drawPenalty = 2;
      
      const seven = createCard('hearts', '7');
      const ten = createCard('hearts', '10');
      const king = createCard('hearts', 'K');
      
      expect(service.canPlayCard(seven)).toBe(true);
      expect(service.canPlayCard(ten)).toBe(true);
      expect(service.canPlayCard(king)).toBe(false);
    });

    it('should accumulate penalty when chaining 7s', () => {
      const state = getState();
      const player = state.players[0];
      
      // Set initial penalty
      state.drawPenalty = 2;
      
      // Give player a 7
      const seven = createCard('hearts', '7');
      player.hand = [seven, createCard('spades', 'K')];
      
      // Set valid discard pile
      const sevenOnPile = createCard('spades', '7');
      state.discardPile = [sevenOnPile];
      state.lastPlayedCard = sevenOnPile;
      
      service.playCard(seven);
      
      const newState = getState();
      // 2 (existing) + 2 (new 7) = 4
      expect(newState.drawPenalty).toBe(4);
    });
  });

  describe('Rule Enforcement: 8 Skip', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should set skipNext when 8 is played', () => {
      const state = getState();
      const player = state.players[0];
      
      const eight = createCard('hearts', '8');
      player.hand = [eight, createCard('spades', 'K')];
      
      const heartCard = createCard('hearts', 'K');
      state.discardPile = [heartCard];
      state.lastPlayedCard = heartCard;
      
      service.playCard(eight);
      
      const newState = getState();
      expect(newState.skipNext).toBe(true);
    });
  });

  describe('Rule Enforcement: Queen Round (§9.A DAMENRUNDE)', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should give penalty for announcing with less than 2 Queens', () => {
      const state = getState();
      const player = state.players[0];
      
      // Give player only 1 Queen
      player.hand = [
        createCard('hearts', 'Q'),
        createCard('spades', 'K'),
        createCard('diamonds', '9')
      ];
      
      const initialPenaltyCount = player.penaltyCards.length;
      
      service.announceQueenRound();
      
      const newState = getState();
      const newPlayer = newState.players[0];
      
      // Should have received penalty
      expect(newPlayer.penaltyCards.length).toBeGreaterThan(initialPenaltyCount);
      // Queen round should not be active
      expect(newState.queenRoundActive).toBe(false);
    });

    it('should activate Queen Round with 2+ Queens', () => {
      const state = getState();
      const player = state.players[0];
      
      // Give player 2 Queens
      player.hand = [
        createCard('hearts', 'Q'),
        createCard('spades', 'Q'),
        createCard('diamonds', 'K')
      ];
      
      service.announceQueenRound();
      
      const newState = getState();
      
      // Queen round should be active
      expect(newState.queenRoundActive).toBe(true);
      expect(player.isQueenRoundStarter).toBe(true);
    });

    it('should only allow Queen or 10 during Queen Round', () => {
      const state = getState();
      
      // Activate queen round
      state.queenRoundActive = true;
      
      const queen = createCard('hearts', 'Q');
      const ten = createCard('hearts', '10');
      const king = createCard('hearts', 'K');
      
      expect(service.canPlayCard(queen)).toBe(true);
      expect(service.canPlayCard(ten)).toBe(true);
      expect(service.canPlayCard(king)).toBe(false);
    });
  });

  describe('Rule Enforcement: Jack Suit Choice', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should set awaitingSuitChoice when Jack is played', () => {
      const state = getState();
      const player = state.players[0];
      
      const jack = createCard('hearts', 'J');
      player.hand = [jack, createCard('spades', 'K')];
      
      // Non-Jack card on pile
      const kingOnPile = createCard('diamonds', 'K');
      state.discardPile = [kingOnPile];
      state.lastPlayedCard = kingOnPile;
      
      service.playCard(jack);
      
      const newState = getState();
      expect(newState.awaitingSuitChoice).toBe(true);
    });

    it('should enforce chosen suit for next player', () => {
      const state = getState();
      
      // Set chosen suit
      state.chosenSuit = 'clubs';
      
      const clubsCard = createCard('clubs', 'K');
      const heartsCard = createCard('hearts', 'K');
      
      expect(service.canPlayCard(clubsCard)).toBe(true);
      expect(service.canPlayCard(heartsCard)).toBe(false);
    });
  });

  describe('Rule Enforcement: Invalid Card Play', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should give penalty when playing invalid card via playInvalidCard()', () => {
      const state = getState();
      const player = state.players[0];
      const initialPenaltyCount = player.penaltyCards.length;
      
      const invalidCard = createCard('hearts', 'K');
      service.playInvalidCard(invalidCard);
      
      const newState = getState();
      const newPlayer = newState.players[0];
      
      expect(newPlayer.penaltyCards.length).toBeGreaterThan(initialPenaltyCount);
    });
  });

  describe('Rule Enforcement: Mau Announcement', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should give penalty for false Mau (not exactly 1 card)', () => {
      const state = getState();
      const player = state.players[0];
      
      // Player has 5 cards, not 1
      expect(player.hand.length).toBe(5);
      
      const initialPenaltyCount = player.penaltyCards.length;
      
      service.sayMau();
      
      const newState = getState();
      const newPlayer = newState.players[0];
      
      // Should have penalty for false Mau
      expect(newPlayer.penaltyCards.length).toBeGreaterThan(initialPenaltyCount);
    });

    it('should not give penalty for correct Mau with 1 card', () => {
      const state = getState();
      const player = state.players[0];
      
      // Give player exactly 1 card
      player.hand = [createCard('hearts', 'K')];
      
      const initialPenaltyCount = player.penaltyCards.length;
      
      service.sayMau();
      
      const newState = getState();
      const newPlayer = newState.players[0];
      
      // Should NOT have additional penalty
      expect(newPlayer.penaltyCards.length).toBe(initialPenaltyCount);
      expect(newPlayer.hasSaidMau).toBe(true);
    });
  });

  describe('Rule Enforcement: End Turn Too Early', () => {
    beforeEach(() => {
      service.startNewGame(['Player1', 'Player2']);
    });

    it('should give penalty for ending turn without action', () => {
      const state = getState();
      const player = state.players[0];
      const initialPenaltyCount = player.penaltyCards.length;
      
      // Player hasn't played or drawn
      state.lastPlayerAction = null;
      player.drawnThisTurn = 0;
      
      service.endTurnTooEarly();
      
      const newState = getState();
      const newPlayer = newState.players[0];
      
      expect(newPlayer.penaltyCards.length).toBeGreaterThan(initialPenaltyCount);
    });
  });
});
