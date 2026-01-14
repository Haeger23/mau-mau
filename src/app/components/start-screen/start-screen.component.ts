import { Component, output, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';

export interface GameSetup {
  playerName: string;
  opponentCount: number;
}

@Component({
  selector: 'app-start-screen',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="start-screen">
      <div class="start-container">
        <h1>🎴 Mau-Mau 🎴</h1>
        <p class="subtitle">Das klassische Kartenspiel</p>
        
        <div class="setup-form">
          <div class="form-group">
            <label for="playerName">Dein Name:</label>
            <div class="name-avatar-container">
              <div class="player-avatar">
                @if (playerAvatar(); as avatar) {
                  @if (avatar.type === 'image') {
                    <img [src]="avatar.value" [alt]="playerName()" class="avatar-image">
                  } @else if (avatar.type === 'letter') {
                    <span class="avatar-letter">{{ avatar.value }}</span>
                  } @else {
                    <span class="avatar-placeholder">?</span>
                  }
                }
              </div>
              <div class="name-input-wrapper">
                <input 
                id="playerName"
                type="text" 
                data-testid="input-player-name"
                [(ngModel)]="playerName"
                (input)="onNameInput()"
                (focus)="showSuggestions.set(true)"
                (blur)="onInputBlur()"
                (keyup.enter)="startGame()"
                (keydown.arrowdown)="navigateSuggestions(1)"
                (keydown.arrowup)="navigateSuggestions(-1)"
                placeholder="Wähle oder tippe deinen Namen..."
                maxlength="20"
                class="name-input"
                autocomplete="off">

              @if (playerName().trim().length > 0) {
                <button 
                  class="clear-btn" 
                  (mousedown)="clearName()" 
                  type="button"
                  aria-label="Eingabe löschen">
                  ✕
                </button>
              }
              
              @if (showSuggestions() && filteredNames().length > 0) {
                <ul class="suggestions-list">
                  @for (player of filteredNames(); track player.name; let i = $index) {
                    <li 
                      class="suggestion-item"
                      [class.highlighted]="selectedIndex() === i"
                      (mousedown)="selectName(player.name)"
                      (mouseenter)="selectedIndex.set(i)">
                      <img [src]="player.image" [alt]="player.name" class="player-thumbnail">
                      <span>{{ player.name }}</span>
                    </li>
                  }
                </ul>
              }
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Anzahl Computer-Gegner:</label>
            <div class="opponent-selector">
              @for (count of opponentOptions; track count) {
                <button
                  class="opponent-btn"
                  [attr.data-testid]="'select-opponents-' + count"
                  [class.selected]="opponentCount() === count"
                  (click)="selectOpponents(count)">
                  {{ count }} {{ count === 1 ? 'Gegner' : 'Gegner' }}
                </button>
              }
            </div>
          </div>

          <button 
            class="start-btn"
            data-testid="action-start-game"
            [disabled]="!playerName().trim()"
            (click)="startGame()">
            Spiel starten
          </button>

          <div class="rules-preview">
            <h3>Spielregeln:</h3>
            <ul>
              <li>🃏 Spiele Karten mit gleicher Farbe oder gleichem Wert</li>
              <li>7️⃣ 7 zwingt den nächsten Spieler 2 Karten zu ziehen</li>
              <li>8️⃣ 8 überspringt den nächsten Spieler</li>
              <li>🃏 Bube kann auf jede Karte gespielt werden - wähle dann eine Farbe</li>
              <li>🅰️ Ass muss mit einer weiteren Karte gespielt werden</li>
              <li>🎯 Ziel: Werde als Erster alle Karten los!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .start-screen {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .start-container {
      background: white;
      border-radius: 20px;
      padding: 50px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.6s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    h1 {
      text-align: center;
      color: #667eea;
      font-size: 3em;
      margin: 0 0 10px 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }

    .subtitle {
      text-align: center;
      color: #666;
      font-size: 1.2em;
      margin: 0 0 40px 0;
    }

    .setup-form {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    label {
      font-weight: bold;
      color: #2c3e50;
      font-size: 1.1em;
    }

    .name-avatar-container {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .player-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: #f0f3ff;
      border: 3px solid #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 56px;
      color: #667eea;
      font-weight: bold;
    }

    .avatar-letter {
      font-size: 64px;
      color: #667eea;
      font-weight: bold;
    }

    .name-input-wrapper {
      position: relative;
      flex: 1;
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      background: #ddd;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      color: #666;
      transition: background 0.2s ease, color 0.2s ease;
      padding: 0;
      line-height: 1;
      margin-top: -12px;

      &:hover {
        background: #bbb;
        color: #333;
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .name-input {
      padding: 15px 20px;
      font-size: 16px;
      border: 2px solid #ddd;
      border-radius: 10px;
      transition: all 0.3s ease;
      font-family: inherit;
      width: 100%;
    }

    .name-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .name-input-wrapper {
      position: relative;
      flex: 1;
    }

    .suggestions-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #667eea;
      border-top: none;
      border-radius: 0 0 10px 10px;
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .suggestion-item {
      padding: 12px 20px;
      cursor: pointer;
      transition: background 0.2s ease;
      color: #2c3e50;
      display: flex;
      align-items: center;
    }

    .suggestion-item:hover,
    .suggestion-item.highlighted {
      background: #f0f3ff;
      color: #667eea;
    }

    .player-thumbnail {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      margin-right: 12px;
      border: 2px solid #ddd;
    }

    .suggestion-item:last-child {
      border-radius: 0 0 8px 8px;
    }

    .opponent-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .opponent-btn {
      padding: 20px;
      font-size: 16px;
      font-weight: bold;
      border: 2px solid #ddd;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: inherit;
      color: #2c3e50;
    }

    .opponent-btn:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .opponent-btn.selected {
      background: #667eea;
      color: white;
      border-color: #667eea;
      transform: scale(1.05);
    }

    .start-btn {
      padding: 18px 40px;
      font-size: 18px;
      font-weight: bold;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 10px;
      font-family: inherit;
    }

    .start-btn:hover:not(:disabled) {
      background: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(76, 175, 80, 0.3);
    }

    .start-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .rules-preview {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      margin-top: 10px;
    }

    .rules-preview h3 {
      margin: 0 0 15px 0;
      color: #2c3e50;
      font-size: 1.2em;
    }

    .rules-preview ul {
      margin: 0;
      padding-left: 20px;
    }

    .rules-preview li {
      margin: 8px 0;
      color: #555;
      line-height: 1.6;
    }

    @media (max-width: 600px) {
      .start-container {
        padding: 30px 20px;
      }

      h1 {
        font-size: 2em;
      }

      .opponent-selector {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class StartScreenComponent {
  private gameService = inject(GameService);
  
  playerName = signal<string>('');
  opponentCount = signal<number>(2);
  opponentOptions = [1, 2, 3, 4];
  
  showSuggestions = signal<boolean>(false);
  selectedIndex = signal<number>(-1);
  
  availableNames = this.gameService.getAvailablePlayerNames();

  constructor() {
    // Preload all player images
    this.availableNames.forEach(player => {
      const img = new Image();
      img.src = player.image;
    });
  }
  
  filteredNames = computed(() => {
    const input = this.playerName().toLowerCase().trim();
    if (!input) {
      return this.availableNames;
    }
    return this.availableNames.filter(player => 
      player.name.toLowerCase().startsWith(input)
    );
  });

  playerAvatar = computed(() => {
    const name = this.playerName().trim();
    
    if (!name) {
      return { type: 'placeholder', value: '?' };
    }
    
    // Check if name matches a player in the list
    const matchedPlayer = this.availableNames.find(
      player => player.name.toLowerCase() === name.toLowerCase()
    );
    
    if (matchedPlayer) {
      return { type: 'image', value: matchedPlayer.image };
    }
    
    // Use first letter for custom names
    return { type: 'letter', value: name.charAt(0).toUpperCase() };
  });

  gameStart = output<GameSetup>();

  onNameInput(): void {
    this.showSuggestions.set(true);
    this.selectedIndex.set(-1);
  }

  onInputBlur(): void {
    // Verzögert ausblenden, damit Click-Event noch funktioniert
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  selectName(name: string): void {
    this.playerName.set(name);
    this.showSuggestions.set(false);
    this.selectedIndex.set(-1);
  }

  clearName(): void {
    this.playerName.set('');
    this.selectedIndex.set(-1);
    this.showSuggestions.set(true);
  }

  navigateSuggestions(direction: number): void {
    if (!this.showSuggestions() || this.filteredNames().length === 0) {
      return;
    }

    const currentIndex = this.selectedIndex();
    const maxIndex = this.filteredNames().length - 1;
    let newIndex = currentIndex + direction;

    if (newIndex < 0) {
      newIndex = maxIndex;
    } else if (newIndex > maxIndex) {
      newIndex = 0;
    }

    this.selectedIndex.set(newIndex);
    
    // Enter-Taste auswählen
    if (newIndex >= 0) {
      const selectedPlayer = this.filteredNames()[newIndex];
      if (selectedPlayer) {
        this.playerName.set(selectedPlayer.name);
      }
    }
  }

  selectOpponents(count: number): void {
    this.opponentCount.set(count);
  }

  startGame(): void {
    const name = this.playerName().trim();
    if (name) {
      this.gameStart.emit({
        playerName: name,
        opponentCount: this.opponentCount()
      });
    }
  }
}
