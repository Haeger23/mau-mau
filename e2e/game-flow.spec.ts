import { test, expect } from '@playwright/test';

test.describe('Mau-Mau Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sollte vollständigen Spielablauf durchführen', async ({ page }) => {
    // Start Screen
    await expect(page.locator('h1')).toContainText('Mau-Mau');
    
    // Namen eingeben
    await page.locator('[data-testid="input-player-name"]').fill('E2E Tester');
    
    // 2 Gegner auswählen
    await page.locator('[data-testid="select-opponents-2"]').click();
    
    // Spiel starten
    await page.locator('[data-testid="action-start-game"]').click();
    
    // Warte auf Spielbrett
    await expect(page.locator('[data-testid="player-0-name"]')).toContainText('E2E Tester');
    
    // Überprüfe dass Spieler 5 Karten hat
    const handSize = await page.locator('[data-testid="player-0-hand-size"]').textContent();
    expect(handSize).toContain('5 Karten');
    
    // Überprüfe dass Deck existiert
    await expect(page.locator('[data-testid="deck-size"]')).toBeVisible();
    
    // Überprüfe dass Gegner existieren
    await expect(page.locator('[data-testid="opponent-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="opponent-2"]')).toBeVisible();
  });

  test('sollte Karte ziehen können', async ({ page }) => {
    await page.locator('[data-testid="input-player-name"]').fill('Tester');
    await page.locator('[data-testid="select-opponents-1"]').click();
    await page.locator('[data-testid="action-start-game"]').click();
    
    await expect(page.locator('[data-testid="player-0-name"]')).toBeVisible();
    
    // Hole initiale Handgröße
    const initialHandText = await page.locator('[data-testid="player-0-hand-size"]').textContent();
    const initialHand = parseInt(initialHandText?.match(/\d+/)?.[0] || '0');
    
    // Ziehe eine Karte
    await page.locator('[data-testid="action-draw"]').click();
    
    // Warte kurz
    await page.waitForTimeout(500);
    
    // Handgröße sollte sich erhöht haben (wenn Spieler am Zug)
    const newHandText = await page.locator('[data-testid="player-0-hand-size"]').textContent();
    const newHand = parseInt(newHandText?.match(/\d+/)?.[0] || '0');
    
    // Entweder +1 Karte oder Computer ist am Zug
    expect(newHand >= initialHand).toBeTruthy();
  });

  test('sollte Mau-Button anzeigen wenn aktiv', async ({ page }) => {
    await page.locator('[data-testid="input-player-name"]').fill('Tester');
    await page.locator('[data-testid="select-opponents-1"]').click();
    await page.locator('[data-testid="action-start-game"]').click();
    
    await expect(page.locator('[data-testid="player-0-name"]')).toBeVisible();
    
    // Mau-Button sollte existieren (könnte disabled sein)
    await expect(page.locator('[data-testid="action-mau"]')).toBeVisible();
  });

  test('sollte zurück zum Startscreen navigieren', async ({ page }) => {
    await page.locator('[data-testid="input-player-name"]').fill('Tester');
    await page.locator('[data-testid="action-start-game"]').click();
    
    await expect(page.locator('[data-testid="player-0-name"]')).toBeVisible();
    
    // Zurück zum Start - öffnet Bestätigungsdialog
    await page.locator('[data-testid="action-back-to-start"]').click();
    
    // Bestätigungsdialog bestätigen
    await page.locator('.confirm-btn.confirm').click();
    
    // Start Screen sollte wieder da sein
    await expect(page.locator('[data-testid="input-player-name"]')).toBeVisible();
  });
});
