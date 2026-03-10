# Material Design 3 Integration

Dieses Projekt nutzt jetzt **Material Design 3 (Material You)** von Google über Angular Material.

## Installierte Pakete

- `@angular/material@^21.0.0` - Material Design 3 Komponenten für Angular

## Konfiguration

### Theme-Datei
Die Material 3 Theme-Konfiguration befindet sich in [`src/theme.scss`](src/theme.scss).

Das Theme ist so konfiguriert, dass es das minimalistische Schweizer Design des Mau-Mau Projekts respektiert:
- **Primary**: Schwarz-Grau Töne (minimalistisch)
- **Tertiary**: Rot als Akzentfarbe
- **Typography**: Lato-Schriftart (bereits im Projekt verwendet)
- **Density**: Standard (0)

### App-Konfiguration
In [`src/app/app.config.ts`](src/app/app.config.ts) wurden die Animationen aktiviert:
```typescript
provideAnimationsAsync()
```

### Icons
Material Icons wurden in [`src/index.html`](src/index.html) hinzugefügt.

## Verfügbare Material 3 Komponenten

### Buttons
```typescript
import { MatButtonModule } from '@angular/material/button';

// In Template:
<button mat-button>Text Button</button>
<button mat-raised-button color="primary">Raised Button</button>
<button mat-flat-button color="accent">Flat Button</button>
<button mat-stroked-button>Outlined Button</button>
<button mat-icon-button>
  <mat-icon>favorite</mat-icon>
</button>
```

### Cards
```typescript
import { MatCardModule } from '@angular/material/card';

// In Template:
<mat-card>
  <mat-card-header>
    <mat-card-title>Card Title</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    Card content
  </mat-card-content>
  <mat-card-actions>
    <button mat-button>ACTION</button>
  </mat-card-actions>
</mat-card>
```

### Dialogs
```typescript
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';

// In Component:
constructor(private dialog: MatDialog) {}

openDialog() {
  this.dialog.open(DialogComponent);
}
```

### Form Fields
```typescript
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// In Template:
<mat-form-field>
  <mat-label>Label</mat-label>
  <input matInput>
</mat-form-field>
```

### Chips
```typescript
import { MatChipsModule } from '@angular/material/chips';

// In Template:
<mat-chip-set>
  <mat-chip>Chip 1</mat-chip>
  <mat-chip>Chip 2</mat-chip>
</mat-chip-set>
```

### Progress Indicators
```typescript
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// In Template:
<mat-spinner></mat-spinner>
<mat-progress-bar mode="indeterminate"></mat-progress-bar>
```

### Tooltips
```typescript
import { MatTooltipModule } from '@angular/material/tooltip';

// In Template:
<button mat-button matTooltip="Tooltip text">
  Hover me
</button>
```

### Snackbar (Notifications)
```typescript
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

// In Component:
constructor(private snackBar: MatSnackBar) {}

showMessage() {
  this.snackBar.open('Message', 'OK', { duration: 3000 });
}
```

## Verwendung in Komponenten

### Standalone Components
Da dieses Projekt Standalone Components verwendet, müssen Sie die benötigten Module direkt in der Component importieren:

```typescript
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-content>
        <button mat-raised-button color="primary">Click me</button>
      </mat-card-content>
    </mat-card>
  `
})
export class ExampleComponent {}
```

## Design-Prinzipien

Das Material 3 Theme wurde so angepasst, dass es die bestehenden Design-Prinzipien des Projekts respektiert:

1. **Minimalismus**: Schwarz-Weiß-Design bleibt erhalten
2. **Klare Strukturen**: 2px Rahmen werden beibehalten
3. **Kompaktes Spacing**: Spacing-System bleibt unverändert
4. **Swiss Design**: Klare Linien und funktionaler Fokus

## Weitere Komponenten

Eine vollständige Liste aller verfügbaren Material 3 Komponenten finden Sie in der [Angular Material Dokumentation](https://material.angular.io/components/categories).

## Anpassungen

Das Theme kann in [`src/theme.scss`](src/theme.scss) angepasst werden:
- Farbpaletten ändern
- Typography-Einstellungen anpassen
- Density-Scale ändern (für kompaktere/luftigere UIs)
- Dark Mode aktivieren (siehe Kommentare in theme.scss)
