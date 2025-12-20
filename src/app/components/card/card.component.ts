import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="card" 
      [class.clickable]="clickable()"
      [class.selected]="selected()"
      [attr.data-suit]="card().suit"
      (click)="handleClick()">
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
      width: 120px;
      height: 168px;
      background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
      border: 3px solid #1a1a1a;
      border-radius: 12px;
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
      top: 8px;
      left: 8px;
      right: 8px;
      bottom: 8px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      pointer-events: none;
    }

    .card.clickable {
      cursor: pointer;
    }

    .card.clickable:hover {
      transform: translateY(-12px) scale(1.03);
      box-shadow: 
        0 12px 24px rgba(0, 0, 0, 0.25),
        0 6px 12px rgba(0, 0, 0, 0.15),
        0 0 0 3px rgba(76, 175, 80, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      border-color: #4CAF50;
    }

    .card.selected {
      transform: translateY(-16px) scale(1.05);
      box-shadow: 
        0 16px 32px rgba(0, 0, 0, 0.3),
        0 8px 16px rgba(0, 0, 0, 0.2),
        0 0 0 4px #4CAF50,
        inset 0 2px 4px rgba(76, 175, 80, 0.1);
      border-color: #4CAF50;
      background: linear-gradient(to bottom, #f0fff0 0%, #e8f5e9 100%);
    }

    .card-corner {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-weight: 900;
      padding: 8px;
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
      font-size: 24px;
      line-height: 1;
      font-family: 'Georgia', 'Times New Roman', serif;
      font-weight: 900;
      letter-spacing: -1px;
    }

    .suit {
      font-size: 22px;
      line-height: 1;
      margin-top: 2px;
    }

    .card-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 0;
    }

    .suit-large {
      font-size: 64px;
      opacity: 0.85;
    }

    [data-suit="hearts"] .rank,
    [data-suit="hearts"] .suit {
      color: #DC143C;
      text-shadow: 0 1px 2px rgba(220, 20, 60, 0.3);
    }

    [data-suit="diamonds"] .rank,
    [data-suit="diamonds"] .suit {
      color: #FF4500;
      text-shadow: 0 1px 2px rgba(255, 69, 0, 0.3);
    }

    [data-suit="clubs"] .rank,
    [data-suit="clubs"] .suit {
      color: #1a1a1a;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    [data-suit="spades"] .rank,
    [data-suit="spades"] .suit {
      color: #000000;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    [data-suit="hearts"] .suit-large,
    [data-suit="diamonds"] .suit-large {
      color: #DC143C;
      text-shadow: 0 2px 4px rgba(220, 20, 60, 0.3);
      filter: drop-shadow(0 2px 4px rgba(220, 20, 60, 0.2));
    }

    [data-suit="clubs"] .suit-large,
    [data-suit="spades"] .suit-large {
      color: #1a1a1a;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
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
