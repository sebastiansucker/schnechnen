// Schaltet die Leaderboard-Funktionalität (Rekorde-Button, Score-Submission) an/aus.
//
// Default: aktiv - für den selbst gehosteten Betrieb (Docker/npm start), wo server.js
// die Leaderboard-API bereitstellt.
//
// Der GitHub-Pages-Deploy-Workflow (.github/workflows/pages.yml) überschreibt diese
// Datei beim Build mit LEADERBOARD_ENABLED = false, weil GitHub Pages rein statisch ist
// und keinen Server für die Leaderboard-API bereitstellt. Das restliche Spiel
// (Level, Statistiken, Fehlertracking) funktioniert davon unabhängig weiter.
//
// Nur setzen, wenn noch nicht definiert - so kann der Wert auch vor dem Laden dieses
// Scripts vorgegeben werden (z.B. von Playwright-Tests via page.addInitScript).
if (typeof window.LEADERBOARD_ENABLED === 'undefined') {
    window.LEADERBOARD_ENABLED = true;
}
