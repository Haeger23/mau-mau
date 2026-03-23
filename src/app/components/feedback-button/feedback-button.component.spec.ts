import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FeedbackButtonComponent } from './feedback-button.component';

describe('FeedbackButtonComponent', () => {
  let component: FeedbackButtonComponent;
  let fixture: ComponentFixture<FeedbackButtonComponent>;
  let dialogSpy: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogSpy = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FeedbackButtonComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeDefined();
  });

  describe('Anzeige', () => {
    it('sollte Feedback-Button rendern', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="feedback-button"]');
      expect(btn).toBeTruthy();
    });

    it('sollte aria-label "Feedback geben" haben', () => {
      const btn = fixture.nativeElement.querySelector('[data-testid="feedback-button"]');
      expect(btn.getAttribute('aria-label')).toBe('Feedback geben');
    });
  });

  describe('Interaktion', () => {
    it('sollte Dialog öffnen bei Klick', () => {
      component.openDialog();
      expect(dialogSpy.open).toHaveBeenCalledOnce();
    });

    it('sollte Dialog mit korrekter Breite öffnen', () => {
      component.openDialog();
      const [, config] = dialogSpy.open.mock.calls[0];
      expect(config).toMatchObject({ width: '44em', maxWidth: '95vw' });
    });
  });
});
