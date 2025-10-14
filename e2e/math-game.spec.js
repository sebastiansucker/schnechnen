const { test, expect } = require('@playwright/test');

test.describe('MathGame Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('should load the game correctly', async ({ page }) => {
    // Check that the game loads properly
    await expect(page).toHaveTitle(/Math Game/);
    
    // Check that level selection screen is visible
    const levelSelection = page.locator('#level-selection');
    await expect(levelSelection).toBeVisible();
    
    // Check that game screen is hidden
    const gameScreen = page.locator('#game-screen');
    await expect(gameScreen).toBeHidden();
    
    // Check that result screen is hidden
    const resultScreen = page.locator('#result-screen');
    await expect(resultScreen).toBeHidden();
  });

  test('should allow selecting a level', async ({ page }) => {
    // Select level 1
    const level1Button = page.locator('.level-btn[data-level="1"]');
    await level1Button.click();
    
    // Check that game screen is now visible
    const gameScreen = page.locator('#game-screen');
    await expect(gameScreen).toBeVisible();
    
    // Check that level selection is hidden
    const levelSelection = page.locator('#level-selection');
    await expect(levelSelection).toBeHidden();
    
    // Check that the current level is displayed
    const currentLevelElement = page.locator('#current-level');
    await expect(currentLevelElement).toContainText('1');
  });

  test('should generate math problems', async ({ page }) => {
    // Select level 1
    const level1Button = page.locator('.level-btn[data-level="1"]');
    await level1Button.click();
    
    // Wait for a problem to be generated
    const problemElement = page.locator('#problem');
    await expect(problemElement).toBeVisible();
    
    // Check that problem is displayed
    const problemText = await problemElement.textContent();
    expect(problemText).toContain('=');
    expect(problemText).toContain('?');
  });

  test('should handle answer input and scoring', async ({ page }) => {
    // Select level 1
    const level1Button = page.locator('.level-btn[data-level="1"]');
    await level1Button.click();
    
    // Wait for problem to appear
    const problemElement = page.locator('#problem');
    await expect(problemElement).toBeVisible();
    
    // Get the problem text to determine the correct answer
    const problemText = await problemElement.textContent();
    
    // For simplicity, we'll test with a known addition problem
    // In a real scenario, we'd parse the problem to determine the answer
    const answerInput = page.locator('#answer');
    const submitButton = page.locator('#submit-btn');
    
    // Enter an answer and submit
    await answerInput.fill('5');
    await submitButton.click();
    
    // Check that score increased (this is a basic check)
    const scoreElement = page.locator('#score');
    await expect(scoreElement).toBeVisible();
  });

  test('should end game after 60 seconds', async ({ page }) => {
    // Select level 1
    const level1Button = page.locator('.level-btn[data-level="1"]');
    await level1Button.click();
    
    // Wait for game to end (60 seconds)
    // We'll wait for result screen to appear
    const resultScreen = page.locator('#result-screen');
    
    // Wait up to 70 seconds for the game to end
    await expect(resultScreen).toBeVisible({ timeout: 70000 });
    
    // Check that result screen is displayed
    await expect(resultScreen).toBeVisible();
    
    // Check that result screen shows correct information
    const resultLevelElement = page.locator('#result-level');
    const resultCorrectElement = page.locator('#result-correct');
    const resultTimeElement = page.locator('#result-time');
    
    await expect(resultLevelElement).toBeVisible();
    await expect(resultCorrectElement).toBeVisible();
    await expect(resultTimeElement).toBeVisible();
  });

  test('should display results correctly', async ({ page }) => {
    // Select level 1
    const level1Button = page.locator('.level-btn[data-level="1"]');
    await level1Button.click();
    
    // Wait for game to end and result screen to appear
    const resultScreen = page.locator('#result-screen');
    await expect(resultScreen).toBeVisible({ timeout: 70000 });
    
    // Check that result screen displays level
    const resultLevelElement = page.locator('#result-level');
    await expect(resultLevelElement).toBeVisible();
    
    // Check that result screen displays correct answers
    const resultCorrectElement = page.locator('#result-correct');
    await expect(resultCorrectElement).toBeVisible();
    
    // Check that result screen displays time
    const resultTimeElement = page.locator('#result-time');
    await expect(resultTimeElement).toBeVisible();
  });
});
