# Schnechnen — Mathe-Spiel

Ein kleines, responsives Mathe-Lernspiel (JavaScript) mit modernem Design.

## Features

- 🎨 **Modernes Design**: Gradient-basiertes UI mit Orange/Türkis/Violett-Farbpalette
- 🐌 **Logo**: Schnecken-Emoji in rundem, gradienten Rahmen
- 📊 **6 Lern-Level**: Level 0 (Addition 1-10), Addition/Subtraktion, Multiplikation, Division, 🌪️ Chaos Mode (alle Operationen gemischt)
- ⏱️ **60-Sekunden-Spielmodus** mit visueller Feedback-Animation
- 📱 **Mobile-First**: Eingabe per Dial-Pad (Backspace ← 0 → OK), optimiert für Touch-Geräte
- 🏆 **Highscore pro Level**: Anzahl richtiger Antworten (localStorage)
- 🧠 **Adaptives Lernen**: Häufige Fehler werden automatisch wiederholt (30% Chance)
- ❌ **Fehleranalyse**: Anzeige häufig falsch gelöster Aufgaben
- 📈 **Statistik-Seite**: Verlaufsdiagramm der letzten 50 Spiele mit Chart.js
- 🏆 **Anonymes Leaderboard**: Selbst gehostet mit SQLite (kein Cloud-Dienst), Top 10 pro Level
- ✅ **Umfassend getestet**: 25 Unit Tests + 546 E2E Tests (Playwright, 6 Browser-Engines)

## Projektstruktur

```
schnechnen/
├── public/              # Statische Dateien, ausschließlich diese werden ausgeliefert
│   ├── index.html       # Haupt-HTML-Datei
│   ├── style.css        # CSS-Styling
│   ├── script.js        # DOM/Spielzustand, lädt game-logic.js
│   ├── game-logic.js    # Reine Spiellogik ohne DOM-Abhängigkeiten (CONFIG, Aufgabengenerierung)
│   ├── weighting.js     # Fehlertracking
│   ├── leaderboard.js   # Anonyme Benutzernamen-Verwaltung
│   ├── leaderboard-screen.js # Leaderboard-UI und Datenladung
│   ├── leaderboard-config.js # Flag LEADERBOARD_ENABLED (aus für GitHub Pages)
│   ├── manifest.webmanifest # PWA-Manifest (Name, Icons, Theme-Farbe, Standalone-Modus)
│   └── sw.js             # Service Worker: Cache-First App-Shell, Network-Only für /api/*
├── server.js            # Backend: Static-File-Server + Leaderboard-API (node:sqlite)
├── Dockerfile           # Container-Image (node:24-alpine)
├── docker-compose.yml   # Referenz-Compose-Datei für Unraid
├── README.md            # Diese Datei
├── package.json         # Projekt-Abhängigkeiten
├── playwright.config.mjs # Playwright-Konfiguration
├── test/
│   ├── unit-test.js     # Unit-Tests für Spiellogik (game-logic.js, weighting.js)
│   ├── server-test.js   # Unit-Tests für Leaderboard-Validierung und SQLite-Zugriff
│   └── e2e/
│       ├── level0-test.spec.js      # Level 0 Tests
│       ├── level1-test.spec.js      # Level 1 Tests
│       ├── level2-test.spec.js      # Level 2 Tests
│       ├── level3-test.spec.js      # Level 3 Tests
│       ├── level4-test.spec.js      # Level 4 Tests
│       ├── schnechnen-tests.spec.js # Allgemeine E2E-Tests
│       ├── back-navigation.spec.js  # Zurück-Button und Navigations-Tests
│       ├── browser-edge-cases.spec.js # Browser-Sonderfälle (z.B. Tab-Wechsel, Reload)
│       ├── leaderboard.spec.js      # Leaderboard Tests
│       ├── stats.spec.js            # Statistik-Tests
│       └── weighting-integration.spec.js # Adaptive Learning Tests
└── .github/
    └── workflows/
        ├── ci.yml       # GitHub Actions CI (Lint + Tests)
        ├── docker.yml   # Baut und pusht das Image nach ghcr.io
        └── pages.yml    # Deployt public/ nach GitHub Pages (ohne Leaderboard)
```

## Quick start (development)

1. Installiere Abhängigkeiten:

```bash
npm ci
```

2. Starte den Server (lokal, Port 8080):

```bash
npm run start
# öffne dann http://localhost:8080
```

Alternativ ohne Leaderboard-API, nur als statischer Server:

```bash
npm run start:simple
```

## Als App installieren

Schnechnen ist eine Progressive Web App (PWA) und lässt sich auf dem Homescreen installieren. Danach startet sie im Vollbild (ohne Browserleiste) und funktioniert auch offline - Spiel, Statistik und Fehlerliste liegen ohnehin im localStorage. Ist kein Netz da oder das eigene NAS gerade aus, zeigt das Leaderboard einfach die Meldung "Rekord-Server nicht erreichbar".

**Android (Chrome)**: Seite öffnen → Menü (⋮) → "App installieren" bzw. der Installations-Hinweis am unteren Bildschirmrand.

**iOS (Safari)**: Seite öffnen → Teilen-Symbol → "Zum Home-Bildschirm".

Nach einem Deployment holt sich die App beim nächsten Start automatisch die neue Version; falls eine bereits geöffnete Instanz eine neue Version erkennt, erscheint unten ein Hinweis "Neue Version verfügbar" mit einem Button zum Neuladen.

## Tests

### Unit tests

```bash
npm run test:unit
```

**25 Unit Tests** (`test/unit-test.js`) für:
- CONFIG-Struktur-Validierung
- Problem-Generierung und Constraints
- Highscore-Persistierung
- Score-Berechnung
- Fehlertracking (Weighting)
- Adaptive Learning mit wrongCount-Prioritisierung
- Leaderboard-Integration

Dazu **10 weitere Tests** (`test/server-test.js`) für den Server: JSON-Body-Parsing, Rate-Limiting und Path-Traversal-Schutz.

### End-to-end tests (Playwright)

Stelle sicher, dass der Server läuft (siehe oben). Dann:

```bash
npm run test:e2e         # Headless run
npm run test:e2e:ui      # Interaktive UI
```

**546 E2E Tests** über 6 Browser-Engines (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, iPhone 13 Mini):
- **Level 0-4 Tests**: Kompletter Spielablauf pro Level, Timer, Backspace, Multi-Digit-Eingabe, Persistierung
- **Allgemeine Tests** (`schnechnen-tests.spec.js`): Navigation, Level-Wechsel, Highscores
- **Zurück-Navigation** (`back-navigation.spec.js`): Zurück-Button-Verhalten
- **Browser-Sonderfälle** (`browser-edge-cases.spec.js`): z.B. Tab-Wechsel, Reload
- **Statistik-Tests**: Verlauf, Charts, Level-Filter, Reset
- **Adaptive Learning Tests**: Fehlertracking, wrongCount-Inkrementierung
- **Leaderboard Tests**: Score-Submission, Top-10-Anzeige, Name-Generierung, Level-Filter

Um den HTML-Report lokal zu öffnen (nach einem Testlauf):

```bash
npm run test:e2e:report
# oder
npx playwright show-report
```

### Alle Tests

```bash
npm test  # Führt Unit + E2E Tests aus (581 Tests gesamt)
```

**WICHTIG**: Vor dem Commit müssen alle Tests bestanden haben!

## 🏆 Leaderboard

Das Spiel verfügt über ein anonymes Leaderboard. Es läuft komplett selbst gehostet: `server.js` schreibt die Scores über das eingebaute [`node:sqlite`](https://nodejs.org/api/sqlite.html)-Modul in eine einzelne SQLite-Datei. Kein Cloud-Dienst, keine API-Keys, kein Vendor-Lock-in — Backup ist eine Datei kopieren.

### Lokal starten

```bash
npm ci
npm run start
```

Der Server legt beim ersten Start die Tabelle in der SQLite-Datenbank automatisch an (`CREATE TABLE IF NOT EXISTS`). Öffne http://localhost:8080 → der 🏆 **Leaderboard-Button** sollte sichtbar sein!

### Konfiguration (Umgebungsvariablen)

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `PORT` | `8080` | Port, auf dem der Server lauscht |
| `DB_PATH` | `/data/leaderboard.db` | Pfad zur SQLite-Datei |
| `CORS_ORIGIN` | *(leer, kein CORS)* | Optional: Origin, die per CORS auf die API zugreifen darf (z.B. wenn das Spiel weiterhin über GitHub Pages läuft, siehe Szenario B unten) |

### API-Endpunkte

- `GET /api/leaderboard/:level` — Top 10 Scores für ein Level (0-5)
- `GET /api/leaderboard` — Top 50 Scores über alle Level
- `POST /api/leaderboard/submit` — Score einreichen (`{ "username": "...", "level": 0-5, "score": 0-200 }`)
- `GET /healthz` — Health-Check für Docker

Die Submission wird serverseitig validiert (Level 0-5, Score 0-200 als Ganzzahl, Username max. 40 Zeichen) und ist pro IP rate-limitiert.

### Betrieb auf Unraid

Das Image wird bei jedem Push auf `main` automatisch nach `ghcr.io/sebastiansucker/schnechnen` gebaut und gepusht (siehe `.github/workflows/docker.yml`).

**Variante 1: Docker-Tab (empfohlen für den Einstieg)**

1. Unraid-WebUI → **Docker** → **Add Container**
2. **Repository**: `ghcr.io/sebastiansucker/schnechnen:latest`
3. **Port**: Container `8080` → Host `8080` (oder frei wählbar)
4. **Path**: Container `/data` → Host `/mnt/user/appdata/schnechnen`
5. Container starten, danach `http://<NAS-IP>:8080` öffnen

**Variante 2: Compose Manager Plugin**

Mit dem Unraid-Plugin "Compose Manager" die im Repo mitgelieferte [`docker-compose.yml`](./docker-compose.yml) verwenden:

```yaml
services:
  schnechnen:
    image: ghcr.io/sebastiansucker/schnechnen:latest
    container_name: schnechnen
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /mnt/user/appdata/schnechnen:/data
    environment:
      - DB_PATH=/data/leaderboard.db
```

**Berechtigungen (wichtig, vor dem ersten Start)**: Der Container läuft als nicht-privilegierter `node`-User (UID 1000). Der appdata-Ordner gehört auf einem frischen Unraid-System aber meist `nobody:users` (99:100) — damit kann der Container die SQLite-Datei nicht anlegen und bricht beim Start ab mit:

```
Error: unable to open database file
    at openDatabase (/app/server.js:...)
```

Deshalb dem Ordner *vor* dem ersten Start des Containers einmalig die passenden Rechte geben:

```bash
mkdir -p /mnt/user/appdata/schnechnen
chown -R 1000:1000 /mnt/user/appdata/schnechnen
```

Danach den Container (neu) starten. Kommt der Fehler trotzdem, prüfen, ob im Docker-Tab wirklich `/mnt/user/appdata/schnechnen` (nicht z.B. ein anderer, noch nicht angelegter Pfad) auf `/data` gemappt ist.

**Updates**: Watchtower oder Unraids eigenes "Check for Updates" für automatische Image-Updates verwenden.

**Backup**: Der appdata-Ordner (`/mnt/user/appdata/schnechnen`) liegt im normalen Unraid-Backup-Umfang (z.B. Appdata Backup Plugin) — es ist nur die eine Datei `leaderboard.db`.

### Szenarien für den Zugriff

- **Nur im Heimnetz (Standardfall)**: Spiel läuft komplett vom NAS unter `http://<NAS-IP>:8080`, inklusive Leaderboard. Kein HTTPS oder Port-Forwarding nötig.
- **GitHub Pages weiterhin nutzen, ohne Leaderboard**: `.github/workflows/pages.yml` baut und deployt bei jedem Push auf `main` automatisch die `public/`-Dateien nach GitHub Pages — mit deaktiviertem Leaderboard (siehe unten). Das ist der einfachste Weg, das Spiel zusätzlich öffentlich unter der Pages-URL anzubieten, ohne einen Server im Internet erreichbar machen zu müssen.
- **GitHub Pages zusätzlich mit funktionierendem Leaderboard**: Die API muss dann per HTTPS erreichbar sein (GitHub Pages blockt sonst Mixed Content). Empfohlen: [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) als zweiter Container, kein offener Port im Router nötig. `CORS_ORIGIN` auf die Pages-URL setzen, `window.API_BASE` im Pages-Build auf die Tunnel-URL zeigen lassen und in `.github/workflows/pages.yml` das `LEADERBOARD_ENABLED = false` in `leaderboard-config.js` weglassen bzw. auf `true` setzen. Kann als Folge-Ticket kommen.

### GitHub Pages ohne Datenbank-Funktionalität

Das Spiel selbst (Level, Statistiken, Fehlertracking) läuft komplett im Browser und braucht keinen Server. Nur das Leaderboard braucht eine erreichbare API — die gibt es auf GitHub Pages standardmäßig nicht.

Dafür gibt es ein Flag in `public/leaderboard-config.js`:

```js
window.LEADERBOARD_ENABLED = true; // Default: an (Docker/npm start)
```

Ist es `false`, wird der 🏆-Rekorde-Button ausgeblendet und es werden keine Scores mehr an eine API gesendet.

`.github/workflows/pages.yml` deployt bei jedem Push auf `main` den Inhalt von `public/` nach GitHub Pages und überschreibt dabei `leaderboard-config.js` mit `LEADERBOARD_ENABLED = false` — der Rest des Spiels bleibt unverändert nutzbar, nur eben ohne Rekorde-Button. Die Docker/Unraid-Variante (`npm start` bzw. `server.js`) bleibt davon unberührt und liefert das Leaderboard ganz normal aus, da dort die Original-Datei aus `public/` mit `LEADERBOARD_ENABLED = true` verwendet wird.

**Einmalige Einrichtung**: Damit dieser Workflow greift, muss die Pages-Quelle des Repositories einmalig auf "GitHub Actions" umgestellt werden: **Settings → Pages → Build and deployment → Source → GitHub Actions**. Ohne diese Umstellung liefert GitHub Pages weiterhin die alte, klassische Root-Deployment-Variante aus (die nach dem Umzug der Dateien nach `public/` nicht mehr funktioniert, da `index.html` nicht mehr im Repository-Root liegt).

### Bekannte Einschränkung

Ist das NAS aus, ist das Leaderboard nicht erreichbar. Das Spiel selbst funktioniert weiter, das Frontend zeigt "🌐 Rekord-Server nicht erreichbar". Highscores und Statistiken liegen ohnehin im Browser (`localStorage`).

### Funktionen

- 👤 **Anonyme Spieler**: Zufällige Namen (Süßer Panda42, Flauschiger Häschen15, etc.)
- 🎮 **Auto-Submission**: Score wird nach jedem Spiel automatisch gesendet
- 🏅 **Top 10 pro Level**: Leaderboard zeigt die besten 10 Scores pro Level
- 📱 **Mobile-freundlich**: Responsive Design für alle Geräte
- 🔄 **Name wechseln**: Button zum Generieren eines neuen anonymen Namens

### Sicherheit

- ✅ **Keine Keys im Code**: Es gibt keine externen Zugangsdaten mehr — der Server hat exklusiven Zugriff auf seine eigene SQLite-Datei
- ✅ **Path-Traversal-Schutz**: Statische Dateien werden ausschließlich aus `public/` ausgeliefert, Pfade werden aufgelöst und geprüft
- ✅ **Validierung serverseitig**: Level, Score und Username werden vor dem Insert geprüft, Requests sind pro IP rate-limitiert
- ✅ **Keine privaten Daten**: Nur anonyme Namen, Level, Score gespeichert

### Troubleshooting

**„Leaderboard lädt nicht"**
- Prüfe Browser-Konsole (F12 → Console) auf Fehler
- Prüfe den Network-Tab: GET `/api/leaderboard/1` sollte 200 sein
- Prüfe `GET /healthz` — sollte `{"status":"ok"}` liefern

**„Scores werden nicht gespeichert"**
- Prüfe die Server-Logs (`docker logs schnechnen`)
- Prüfe, ob `/data` im Container beschreibbar ist (Berechtigungen, siehe oben)

**Container startet gar nicht, Log zeigt `Error: unable to open database file`**
- Das ist praktisch immer eine Berechtigungsfrage, siehe [Berechtigungen](#betrieb-auf-unraid) oben: `chown -R 1000:1000` auf den appdata-Ordner, dann Container neu starten
- Der Server loggt vor diesem Fehler die verwendete `DB_PATH` sowie eine Erklärung — in `docker logs schnechnen` nachsehen

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

Zusätzlich baut `.github/workflows/docker.yml` bei jedem Push auf `main` das Docker-Image und pusht es nach `ghcr.io/sebastiansucker/schnechnen` (Tags `latest` und Commit-SHA). Es wird nur das eingebaute `GITHUB_TOKEN` benötigt, kein zusätzliches Secret.

Und `.github/workflows/pages.yml` deployt bei jedem Push auf `main` `public/` nach GitHub Pages (Leaderboard dort deaktiviert, siehe [GitHub Pages ohne Datenbank-Funktionalität](#github-pages-ohne-datenbank-funktionalität)). Dafür muss die Pages-Quelle des Repositories einmalig auf "GitHub Actions" umgestellt sein.

### Automatische Dependency Updates (Renovate Bot)

Das Projekt verwendet [Renovate Bot](https://renovatebot.com/) für automatische Dependency-Updates:

- **Wöchentliche Updates**: Jeden Montag vor 6 Uhr (Europe/Berlin)
- **Automerge**: Minor/Patch-Updates für devDependencies werden automatisch gemergt
- **Sicherheit**: Security Alerts werden automatisch gemergt
- **Gruppierung**: Verwandte Updates (Playwright, GitHub Actions) werden zusammengefasst
- **Lock File Maintenance**: Monatliche Aktualisierung von `package-lock.json`
- **Rate Limiting**: Max. 5 PRs gleichzeitig, 2 pro Stunde

Die Konfiguration befindet sich in `renovate.json` im Repository-Root.

## 🔒 Datenschutz & Datenspeicherung

Schnechnen speichert Daten an drei Orten:

### 🌐 Browser (localStorage)

Lokal auf dem Gerät des Spielers — **nur lesbar vom Browser, nicht vom Server**:

| Daten | Schlüssel | Inhalt | Lebensdauer |
|-------|-----------|--------|------------|
| **Highscores** | `schnechnen-highscores` | JSON `{ "0": 12, "1": 8, ... }` (Level → Max-Score) | Unbegrenzt |
| **Fehlertracking** | `schnechnen-mistakes` | JSON mit häufig falsch gelösten Aufgaben für adaptives Lernen | Unbegrenzt |
| **Tastatur-Modus** | `schnechnen-keyboard-mode` | Boolean (true = native Tastatur, false = Dial-Pad) | Unbegrenzt |
| **Leaderboard-Name** | `schnechnen-username` | String (z.B. "Süßer Panda42") | Unbegrenzt |

**Sicherheit**: Diese Daten sind:
- ✅ Nur auf dem lokalen Gerät
- ✅ Nicht auf Servern gespeichert
- ✅ Können jederzeit gelöscht werden (Browser → Einstellungen → Cookies/Cache löschen)
- ⚠️ Werden verloren, wenn Browser-Daten gelöscht werden

### 🖥️ Eigener Server (Node.js + SQLite, nur für Leaderboard)

Wenn der Leaderboard-Button genutzt wird, werden folgende Daten an den **eigenen** Server gesendet (kein Drittanbieter):

| Daten | Beispiel | Speicherort |
|-------|----------|------------|
| **Benutzername** | "Süßer Panda42" | SQLite-Datei auf dem eigenen NAS |
| **Level** | 2 | SQLite-Datei auf dem eigenen NAS |
| **Score** | 15 | SQLite-Datei auf dem eigenen NAS |
| **Zeitstempel** | 2024-11-14 10:30:00 | SQLite-Datei auf dem eigenen NAS |

**Sicherheit**:
- ✅ **Anonym**: Kein Name, keine Email, keine Identifikation
- ✅ **Nur Zufallsnamen**: Generiert lokal, nicht vom Server
- ✅ **Nur für Highscores**: Nur der beste Score wird gesendet (nicht jedes Spiel)
- ✅ **Keine Aktivitätsverfolgung**: IP-Adressen werden nur kurzzeitig für das Rate-Limiting im Speicher gehalten, nicht geloggt oder gespeichert
- ✅ **Kein Cloud-Dienst**: Die Daten verlassen das eigene Netzwerk nicht (Standardfall, siehe Szenario A oben)

### 🔐 Server (Node.js + SQLite)

Der Server (`server.js`) läuft auf dem eigenen NAS und ist die einzige Stelle, an der Leaderboard-Daten dauerhaft gespeichert werden. Er:
- ✅ Speichert Leaderboard-Einträge in einer lokalen SQLite-Datei (`DB_PATH`, Standard `/data/leaderboard.db`)
- ✅ Speichert keine weiteren Logs oder Benutzerinformationen

### 📋 Zusammenfassung

```
Lokal (Browser)          → localStorage
                         ├─ Highscores ✅
                         ├─ Fehlertracking ✅
                         └─ Einstellungen ✅

Optional (Leaderboard)   → eigener Server (SQLite)
                         ├─ Zufallsname 🔒
                         ├─ Level 🔒
                         └─ Score 🔒
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
- [x] Anonymes Leaderboard (selbst gehostet, SQLite via Docker)
- [x] Leaderboard-Tests und Test-Mode-Protection
- [x] Weitere Level mit gemischten Operationen
- [ ] Dark Mode Support
- [ ] Internationalisierung (i18n) für mehrere Sprachen
- [x] PWA-Funktionalität (Offline-Nutzung, Install-Prompt)
- [ ] ...

## License

MIT
