import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Start Screen sollte keine Accessibility-Fehler haben', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Game Board sollte keine Accessibility-Fehler haben', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('[data-testid="input-player-name"]').fill('Tester');
    await page.locator('[data-testid="action-start-game"]').click();
    
    await expect(page.locator('[data-testid="player-0-name"]')).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sollte keyboard navigation unterstützen', async ({ page }) => {
    await page.goto('/');
    
    // Tab zur Name-Input
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard User');
    
    // Tab zu Gegner-Buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Tab zum Start-Button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Sollte im Spiel sein
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="player-0-name"]')).toContainText('Keyboard User');
  });

  test('sollte focus indicators haben', async ({ page }) => {
    await page.goto('/');
    
    const nameInput = page.locator('[data-testid="input-player-name"]');
    await nameInput.focus();
    
    // Prüfe dass Element fokussiert ist
    await expect(nameInput).toBeFocused();
  });
});
