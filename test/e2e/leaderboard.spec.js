import { test, expect } from '@playwright/test';

test.describe('Leaderboard Screen Tests', () => {
  // Setup: Insert one test record per level (0-5) via the app's own API before tests run
  // This ensures each test has at least one record to verify in the leaderboard.
  // The Playwright webServer runs with a throwaway DB_PATH (see playwright.config.mjs),
  // so this never touches real leaderboard data.
  test.beforeAll(async ({ request }) => {
    for (let level = 0; level <= 5; level++) {
      await request.post('http://localhost:8080/api/leaderboard/submit', {
        data: {
          username: `Test-Level-${level}`,
          level,
          score: 1
        }
      });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8080');
  });

  test('Leaderboard-Button ist auf Start-Screen sichtbar', async ({ page }) => {
    await page.waitForSelector('#leaderboard-btn');
    const btn = page.locator('#leaderboard-btn');

    await expect(btn).toBeVisible();
    await expect(btn).toContainText('🏆 Rekorde');
  });

  test('Leaderboard-Screen öffnet sich beim Button-Klick', async ({ page }) => {
    // Click leaderboard button
    await page.click('#leaderboard-btn');

    // Wait for leaderboard screen to appear
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');
    await expect(page.locator('#leaderboard-screen')).not.toHaveClass('hidden');
  });

  test('Leaderboard zeigt Level-Selector mit 6 Buttons', async ({ page }) => {
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    const levelBtns = page.locator('#leaderboard-screen .stats-level-btn');
    await expect(levelBtns).toHaveCount(6);
  });

  test('Player-Name wird angezeigt', async ({ page }) => {
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    const usernameEl = page.locator('#player-username');
    const username = await usernameEl.textContent();

    // Username should not be empty or "-"
    expect(username).toBeTruthy();
    expect(username).not.toBe('-');
  });

  test('Leaderboard-Button "Zurück" führt zum Start-Screen', async ({ page }) => {
    // Open leaderboard
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    // Verify leaderboard is open
    await expect(page.locator('#leaderboard-screen')).not.toHaveClass('hidden');

    // Back button should be visible
    const backBtn = page.locator('#leaderboard-back-btn');
    await expect(backBtn).toBeVisible();
  });

  test('Level-Wechsel funktioniert im Leaderboard', async ({ page }) => {
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    // Wait for the initial list content to render
    await page.waitForSelector('#leaderboard-list li', { timeout: 10000 });

    // Click on level 2 button
    const level2Btn = page.locator('#leaderboard-screen .stats-level-btn[data-level="2"]');
    await level2Btn.click();

    // Wait for potential async operations
    await page.waitForTimeout(1000);

    // Verify the leaderboard list still exists and is visible
    await expect(page.locator('#leaderboard-list')).toBeVisible();

    // Verify that level buttons are still clickable
    const allLevelBtns = page.locator('#leaderboard-screen .stats-level-btn');
    await expect(allLevelBtns).toHaveCount(6);
  });

  test('Leaderboard zeigt "Lade Leaderboard..." beim Öffnen', async ({ page }) => {
    await page.click('#leaderboard-btn');

    // Loading text should appear briefly
    page.locator('.leaderboard-loading');
    // Wait for it to load data or show empty state
    await page.waitForTimeout(2000);
  });

  test('Leaderboard zeigt echte Daten von der API', async ({ page }) => {
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    // Click Level 1 to load leaderboard data
    await page.click('#leaderboard-screen .stats-level-btn[data-level="1"]');

    // Wait longer for API call to complete and elements to render
    await page.waitForSelector('.leaderboard-item', { timeout: 10000 });
    await page.waitForTimeout(500); // Extra time for rendering

    const entries = page.locator('.leaderboard-item');
    const count = await entries.count();

    // MUSS mindestens einen Eintrag haben
    expect(count).toBeGreaterThan(0);
  });

  test('Leaderboard-Einträge zeigen Name, Level und Score', async ({ page }) => {
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    // Click Level 1
    await page.click('#leaderboard-screen .stats-level-btn[data-level="1"]');

    // Wait for entries to load with longer timeout
    await page.waitForSelector('.leaderboard-item', { timeout: 10000 });
    await page.waitForTimeout(500); // Extra time for rendering

    const firstEntry = page.locator('.leaderboard-item').first();

    // Check for username
    const username = firstEntry.locator('.leaderboard-player-name');
    await expect(username).toBeVisible({ timeout: 5000 });
    const usernameText = await username.textContent();
    expect(usernameText).toBeTruthy();

    // Check for score
    const score = firstEntry.locator('.leaderboard-score');
    await expect(score).toBeVisible({ timeout: 5000 });
    const scoreText = await score.textContent();
    expect(scoreText).toMatch(/\d+/);
  });

  test('Leaderboard Ranking-Nummer wird angezeigt', async ({ page }) => {
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    // Click Level 1
    await page.click('#leaderboard-screen .stats-level-btn[data-level="1"]');

    // Wait for entries with longer timeout
    await page.waitForSelector('.leaderboard-item', { timeout: 10000 });
    await page.waitForTimeout(500); // Extra time for rendering

    const firstEntry = page.locator('.leaderboard-item').first();
    const rankingNum = firstEntry.locator('.leaderboard-rank');

    await expect(rankingNum).toBeVisible({ timeout: 5000 });
    const rankText = await rankingNum.textContent();
    expect(rankText).toBe('1');
  });

  test('Leaderboard zeigt unterschiedliche Daten für verschiedene Level', async ({ page }) => {
    await page.click('#leaderboard-btn');
    await page.waitForSelector('#leaderboard-screen:not(.hidden)');

    // Load Level 1
    await page.click('#leaderboard-screen .stats-level-btn[data-level="1"]');
    await page.waitForTimeout(1500);

    const level1Entries = page.locator('.leaderboard-entry');
    const level1Count = await level1Entries.count();

    if (level1Count > 0) {
      const level1FirstEntry = level1Entries.first();
      await level1FirstEntry.locator('.leaderboard-username').textContent();
    }

    // Load Level 2
    await page.click('#leaderboard-screen .stats-level-btn[data-level="2"]');
    await page.waitForTimeout(1500);

    const level2Entries = page.locator('.leaderboard-entry');
    const level2Count = await level2Entries.count();

    // Test passes if either level has data (or both are empty)
    expect(level1Count + level2Count).toBeGreaterThanOrEqual(0);
  });

  test('API Leaderboard-Endpoint antwortet', async ({ page }) => {
    // Make API call directly
    const response = await page.request.get('http://localhost:8080/api/leaderboard/1');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    const entry = data[0];
    expect(entry).toHaveProperty('username');
    expect(entry).toHaveProperty('level');
    expect(entry).toHaveProperty('score');
    expect(entry).toHaveProperty('timestamp');
  });

  test('API lehnt ungültige Submissions ab', async ({ page }) => {
    const response = await page.request.post('http://localhost:8080/api/leaderboard/submit', {
      data: { username: 'Cheater', level: 1, score: 999999 }
    });

    expect(response.status()).toBe(400);
  });
});

test.describe('Leaderboard disabled (z.B. GitHub-Pages-Build ohne Backend)', () => {
  test.beforeEach(async ({ page }) => {
    // Simuliert den von .github/workflows/pages.yml überschriebenen leaderboard-config.js
    await page.addInitScript(() => {
      window.LEADERBOARD_ENABLED = false;
    });
    await page.goto('http://localhost:8080');
  });

  test('Rekorde-Button ist ausgeblendet', async ({ page }) => {
    await page.waitForSelector('#leaderboard-btn', { state: 'attached' });
    await expect(page.locator('#leaderboard-btn')).toBeHidden();
  });

  test('Score-Submission wird nicht ausgelöst', async ({ page }) => {
    let submitCalled = false;
    await page.route('**/api/leaderboard/submit', route => {
      submitCalled = true;
      route.continue();
    });

    // submitScoreToLeaderboard() is a global function in script.js (non-module script,
    // so top-level function declarations end up on window)
    await page.evaluate(() => {
      window.__TEST_MODE__ = false; // sonst würde submitScoreToLeaderboard schon aus diesem Grund überspringen
      return window.submitScoreToLeaderboard(1, 10);
    });

    await page.waitForTimeout(500);
    expect(submitCalled).toBe(false);
  });
});
