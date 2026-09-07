// test/e2e/practice-mode.spec.js
// Tests für den Übungsmodus (kein Timer, feste Aufgabenzahl) und den
// "Fehler üben"-Modus (siehe Issue #47).
const { test, expect } = require('@playwright/test');

// Hilfsfunktion: aktuelle Aufgabe korrekt beantworten (über das Dial-Pad)
async function submitCorrectAnswer(page) {
  const result = await page.evaluate(() => {
    return window.__TEST__.getState().currentProblem.result;
  });
  for (const digit of String(result)) {
    await page.click(`.dial-btn[data-value="${digit}"]`);
  }
  await page.click('#submit-btn');
  await page.waitForTimeout(700);
}

test.describe('Übungsmodus und Fehler üben (Issue #47)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');

    await page.evaluate(() => {
      localStorage.removeItem('schnechnen-history');
      localStorage.removeItem('schnechnen-highscores');
      localStorage.removeItem('schnechnen-mistakes');
      window.__TEST_MODE__ = true;
    });
  });

  test('Modus-Umschalter wechselt den aktiven Zustand', async ({ page }) => {
    const timedBtn = page.locator('.mode-btn[data-mode="timed"]');
    const practiceBtn = page.locator('.mode-btn[data-mode="practice"]');

    await expect(timedBtn).toHaveClass(/active/);
    await expect(timedBtn).toHaveAttribute('aria-pressed', 'true');

    await practiceBtn.click();

    await expect(practiceBtn).toHaveClass(/active/);
    await expect(practiceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(timedBtn).not.toHaveClass(/active/);
    await expect(timedBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('Übungsmodus zeigt Fortschritt statt Timer und keinen Timer-Countdown', async ({ page }) => {
    await page.click('.mode-btn[data-mode="practice"]');
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');

    // Timer-Anzeige ist versteckt, Fortschrittsanzeige sichtbar
    await expect(page.locator('#timer-display')).toHaveClass(/hidden/);
    await expect(page.locator('#progress-display')).not.toHaveClass(/hidden/);
    await expect(page.locator('#progress-text')).toHaveText('Aufgabe 1 / 20');

    const mode = await page.evaluate(() => window.__TEST__.getState().mode);
    expect(mode).toBe('practice');
  });

  test('Übungsrunde endet nach 20 Aufgaben ohne Highscore-Update', async ({ page }) => {
    // Bestehenden Highscore setzen, um zu prüfen, dass die Übungsrunde ihn nicht überschreibt
    await page.evaluate(() => {
      localStorage.setItem('schnechnen-highscores', JSON.stringify({ 1: 5 }));
    });
    await page.reload();
    await page.evaluate(() => { window.__TEST_MODE__ = true; });

    await page.click('.mode-btn[data-mode="practice"]');
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');

    // Direkt auf die letzte Aufgabe der Runde vorspulen (19 bereits "gespielt")
    await page.evaluate(() => {
      window.__TEST__.setGameState({ totalProblems: 19, score: 19 });
    });

    await submitCorrectAnswer(page);

    // Runde sollte automatisch beendet sein (kein Timer nötig)
    await page.waitForSelector('#result-screen:not(.hidden)');
    await expect(page.locator('#total-problems')).toHaveText('20');
    await expect(page.locator('#result-score')).toHaveText('20');

    // Highscore darf durch die Übungsrunde nicht verändert werden
    const highscores = await page.evaluate(() => JSON.parse(localStorage.getItem('schnechnen-highscores')));
    expect(highscores['1']).toBe(5);

    // ... und auch keine Highscore-Animation auslösen
    const animationHidden = await page.locator('#highscore-animation').evaluate(el => el.classList.contains('hidden'));
    expect(animationHidden).toBe(true);
  });

  test('Übungsrunden landen in der Spiel-History, aber nicht im Highscore-Chart', async ({ page }) => {
    await page.click('.mode-btn[data-mode="practice"]');
    await page.click('button[data-level="1"]');
    await page.waitForSelector('#problem');

    await page.evaluate(() => {
      window.__TEST__.setGameState({ totalProblems: 19, score: 10 });
    });
    await submitCorrectAnswer(page);
    await page.waitForSelector('#result-screen:not(.hidden)');

    const history = await page.evaluate(() => JSON.parse(localStorage.getItem('schnechnen-history')));
    expect(history['1']).toBeDefined();
    expect(history['1'][history['1'].length - 1].mode).toBe('practice');

    // Statistik-Seite: "Gespielte Runden" zählt die Übungsrunde mit,
    // der Highscore bleibt unberührt (0, da nie ein Zeitrennen gespielt wurde)
    await page.click('#restart-btn');
    await page.click('#stats-btn');
    await expect(page.locator('#stat-total-games')).toHaveText('1');
    await expect(page.locator('#stat-highscore')).toHaveText('0');
  });

  test('"Fehler üben"-Button ist deaktiviert, wenn keine Fehler vorhanden sind', async ({ page }) => {
    await page.click('#stats-btn');

    const btn = page.locator('#stats-practice-mistakes-btn');
    await expect(btn).toBeDisabled();
    await expect(btn).toContainText('Keine Fehler zum Üben');
  });

  test('Fehler-Modus entfernt eine Aufgabe erst nach zwei richtigen Antworten in Folge', async ({ page }) => {
    await page.evaluate(() => {
      const mistakes = { 1: [{ num1: 3, num2: 4, operation: '+', result: 7, wrongCount: 2 }] };
      localStorage.setItem('schnechnen-mistakes', JSON.stringify(mistakes));
    });
    await page.reload();
    await page.evaluate(() => { window.__TEST_MODE__ = true; });

    await page.click('#stats-btn');
    const statsBtn = page.locator('#stats-practice-mistakes-btn');
    await expect(statsBtn).toBeEnabled();
    await statsBtn.click();

    await page.waitForSelector('#problem');
    const mode = await page.evaluate(() => window.__TEST__.getState().mode);
    expect(mode).toBe('mistakes');
    await expect(page.locator('#progress-text')).toHaveText('Noch 1 Fehler');

    // Erste richtige Antwort: Aufgabe bleibt (nur 1x in Folge richtig)
    await submitCorrectAnswer(page);
    let mistakesAfterFirst = await page.evaluate(() => JSON.parse(localStorage.getItem('schnechnen-mistakes')));
    expect(mistakesAfterFirst['1'].length).toBe(1);
    await expect(page.locator('#result-screen')).toHaveClass(/hidden/);

    // Zweite richtige Antwort in Folge: Aufgabe wird entfernt, Runde endet (Liste leer)
    await submitCorrectAnswer(page);
    await page.waitForSelector('#result-screen:not(.hidden)');

    const mistakesAfterSecond = await page.evaluate(() => JSON.parse(localStorage.getItem('schnechnen-mistakes')));
    expect((mistakesAfterSecond['1'] || []).length).toBe(0);
  });

  test('Fehler-Modus: eine falsche Antwort unterbricht die Serie', async ({ page }) => {
    await page.evaluate(() => {
      const mistakes = { 1: [{ num1: 3, num2: 4, operation: '+', result: 7, wrongCount: 2 }] };
      localStorage.setItem('schnechnen-mistakes', JSON.stringify(mistakes));
    });
    await page.reload();
    await page.evaluate(() => { window.__TEST_MODE__ = true; });

    await page.click('#stats-btn');
    await page.click('#stats-practice-mistakes-btn');
    await page.waitForSelector('#problem');

    // Richtig, dann falsch, dann richtig -> Serie wurde unterbrochen, Aufgabe bleibt nach 3 Antworten noch nicht zwingend geschafft
    await submitCorrectAnswer(page);

    // Falsche Antwort abgeben
    await page.click('.dial-btn[data-value="1"]');
    await page.click('.dial-btn[data-value="0"]');
    await page.click('.dial-btn[data-value="0"]');
    await page.click('#submit-btn');
    await page.waitForTimeout(700);

    let mistakes = await page.evaluate(() => JSON.parse(localStorage.getItem('schnechnen-mistakes')));
    expect(mistakes['1'].length).toBe(1);
    await expect(page.locator('#result-screen')).toHaveClass(/hidden/);

    // Jetzt zwei richtige Antworten in Folge nötig, um die Aufgabe zu schaffen
    await submitCorrectAnswer(page);
    await expect(page.locator('#result-screen')).toHaveClass(/hidden/);
    await submitCorrectAnswer(page);
    await page.waitForSelector('#result-screen:not(.hidden)');
  });
});
