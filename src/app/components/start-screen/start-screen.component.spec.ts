import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartScreenComponent } from './start-screen.component';

describe('StartScreenComponent', () => {
  let component: StartScreenComponent;
  let fixture: ComponentFixture<StartScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartScreenComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StartScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeDefined();
  });

  describe('Initialisierung', () => {
    it('sollte mit leerem Spielernamen starten', () => {
      expect(component.playerName()).toBe('');
    });

    it('sollte mit 3 Gegnern als Standard starten', () => {
      expect(component.opponentCount()).toBe(3);
    });

    it('sollte Gegner-Optionen 1-4 haben', () => {
      expect(component.opponentOptions).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Spielername', () => {
    it('sollte Spielername-Input rendern', () => {
      const input = fixture.nativeElement.querySelector('[data-testid="input-player-name"]');
      expect(input).toBeTruthy();
    });

    it('sollte Start-Button deaktivieren bei leerem Namen', () => {
      component.playerName.set('');
      fixture.detectChanges();

      const startButton = fixture.nativeElement.querySelector('[data-testid="action-start-game"]');
      expect(startButton.disabled).toBe(true);
    });

    it('sollte Start-Button aktivieren bei gültigem Namen', () => {
      component.playerName.set('Spieler');
      fixture.detectChanges();

      const startButton = fixture.nativeElement.querySelector('[data-testid="action-start-game"]');
      expect(startButton.disabled).toBe(false);
    });

    it('sollte Start-Button deaktivieren bei nur Leerzeichen', () => {
      component.playerName.set('   ');
      fixture.detectChanges();

      const startButton = fixture.nativeElement.querySelector('[data-testid="action-start-game"]');
      expect(startButton.disabled).toBe(true);
    });
  });

  describe('Gegner-Auswahl', () => {
    it('sollte 1 Gegner auswählen können', () => {
      component.selectOpponents(1);
      expect(component.opponentCount()).toBe(1);
    });

    it('sollte 2 Gegner auswählen können', () => {
      component.selectOpponents(2);
      expect(component.opponentCount()).toBe(2);
    });

    it('sollte 3 Gegner auswählen können', () => {
      component.selectOpponents(3);
      expect(component.opponentCount()).toBe(3);
    });

    it('sollte alle Gegner-Buttons rendern', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.opponent-btn');
      expect(buttons.length).toBe(4);
    });

    it('sollte selected Klasse auf gewähltem Button haben', () => {
      component.selectOpponents(1);
      fixture.detectChanges();

      const button1 = fixture.nativeElement.querySelector('[data-testid="select-opponents-1"]');
      expect(button1.classList.contains('selected')).toBe(true);
    });
  });

  describe('Spiel starten', () => {
    it('sollte gameStart event emittieren mit korrekten Daten', () => {
      const emitSpy = vi.fn();
      component.gameStart.subscribe(emitSpy);

      component.playerName.set('TestSpieler');
      component.selectOpponents(2);
      component.startGame();

      expect(emitSpy).toHaveBeenCalledWith({
        playerName: 'TestSpieler',
        opponentCount: 2
      });
    });

    it('sollte gameStart nicht emittieren bei leerem Namen', () => {
      const emitSpy = vi.fn();
      component.gameStart.subscribe(emitSpy);

      component.playerName.set('');
      component.startGame();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('sollte gameStart nicht emittieren bei nur Leerzeichen', () => {
      const emitSpy = vi.fn();
      component.gameStart.subscribe(emitSpy);

      component.playerName.set('   ');
      component.startGame();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('sollte Namen trimmen vor dem Senden', () => {
      const emitSpy = vi.fn();
      component.gameStart.subscribe(emitSpy);

      component.playerName.set('  Spieler  ');
      component.selectOpponents(1);
      component.startGame();

      expect(emitSpy).toHaveBeenCalledWith({
        playerName: 'Spieler',
        opponentCount: 1
      });
    });
  });

  describe('UI-Elemente', () => {
    it('sollte Titel "Mau-Mau" anzeigen', () => {
      const title = fixture.nativeElement.querySelector('h1');
      expect(title.textContent).toContain('Mau-Mau');
    });

    it('sollte Spielregeln anzeigen', () => {
      const rulesSection = fixture.nativeElement.querySelector('.rules-preview');
      expect(rulesSection).toBeTruthy();
    });

    it('sollte "Spielregeln:" Überschrift haben', () => {
      const rulesTitle = fixture.nativeElement.querySelector('.rules-preview h3');
      expect(rulesTitle.textContent).toContain('Spielregeln');
    });
  });
});
