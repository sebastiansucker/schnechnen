# Schnechnen - Mathe Spiel

Ein interaktives Mathe-Spiel zum Lernen, ähnlich wie das Wortspiel. Das Spiel bietet verschiedene Level zur Übung von Grundrechenarten.

## Funktionen

- **Vier verschiedene Level**:
  - Level 1: Addition und Subtraktion bis 10
  - Level 2: Addition und Subtraktion bis 100
  - Level 3: Multiplikation bis 100
  - Level 4: Multiplikation und Division bis 100

- **Spielmechanik**:
  - 60 Sekunden lang zufällige Matheaufgaben
  - Zahleneingabe über Dial-Pad (optimiert für Mobilgeräte)
  - Ergebnis wird angezeigt (Anzahl richtiger Antworten)
  - Highscores pro Level mit localStorage
  - Häufig falsch gelöste Aufgaben werden angezeigt

- **Technologien**:
  - HTML5, CSS3, JavaScript (ES6)
  - Responsive Design für Mobilgeräte
  - Unit Tests mit Node.js
  - End-to-End Tests mit Playwright

## Projektstruktur

```
schnechnen/
├── index.html          # Haupt-HTML-Datei
├── style.css           # CSS-Styling
├── script.js           # Spiellogik
├── README.md           # Diese Datei
├── package.json        # Projekt-Abhängigkeiten
├── playwright.config.js # Playwright-Konfiguration
├── test/
│   ├── unit-test.js    # Unit-Tests
│   ├── test-runner.html # HTML-Testrunner
│   └── e2e/
│       └── schnechnen-tests.spec.js # End-to-End-Tests
```

## Spielstart

1. Öffne `index.html` in einem Browser
2. Wähle ein Level aus
3. Löse so viele Aufgaben wie möglich innerhalb von 60 Sekunden
4. Sehe deine Ergebnisse und Highscore

## Tests ausführen

### Unit Tests
```bash
npm run test:unit
```

### End-to-End Tests (UI)
```bash
npm run test:e2e:ui
```

### Alle Tests
```bash
npm run test
```

## Entwicklung

Das Projekt verwendet moderne Web-Technologien und ist für die Weiterentwicklung aufbereitet. Die Spiellogik ist modular aufgebaut und die Tests gewährleisten die Qualität der Implementierung.

## Lizenz


# Schnechnen — Mathe-Spiel

Ein kleines, responsives Mathe-Lernspiel (JavaScript) mit Unit- und End-to-End-Tests.

## Features

- 4 Lern-Level (Addition/Subtraktion, Multiplikation, Division)
- 60-Sekunden-Spielmodus
- Eingabe per Dial-Pad (mobil-first) + OK-Button
- Highscore pro Level (localStorage)
- Anzeige häufig falsch gelöster Aufgaben
- Unit tests (Node), E2E tests (Playwright)

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

## License

MIT
