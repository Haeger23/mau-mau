import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuitSelectorComponent } from './suit-selector.component';

describe('SuitSelectorComponent', () => {
  let component: SuitSelectorComponent;
  let fixture: ComponentFixture<SuitSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuitSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SuitSelectorComponent);
    component = fixture.componentInstance;
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeDefined();
  });

  describe('Anzeige', () => {
    it('sollte nicht sichtbar sein wenn show=false', () => {
      fixture.componentRef.setInput('show', false);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.suit-selector-overlay');
      expect(overlay).toBeNull();
    });

    it('sollte sichtbar sein wenn show=true', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.suit-selector-overlay');
      expect(overlay).toBeTruthy();
    });

    it('sollte alle 4 Farben anzeigen', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.suit-button');
      expect(buttons.length).toBe(4);
    });

    it('sollte Herz-Button haben', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const heartsButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-hearts"]');
      expect(heartsButton).toBeTruthy();
    });

    it('sollte Karo-Button haben', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const diamondsButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-diamonds"]');
      expect(diamondsButton).toBeTruthy();
    });

    it('sollte Kreuz-Button haben', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const clubsButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-clubs"]');
      expect(clubsButton).toBeTruthy();
    });

    it('sollte Pik-Button haben', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const spadesButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-spades"]');
      expect(spadesButton).toBeTruthy();
    });
  });

  describe('Interaktion', () => {
    it('sollte suitSelected event emittieren bei Herz-Klick', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.suitSelected.subscribe(emitSpy);

      component.selectSuit('hearts');

      expect(emitSpy).toHaveBeenCalledWith('hearts');
    });

    it('sollte suitSelected event emittieren bei Karo-Klick', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.suitSelected.subscribe(emitSpy);

      component.selectSuit('diamonds');

      expect(emitSpy).toHaveBeenCalledWith('diamonds');
    });

    it('sollte suitSelected event emittieren bei Kreuz-Klick', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.suitSelected.subscribe(emitSpy);

      component.selectSuit('clubs');

      expect(emitSpy).toHaveBeenCalledWith('clubs');
    });

    it('sollte suitSelected event emittieren bei Pik-Klick', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.suitSelected.subscribe(emitSpy);

      component.selectSuit('spades');

      expect(emitSpy).toHaveBeenCalledWith('spades');
    });
  });

  describe('Farb-Symbole', () => {
    it('sollte Herz-Symbol anzeigen', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const heartsButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-hearts"]');
      expect(heartsButton.textContent).toContain('♥');
    });

    it('sollte Karo-Symbol anzeigen', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const diamondsButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-diamonds"]');
      expect(diamondsButton.textContent).toContain('♦');
    });

    it('sollte Kreuz-Symbol anzeigen', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const clubsButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-clubs"]');
      expect(clubsButton.textContent).toContain('♣');
    });

    it('sollte Pik-Symbol anzeigen', () => {
      fixture.componentRef.setInput('show', true);
      fixture.detectChanges();

      const spadesButton = fixture.nativeElement.querySelector('[data-testid="suit-selector-spades"]');
      expect(spadesButton.textContent).toContain('♠');
    });
  });
});
