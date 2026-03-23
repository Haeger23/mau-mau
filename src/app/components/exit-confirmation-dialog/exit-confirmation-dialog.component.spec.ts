import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ExitConfirmationDialogComponent } from './exit-confirmation-dialog.component';

describe('ExitConfirmationDialogComponent', () => {
  let component: ExitConfirmationDialogComponent;
  let fixture: ComponentFixture<ExitConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExitConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExitConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeDefined();
  });

  describe('Anzeige', () => {
    it('sollte Titel "Spiel beenden?" anzeigen', () => {
      const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
      expect(title.textContent.trim()).toBe('Spiel beenden?');
    });

    it('sollte Abbrechen-Button anzeigen', () => {
      const btn = fixture.nativeElement.querySelector('[mat-stroked-button]');
      expect(btn.textContent.trim()).toBe('Abbrechen');
    });

    it('sollte Beenden-Button anzeigen', () => {
      const btn = fixture.nativeElement.querySelector('[mat-flat-button]');
      expect(btn.textContent.trim()).toBe('Beenden');
    });
  });
});
