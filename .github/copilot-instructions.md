# Schnechnen - Copilot Instructions

## Project Overview
Schnechnen is a mobile-first math learning game built with vanilla JavaScript, HTML, and CSS. Players solve timed math problems (60 seconds) across 4 difficulty levels, with dial-pad input optimized for touch devices.

## Architecture

### Core Components
- **`script.js`**: Single-file game engine with CONFIG-driven level system
- **`weighting.js`**: Standalone mistake tracking (localStorage with in-memory fallback)
- **`index.html`**: Three-screen flow (start → game → results)
- **`style.css`**: Mobile-first responsive design

### Key Design Pattern: Dual Environment Support
The app runs in both browser and Node.js (for unit tests). The `createElements()` function in `script.js` returns:
- Real DOM elements when `document` exists (browser)
- Mock objects with minimal API when in Node.js (tests)

**Critical**: When adding new DOM elements, update both branches of `createElements()` and the mock objects in `test/unit-test.js`.

### Level Configuration (`CONFIG` object)
All game mechanics are driven by `CONFIG.levels[1-4]`:
```javascript
{
  name: "Display name",
  operations: ['+', '-', '*', '/'],  // Allowed operators
  maxNumber: 100,                     // Max operand value
  minResult: 0                        // Minimum acceptable result
}
```
Level logic is centralized in `generateProblem()` - modify here to change math rules.

### State Management
Global `gameState` object holds runtime state. Reset via `resetGame()` (clears everything) or back button handler (preserves highscores).

## Development Workflows

### Local Development
```bash
npm ci                    # Install dependencies
npm run start            # Start http-server on :8080
# Open http://localhost:8080
```

### Testing Strategy
**Unit tests** (`test/unit-test.js`): Run in Node.js, test pure logic (problem generation, scoring, CONFIG validation).
```bash
npm run test:unit
```

**E2E tests** (`test/e2e/`): Playwright tests require local server running.
```bash
# Terminal 1:
npm run start

# Terminal 2:
npm run test:e2e         # Headless run
npm run test:e2e:ui      # Interactive UI mode
```

**Important**: E2E tests use `http://localhost:8080` (hardcoded in `playwright.config.js`). Server must be running first.

### Test Utilities
`script.js` exposes `window.__TEST__` API for E2E tests (only when `localhost` or `?e2e-test` flag):
```javascript
window.__TEST__.endGame()
window.__TEST__.startGame(level)
window.__TEST__.generateProblem()
```

## Project Conventions

### Mobile-First Input
- **Dial pad is default**: Input field is `readonly`, users click dial buttons
- Never auto-focus input (prevents mobile keyboard pop-up)
- Dial buttons use `data-value` attribute for digits (0-9)
- Special buttons: `#backspace-btn`, `#submit-btn`

### Operator Display
Internal operators (`+`, `-`, `*`, `/`) map to printable symbols via `displayOperator()`:
- `*` → `×` (multiplication sign)
- `/` → `÷` (division sign)

Always use `displayOperator()` when showing math problems to users.

### LocalStorage Keys
- `schnechnen-highscores`: JSON object `{ "1": 75, "2": 80, ... }` (level → percentage)
- `schnechnen-mistakes`: JSON object managed by `weighting.js`

### Screen Navigation
Three screens with `.hidden` class toggling via `showScreen()`:
- `start-screen` → `game-screen` → `result-screen`
- Back button returns to start-screen (clears game state but keeps highscores)

## Common Patterns

### Adding a New Level
1. Add entry to `CONFIG.levels` with operations array and constraints
2. Add corresponding button to `index.html` with `data-level="N"`
3. Update level button text in E2E test expectations

### Problem Generation Logic
`generateProblem()` uses different strategies per operation:
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
- **Playwright**: E2E testing framework (requires `@playwright/test` and `playwright` packages)
- **http-server**: Static file server for local dev
- **concurrently**: Run multiple npm scripts (used in `dev` script)

No build step required - everything runs directly in the browser.
