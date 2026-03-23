import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GameService } from '../../services/game.service';
import { version } from '../../../../package.json';

@Component({
  selector: 'app-feedback-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Feedback</h2>

    <mat-dialog-content>
      <div class="field">
        <label class="field-label" for="feedback-type-select">Typ</label>
        <mat-button-toggle-group
          id="feedback-type-select"
          data-testid="feedback-type-select"
          [value]="feedbackType()"
          (change)="feedbackType.set($event.value)"
          hideSingleSelectionIndicator>
          @for (option of typeOptions; track option.value) {
            <mat-button-toggle [value]="option.value">{{ option.label }}</mat-button-toggle>
          }
        </mat-button-toggle-group>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input
          matInput
          data-testid="feedback-name"
          placeholder="Dein Name"
          [value]="playerName()"
          (input)="playerName.set($any($event.target).value)" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>E-Mail</mat-label>
        <input
          matInput
          data-testid="feedback-email"
          type="email"
          placeholder="Deine E-Mail (optional)"
          [value]="email()"
          (input)="email.set($any($event.target).value)" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Titel *</mat-label>
        <input
          matInput
          data-testid="feedback-title"
          placeholder="Kurze Beschreibung"
          [value]="title()"
          (input)="title.set($any($event.target).value)" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Beschreibung</mat-label>
        <textarea
          matInput
          data-testid="feedback-description"
          placeholder="Details (optional)"
          rows="4"
          [value]="description()"
          (input)="description.set($any($event.target).value)"></textarea>
      </mat-form-field>

      <div class="checkboxes">
        <mat-checkbox
          [checked]="includeVersion()"
          (change)="includeVersion.set($event.checked)">
          Version (v{{ appVersion }}) anfügen
        </mat-checkbox>
        @if (hasGame()) {
          <mat-checkbox
            [checked]="includePlayerCount()"
            (change)="includePlayerCount.set($event.checked)">
            Spieleranzahl ({{ gameService.state().players.length }}) anfügen
          </mat-checkbox>
        }
        @if (hasGameLogs()) {
          <mat-checkbox
            data-testid="feedback-logs-checkbox"
            [checked]="includeGameLogs()"
            (change)="includeGameLogs.set($event.checked)">
            Spielprotokoll anfügen
          </mat-checkbox>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Abbrechen</button>
      <button
        mat-button
        data-testid="feedback-mailto"
        [disabled]="!title()"
        (click)="submitMailto()">
        Per E-Mail senden
      </button>
      <button
        mat-flat-button
        color="primary"
        data-testid="feedback-submit"
        [disabled]="!title()"
        (click)="submitGithub()">
        GitHub Issue erstellen
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.333em;
      margin-bottom: 1em;
    }

    .field-label {
      font-size: 0.917em;
      color: rgba(0, 0, 0, 0.6);
    }

    mat-button-toggle-group {
      width: 100%;
    }

    mat-button-toggle {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      margin-bottom: 0.5em;
    }
  `]
})
export class FeedbackDialogComponent {
  protected readonly gameService = inject(GameService);
  protected readonly appVersion = version;
  private readonly dialogRef = inject(MatDialogRef<FeedbackDialogComponent>);

  readonly feedbackType = signal<'bug' | 'vorschlag' | 'frage'>('bug');
  readonly title = signal('');
  readonly description = signal('');
  readonly includeGameLogs = signal(true);
  readonly playerName = signal('');
  readonly email = signal('');

  readonly includePlayerCount = signal(true);
  readonly includeVersion = signal(true);

  readonly hasGameLogs = computed(() => this.gameService.state().chatLog.length > 0);
  readonly hasGame = computed(() => this.gameService.state().players.length > 0);

  readonly typeOptions = [
    { value: 'bug' as const, label: 'Bug' },
    { value: 'vorschlag' as const, label: 'Vorschlag' },
    { value: 'frage' as const, label: 'Frage' }
  ];

  constructor() {
    const human = this.gameService.state().players.find(p => p.isHuman);
    this.playerName.set(human?.name ?? '');
  }

  private buildBody(): { body: string; label: string } {
    const logs = this.includeGameLogs()
      ? this.gameService.state().chatLog
          .map(m => `[${m.timestamp.toLocaleTimeString()}] ${m.playerName}: ${m.message}`)
          .join('\n')
          .slice(0, 4000)
      : '';

    const playerCount = this.gameService.state().players.length;
    const nameLine = this.playerName() ? `Von: ${this.playerName()}\n` : '';
    const emailLine = this.email() ? `E-Mail: ${this.email()}\n` : '';
    const versionLine = this.includeVersion() ? `Version: v${version}\n` : '';
    const playerCountLine = this.includePlayerCount() && playerCount > 0 ? `Spieleranzahl: ${playerCount}\n` : '';
    const body = nameLine + emailLine + versionLine + playerCountLine + this.description() +
      (logs ? `\n\n## Spielprotokoll\n\`\`\`\n${logs}\n\`\`\`` : '');

    const label = this.feedbackType() === 'bug' ? 'bug' :
                  this.feedbackType() === 'vorschlag' ? 'enhancement' : 'question';

    return { body, label };
  }

  submitGithub(): void {
    const { body, label } = this.buildBody();
    const url = `https://github.com/Haeger23/mau-mau/issues/new` +
      `?title=${encodeURIComponent(this.title())}` +
      `&body=${encodeURIComponent(body)}` +
      `&labels=${label},feedback`;
    window.open(url, '_blank');
    this.dialogRef.close();
  }

  submitMailto(): void {
    const { body, label } = this.buildBody();
    const url = `mailto:mau-mau@kampe24.de` +
      `?subject=${encodeURIComponent('[' + label + '] ' + this.title())}` +
      `&body=${encodeURIComponent(body)}`;
    window.open(url, '_self');
    this.dialogRef.close();
  }
}
