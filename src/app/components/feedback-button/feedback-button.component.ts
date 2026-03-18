import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent } from './feedback-dialog.component';

@Component({
  selector: 'app-feedback-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-fab
      class="feedback-btn"
      data-testid="feedback-button"
      color="primary"
      aria-label="Feedback geben"
      (click)="openDialog()">
      <mat-icon>feedback</mat-icon>
    </button>
  `,
  styles: [`
    .feedback-btn {
      position: fixed !important;
      bottom: 2em;
      left: 2em;
      z-index: 500;
    }
  `]
})
export class FeedbackButtonComponent {
  private readonly dialog = inject(MatDialog);

  openDialog(): void {
    this.dialog.open(FeedbackDialogComponent, {
      width: '44em',
      maxWidth: '95vw'
    });
  }
}
