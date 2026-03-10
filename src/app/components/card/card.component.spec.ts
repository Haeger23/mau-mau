import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CardComponent } from './card.component';
import { Card } from '../../models/card.model';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeDefined();
  });

  describe('Karten-Rendering', () => {
    it('sollte Herz-Symbol korrekt anzeigen', () => {
      const card: Card = { id: '1', suit: 'hearts', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      expect(component.getSuitSymbol()).toBe('♥');
    });

    it('sollte Karo-Symbol korrekt anzeigen', () => {
      const card: Card = { id: '1', suit: 'diamonds', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      expect(component.getSuitSymbol()).toBe('♦');
    });

    it('sollte Kreuz-Symbol korrekt anzeigen', () => {
      const card: Card = { id: '1', suit: 'clubs', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      expect(component.getSuitSymbol()).toBe('♣');
    });

    it('sollte Pik-Symbol korrekt anzeigen', () => {
      const card: Card = { id: '1', suit: 'spades', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      expect(component.getSuitSymbol()).toBe('♠');
    });

    it('sollte Herz-Karte data-suit attribute haben', () => {
      const card: Card = { id: '1', suit: 'hearts', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.getAttribute('data-suit')).toBe('hearts');
    });

    it('sollte Karo-Karte data-suit attribute haben', () => {
      const card: Card = { id: '1', suit: 'diamonds', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.getAttribute('data-suit')).toBe('diamonds');
    });

    it('sollte Kreuz-Karte data-suit attribute haben', () => {
      const card: Card = { id: '1', suit: 'clubs', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.getAttribute('data-suit')).toBe('clubs');
    });

    it('sollte Pik-Karte data-suit attribute haben', () => {
      const card: Card = { id: '1', suit: 'spades', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.getAttribute('data-suit')).toBe('spades');
    });
  });

  describe('Karten-Interaktion', () => {
    it('sollte cardClick event emittieren wenn clickable', () => {
      const card: Card = { id: '1', suit: 'hearts', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.cardClick.subscribe(emitSpy);

      component.handleClick();

      expect(emitSpy).toHaveBeenCalledWith(card);
    });

    it('sollte NICHT cardClick event emittieren wenn nicht clickable', () => {
      const card: Card = { id: '1', suit: 'hearts', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.componentRef.setInput('clickable', false);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.cardClick.subscribe(emitSpy);

      component.handleClick();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('sollte clickable CSS-Klasse haben wenn clickable=true', () => {
      const card: Card = { id: '1', suit: 'hearts', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.classList.contains('clickable')).toBe(true);
    });

    it('sollte selected CSS-Klasse haben wenn selected=true', () => {
      const card: Card = { id: '1', suit: 'hearts', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.componentRef.setInput('selected', true);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.classList.contains('selected')).toBe(true);
    });
  });

  describe('Karten-Attribute', () => {
    it('sollte data-testid mit Suit und Rank haben', () => {
      const card: Card = { id: '1', suit: 'hearts', rank: '7' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.getAttribute('data-testid')).toBe('card-hearts-7');
    });

    it('sollte data-suit Attribut haben', () => {
      const card: Card = { id: '1', suit: 'clubs', rank: 'A' };
      fixture.componentRef.setInput('card', card);
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement.getAttribute('data-suit')).toBe('clubs');
    });
  });

  describe('Alle Karten-Ränge', () => {
    const ranks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

    ranks.forEach(rank => {
      it(`sollte Rang ${rank} korrekt rendern`, () => {
        const card: Card = { id: '1', suit: 'hearts', rank };
        fixture.componentRef.setInput('card', card);
        fixture.detectChanges();

        const rankElements = fixture.nativeElement.querySelectorAll('.rank');
        expect(rankElements[0].textContent).toBe(rank);
      });
    });
  });
});
