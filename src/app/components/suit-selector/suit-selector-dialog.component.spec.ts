import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SuitSelectorDialogComponent } from './suit-selector-dialog.component';

describe('SuitSelectorDialogComponent', () => {
  let component: SuitSelectorDialogComponent;
  let fixture: ComponentFixture<SuitSelectorDialogComponent>;
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefSpy = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SuitSelectorDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SuitSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeDefined();
  });

  describe('Anzeige', () => {
    it('sollte alle 4 Farben-Buttons anzeigen', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.suit-button');
      expect(buttons.length).toBe(4);
    });

    it('sollte Herz-Button haben', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-hearts"]');
      expect(btn).toBeTruthy();
    });

    it('sollte Karo-Button haben', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-diamonds"]');
      expect(btn).toBeTruthy();
    });

    it('sollte Kreuz-Button haben', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-clubs"]');
      expect(btn).toBeTruthy();
    });

    it('sollte Pik-Button haben', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-spades"]');
      expect(btn).toBeTruthy();
    });

    it('sollte Herz-Symbol ♥ anzeigen', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-hearts"]');
      expect(btn.textContent).toContain('♥');
    });

    it('sollte Karo-Symbol ♦ anzeigen', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-diamonds"]');
      expect(btn.textContent).toContain('♦');
    });

    it('sollte Kreuz-Symbol ♣ anzeigen', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-clubs"]');
      expect(btn.textContent).toContain('♣');
    });

    it('sollte Pik-Symbol ♠ anzeigen', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="suit-selector-spades"]');
      expect(btn.textContent).toContain('♠');
    });
  });

  describe('Interaktion', () => {
    it('sollte Dialog mit "hearts" schliessen bei Herz-Klick', () => {
      component.select('hearts');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('hearts');
    });

    it('sollte Dialog mit "diamonds" schliessen bei Karo-Klick', () => {
      component.select('diamonds');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('diamonds');
    });

    it('sollte Dialog mit "clubs" schliessen bei Kreuz-Klick', () => {
      component.select('clubs');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('clubs');
    });

    it('sollte Dialog mit "spades" schliessen bei Pik-Klick', () => {
      component.select('spades');
      expect(dialogRefSpy.close).toHaveBeenCalledWith('spades');
    });
  });
});
