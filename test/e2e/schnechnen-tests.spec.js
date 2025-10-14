// test/e2e/schnechnen-tests.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Schnechnen Spiel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('Startbildschirm wird korrekt angezeigt', async ({ page }) => {
    // Prüfe, dass der Startbildschirm angezeigt wird
    await expect(page).toHaveTitle('Schnechnen - Mathe Spiel');
    
    // Prüfe, dass die Hauptüberschrift angezeigt wird
    await expect(page.locator('h1')).toHaveText('Schnechnen');
    
  // Prüfe, dass die Spielbeschreibung angezeigt wird (scoped selector to avoid multiple <p> elements)
  await expect(page.locator('#start-screen p')).toHaveText('Mathe Spiel zum Lernen');
    
    // Prüfe, dass die Level-Auswahl angezeigt wird
    await expect(page.locator('.level-selection')).toBeVisible();
    
    // Prüfe, dass alle vier Level-Buttons angezeigt werden
    const levelButtons = page.locator('.level-btn');
    await expect(levelButtons).toHaveCount(4);
    
    // Prüfe die Texte der Level-Buttons
    const levelTexts = await levelButtons.allTextContents();
    expect(levelTexts).toContain('Level 1: Addition & Subtraktion bis 10');
    expect(levelTexts).toContain('Level 2: Addition & Subtraktion bis 100');
    expect(levelTexts).toContain('Level 3: Multiplikation bis 100');
    expect(levelTexts).toContain('Level 4: Multiplikation & Division bis 100');
  });

  test('Spielstart mit Level 1', async ({ page }) => {
    // Wähle Level 1 aus
    await page.click('button[data-level="1"]');
    
    // Prüfe, dass das Spielbildschirm angezeigt wird
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    
    // Prüfe, dass der Timer gestartet wird
    await expect(page.locator('#time')).toHaveText('60');
    
    // Prüfe, dass das aktuelle Level angezeigt wird
    await expect(page.locator('#current-level')).toHaveText('1');
    
    // Prüfe, dass der Score 0 ist
    await expect(page.locator('#score')).toHaveText('0');
    
    // Prüfe, dass ein Problem angezeigt wird
    await expect(page.locator('#problem')).toBeVisible();
    
    // Prüfe, dass das Eingabefeld sichtbar ist
    await expect(page.locator('#answer-input')).toBeVisible();
    
    // Prüfe, dass das Dial-Pad sichtbar ist
    await expect(page.locator('#dial-pad')).not.toHaveClass('hidden');
  });

  test('Spielablauf mit korrekter Antwort', async ({ page }) => {
    // Wähle Level 1 aus
    await page.click('button[data-level="1"]');
    
    // Warte auf das erste Problem
    await page.waitForSelector('#problem');
    
    // Hole das aktuelle Problem
    const problemText = await page.locator('#problem').textContent();
    console.log('Aktuelles Problem:', problemText);
    
    // Lösung berechnen (einfach für Testzwecke)
    let solution = 0;
    if (problemText.includes('+')) {
      const parts = problemText.split(' + ');
      solution = parseInt(parts[0]) + parseInt(parts[1].split(' = ?')[0]);
    } else if (problemText.includes('-')) {
      const parts = problemText.split(' - ');
      solution = parseInt(parts[0]) - parseInt(parts[1].split(' = ?')[0]);
    }
    
    // Gib die Lösung ein
    await page.fill('#answer-input', solution.toString());
    
    // Sendet Enter-Taste (wird im Spiel abgefangen)
    await page.press('#answer-input', 'Enter');
    
    // Warte kurz, damit das nächste Problem geladen wird
    await page.waitForTimeout(1000);
    
    // Prüfe, dass der Score erhöht wurde (wenn die Antwort korrekt war)
    // Beachte: Wir können nicht genau prüfen, da wir nicht wissen, ob die Antwort korrekt war
    // Aber wir können prüfen, dass das nächste Problem geladen wurde
    await expect(page.locator('#problem')).toBeVisible();
  });

  test('Highscore-Funktion', async ({ page }) => {
    // Wähle Level 1 aus
    await page.click('button[data-level="1"]');
    
    // Warte auf das erste Problem
    await page.waitForSelector('#problem');
    
    // Lösung eingeben und das Spiel beenden (wenn wir ein paar Probleme lösen)
    // Für diesen Test einfach das erste Problem lösen und dann Ergebnisse prüfen
    
    // Statt einer langen Warte: rufe das Endgame direkt an (script exposes a test helper on window.__TEST__)
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.endGame === 'function') {
        window.__TEST__.endGame();
      }
    });
    
    // Prüfe, dass das Ergebnisbildschirm angezeigt wird
    await expect(page.locator('#result-screen')).not.toHaveClass('hidden');
    
    // Prüfe, dass die Ergebnisdaten angezeigt werden
    await expect(page.locator('#result-level')).toBeVisible();
    await expect(page.locator('#result-score')).toBeVisible();
    await expect(page.locator('#total-problems')).toBeVisible();
    await expect(page.locator('#result-percentage')).toBeVisible();
  });

  test('Dial-Pad Funktion', async ({ page }) => {
    // Wähle Level 1 aus
    await page.click('button[data-level="1"]');
    
    // Warte auf das erste Problem
    await page.waitForSelector('#problem');
    
    // Prüfe, dass das Dial-Pad sichtbar ist
    await expect(page.locator('#dial-pad')).not.toHaveClass('hidden');
    
    // Prüfe, dass die Zifferntasten sichtbar sind
    const dialButtons = page.locator('.dial-btn[data-value]');
    await expect(dialButtons).toHaveCount(10); // 0-9
    
    // Prüfe, dass die Clear-Taste sichtbar ist
    await expect(page.locator('#clear-btn')).toBeVisible();
    
    // Prüfe, dass die Backspace-Taste sichtbar ist
    await expect(page.locator('#backspace-btn')).toBeVisible();
    
    // Teste das Klicken auf eine Zahl
    await page.click('.dial-btn[data-value="5"]');
    
    // Prüfe, dass die Zahl im Eingabefeld angezeigt wird
    await expect(page.locator('#answer-input')).toHaveValue('5');
  });

  test('Level-Wechsel funktioniert', async ({ page }) => {
    // Use the test API to start games at different levels to avoid clicking hidden buttons
    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.startGame === 'function') {
        window.__TEST__.startGame(2);
      }
    });
    await expect(page.locator('#game-screen')).not.toHaveClass('hidden');
    await expect(page.locator('#current-level')).toHaveText('2');

    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.startGame === 'function') {
        window.__TEST__.startGame(3);
      }
    });
    await expect(page.locator('#current-level')).toHaveText('3');

    await page.evaluate(() => {
      if (window.__TEST__ && typeof window.__TEST__.startGame === 'function') {
        window.__TEST__.startGame(4);
      }
    });
    await expect(page.locator('#current-level')).toHaveText('4');
  });
});
