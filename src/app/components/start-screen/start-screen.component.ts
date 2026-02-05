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
      <!-- Hero Section with Logo -->
      <header class="hero-section">
        <div class="logo-container">
          <img src="/mau-mau-logo.svg" alt="Mau-Mau Logo" class="logo">
        </div>
        <h1 class="tagline">Die in der Schweiz typische Spielart <br />auf einhundert</h1>
      </header>

      <!-- Game Settings Section -->
      <main class="settings-section">
        <div class="settings-container">
          <div class="setup-form">
            <div class="form-group">
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
              <div class="opponent-selector">
                @for (count of opponentOptions; track count) {
                  <button
                    class="opponent-btn"
                    [attr.data-testid]="'select-opponents-' + count"
                    [class.selected]="opponentCount() === count"
                    (click)="selectOpponents(count)">
                    {{ count }} Gegner
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
              <a href="https://mau-mau.ch/" target="_blank" rel="noopener noreferrer" class="rules-link">
                Spielregeln
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .start-screen {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: sans-serif;
    }

    /* Hero Section - großflächiges Rot wie mau-mau.ch */
    .hero-section {
      background: #ff0000;
      padding: 5em 1.667em 5em; /* 60px 20px 60px */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .logo-container {
      max-width: 26.667em; /* 320px */
      width: 100%;
      margin-bottom: 1.667em; /* 20px */
    }

    .logo {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 0.333em 0.667em rgba(0, 0, 0, 0.2)); /* 0 4px 8px */
    }

    .tagline {
      color: #ffffff;
      font-family: 'Lato', sans-serif;
      font-size: 2.5em; /* 30px */
      font-weight: 900;
      letter-spacing: 0.1em;
      margin: 0;
      text-align: center;
      text-transform: uppercase;
    }

    /* Settings Section */
    .settings-section {
      flex: 1;
      background: #ffffff;
      display: flex;
      justify-content: center;
      padding: 3.333em 1.667em 0; /* 40px 20px 0px */
    }

    .settings-container {
      background: white;
      border-radius: 1.333em; /* 16px */
      padding: 3.333em; /* 40px */
      max-width: 45.833em; /* 550px */
      width: 100%;
      height: fit-content;
      box-shadow: 0 0.667em 2.667em rgba(0, 0, 0, 0.1); /* 0 8px 32px */
    }

    .setup-form {
      display: flex;
      flex-direction: column;
      gap: 2.333em; /* 28px */
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.833em; /* 10px */
    }

    label {
      font-weight: 600;
      color: #333;
      font-size: 1.05em;
    }

    .name-avatar-container {
      display: flex;
      align-items: center;
      gap: 1.25em; /* 15px */
    }

    .player-avatar {
      width: 8.333em; /* 100px */
      height: 8.333em; /* 100px */
      border-radius: 50%;
      background: #fff5f5;
      border: 0.25em solid #ff0000; /* 3px */
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
      font-size: 4em; /* 48px */
      color: #ff0000;
      font-weight: bold;
    }

    .avatar-letter {
      font-size: 4.333em; /* 52px */
      color: #ff0000;
      font-weight: bold;
    }

    .name-input-wrapper {
      position: relative;
      flex: 1;
    }

    .clear-btn {
      position: absolute;
      right: 1em; /* 12px */
      top: 50%;
      background: #e0e0e0;
      border: none;
      border-radius: 50%;
      width: 2em; /* 24px */
      height: 2em; /* 24px */
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.167em; /* 14px */
      color: #666;
      transition: background 0.2s ease, color 0.2s ease;
      padding: 0;
      line-height: 1;
      margin-top: -1em; /* -12px */

      &:hover {
        background: #ff0000;
        color: white;
      }
    }

    .name-input {
      padding: 1.167em 1.5em; /* 14px 18px */
      font-size: 1.333em; /* 16px */
      border: 0.167em solid #e0e0e0; /* 2px */
      border-radius: 0.667em; /* 8px */
      transition: all 0.2s ease;
      font-family: inherit;
      width: 100%;
    }

    .name-input:focus {
      outline: none;
      border-color: #ff0000;
      box-shadow: 0 0 0 0.25em rgba(255, 0, 0, 0.1); /* 0 0 0 3px */
    }

    .suggestions-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 0.167em solid #ff0000; /* 2px */
      border-top: none;
      border-radius: 0 0 0.667em 0.667em; /* 0 0 8px 8px */
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 16.667em; /* 200px */
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 0.333em 1em rgba(0, 0, 0, 0.15); /* 0 4px 12px */
    }

    .suggestion-item {
      padding: 1em 1.5em; /* 12px 18px */
      cursor: pointer;
      transition: background 0.2s ease;
      color: #333;
      display: flex;
      align-items: center;
    }

    .suggestion-item:hover,
    .suggestion-item.highlighted {
      background: #fff5f5;
      color: #ff0000;
    }

    .player-thumbnail {
      width: 2.667em; /* 32px */
      height: 2.667em; /* 32px */
      border-radius: 50%;
      object-fit: cover;
      margin-right: 1em; /* 12px */
      border: 0.167em solid #e0e0e0; /* 2px */
    }

    .suggestion-item:last-child {
      border-radius: 0 0 0.5em 0.5em; /* 0 0 6px 6px */
    }

    .opponent-selector {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.833em; /* 10px */
    }

    .opponent-btn {
      padding: 1.333em 1em; /* 16px 12px */
      font-size: 1.25em; /* 15px */
      font-weight: 600;
      border: 0.167em solid #e0e0e0; /* 2px */
      border-radius: 0.667em; /* 8px */
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      color: #333;
    }

    .opponent-btn:hover {
      background: #ffffff;
      border-color: #ff0000;
      color: #ff0000;
    }

    .opponent-btn.selected {
      background: #ff0000;
      color: white;
      border-color: #ff0000;
    }

    .start-btn {
      padding: 1.333em 3.333em; /* 16px 40px */
      font-size: 1.5em; /* 18px */
      font-weight: 600;
      background: #ff0000;
      color: white;
      border: none;
      border-radius: 0.667em; /* 8px */
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.667em; /* 8px */
      font-family: inherit;
      text-transform: uppercase;
      letter-spacing: 0.083em; /* 1px */
    }

    .start-btn:hover:not(:disabled) {
      background: #cc0000;
    }

    .start-btn:disabled {
      background: #ccc;
      cursor: default;
      color: #000000;
    }

    .rules-preview {
      text-align: center;
      padding-top: 0.667em; /* 8px */
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 0.083em; /* 1px */
    }

    .rules-link {
      display: inline-flex;
      align-items: center;
      gap: 0.667em; /* 8px */
      color: #ff0000;
      text-decoration: none;
      font-size: 1.25em; /* 15px */
      font-weight: 500;
      transition: all 0.2s ease;
      padding: 0.833em 1.333em; /* 10px 16px */
      border-radius: 0.5em; /* 6px */
    }

    .rules-link:hover {
      background: rgba(255, 0, 0, 0.08);
    }

    .rules-link:focus {
      outline: 0.167em solid #ff0000; /* 2px */
      outline-offset: 0.167em; /* 2px */
    }

    @media (max-width: 600px) {
      .hero-section {
        padding: 3.333em 1.667em 3.333em; /* 40px 20px 40px */
      }

      .logo-container {
        max-width: 20em; /* 240px */
      }

      .tagline {
        font-size: 1.1em;
      }

      .settings-container {
        padding: 2.5em 1.667em; /* 30px 20px */
        margin-top: -2.5em; /* -30px */
      }

      .opponent-selector {
        grid-template-columns: repeat(2, 1fr);
      }

      .player-avatar {
        width: 6.667em; /* 80px */
        height: 6.667em; /* 80px */
      }

      .avatar-placeholder,
      .avatar-letter {
        font-size: 3.333em; /* 40px */
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
