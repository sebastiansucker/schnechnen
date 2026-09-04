# Schnechnen - Agent Instructions

## Project Overview
Schnechnen is a mobile-first math learning game built with vanilla JavaScript, HTML, and CSS. Players solve timed math problems (60 seconds) across **6 difficulty levels** (Level 0 to 5), with dial-pad input optimized for touch devices. Features adaptive learning that repeats frequently missed problems, a statistics page with a history chart, and a self-hosted anonymous leaderboard.

## Architecture

### Core Components
- **`public/game-logic.js`**: Pure game logic with no DOM dependencies (`CONFIG`, problem generation). Imported directly by unit tests and by `script.js`.
- **`public/script.js`**: DOM/game-state layer built on top of `game-logic.js` - screen navigation, timer, highscores, game history.
- **`public/weighting.js`**: Standalone mistake tracking (localStorage with in-memory fallback).
- **`public/leaderboard.js`** / **`public/leaderboard-screen.js`**: Anonymous username generation and leaderboard UI/data loading.
- **`public/leaderboard-config.js`**: `LEADERBOARD_ENABLED` flag (turned off for the GitHub Pages build).
- **`public/index.html`**: Five-screen flow (start → game → result / stats / leaderboard).
- **`public/style.css`**: Mobile-first responsive design with gradient-based color system.
- **`server.js`**: Static-file server + leaderboard API, backed by the built-in `node:sqlite` module.

### Key Design Pattern: Dual Environment Support
The app runs in both browser and Node.js (for unit tests). `game-logic.js` has no DOM dependency at all and is imported as-is by `test/unit-test.js`. The `createElements()` function in `script.js` returns:
- Real DOM elements when `document` exists (browser)
- Mock objects with minimal API when in Node.js (tests)

**Critical**: When adding new DOM elements, update both branches of `createElements()` and the mock objects in `test/unit-test.js`.

### Level Configuration (`CONFIG` object, in `game-logic.js`)
All game mechanics are driven by `CONFIG.levels[0-5]`:
```javascript
{
  name: "Display name",
  operations: ['+', '-', '*', '/'],  // Allowed operators
  maxNumber: 100,                     // Max operand value
  minResult: 0                        // Minimum acceptable result
}
```
- **Level 0** (Addition bis 10): Introductory level, addition only, numbers up to 10.
- **Level 1**: Addition & Subtraktion bis 10.
- **Level 2**: Addition & Subtraktion bis 100.
- **Level 3**: Multiplikation bis 100.
- **Level 4**: Multiplikation & Division bis 100.
- **Level 5** (🌪️ Chaos Mode): All four operations mixed, numbers up to 1000.

Level logic is centralized in `generateProblemFor()` in `game-logic.js` - modify here to change math rules.

### State Management
Global `gameState` object (in `script.js`) holds runtime state. Reset via `resetGame()` (clears everything) or the back button handler (preserves highscores).

### Highscores
`gameState.score` / the persisted highscore is the **number of correctly answered problems** within the 60-second round, not a percentage.

### Adaptive Learning System
`generateProblem()` integrates with `weighting.js` to implement spaced repetition:
- 30% probability to repeat a previously missed problem (via `peekMistake()`)
- Problems with higher `wrongCount` are prioritized
- Correct answers remove problems from the mistake pool (via `removeMistake()`)
- Wrong answers add/increment problems in the mistake pool (via `addMistake()`)

## Development Workflows

### Local Development
```bash
npm ci                    # Install dependencies
npm run start             # Start server.js (game + leaderboard API) on :8080
# or: npm run start:simple  # Static-only server (http-server), no leaderboard API
# Open http://localhost:8080
```

### Testing Strategy
**CRITICAL**: Always run `npm test` before committing! All tests must pass before pushing changes.

**Unit tests** (`test/unit-test.js`, 25 tests): Run in Node.js against the real `game-logic.js` / `weighting.js` modules (problem generation, scoring, CONFIG validation, adaptive learning).
```bash
npm run test:unit   # runs test/unit-test.js and test/server-test.js
```

`test/server-test.js` (10 tests) covers the server directly: JSON body parsing, rate limiting, and path-traversal protection.

**E2E tests** (`test/e2e/`, 546 tests across 6 Playwright browser projects): require the local server running.
```bash
npm run test:e2e         # Headless run
npm run test:e2e:ui      # Interactive UI mode
```

**Run all tests** before committing:
```bash
npm test                 # Runs unit + server + E2E tests (581 tests total)
```

**Important**: `playwright.config.mjs` starts the server itself (`webServer`) against a throwaway SQLite file, so E2E runs never touch real leaderboard data. `baseURL` is `http://localhost:8080`.

### Test Utilities
`script.js` exposes a `window.__TEST__` API for E2E tests (only when running on `localhost` or with `?e2e-test` in the URL):
```javascript
window.__TEST__.endGame()
window.__TEST__.startGame(level)
window.__TEST__.generateProblem()
```

## Project Conventions

### Mobile-First Input
- **Dial pad is default**: Input field is `readonly`, users click dial buttons (85px × 85px on desktop, responsive down to 64px on small screens)
- **Dial pad layout**: Bottom row organized as: Backspace (left) → 0 (center) → OK (right)
- Never auto-focus input (prevents mobile keyboard pop-up)
- Dial buttons use `data-value` attribute for digits (0-9)
- Special buttons: `#backspace-btn`, `#submit-btn`
- Touch optimization: `touch-action: manipulation` prevents zoom on rapid taps

### Design System
- **Color Palette**: Gradient-based design
  - Primary Orange: `#FF6B35`
  - Primary Turquoise: `#00B4D8`
  - Primary Purple: `#9D4EDD`
  - Primary Pink: `#FF006E`
  - Primary Teal: `#06A77D`
- **CSS Variables**: All colors defined in `:root` for easy theming
- **Gradient Backgrounds**: `linear-gradient(135deg, ...)` throughout UI
- **Card Shadows**: `0 8px 32px rgba(0, 0, 0, 0.1)` for depth
- **Border Radius**: `16px` standard, `20px` for container

### Operator Display
Internal operators (`+`, `-`, `*`, `/`) map to printable symbols via `displayOperator()`:
- `*` → `×` (multiplication sign)
- `/` → `÷` (division sign)

Always use `displayOperator()` when showing math problems to users.

### LocalStorage Keys
- `schnechnen-highscores`: JSON object `{ "0": 12, "1": 8, ... }` (level → highscore, i.e. number of correct answers)
- `schnechnen-mistakes`: JSON object managed by `weighting.js`
- `schnechnen-keyboard-mode`: boolean, dial-pad vs. native keyboard
- `schnechnen-username`: anonymous leaderboard display name

### Screen Navigation
Five screens with the `.hidden` class toggled via `showScreen()`:
- `start-screen` → `game-screen` → `result-screen`
- `stats-screen` and `leaderboard-screen` are reachable from `start-screen` / `result-screen`
- Back button returns to `start-screen` (clears game state but keeps highscores)

## Common Patterns

### Adding a New Level
1. Add an entry to `CONFIG.levels` (in `game-logic.js`) with operations array and constraints
2. Add a corresponding button to `index.html` with `data-level="N"`
3. Create a dedicated E2E test file (e.g. `test/e2e/levelN-test.spec.js`)
4. Update level button text in E2E test expectations

### Problem Generation Logic
`generateProblemFor()` uses different strategies per operation:
- **Division**: Generate `result` and `num2` first, then `num1 = num2 * result` (ensures whole numbers)
- **Multiplication**: Use `sqrt(maxNumber)` for operands to keep results in range
- **Subtraction**: Ensure `num2 ≤ num1` to avoid negative results
- Loop with `do-while` to enforce `result ≥ minResult`

### Mistake Tracking
Mistakes are tracked per level in `weighting.js`:
```javascript
addMistake(level, { num1, num2, operation, result, wrongCount })
```
Called from `checkAnswer()` only on wrong answers. The `wrongCount` field is incremented for duplicate problems.

## Testing Notes

### Flaky Test Prevention
- E2E tests must `await page.waitForSelector()` before reading dynamic content
- Use scoped selectors (e.g., `#start-screen p`) to avoid ambiguous matches
- Check for `not.toHaveClass('hidden')` rather than `.toBeVisible()` for reliability

### Unit Test Mocking
When testing functions that use DOM elements, ensure mock objects in `test/unit-test.js` implement all accessed properties/methods (e.g., `classList.add`, `textContent`, `focus`).

## Dependencies
- **Playwright** (`@playwright/test`, `playwright`): E2E testing framework
- **http-server**: Static file server for `npm run start:simple`
- **eslint** / **@eslint/js**: Linting (`npm run lint`)
- **nyc**: Coverage reporting for unit tests

No build step required - everything runs directly in the browser. The leaderboard backend (`server.js`) uses only Node's built-in `node:sqlite`, no extra database dependency.
