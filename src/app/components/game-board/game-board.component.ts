import { Component, computed, signal, effect, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { GameService } from '../../services/game.service';
import { CardComponent } from '../card/card.component';
import { SuitSelectorComponent } from '../suit-selector/suit-selector.component';
import { Card, Suit } from '../../models/card.model';
import { GameSetup } from '../start-screen/start-screen.component';

@Component({
  selector: 'app-game-board',
  imports: [CardComponent, SuitSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-board">
      <!-- Header -->
      <div class="game-header">
        <h1>🎴 Mau-Mau</h1>
        <button class="back-btn" (click)="backToStart()">← Zum Startbildschirm</button>
      </div>

      @if (gameState()) {
        <!-- Game Area -->
        <div class="game-area">
          
          <!-- Main Game Area -->
          <div class="game-main">
          
          <!-- Opponent Players -->
          <div class="opponents">
            @for (player of opponentPlayers(); track player.id) {
              <div class="opponent-player">
                <div class="player-info" [class.active]="player.isActive">
                  <div class="player-name">{{ player.name }}</div>
                  <div class="card-count">{{ player.hand.length }} Karten</div>
                </div>
                <div class="opponent-cards">
                  @for (card of player.hand; track card.id) {
                    <div class="card-back"></div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Game Status -->
          @if (gameState().drawPenalty > 0 || gameState().chosenSuit) {
            <div class="game-status">
              @if (gameState().drawPenalty > 0) {
                <div class="status-message">
                  ⚠️ Nächster Spieler muss {{ gameState().drawPenalty }} Karten ziehen!
                </div>
              }
              @if (gameState().chosenSuit) {
                <div class="status-message">
                  🎯 Gewählte Farbe: 
                  <span [style.color]="getSuitColor(gameState().chosenSuit!)">
                    {{ getSuitSymbol(gameState().chosenSuit!) }} {{ getSuitName(gameState().chosenSuit!) }}
                  </span>
                </div>
              }
            </div>
          }

          <!-- Center Area: Deck and Discard Pile -->
          <div class="center-area">
            <div class="deck-area">
              <div class="deck" (click)="onDrawCard()">
                <div class="card-back stack"></div>
                <div class="deck-label">Nachziehen ({{ gameState().deck.length }})</div>
              </div>
            </div>

            <div class="discard-area">
              @if (topCard()) {
                <app-card 
                  [card]="topCard()!" 
                  [clickable]="false">
                </app-card>
              }
              <div class="discard-label">Ablagestapel</div>
            </div>
          </div>

          <!-- Human Player Hand -->
          @if (humanPlayer()) {
            <div class="player-hand">
              <div class="player-info main-player" [class.active]="humanPlayer()!.isActive">
                <div class="player-name">{{ humanPlayer()!.name }}</div>
                <div class="card-count">{{ humanPlayer()!.hand.length }} Karten</div>
              </div>
              
              <div class="hand-cards">
                @for (card of humanPlayer()!.hand; track card.id) {
                  <app-card
                    [card]="card"
                    [clickable]="isCardClickable(card) && humanPlayer()!.isActive"
                    [selected]="selectedCard()?.id === card.id || selectedAdditionalCard()?.id === card.id"
                    (cardClick)="onCardClick(card)">
                  </app-card>
                }
              </div>

              <!-- Action Button for Ace -->
              @if (selectedCard() && selectedCard()!.rank === 'A') {
                <div class="action-area">
                  <button 
                    class="play-btn"
                    [disabled]="!selectedAdditionalCard()"
                    (click)="playSelectedCards()">
                    Karten spielen (Ass + {{ selectedAdditionalCard() ? 'Karte' : '?' }})
                  </button>
                  <p class="hint">Wähle eine zusätzliche Karte für das Ass</p>
                </div>
              }
            </div>
          }

          <!-- Win Screen -->
          @if (gameState().gameOver && gameState().winner) {
            <div class="win-overlay">
              <div class="win-message">
                <h2>🎉 {{ gameState().winner!.name }} gewinnt! 🎉</h2>
                <button class="new-game-btn large" (click)="backToStart()">Zurück zum Startbildschirm</button>
              </div>
            </div>
          }

          <!-- Suit Selector -->
          <app-suit-selector
            [show]="showSuitSelector()"
            (suitSelected)="onSuitSelected($event)">
          </app-suit-selector>
          
          </div>
          
          <!-- Chat Log -->
          <div class="chat-log">
            <h3>Spielverlauf</h3>
            <div class="chat-messages">
              @for (msg of gameState().chatLog; track $index) {
                <div class="chat-message" [class]="'type-' + msg.type">
                  <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
                  <span class="player-name">{{ msg.playerName }}:</span>
                  <span class="message">{{ msg.message }}</span>
                </div>
              }
            </div>
          </div>
          
        </div>
      } @else {
        <!-- Welcome Screen -->
        <div class="welcome-screen">
          <h2>Willkommen bei Mau-Mau!</h2>
          <p>Klicke auf "Neues Spiel" um zu beginnen.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-board {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    h1 {
      color: white;
      margin: 0;
      font-size: 2.5em;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .back-btn {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }

    .game-area {
      max-width: 1600px;
      margin: 0 auto;
      display: flex;
      gap: 20px;
    }

    .game-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .chat-log {
      width: 350px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 120px);
    }

    .chat-log h3 {
      margin: 0 0 15px 0;
      color: #667eea;
      font-size: 1.3em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chat-message {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .chat-message .timestamp {
      color: #999;
      font-size: 11px;
      margin-right: 8px;
    }

    .chat-message .player-name {
      font-weight: bold;
      margin-right: 6px;
    }

    .chat-message .message {
      color: #333;
    }

    .chat-message.type-play {
      background: #e3f2fd;
      border-left: 3px solid #2196f3;
    }

    .chat-message.type-play .player-name {
      color: #1976d2;
    }

    .chat-message.type-draw {
      background: #fff3e0;
      border-left: 3px solid #ff9800;
    }

    .chat-message.type-draw .player-name {
      color: #f57c00;
    }

    .chat-message.type-suit {
      background: #f3e5f5;
      border-left: 3px solid #9c27b0;
    }

    .chat-message.type-suit .player-name {
      color: #7b1fa2;
    }

    .chat-message.type-skip {
      background: #ffebee;
      border-left: 3px solid #f44336;
    }

    .chat-message.type-skip .player-name {
      color: #c62828;
    }

    .chat-message.type-penalty {
      background: #ffe0b2;
      border-left: 3px solid #ff5722;
    }

    .chat-message.type-penalty .player-name {
      color: #d84315;
    }

    .chat-message.type-win {
      background: #c8e6c9;
      border-left: 3px solid #4caf50;
      font-weight: bold;
    }

    .chat-message.type-win .player-name {
      color: #2e7d32;
    }

    .opponents {
      display: flex;
      justify-content: space-around;
      margin-bottom: 30px;
    }

    .opponent-player {
      text-align: center;
    }

    .player-info {
      background: rgba(255, 255, 255, 0.9);
      padding: 10px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      transition: all 0.3s ease;
    }

    .player-info.active {
      background: #4CAF50;
      color: white;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
    }

    .player-name {
      font-weight: bold;
      font-size: 16px;
    }

    .card-count {
      font-size: 14px;
      opacity: 0.8;
    }

    .opponent-cards {
      display: flex;
      gap: -30px;
      justify-content: center;
    }

    .card-back {
      width: 60px;
      height: 85px;
      background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
      border: 2px solid #2c3e50;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      margin: 0 -20px;
    }

    .card-back::before {
      content: '🎴';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 30px;
    }

    .game-status {
      text-align: center;
      margin: 20px 0;
    }

    .status-message {
      background: rgba(255, 255, 255, 0.95);
      padding: 15px 30px;
      border-radius: 8px;
      display: inline-block;
      font-weight: bold;
      font-size: 18px;
      color: #2c3e50;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      margin: 5px;
    }

    .center-area {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 60px;
      margin: 40px 0;
      min-height: 200px;
    }

    .deck-area, .discard-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .deck {
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .deck:hover {
      transform: scale(1.05);
    }

    .card-back.stack {
      width: 100px;
      height: 140px;
      box-shadow: 
        2px 2px 0 rgba(0, 0, 0, 0.1),
        4px 4px 0 rgba(0, 0, 0, 0.1),
        6px 6px 0 rgba(0, 0, 0, 0.1);
    }

    .deck-label, .discard-label {
      color: white;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .player-hand {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin-top: 30px;
    }

    .player-info.main-player {
      margin: 0 auto 20px;
      width: fit-content;
    }

    .hand-cards {
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      min-height: 160px;
    }

    .action-area {
      text-align: center;
      margin-top: 20px;
    }

    .play-btn {
      padding: 12px 32px;
      font-size: 16px;
      font-weight: bold;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .play-btn:hover:not(:disabled) {
      background: #45a049;
      transform: translateY(-2px);
    }

    .play-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .hint {
      color: white;
      margin-top: 10px;
      font-size: 14px;
    }

    .win-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.5s ease;
    }

    .win-message {
      background: white;
      padding: 60px;
      border-radius: 16px;
      text-align: center;
      animation: bounceIn 0.6s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }

    .win-message h2 {
      color: #4CAF50;
      margin: 0 0 30px 0;
      font-size: 2.5em;
    }

    .welcome-screen {
      text-align: center;
      color: white;
      margin-top: 100px;
    }

    .welcome-screen h2 {
      font-size: 2em;
      margin-bottom: 20px;
    }

    .welcome-screen p {
      font-size: 1.2em;
    }
  `]
})
export class GameBoardComponent {
  protected selectedCard = signal<Card | null>(null);
  protected selectedAdditionalCard = signal<Card | null>(null);
  protected showSuitSelector = signal<boolean>(false);

  gameSetup = input.required<GameSetup>();
  returnToStart = output<void>();

  gameState;
  humanPlayer;
  opponentPlayers;
  topCard;
  
  private gameService = inject(GameService);

  constructor() {
    this.gameState = this.gameService.state;
    
    this.humanPlayer = computed(() => {
      return this.gameState()?.players.find(p => p.isHuman) || null;
    });

    this.opponentPlayers = computed(() => {
      return this.gameState()?.players.filter(p => !p.isHuman) || [];
    });

    this.topCard = computed(() => {
      return this.gameService.getTopCard();
    });

    // Start game when setup changes
    effect(() => {
      const setup = this.gameSetup();
      if (setup) {
        this.startNewGame();
      }
    }, { allowSignalWrites: true });
  }

  startNewGame(): void {
    const setup = this.gameSetup();
    const playerNames = [setup.playerName];
    
    // Add computer opponents
    for (let i = 1; i <= setup.opponentCount; i++) {
      playerNames.push(`Computer ${i}`);
    }
    
    this.gameService.startNewGame(playerNames);
    this.selectedCard.set(null);
    this.selectedAdditionalCard.set(null);
    this.showSuitSelector.set(false);
  }

  backToStart(): void {
    this.returnToStart.emit();
  }

  canPlayCard(card: Card): boolean {
    return this.gameService.canPlayCard(card);
  }

  isCardClickable(card: Card): boolean {
    // Wenn ein Ass ausgewählt ist, sind alle anderen Karten als zusätzliche Karte wählbar
    if (this.selectedCard()?.rank === 'A') {
      return card.id !== this.selectedCard()!.id;
    }
    // Ansonsten: Nur spielbare Karten sind klickbar
    return this.canPlayCard(card);
  }

  onCardClick(card: Card): void {
    const human = this.humanPlayer();
    if (!human || !human.isActive) return;

    // Wenn ein Ass bereits ausgewählt ist
    if (this.selectedCard()?.rank === 'A') {
      if (card.id === this.selectedCard()!.id) {
        // Klick auf das Ass selbst: Deselektiere alles
        this.selectedCard.set(null);
        this.selectedAdditionalCard.set(null);
      } else {
        // Wähle beliebige andere Karte als zusätzliche Karte
        this.selectedAdditionalCard.set(card);
      }
    } else if (card.rank === 'A') {
      // Wähle ein Ass aus
      this.selectedCard.set(card);
      this.selectedAdditionalCard.set(null);
    } else {
      // Normale Karte: Sofort spielen wenn möglich
      if (this.canPlayCard(card)) {
        this.selectedCard.set(card);
        this.playCard(card);
      }
    }
  }

  playSelectedCards(): void {
    const ace = this.selectedCard();
    const additional = this.selectedAdditionalCard();
    
    if (ace && ace.rank === 'A' && additional) {
      this.playCard(ace, additional);
      this.selectedCard.set(null);
      this.selectedAdditionalCard.set(null);
    }
  }

  playCard(card: Card, additionalCard?: Card): void {
    this.gameService.playCard(card, additionalCard);
    this.selectedCard.set(null);
    this.selectedAdditionalCard.set(null);

    // Show suit selector if Jack was played (either as main card or additional card)
    if (card.rank === 'J' || additionalCard?.rank === 'J') {
      setTimeout(() => {
        this.showSuitSelector.set(true);
      }, 300);
    }
  }

  onDrawCard(): void {
    const human = this.humanPlayer();
    if (human && human.isActive) {
      this.gameService.drawCard();
      this.selectedCard.set(null);
      this.selectedAdditionalCard.set(null);
    }
  }

  onSuitSelected(suit: Suit): void {
    this.showSuitSelector.set(false);
    this.gameService.chooseSuit(suit);
  }

  formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  getSuitSymbol(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[suit];
  }

  getSuitName(suit: Suit): string {
    const names: Record<Suit, string> = {
      hearts: 'Herz',
      diamonds: 'Karo',
      clubs: 'Kreuz',
      spades: 'Pik'
    };
    return names[suit];
  }

  getSuitColor(suit: Suit): string {
    return suit === 'hearts' || suit === 'diamonds' ? '#e74c3c' : '#2c3e50';
  }

  trackByCardId(_index: number, card: Card): string {
    return card.id;
  }
}
