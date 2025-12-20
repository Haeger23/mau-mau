import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
            <input 
              id="playerName"
              type="text" 
              [(ngModel)]="playerName"
              (keyup.enter)="startGame()"
              placeholder="Gib deinen Namen ein..."
              maxlength="20"
              class="name-input">
          </div>

          <div class="form-group">
            <label>Anzahl Computer-Gegner:</label>
            <div class="opponent-selector">
              @for (count of opponentOptions; track count) {
                <button
                  class="opponent-btn"
                  [class.selected]="opponentCount() === count"
                  (click)="selectOpponents(count)">
                  {{ count }} {{ count === 1 ? 'Gegner' : 'Gegner' }}
                </button>
              }
            </div>
          </div>

          <button 
            class="start-btn"
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

    .name-input {
      padding: 15px 20px;
      font-size: 16px;
      border: 2px solid #ddd;
      border-radius: 10px;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .name-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  playerName = signal<string>('');
  opponentCount = signal<number>(2);
  opponentOptions = [1, 2, 3, 4];

  gameStart = output<GameSetup>();

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
