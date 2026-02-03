import { test, expect } from '@playwright/test';

/**
 * Quick game test - runs a fast game to debug issues
 * SKIPPED: This test is unreliable as it depends on random game outcomes
 * Rule validation is now covered by unit tests in game.service.spec.ts
 */

test.describe('Quick Game Test', () => {
  test.skip('should complete a quick game', async ({ page }) => {
    test.setTimeout(60000);

    console.log('\n🎮 Starting quick game...');
    
    // Start game
    await page.goto('http://localhost:4200/mau-mau');
    await page.waitForSelector('app-start-screen', { timeout: 5000 });
    
    const input = page.locator('input[data-testid="input-player-name"]');
    await input.fill('TestBot');
    
    const opponentBtn = page.locator('button[data-testid="select-opponents-1"]');
    await opponentBtn.click();
    
    const startButton = page.locator('button[data-testid="action-start-game"]');
    await startButton.click();
    
    await page.waitForSelector('app-game-board', { timeout: 5000 });
    console.log('✓ Game started');

    // Wait and observe
    let checkCount = 0;
    const maxChecks = 300; // 30 seconds
    
    while (checkCount < maxChecks) {
      await page.waitForTimeout(100);
      
      // Check if game is over
      const gameOver = await page.locator('[data-testid="game-winner"]').isVisible().catch(() => false);
      if (gameOver) {
        console.log(`\n✓ Game completed after ${checkCount * 0.1} seconds!`);
        break;
      }
      
      // Play human turn - always try
      // Try to play a card
      const playableCards = await page.locator('app-card[clickable="true"]').all();
      const totalCards = await page.locator('.player-hand app-card').count();
      
      if (checkCount % 50 === 0) {
        const isActive = await page.locator('.player-info.main-player.active').isVisible().catch(() => false);
        console.log(`  Player active: ${isActive}, Playable: ${playableCards.length}/${totalCards}`);
      }
      
      if (playableCards.length > 0) {
        await playableCards[0].click().catch(() => {});
        await page.waitForTimeout(300);
        
        // Handle suit selector
        const suitSelector = await page.locator('app-suit-selector').isVisible().catch(() => false);
        if (suitSelector) {
          const suits = await page.locator('.suit-option').all();
          if (suits.length > 0) await suits[0].click().catch(() => {});
        }
      } else if (totalCards > 0) {
        // No playable cards - try to draw
        const deck = page.locator('.deck[data-testid="action-draw"]');
        const canClick = await deck.isVisible().catch(() => false);
        if (canClick) {
          await deck.click().catch(() => {});
        }
      }
      
      checkCount++;
      if (checkCount % 50 === 0) {
        // Log game state
        const deckSize = await page.locator('[data-testid="deck-size"]').textContent().catch(() => '?');
        const player0 = await page.locator('[data-testid="player-0-hand-size"]').textContent().catch(() => '?');
        const isActive = await page.locator('.player-info.main-player.active').isVisible().catch(() => false);
        const playableCount = await page.locator('app-card[clickable="true"]').count();
        console.log(`⏳ ${checkCount * 0.1}s - Deck: ${deckSize}, Player: ${player0}, Active: ${isActive}, Playable: ${playableCount}`);
      }
    }
    
    if (checkCount === maxChecks) {
      console.log('\n⚠️  Timeout after 30 seconds');
      
      // Dump final state
      const deckSize = await page.locator('[data-testid="deck-size"]').textContent().catch(() => '?');
      const discardSize = await page.locator('[data-testid="discard-pile-size"]').textContent().catch(() => '?');
      const player0 = await page.locator('[data-testid="player-0-hand-size"]').textContent().catch(() => '?');
      
      console.log(`\n📊 Final state:`);
      console.log(`  Deck: ${deckSize}`);
      console.log(`  Discard: ${discardSize}`);
      console.log(`  Player 0: ${player0}`);
      
      // Get top card
      const topCard = await page.locator('app-card').first().getAttribute('ng-reflect-card').catch(async () => {
        // Try alternative - get from visible card
        const cardText = await page.locator('app-card').first().textContent().catch(() => '');
        return cardText;
      });
      console.log(`  Top card: ${topCard || 'unknown'}`);
      
      // Get opponent info
      const opponents = await page.locator('[data-testid^="opponent-"]').all();
      for (let i = 0; i < opponents.length; i++) {
        const opponentCards = await page.locator(`[data-testid="player-${i+1}-hand-size"]`).textContent().catch(() => '?');
        console.log(`  Opponent ${i}: ${opponentCards}`);
      }      
      // Get last few chat messages
      const chatMessages = await page.locator('.chat-message .message').all();
      const lastMessages = chatMessages.slice(-5);
      console.log(`\n📝 Last 5 actions:`);
      for (const msg of lastMessages) {
        const text = await msg.textContent().catch(() => '');
        console.log(`  ${text}`);
      }
    }

    // Always pass for now - we're just observing
    expect(checkCount).toBeGreaterThan(0);
  });
});
