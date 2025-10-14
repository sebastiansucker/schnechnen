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

MIT
