import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MobileWarningDialogComponent } from './mobile-warning-dialog.component';

describe('MobileWarningDialogComponent', () => {
  let component: MobileWarningDialogComponent;
  let fixture: ComponentFixture<MobileWarningDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileWarningDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MobileWarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeDefined();
  });

  describe('Anzeige', () => {
    it('sollte Titel "Eingeschränkte Darstellung" anzeigen', () => {
      const title = fixture.nativeElement.querySelector('[mat-dialog-title]');
      expect(title.textContent.trim()).toBe('Eingeschränkte Darstellung');
    });

    it('sollte Hinweis auf Desktop/Tablet-Optimierung enthalten', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(content.textContent).toContain('Desktop und Tablet');
    });

    it('sollte "Verstanden"-Button anzeigen', () => {
      const btn = fixture.nativeElement.querySelector('[mat-flat-button]');
      expect(btn.textContent.trim()).toBe('Verstanden');
    });
  });
});
