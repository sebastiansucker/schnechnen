# Schnechnen — Mathe-Spiel

Ein kleines, responsives Mathe-Lernspiel (JavaScript) mit modernem Design.

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
- 🏆 **Anonymes Leaderboard**: Mit Supabase integriert, Top 10 pro Level
- ✅ **Umfassend getestet**: 11 Unit Tests + 480 E2E Tests (Playwright, 5 Browser-Engines)

## Projektstruktur

```
schnechnen/
├── index.html          # Haupt-HTML-Datei
├── style.css           # CSS-Styling
├── script.js           # Spiellogik
├── weighting.js        # Fehlertracking
├── leaderboard.js      # Anonyme Benutzernamen-Verwaltung
├── leaderboard-screen.js # Leaderboard-UI und Datenladung
├── server.js           # Backend-API für Leaderboard
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
- Leaderboard-Integration

### End-to-end tests (Playwright)

Stelle sicher, dass der Server läuft (siehe oben). Dann:

```bash
npm run test:e2e         # Headless run
npm run test:e2e:ui      # Interaktive UI
```

**480 E2E Tests** über 5 Browser-Engines (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari):
- **Level 0 Tests** (10 Tests): Kompletter Spielablauf, Timer, Backspace, Multi-Digit-Eingabe, Persistierung
- **Allgemeine Tests**: Navigation, Level-Wechsel, Highscores
- **Statistik-Tests**: Verlauf, Charts, Level-Filter, Reset
- **Adaptive Learning Tests**: Fehlertracking, wrongCount-Inkrementierung
- **Leaderboard Tests** (65 Tests): Score-Submission, Top-10-Anzeige, Name-Generierung, Level-Filter

Um den HTML-Report lokal zu öffnen (nach einem Testlauf):

```bash
npm run test:e2e:report
# oder
npx playwright show-report
```

### Alle Tests

```bash
npm test  # Führt Unit + E2E Tests aus (491 Tests gesamt)
```

**WICHTIG**: Vor dem Commit müssen alle Tests bestanden haben!

## 🏆 Leaderboard

Das Spiel verfügt über ein anonymes Leaderboard, das mit Supabase integriert ist.

### Setup

Das Leaderboard erfordert Supabase (kostenlos). Hier ist die Setup-Anleitung:

#### 1. Supabase-Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Melde dich an (Google/GitHub)
3. Erstelle ein neues Projekt:
   - **Name**: `schnechnen` (beliebig)
   - **Region**: `eu-central-1` (GDPR-konform)
   - **Password**: Notieren/speichern

#### 2. Leaderboard-Tabelle erstellen

Nach der Erstellung, öffne den **SQL Editor** und führe folgende Query aus:

```sql
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  level INT NOT NULL CHECK (level >= 0 AND level <= 5),
  score INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_score CHECK (score >= 0)
);

CREATE INDEX idx_leaderboard_level_score ON leaderboard(level, score DESC);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Jeder kann lesen, Inserts durch API
CREATE POLICY "Allow public read" ON leaderboard FOR SELECT USING (true);
```

#### 3. API-Keys kopieren

1. Gehe zu **Settings → API**
2. Kopiere:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon public** Key (lange alphanumerische Zeichenkette)
   - **service_role** Key (für Backend-API auf dem Server)

#### 4. Konfiguration

Die Keys sind bereits in `server.js` hardcoded und in der HTML injiziert. Der Server (Node.js) lädt die Leaderboard-Daten sicher vom Backend:

```bash
npm run start
```

Öffne http://localhost:8080 → der 🏆 **Leaderboard-Button** sollte sichtbar sein!

### Funktionen

- 👤 **Anonyme Spieler**: Zufällige Namen (BraveEagle42, SwiftPanda13, etc.)
- 🎮 **Auto-Submission**: Score wird nach jedem Spiel automatisch gesendet
- 🏅 **Top 10 pro Level**: Leaderboard zeigt die besten 10 Scores pro Level
- 📱 **Mobile-freundlich**: Responsive Design für alle Geräte
- 🔄 **Name wechseln**: Button zum Generieren eines neuen anonymen Namens

### Sicherheit

- ✅ **Keys auf Server**: `server.js` hat Zugriff auf `SERVICE_ROLE_KEY` (sicher)
- ✅ **Frontend-API**: Browser kommuniziert mit `/api/leaderboard/:level` (nicht direkt mit Supabase)
- ✅ **Keine privaten Daten**: Nur anonyme Namen, Level, Score gespeichert
- ✅ **Supabase RLS**: Nur SELECT public, INSERT blockiert ohne Auth (API-only)

### Troubleshooting

**„Leaderboard lädt nicht"**
- Prüfe Browser-Konsole (F12 → Console) auf Fehler
- Überprüfe, ob die Tabelle in Supabase erstellt wurde
- Prüfe die Network-Tab: GET `/api/leaderboard/1` sollte 200 sein

**„Scores werden nicht gespeichert"**
- Prüfe die Supabase Logs (Project → Logs)
- Stellt sicher, dass RLS aktiviert ist

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

## 🔒 Datenschutz & Datenspeicherung

Schnechnen speichert Daten an drei Orten:

### 🌐 Browser (localStorage)

Lokal auf dem Gerät des Spielers — **nur lesbar vom Browser, nicht vom Server**:

| Daten | Schlüssel | Inhalt | Lebensdauer |
|-------|-----------|--------|------------|
| **Highscores** | `schnechnen-highscores` | JSON `{ "0": 12, "1": 8, ... }` (Level → Max-Score) | Unbegrenzt |
| **Fehlertracking** | `schnechnen-mistakes` | JSON mit häufig falsch gelösten Aufgaben für adaptives Lernen | Unbegrenzt |
| **Tastatur-Modus** | `schnechnen-keyboard-mode` | Boolean (true = native Tastatur, false = Dial-Pad) | Unbegrenzt |
| **Leaderboard-Name** | `schnechnen-username` | String (z.B. "BraveEagle42") | Unbegrenzt |

**Sicherheit**: Diese Daten sind:
- ✅ Nur auf dem lokalen Gerät
- ✅ Nicht auf Servern gespeichert
- ✅ Können jederzeit gelöscht werden (Browser → Einstellungen → Cookies/Cache löschen)
- ⚠️ Werden verloren, wenn Browser-Daten gelöscht werden

### 📊 Supabase (optional, nur für Leaderboard)

Wenn der Leaderboard-Button genutzt wird, werden folgende Daten **an Supabase gesendet**:

| Daten | Beispiel | Speicherort |
|-------|----------|------------|
| **Benutzername** | "SwiftPanda13" | Supabase Cloud DB |
| **Level** | 2 | Supabase Cloud DB |
| **Score** | 15 | Supabase Cloud DB |
| **Zeitstempel** | 2024-11-14 10:30:00 | Supabase Cloud DB |

**Sicherheit**:
- ✅ **Anonym**: Kein Name, keine Email, keine Identifikation
- ✅ **Nur Zufallsnamen**: Generiert lokal, nicht vom Server
- ✅ **Nur für Highscores**: Nur der beste Score wird gesendet (nicht jedes Spiel)
- ✅ **Keine Aktivitätsverfolgung**: IP-Adressen werden nicht geloggt
- ✅ **GDPR-konform**: EU-Region (eu-central-1), nur öffentliche Leaderboard-Daten

### 🔐 Server (Node.js, nur backend)

Der Server (`server.js`) läuft nur lokal und speichert **keine Daten**. Er:
- ✅ Lädt Leaderboard-Daten von Supabase (GET-Request)
- ✅ Speichert keine Logs oder Benutzerinformationen

### 📋 Zusammenfassung

```
Lokal (Browser)          → localStorage
                         ├─ Highscores ✅
                         ├─ Fehlertracking ✅
                         └─ Einstellungen ✅

Optional (Leaderboard)   → Supabase Cloud
                         ├─ Zufallsname 🔒
                         ├─ Level 🔒
                         └─ Score 🔒

Server (Node.js)         → Keine Speicherung
                         └─ Nur Daten-Relay ⚡
```

Keine persönlichen Daten werden verarbeitet. Die App ist datenschutzfreundlich! 🛡️

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
- [x] Anonymes Leaderboard mit Supabase
- [x] Leaderboard-Tests und Test-Mode-Protection
- [ ] Weitere Level mit gemischten Operationen
- [ ] Dark Mode Support
- [ ] Internationalisierung (i18n) für mehrere Sprachen
- [ ] PWA-Funktionalität (Offline-Nutzung, Install-Prompt)
- [ ] ...

## License

MIT
