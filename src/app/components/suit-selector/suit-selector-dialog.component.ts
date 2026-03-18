import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Suit } from '../../models/card.model';

@Component({
  selector: 'app-suit-selector-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Wähle eine Farbe für den Buben:</h2>
    <mat-dialog-content>
      <div class="suits">
        @for (suit of suits; track suit.value) {
          <button
            class="suit-button"
            [attr.data-suit]="suit.value"
            [attr.data-testid]="'suit-selector-' + suit.value"
            (click)="select(suit.value)">
            <span class="suit-symbol">{{ suit.symbol }}</span>
            <span class="suit-name">{{ suit.name }}</span>
          </button>
        }
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .suits {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25em;
      padding: 0.5em 0;
    }

    .suit-button {
      width: 100%;
      aspect-ratio: 1;
      border: 0.25em solid #ddd;
      border-radius: 0.667em;
      background: white;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .suit-button:hover {
      border-color: #4CAF50;
      box-shadow: 0 0.333em 1em rgba(76, 175, 80, 0.3);
    }

    .suit-symbol {
      font-size: 3.5em;
    }

    .suit-name {
      font-size: 1em;
      font-weight: bold;
      text-transform: uppercase;
    }

    [data-suit="hearts"] .suit-symbol,
    [data-suit="hearts"] .suit-name,
    [data-suit="diamonds"] .suit-symbol,
    [data-suit="diamonds"] .suit-name {
      color: #ff0000;
    }

    [data-suit="clubs"] .suit-symbol,
    [data-suit="clubs"] .suit-name,
    [data-suit="spades"] .suit-symbol,
    [data-suit="spades"] .suit-name {
      color: #000000;
    }
  `]
})
export class SuitSelectorDialogComponent {
  readonly suits = [
    { value: 'hearts' as Suit, symbol: '♥', name: 'Herz' },
    { value: 'diamonds' as Suit, symbol: '♦', name: 'Karo' },
    { value: 'clubs' as Suit, symbol: '♣', name: 'Kreuz' },
    { value: 'spades' as Suit, symbol: '♠', name: 'Pik' }
  ];

  constructor(private dialogRef: MatDialogRef<SuitSelectorDialogComponent>) {}

  select(suit: Suit): void {
    this.dialogRef.close(suit);
  }
}
