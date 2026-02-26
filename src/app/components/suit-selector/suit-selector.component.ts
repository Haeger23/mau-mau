import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Suit } from '../../models/card.model';

@Component({
  selector: 'app-suit-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div class="suit-selector-overlay">
        <div class="suit-selector">
          <h3>Wähle eine Farbe für den Buben:</h3>
          <div class="suits">
            @for (suit of suits; track suit.value) {
              <button 
                class="suit-button" 
                [attr.data-suit]="suit.value"
                [attr.data-testid]="'suit-selector-' + suit.value"
                (click)="selectSuit(suit.value)">
                <span class="suit-symbol">{{ suit.symbol }}</span>
                <span class="suit-name">{{ suit.name }}</span>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .suit-selector-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .suit-selector {
      background: white;
      padding: 2.5em; /* 30px */
      border-radius: 1em; /* 12px */
      box-shadow: 0 0.833em 3.333em rgba(0, 0, 0, 0.3); /* 0 10px 40px */
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(4.167em); opacity: 0; } /* 50px */
      to { transform: translateY(0); opacity: 1; }
    }

    h3 {
      margin: 0 0 1.667em 0; /* 0 0 20px 0 */
      text-align: center;
      color: #2c3e50;
    }

    .suits {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25em; /* 15px */
    }

    .suit-button {
      width: 10em; /* 120px */
      height: 10em; /* 120px */
      border: 0.25em solid #ddd; /* 3px */
      border-radius: 0.667em; /* 8px */
      background: white;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .suit-button:hover {
      border-color: #4CAF50;
      box-shadow: 0 0.333em 1em rgba(76, 175, 80, 0.3); /* 0 4px 12px */
    }

    .suit-symbol {
      font-size: 4em; /* 48px */
    }

    .suit-name {
      font-size: 1.167em; /* 14px */
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
export class SuitSelectorComponent {
  show = input.required<boolean>();
  suitSelected = output<Suit>();

  suits = [
    { value: 'hearts' as Suit, symbol: '♥', name: 'Herz' },
    { value: 'diamonds' as Suit, symbol: '♦', name: 'Karo' },
    { value: 'clubs' as Suit, symbol: '♣', name: 'Kreuz' },
    { value: 'spades' as Suit, symbol: '♠', name: 'Pik' }
  ];

  selectSuit(suit: Suit): void {
    this.suitSelected.emit(suit);
  }
}
