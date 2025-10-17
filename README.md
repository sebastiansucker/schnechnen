# Schnechnen — Mathe-Spiel

Ein kleines, responsives Mathe-Lernspiel (JavaScript) mit modernem Design, inspiriert von Wortspiel.

## Features

- 🎨 **Modernes Design**: Gradient-basiertes UI mit Orange/Türkis/Violett-Farbpalette
- 🐌 **Logo**: Schnecken-Emoji in rundem, gradienten Rahmen
- 📊 **4 Lern-Level**: Addition/Subtraktion, Multiplikation, Division
- ⏱️ **60-Sekunden-Spielmodus** mit visueller Feedback-Animation
- 📱 **Mobile-First**: Eingabe per Dial-Pad, optimiert für Touch-Geräte
- 🏆 **Highscore pro Level**: Anzahl richtiger Antworten (localStorage)
- 🧠 **Adaptives Lernen**: Häufige Fehler werden automatisch wiederholt (30% Chance)
- ❌ **Fehleranalyse**: Anzeige häufig falsch gelöster Aufgaben
- 📈 **Statistik-Seite**: Verlaufsdiagramm der letzten 50 Spiele mit Chart.js
- ✅ **Getestet**: Unit tests (Node), E2E tests (Playwright)

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
│   ├── unit-test.js    # Unit-Tests
│   └── e2e/
│       ├── schnechnen-tests.spec.js # End-to-End-Tests
│       └── check-buttons.spec.js
└── .github/
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

### End-to-end tests (Playwright)

Stelle sicher, dass der Server läuft (siehe oben). Dann:

```bash
npm run test:e2e
```

Um den HTML-Report lokal zu öffnen (nach einem Testlauf):

```bash
npm run test:e2e:report
# oder
npx playwright show-report
```

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

- Die Dial-Pad Buttons verwenden `data-value` Attribute — Tests interagieren mit `.dial-btn[data-value]`.
- Die App stellt eine kleine Test-API (`window.__TEST__`) zur Verfügung, wenn sie lokal läuft oder `?e2e-test` in der URL steht. Diese API wird von den Playwright-Tests verwendet, um z.B. `endGame()` oder `startGame(level)` programmgesteuert aufzurufen.
- Für bessere Zugänglichkeit sollten ARIA-Labels für Submit/Backspace/Toggle hinzugefügt werden.
- Wenn gewünscht, kann die Tastatur-Einstellung in `localStorage` persistiert werden.

## TODO (Ideen)

- [x] Adaptive Problemgenerierung basierend auf `weighting.js` (häufige Fehler öfter wiederholen)
- [x] Animationen für Feedback (z.B. grüner/roter Rahmen bei Antworten)
- [ ] Weitere Level mit gemischten Operationen
- [x] Statistik-Seite mit Verlaufsdiagramm der Highscores
- [ ] Dark Mode Support
- [x] PWA-Funktionalität (Offline-Nutzung, Install-Prompt)
- [x] ARIA-Labels für bessere Accessibility
- [ ] Internationalisierung (i18n) für mehrere Sprachen
- [x] Zoom verhindern auf Mobilgeräten
- [x] npm:test:e2e sollte den server starten
- [ ] ...

## License

MIT
