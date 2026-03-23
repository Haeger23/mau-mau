import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-exit-confirmation-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Spiel beenden?</h2>
    <mat-dialog-content>
      <p>Möchtest du die aktuelle Partie wirklich beenden und zum Startbildschirm zurückkehren?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button class="confirm-btn cancel" [mat-dialog-close]="false">Abbrechen</button>
      <button mat-flat-button color="warn" class="confirm-btn confirm" [mat-dialog-close]="true">Beenden</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content p {
      color: #666;
      line-height: 1.5;
    }
  `]
})
export class ExitConfirmationDialogComponent {}
