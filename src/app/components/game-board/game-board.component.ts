import { Component, computed, signal, effect, input, output, inject, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { GameService } from '../../services/game.service';
import { CardComponent } from '../card/card.component';
import { SuitSelectorComponent } from '../suit-selector/suit-selector.component';
import { Card, Suit } from '../../models/card.model';
import { GameSetup } from '../start-screen/start-screen.component';

@Component({
  selector: 'app-game-board',
  imports: [CardComponent, SuitSelectorComponent, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss'
})
export class GameBoardComponent implements AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesRef?: ElementRef;
  private shouldScrollToBottom = false;
  private lastChatLength = 0;

  protected selectedCard = signal<Card | null>(null);
  protected showSuitSelector = signal<boolean>(false);
  protected hoverAvatarUrl = signal<string | null>(null);
  protected hoverAvatarPosition = signal<{ x: number, y: number } | null>(null);
  private hoverTimeout: any = null;

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

    // Track chat log changes for auto-scroll
    effect(() => {
      const state = this.gameState();
      if (state && state.chatLog.length !== this.lastChatLength) {
        this.lastChatLength = state.chatLog.length;
        this.shouldScrollToBottom = true;
      }
    });
  }

  protected getPlayerAvatar(playerName: string): { type: string, value: string } {
    const availablePlayers = this.gameService.getAvailablePlayerNames();
    const matchedPlayer = availablePlayers.find(
      player => player.name.toLowerCase() === playerName.toLowerCase()
    );
    
    if (matchedPlayer) {
      return { type: 'image', value: matchedPlayer.image };
    }
    
    return { type: 'letter', value: playerName.charAt(0).toUpperCase() };
  }

  protected onAvatarHover(imageUrl: string | null, event?: MouseEvent): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    if (imageUrl && event) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      this.hoverTimeout = setTimeout(() => {
        this.hoverAvatarUrl.set(imageUrl);
        this.hoverAvatarPosition.set({ x, y });
      }, 1000);
    } else {
      this.hoverAvatarUrl.set(null);
      this.hoverAvatarPosition.set(null);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.chatMessagesRef) {
      try {
        this.chatMessagesRef.nativeElement.scrollTop = this.chatMessagesRef.nativeElement.scrollHeight;
        this.shouldScrollToBottom = false;
      } catch (err) {
        console.error('Scroll error:', err);
      }
    }
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
    this.showSuitSelector.set(false);
  }

  backToStart(): void {
    this.returnToStart.emit();
  }

  canPlayCard(card: Card): boolean {
    return this.gameService.canPlayCard(card);
  }

  isCardClickable(card: Card): boolean {
    // Alle Karten sind klickbar (auch ungültige)
    // Ungültige Züge führen zu Strafkarten
    return true;
  }

  onCardClick(card: Card): void {
    const human = this.humanPlayer();
    if (!human || !human.isActive) return;

    // Wähle Karte aus oder spiele sie
    if (this.selectedCard()?.id === card.id) {
      // Deselektiere wenn nochmal geklickt
      this.selectedCard.set(null);
    } else {
      this.selectedCard.set(card);
      
      // Prüfe ob Karte gültig ist
      if (this.canPlayCard(card)) {
        // Gültiger Zug
        this.playCard(card);
      } else {
        // Ungültiger Zug - Strafe!
        this.gameService.playInvalidCard(card);
        this.selectedCard.set(null);
      }
    }
  }

  playCard(card: Card): void {
    this.gameService.playCard(card);
    this.selectedCard.set(null);

    // Show suit selector if Jack was played
    if (card.rank === 'J') {
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
    }
  }

  onEndTurn(): void {
    // Prüfe ob Zug tatsächlich beendet werden kann
    const canEnd = this.gameService.canEndTurnNow();
    if (canEnd) {
      this.gameService.endTurn();
    } else {
      // Zu früh beendet - Strafe!
      this.gameService.endTurnTooEarly();
    }
    this.selectedCard.set(null);
  }

  canEndTurn(): boolean {
    const human = this.humanPlayer();
    // Button ist immer sichtbar wenn Spieler am Zug ist
    return human?.isActive ?? false;
  }

  onSayMau(): void {
    this.gameService.sayMau();
  }

  onSayMauMau(): void {
    this.gameService.sayMauMau();
  }

  onAnnounceQueenRound(): void {
    this.gameService.announceQueenRound();
  }

  onEndQueenRound(): void {
    this.gameService.endQueenRound();
  }

  onPickupPenalty(): void {
    const human = this.humanPlayer();
    if (human) {
      this.gameService.pickupPenaltyCards(human.id);
    }
  }

  onPickupSinglePenalty(card: Card, isPickupable: boolean): void {
    const human = this.humanPlayer();
    if (human && human.isActive) {
      this.gameService.pickupSinglePenaltyCard(human.id, card.id, isPickupable);
    }
  }

  toggleRuleExplanation(msg: any): void {
    msg.showExplanation = !msg.showExplanation;
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
