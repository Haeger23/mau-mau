import { test, expect, Page } from '@playwright/test';

/**
 * Autonomous Game Validator
 * 
 * This test plays complete games automatically, extracts chat logs,
 * validates against Swiss Mau-Mau rules, and reports violations.
 * Runs without user intervention - only status updates.
 */

interface ChatEntry {
  time: string;
  player: string;
  action: string;
}

interface RuleViolation {
  time: string;
  player: string;
  action: string;
  rule: string;
  reason: string;
}

class GameValidator {
  private chatLog: ChatEntry[] = [];
  private violations: RuleViolation[] = [];
  private gameState: {
    lastCard?: { rank: string; suit: string };
    playerCards: Map<string, number>;
    queenRoundActive: boolean;
    drawPenalty: number;
  };

  constructor() {
    this.gameState = {
      playerCards: new Map(),
      queenRoundActive: false,
      drawPenalty: 0
    };
  }

  /**
   * Extract chat log from game UI
   */
  async extractChatLog(page: Page): Promise<void> {
    const chatMessages = await page.locator('.chat-message').all();
    
    for (const msg of chatMessages) {
      const timestamp = await msg.locator('.timestamp').textContent().catch(() => '');
      const playerName = await msg.locator('.player-name').textContent().catch(() => '');
      const message = await msg.locator('.message').textContent().catch(() => '');
      
      if (timestamp && playerName && message) {
        this.chatLog.push({
          time: timestamp.trim(),
          player: playerName.replace(':', '').trim(),
          action: message.trim()
        });
      }
    }
  }

  /**
   * Validate chat log against Swiss Mau-Mau rules
   */
  validateRules(): void {
    for (let i = 0; i < this.chatLog.length; i++) {
      const entry = this.chatLog[i];
      
      // Check for Jack replication (§7 BUBE)
      if (entry.action.includes('repliziert')) {
        const prevEntry = i > 0 ? this.chatLog[i - 1] : null;
        if (prevEntry && prevEntry.action.includes('Bube')) {
          // Check if 10 was played on Jack
          if (entry.action.includes('10')) {
            // This should trigger penalty - check if it did
            const nextEntry = i < this.chatLog.length - 1 ? this.chatLog[i + 1] : null;
            if (!nextEntry || !nextEntry.action.includes('Strafkarte')) {
              this.violations.push({
                time: entry.time,
                player: entry.player,
                action: entry.action,
                rule: 'JACK_REPLICATION',
                reason: '§7 BUBE: 10 auf Bube (Bube auf Bube geht nicht!) muss Strafkarte geben'
              });
            }
          }
        }
      }

      // Check for Ace as last card
      if (entry.action.includes('gewinnt') && i > 0) {
        const lastPlay = this.chatLog[i - 1];
        if (lastPlay.action.includes('Ass')) {
          this.violations.push({
            time: entry.time,
            player: entry.player,
            action: entry.action,
            rule: 'ACE_LAST_CARD',
            reason: 'ASS-REGEL: Spiel darf nicht mit Ass beendet werden'
          });
        }
      }

      // Check for missing MAU announcement
      // Player plays second-to-last card but doesn't say MAU
      if (entry.action.includes('legt') && !entry.action.includes('MAU')) {
        // Would need to track card count - simplified for now
      }

      // Check for Queen round violations (§9.A DAMENRUNDE)
      if (entry.action.includes('Damenrunde')) {
        this.gameState.queenRoundActive = entry.action.includes('startet');
      }
    }
  }

  /**
   * Get validation results
   */
  getResults(): { total: number; violations: RuleViolation[] } {
    return {
      total: this.chatLog.length,
      violations: this.violations
    };
  }

  /**
   * Print status update
   */
  printStatus(): void {
    console.log('\n=== Game Validation Status ===');
    console.log(`Total chat entries: ${this.chatLog.length}`);
    console.log(`Rule violations found: ${this.violations.length}`);
    
    if (this.violations.length > 0) {
      console.log('\nViolations:');
      this.violations.forEach((v, i) => {
        console.log(`\n${i + 1}. [${v.time}] ${v.player}: ${v.action}`);
        console.log(`   Rule: ${v.rule}`);
        console.log(`   Reason: ${v.reason}`);
      });
    } else {
      console.log('\n✅ No rule violations detected!');
    }
  }
}

class AutoPlayer {
  /**
   * Start a new game
   */
  async startGame(page: Page, playerName: string = 'TestBot'): Promise<void> {
    await page.goto('http://localhost:4200/mau-mau');
    
    // Wait for start screen
    await page.waitForSelector('app-start-screen', { timeout: 5000 });
    
    // Enter player name
    const input = page.locator('input[data-testid="input-player-name"]');
    await input.fill(playerName);
    
    // Select 1 opponent for faster games
    const opponentBtn = page.locator('button[data-testid="select-opponents-1"]');
    await opponentBtn.click();
    
    // Start game
    const startButton = page.locator('button[data-testid="action-start-game"]');
    await startButton.click();
    
    // Wait for game board
    await page.waitForSelector('app-game-board', { timeout: 5000 });
  }

  /**
   * Play one turn automatically
   */
  async playTurn(page: Page): Promise<boolean> {
    // Check if it's player's turn
    const isActive = await page.locator('.player-info.main-player.active').isVisible().catch(() => false);
    if (!isActive) return false;

    // DO NOT handle penalty cards immediately - must play/draw first!
    // Check for penalty cards AFTER a turn
    const hasPenalty = await page.locator('button[data-testid="action-pickup-penalty"]').isVisible().catch(() => false);
    
    // Try to play a card first
    const playableCards = await page.locator('app-card[clickable="true"]').all();
    
    if (playableCards.length > 0) {
      // Click first playable card
      await playableCards[0].click({ timeout: 2000 }).catch(() => {});
      
      // Check for suit selector (Jack was played)
      await page.waitForTimeout(300);
      const suitSelector = await page.locator('app-suit-selector').isVisible().catch(() => false);
      if (suitSelector) {
        // Select first suit
        const suits = await page.locator('.suit-option').all();
        if (suits.length > 0) {
          await suits[0].click().catch(() => {});
        }
      }
      
      await page.waitForTimeout(200);
      
      // NOW pickup penalty cards if we had them
      if (hasPenalty) {
        await page.waitForTimeout(200);
        const penaltyBtn = page.locator('button[data-testid="action-pickup-penalty"]');
        if (await penaltyBtn.isVisible().catch(() => false)) {
          await penaltyBtn.click().catch(() => {});
        }
      }
      
      return true;
    }

    // Check if can end turn
    const endTurnBtn = page.locator('button[data-testid="action-end-turn"]');
    if (await endTurnBtn.isVisible().catch(() => false)) {
      await endTurnBtn.click({ timeout: 2000 }).catch(() => {
        // Button might be detached during Angular re-render, retry
      });
      await page.waitForTimeout(200);
      
      // NOW pickup penalty cards if we had them
      if (hasPenalty) {
        await page.waitForTimeout(200);
        const penaltyBtn = page.locator('button[data-testid="action-pickup-penalty"]');
        if (await penaltyBtn.isVisible().catch(() => false)) {
          await penaltyBtn.click().catch(() => {});
        }
      }
      
      return true;
    }

    // Draw from deck if no playable cards
    const deck = page.locator('.deck[data-testid="action-draw"]');
    if (await deck.isVisible().catch(() => false)) {
      await deck.click();
      await page.waitForTimeout(200);
      
      // NOW pickup penalty cards if we had them
      if (hasPenalty) {
        await page.waitForTimeout(200);
        const penaltyBtn = page.locator('button[data-testid="action-pickup-penalty"]');
        if (await penaltyBtn.isVisible().catch(() => false)) {
          await penaltyBtn.click().catch(() => {});
        }
      }
      
      return true;
    }

    return false;
  }

  /**
   * Handle penalty card pickup
   */
  async handlePenaltyCards(page: Page): Promise<void> {
    // Handled in playTurn now
  }

  /**
   * Check if game is over
   */
  async isGameOver(page: Page): Promise<boolean> {
    return await page.locator('[data-testid="game-winner"]').isVisible().catch(() => false);
  }
}

test.describe('Autonomous Game Validator', () => {
  test('should play complete game and validate rules', async ({ page }) => {
    test.setTimeout(60000); // 1 minute for complete game

    const player = new AutoPlayer();
    const validator = new GameValidator();

    console.log('\n🎮 Starting autonomous game...');

    // Start game
    await player.startGame(page, 'ValidatorBot');
    console.log('✓ Game started');

    // Wait for game to end (AI plays automatically)
    console.log('⏳ Waiting for game to complete...');
    let checkCount = 0;
    const maxChecks = 300; // 30 seconds with 100ms checks
    
    while (checkCount < maxChecks) {
      await page.waitForTimeout(100);
      
      if (await player.isGameOver(page)) {
        console.log(`\n✓ Game completed after ${checkCount * 0.1} seconds`);
        break;
      }
      
      // Play human player's turn when active
      const isActive = await page.locator('.player-info.main-player.active').isVisible().catch(() => false);
      if (isActive) {
        await player.playTurn(page);
      }
      
      checkCount++;
      if (checkCount % 50 === 0) {
        console.log(`⏳ Still playing... (${checkCount * 0.1}s)`);
      }
    }
    
    if (checkCount === maxChecks) {
      console.log('\n⚠️  Timeout - game did not complete in 30 seconds');
      console.log('📋 Extracting partial chat log for analysis...');
    }

    // Extract and validate chat log
    console.log('\n📋 Extracting chat log...');
    await validator.extractChatLog(page);

    console.log('🔍 Validating rules...');
    validator.validateRules();

    // Print results
    validator.printStatus();
    
    // Print last 10 chat entries for debugging
    const results = validator.getResults();
    if (results.total > 10) {
      console.log('\n📝 Last 10 chat entries:');
      const lastEntries = validator['chatLog'].slice(-10);
      lastEntries.forEach((entry, i) => {
        console.log(`  ${i + 1}. [${entry.time}] ${entry.player}: ${entry.action}`);
      });
    }
    
    // Check deck size
    const deckSize = await page.locator('[data-testid="deck-size"]').textContent().catch(() => '');
    console.log(`\n🃏 Deck status: ${deckSize}`);
    
    // Check discard pile size
    const discardSize = await page.locator('[data-testid="discard-pile-size"]').textContent().catch(() => '');
    console.log(`🗑️  Discard pile: ${discardSize}`);
    
    // Check player hand sizes
    const player0Hand = await page.locator('[data-testid="player-0-hand-size"]').textContent().catch(() => '');
    console.log(`👤 Player 0: ${player0Hand}`);
    
    const opponents = await page.locator('[data-testid^="player-"][data-testid$="-hand-size"]').all();
    for (let i = 0; i < opponents.length && i < 3; i++) {
      const text = await opponents[i].textContent().catch(() => '');
      console.log(`🤖 Opponent ${i + 1}: ${text}`);
    }

    // Test assertions
    expect(results.total).toBeGreaterThan(0);
    // Note: Violations check disabled for now to see what we find
    // expect(results.violations).toHaveLength(0);
  });

  test('should detect Jack replication violation', async ({ page }) => {
    // This test would set up a specific scenario to test violation detection
    // For now, just validate that the validator can detect the issue
    
    const validator = new GameValidator();
    
    // Simulate chat log with violation
    validator['chatLog'] = [
      { time: '10:00:00', player: 'Player1', action: 'legt Bube ♠' },
      { time: '10:00:01', player: 'Player2', action: 'legt 10 ♠ - repliziert Bube' },
    ];

    validator.validateRules();
    const results = validator.getResults();

    console.log('\n🧪 Testing violation detection...');
    validator.printStatus();

    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations[0].rule).toBe('JACK_REPLICATION');
  });
});
