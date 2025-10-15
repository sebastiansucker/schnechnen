# Schnechnen - Copilot Instructions

## Project Overview
Schnechnen is a mobile-first math learning game built with vanilla JavaScript, HTML, and CSS. Players solve timed math problems (60 seconds) across 4 difficulty levels, with dial-pad input optimized for touch devices. Features adaptive learning that repeats frequently missed problems.

## Architecture

### Core Components
- **`script.js`**: Single-file game engine with CONFIG-driven level system and adaptive problem generation
- **`weighting.js`**: Standalone mistake tracking (localStorage with in-memory fallback)
- **`index.html`**: Three-screen flow (start → game → results)
- **`style.css`**: Mobile-first responsive design with gradient-based color system

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

### Adaptive Learning System
`generateProblem()` integrates with `weighting.js` to implement spaced repetition:
- 30% probability to repeat a previously missed problem (via `peekMistake()`)
- Problems with higher `wrongCount` are prioritized
- Correct answers remove problems from mistake pool (via `removeMistake()`)
- Wrong answers add/increment problems in mistake pool (via `addMistake()`)

## Development Workflows

### Local Development
```bash
npm ci                    # Install dependencies
npm run start            # Start http-server on :8080
# Open http://localhost:8080
```

### Testing Strategy
**Unit tests** (`test/unit-test.js`): Run in Node.js, test pure logic (problem generation, scoring, CONFIG validation, adaptive learning).
```bash
npm run test:unit
```

Tests include:
- `testConfig()`: Validates CONFIG structure
- `testProblemGeneration()`: Verifies math problem constraints
- `testHighscore()`: Tests localStorage highscore persistence
- `testScoreCalculation()`: Validates percentage calculations
- `testWeighting()`: Tests basic mistake tracking
- `testAdaptiveProblemGeneration()`: Verifies adaptive learning with wrongCount prioritization

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
- **Dial pad is default**: Input field is `readonly`, users click dial buttons (85px × 85px on desktop, responsive down to 64px on small screens)
- Never auto-focus input (prevents mobile keyboard pop-up)
- Dial buttons use `data-value` attribute for digits (0-9)
- Special buttons: `#backspace-btn`, `#submit-btn`
- Touch optimization: `touch-action: manipulation` prevents zoom on rapid taps

### Design System
- **Color Palette**: Gradient-based design inspired by wortspiel project
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
