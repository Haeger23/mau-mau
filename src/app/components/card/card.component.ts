import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.clickable]': 'clickable()'
  },
  template: `
    <div
      class="card"
      [class.clickable]="clickable()"
      [class.selected]="selected()"
      [attr.data-suit]="card().suit"
      [attr.data-testid]="'card-' + card().suit + '-' + card().rank"
      [attr.tabindex]="clickable() ? 0 : null"
      [attr.role]="clickable() ? 'button' : null"
      (click)="handleClick()"
      (keydown.enter)="handleClick()"
      (keydown.space)="handleClick()">
      <div class="card-corner top-left">
        <div class="rank">{{ card().rank }}</div>
        <div class="suit">{{ getSuitSymbol() }}</div>
      </div>
      <div class="card-center">
        <div class="suit-large">{{ getSuitSymbol() }}</div>
      </div>
      <div class="card-corner bottom-right">
        <div class="rank">{{ card().rank }}</div>
        <div class="suit">{{ getSuitSymbol() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      width: 10em; /* 120px */
      height: 14em; /* 168px */
      background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
      border-radius: 1em; /* 12px */
      position: relative;
      box-shadow: 
        0 4px 8px rgba(0, 0, 0, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        ellipse at center,
        rgba(255, 255, 255, 0.3) 0%,
        transparent 70%
      );
      pointer-events: none;
    }

    .card::after {
      content: '';
      position: absolute;
      top: 0.667em; /* 8px */
      left: 0.667em; /* 8px */
      right: 0.667em; /* 8px */
      bottom: 0.667em; /* 8px */
      border: 0.083em solid rgba(0, 0, 0, 0.05); /* 1px */
      border-radius: 0.667em; /* 8px */
      pointer-events: none;
    }

    .card.clickable {
      cursor: pointer;
    }

    .card.clickable:hover {
      transform: translateY(-1em) scale(1.03); /* -12px */
      box-shadow: 
        0 1em 2em rgba(0, 0, 0, 0.25), /* 0 12px 24px */
        0 0.5em 1em rgba(0, 0, 0, 0.15), /* 0 6px 12px */
        0 0 0 0.25em rgba(76, 175, 80, 0.3), /* 0 0 0 3px */
        inset 0 0.083em 0 rgba(255, 255, 255, 0.9); /* inset 0 1px 0 */
      border-color: #4CAF50;
    }

    .card.selected {
      transform: translateY(-1.333em) scale(1.05); /* -16px */
      box-shadow: 
        0 1.333em 2.667em rgba(0, 0, 0, 0.3), /* 0 16px 32px */
        0 0.667em 1.333em rgba(0, 0, 0, 0.2), /* 0 8px 16px */
        0 0 0 0.333em #4CAF50, /* 0 0 0 4px */
        inset 0 0.167em 0.333em rgba(76, 175, 80, 0.1); /* inset 0 2px 4px */
      border-color: #4CAF50;
      background: linear-gradient(to bottom, #f0fff0 0%, #e8f5e9 100%);
    }

    .card-corner {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-weight: 900;
      padding: 0.667em; /* 8px */
      z-index: 1;
    }

    .top-left {
      top: 0;
      left: 0;
    }

    .bottom-right {
      bottom: 0;
      right: 0;
      transform: rotate(180deg);
    }

    .rank {
      font-size: 2em; /* 24px */
      line-height: 1;
      font-family: 'Georgia', 'Times New Roman', serif;
      font-weight: 900;
      letter-spacing: -0.083em; /* -1px */
    }

    .suit {
      font-size: 1.833em; /* 22px */
      line-height: 1;
      margin-top: 0.167em; /* 2px */
    }

    .card-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 0;
    }

    .suit-large {
      font-size: 5.333em; /* 64px */
      opacity: 0.85;
    }

    [data-suit="hearts"] .rank,
    [data-suit="hearts"] .suit {
      color: #ff0000;
      text-shadow: 0 0.083em 0.167em rgba(255, 0, 0, 0.3); /* 0 1px 2px */
    }

    [data-suit="diamonds"] .rank,
    [data-suit="diamonds"] .suit {
      color: #ff0000;
      text-shadow: 0 0.083em 0.167em rgba(255, 0, 0, 0.3); /* 0 1px 2px */
    }

    [data-suit="clubs"] .rank,
    [data-suit="clubs"] .suit {
      color: #000000;
      text-shadow: 0 0.083em 0.167em rgba(0, 0, 0, 0.4); /* 0 1px 2px */
    }

    [data-suit="spades"] .rank,
    [data-suit="spades"] .suit {
      color: #000000;
      text-shadow: 0 0.083em 0.167em rgba(0, 0, 0, 0.5); /* 0 1px 2px */
    }

    [data-suit="hearts"] .suit-large,
    [data-suit="diamonds"] .suit-large {
      color: #ff0000;
      text-shadow: 0 0.167em 0.333em rgba(255, 0, 0, 0.3); /* 0 2px 4px */
      filter: drop-shadow(0 0.167em 0.333em rgba(255, 0, 0, 0.2)); /* 0 2px 4px */
    }

    [data-suit="clubs"] .suit-large,
    [data-suit="spades"] .suit-large {
      color: #000000;
      text-shadow: 0 0.167em 0.333em rgba(0, 0, 0, 0.4); /* 0 2px 4px */
      filter: drop-shadow(0 0.167em 0.333em rgba(0, 0, 0, 0.3)); /* 0 2px 4px */
    }
  `]
})
export class CardComponent {
  card = input.required<Card>();
  clickable = input<boolean>(false);
  selected = input<boolean>(false);
  
  cardClick = output<Card>();

  handleClick(): void {
    if (this.clickable()) {
      this.cardClick.emit(this.card());
    }
  }

  getSuitSymbol(): string {
    const symbols: Record<string, string> = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[this.card().suit] || '';
  }
}
