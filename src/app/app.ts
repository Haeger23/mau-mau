import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { StartScreenComponent, GameSetup } from './components/start-screen/start-screen.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GameBoardComponent, StartScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('mau-mau');
  protected gameStarted = signal<boolean>(false);
  protected gameSetup = signal<GameSetup | null>(null);

  onGameStart(setup: GameSetup): void {
    this.gameSetup.set(setup);
    this.gameStarted.set(true);
  }

  onReturnToStart(): void {
    this.gameStarted.set(false);
    this.gameSetup.set(null);
  }
}
