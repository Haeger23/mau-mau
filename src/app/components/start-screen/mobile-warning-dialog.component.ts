import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mobile-warning-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Eingeschränkte Darstellung</h2>
    <mat-dialog-content>
      <p>
        Dieses Spiel ist aktuell für Desktop und Tablet optimiert.
        Auf kleineren Bildschirmen kann es zu Einschränkungen in der Darstellung und Bedienung kommen.
      </p>
      <p>Für das beste Spielerlebnis empfehlen wir ein Tablet oder einen Computer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button mat-dialog-close>Verstanden</button>
    </mat-dialog-actions>
  `,
  styles: [`
    p {
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.6;
      margin-bottom: 0.75em;
    }
    p:last-child { margin-bottom: 0; }
  `]
})
export class MobileWarningDialogComponent {}
