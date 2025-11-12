# Schnechnen — Mathe-Spiel

Ein kleines, responsives Mathe-Lernspiel (JavaScript) mit modernem Design, inspiriert von Wortspiel.

## Features

- 🎨 **Modernes Design**: Gradient-basiertes UI mit Orange/Türkis/Violett-Farbpalette
- 🐌 **Logo**: Schnecken-Emoji in rundem, gradienten Rahmen
- 📊 **5 Lern-Level**: Level 0 (Addition 1-10), Addition/Subtraktion, Multiplikation, Division
- ⏱️ **60-Sekunden-Spielmodus** mit visueller Feedback-Animation
- 📱 **Mobile-First**: Eingabe per Dial-Pad (Backspace ← 0 → OK), optimiert für Touch-Geräte
- 🏆 **Highscore pro Level**: Anzahl richtiger Antworten (localStorage)
- 🧠 **Adaptives Lernen**: Häufige Fehler werden automatisch wiederholt (30% Chance)
- ❌ **Fehleranalyse**: Anzeige häufig falsch gelöster Aufgaben
- 📈 **Statistik-Seite**: Verlaufsdiagramm der letzten 50 Spiele mit Chart.js
- ✅ **Umfassend getestet**: 11 Unit Tests + 215 E2E Tests (Playwright, 5 Browser-Engines)

## Projektstruktur

```
schnechnen/
├── index.html          # Haupt-HTML-Datei
├── style.css           # CSS-Styling
├── script.js           # Spiellogik
├── weighting.js        # Fehlertracking
├── README.md           # Diese Datei
├── package.json        # Projekt-Abhängigkeiten
├── playwright.config.js # Playwright-Konfiguration
├── test/
│   ├── unit-test.js    # Unit-Tests (11 Tests)
│   └── e2e/
│       ├── level0-test.spec.js      # Level 0 Tests (10 Tests)
│       ├── schnechnen-tests.spec.js # Allgemeine E2E-Tests
│       ├── check-buttons.spec.js    # Button-Tests
│       ├── stats.spec.js            # Statistik-Tests
│       └── weighting-integration.spec.js # Adaptive Learning Tests
└── .github/
    ├── copilot-instructions.md # Copilot-Anweisungen
    └── workflows/
        └── ci.yml      # GitHub Actions CI
```

## Quick start (development)

1. Installiere Abhängigkeiten:

```bash
npm ci
```

2. Starte einen statischen Server (lokal, Port 8080):

```bash
npm run start
# öffne dann http://localhost:8080
```

3. Öffne die Seite im Browser oder starte im Dev mode (öffnet Playwright UI):

```bash
npm run dev
```

## Tests

### Unit tests

```bash
npm run test:unit
```

**11 Unit Tests** für:
- CONFIG-Struktur-Validierung
- Problem-Generierung und Constraints
- Highscore-Persistierung
- Score-Berechnung
- Fehlertracking (Weighting)
- Adaptive Learning mit wrongCount-Prioritisierung

### End-to-end tests (Playwright)

Stelle sicher, dass der Server läuft (siehe oben). Dann:

```bash
npm run test:e2e         # Headless run
npm run test:e2e:ui      # Interaktive UI
```

**215 E2E Tests** über 5 Browser-Engines (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari):
- **Level 0 Tests** (10 Tests): Kompletter Spielablauf, Timer, Backspace, Multi-Digit-Eingabe, Persistierung
- **Allgemeine Tests**: Navigation, Level-Wechsel, Highscores
- **Statistik-Tests**: Verlauf, Charts, Level-Filter, Reset
- **Adaptive Learning Tests**: Fehlertracking, wrongCount-Inkrementierung

Um den HTML-Report lokal zu öffnen (nach einem Testlauf):

```bash
npm run test:e2e:report
# oder
npx playwright show-report
```

### Alle Tests

```bash
npm test  # Führt Unit + E2E Tests aus (226 Tests gesamt)
```

**WICHTIG**: Vor dem Commit müssen alle Tests bestanden haben!

## Mobile keyboard behavior

Um zu verhindern, dass die Bildschirmtastatur auf Mobilgeräten automatisch angezeigt wird, ist das Eingabefeld standardmäßig `readonly` und die Primäreingabe erfolgt über das Dial-Pad:

- Das Antwortfeld (`#answer-input`) ist standardmäßig `readonly`. Dadurch erscheint die virtuelle Tastatur nicht, wenn der Nutzer das Dial-Pad benutzt.
- Ein Toggle-Button `Tastatur verwenden` ermöglicht das Aktivieren der nativen Tastatur (entfernt `readonly` und fokussiert das Feld). Durch erneutes Klicken wird das Feld wieder auf `readonly` gesetzt.

So bleibt die mobile UX sauber, die Systemtastatur kann bei Bedarf aber verwendet werden.

## CI

Eine GitHub Actions-Workflow-Datei ist vorhanden unter `.github/workflows/ci.yml`:

- Installiert Abhängigkeiten mit `npm ci`.
- Führt Unit Tests aus.
- Startet den statischen Server (`npm run start`).
- Installiert Playwright-Browser via `npx playwright install --with-deps`.
- Führt Playwright-Tests aus und lädt den `playwright-report` als Artefakt hoch.
- Nutzt Caching für npm und Playwright-Downloads zur Beschleunigung.

## Developer notes & suggestions

- **Dial-Pad Layout**: Backspace (links) → 0 (zentriert) → OK (rechts). Buttons verwenden `data-value` Attribute — Tests interagieren mit `.dial-btn[data-value]`.
- **Test-API**: Die App stellt eine kleine Test-API (`window.__TEST__`) zur Verfügung, wenn sie lokal läuft oder `?e2e-test` in der URL steht. Diese API wird von den Playwright-Tests verwendet, um z.B. `endGame()`, `startGame(level)` oder `generateProblem()` programmgesteuert aufzurufen.
- **Level 0**: Spezielles Anfänger-Level mit Addition 1-10. Umfassend getestet mit eigenem Test-Suite (`level0-test.spec.js`).
- **ARIA Labels**: Vollständig implementiert für Buttons, Dial-Pad, Charts und Statistiken (verbesserte Zugänglichkeit).
- **Adaptive Learning**: Fehler werden in `localStorage` gespeichert und mit `wrongCount`-Tracking verwaltet. Häufige Fehler erscheinen mit 30% Wahrscheinlichkeit wieder.
- **Tastatur-Einstellung**: In `localStorage` persistiert; kann durch Toggle-Button zwischen Dial-Pad und nativer Tastatur umgeschaltet werden.

## TODO (Ideen)

- [x] Adaptive Problemgenerierung basierend auf `weighting.js` (häufige Fehler öfter wiederholen)
- [x] Animationen für Feedback (z.B. grüner/roter Rahmen bei Antworten)
- [x] Level 0 (Anfänger-Level: Addition 1-10)
- [x] Umfassende E2E Tests für Level 0 (10 Tests)
- [x] Statistik-Seite mit Verlaufsdiagramm der Highscores
- [x] ARIA-Labels für bessere Accessibility
- [x] Zoom verhindern auf Mobilgeräten
- [x] npm test:e2e sollte den server starten
- [ ] Weitere Level mit gemischten Operationen
- [ ] Dark Mode Support
- [ ] Internationalisierung (i18n) für mehrere Sprachen
- [ ] PWA-Funktionalität (Offline-Nutzung, Install-Prompt)
- [ ] ...

## License

MIT
