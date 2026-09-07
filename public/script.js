/**
 * Detect if running in test mode
 * - E2E tests run on localhost with an explicit ?e2e-test query parameter
 * - Unit tests set window.__TEST_MODE__ = true
 */
if (typeof window !== 'undefined' && !window.__TEST_MODE__) {
    const testModeParams = new URLSearchParams(window.location.search);
    window.__TEST_MODE__ = (
        window.location.hostname === 'localhost' &&
        testModeParams.has('e2e-test')
    );
}

// Reine Spiellogik (CONFIG, Aufgabengenerierung, Anzeige-Helfer) lebt in
// game-logic.js, damit sie ohne DOM-Mocks direkt und unverfälscht getestet
// werden kann. script.js kümmert sich nur noch um DOM und Spielzustand.
// (Kein Destructuring von CONFIG/etc. hier: script.js und game-logic.js sind
// im Browser beides klassische <script>-Tags im selben globalen Scope -
// eigene "const CONFIG" würde mit der in game-logic.js kollidieren.)
const GameLogic = (typeof module !== 'undefined' && module.exports)
    ? require('./game-logic.js')
    : window.GameLogic;

// Create a safe elements object when running under Node (unit tests) or real DOM when in browser
function createElements() {
    if (typeof document !== 'undefined') {
        return {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultScreen: document.getElementById('result-screen'),
            statsScreen: document.getElementById('stats-screen'),
            modeButtons: document.querySelectorAll('.mode-btn'),
            levelButtons: document.querySelectorAll('.level-btn'),
            timerDisplay: document.getElementById('timer-display'),
            timeElement: document.getElementById('time'),
            progressDisplay: document.getElementById('progress-display'),
            progressText: document.getElementById('progress-text'),
            progressBarFill: document.getElementById('progress-bar-fill'),
            scoreElement: document.getElementById('score'),
            currentLevelElement: document.getElementById('current-level'),
            problemElement: document.getElementById('problem'),
            problemNum1Element: document.getElementById('problem-num1'),
            problemOperatorElement: document.getElementById('problem-operator'),
            problemNum2Element: document.getElementById('problem-num2'),
            userAnswerElement: document.getElementById('user-answer'),
            dialPad: document.getElementById('dial-pad'),
            // Only select numeric dial buttons that provide a data-value attribute
            dialButtons: document.querySelectorAll('.dial-btn[data-value]'),
            backspaceButton: document.getElementById('backspace-btn'),
            submitButton: document.getElementById('submit-btn'),
            resultLevel: document.getElementById('result-level'),
            resultScore: document.getElementById('result-score'),
            totalProblemsElement: document.getElementById('total-problems'),
            highscoreElement: document.getElementById('highscore'),
            mistakeList: document.getElementById('mistake-list'),
            practiceMistakesButton: document.getElementById('practice-mistakes-btn'),
            restartButton: document.getElementById('restart-btn'),
            backButton: document.getElementById('back-btn'),
            statsButton: document.getElementById('stats-btn'),
            statsBackButton: document.getElementById('stats-back-btn'),
            statsResetButton: document.getElementById('stats-reset-btn'),
            statsPracticeMistakesButton: document.getElementById('stats-practice-mistakes-btn'),
            statsLevelButtons: document.querySelectorAll('#stats-screen .stats-level-btn'),
            statHighscore: document.getElementById('stat-highscore'),
            statTotalGames: document.getElementById('stat-total-games'),
            statAvgScore: document.getElementById('stat-avg-score'),
            chartCanvas: document.getElementById('highscore-chart'),
            statsMistakeList: document.getElementById('stats-mistake-list'),
            timesTableSection: document.getElementById('times-table-section'),
            timesTableGrid: document.getElementById('times-table-grid'),
            timesTableDetail: document.getElementById('times-table-detail')
        };
    }

    // Node.js placeholders for unit tests (provide minimal API used by functions)
    return {
        startScreen: { classList: { add: () => {}, remove: () => {} } },
        gameScreen: { classList: { add: () => {}, remove: () => {} } },
        resultScreen: { classList: { add: () => {}, remove: () => {} } },
        modeButtons: [],
        levelButtons: [],
        timerDisplay: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
        timeElement: { textContent: '' },
        progressDisplay: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
        progressText: { textContent: '' },
        progressBarFill: { style: {} },
        scoreElement: { textContent: '' },
        currentLevelElement: { textContent: '' },
        problemElement: { textContent: '' },
        problemNum1Element: { textContent: '' },
        problemOperatorElement: { textContent: '' },
        problemNum2Element: { textContent: '' },
        userAnswerElement: { textContent: '' },
        dialPad: { classList: { remove: () => {} } },
        dialButtons: [],
        backspaceButton: { addEventListener: () => {} },
        submitButton: { addEventListener: () => {} },
        resultLevel: { textContent: '' },
        resultScore: { textContent: '' },
        totalProblemsElement: { textContent: '' },
        highscoreElement: { textContent: '' },
        mistakeList: { innerHTML: '' },
        practiceMistakesButton: { addEventListener: () => {}, disabled: false, title: '' },
        restartButton: { addEventListener: () => {} },
        backButton: { addEventListener: () => {} },
        statsPracticeMistakesButton: { addEventListener: () => {}, disabled: false, title: '' },
        statsMistakeList: { innerHTML: '' },
        timesTableSection: { classList: { add: () => {}, remove: () => {} } },
        timesTableGrid: { innerHTML: '', appendChild: () => {} },
        timesTableDetail: { textContent: '', classList: { add: () => {}, remove: () => {} } }
    };
}


const elements = createElements();

// Highscore-Animation-Element referenzieren
elements.highscoreAnimation = document.getElementById('highscore-animation');

// Spielzustand
let gameState = {
    currentLevel: null,
    // 'timed' (Zeitrennen, bisheriges Verhalten), 'practice' (Üben ohne Timer,
    // feste Aufgabenzahl) oder 'mistakes' (Fehler üben, siehe Issue #47)
    mode: 'timed',
    timeLeft: 60,
    timerEndAt: null,
    score: 0,
    totalProblems: 0,
    highscore: 0,
    timer: null,
    currentProblem: null,
    // Fehler-Modus: Anzahl richtiger Antworten in Folge je Aufgabe (Schlüssel
    // via GameLogic.mistakeKey), um zu erkennen, wann eine Aufgabe geschafft ist
    mistakeStreaks: {},
    // Fehler-Modus: Anzahl Fehler zu Rundenbeginn, für die Fortschrittsanzeige
    mistakesInitialCount: 0
};

// Auf dem Start-Bildschirm gewählter Modus (Zeitrennen/Üben-Umschalter).
// Bleibt über Runden hinweg bestehen, bis die Nutzerin/der Nutzer ihn ändert.
let selectedMode = 'timed';

// Zuletzt auf der Statistik-Seite angezeigtes Level, damit der "Fehler üben"-
// Button dort weiß, für welches Level er die Fehlerrunde starten soll.
let currentStatsLevel = 1;

// DOM elements are initialized via createElements() at the top of the file

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadHighscores();

    // Initialen History-Eintrag explizit setzen (statt ihn implizit leer zu
    // lassen), damit der erste Druck auf Browser-Zurück ein wohldefiniertes
    // Ziel hat und nicht mit dem Fix in showScreen() kollidiert.
    window.history.replaceState({ screen: 'start' }, '', '?screen=start');
    currentScreenName = 'start';
});

// Ereignis-Listener initialisieren
function initEventListeners() {
    // Timer-Anzeige beim Zurückkehren aus einem Hintergrund-Tab sofort auffrischen,
    // statt auf das nächste (gedrosselte) Interval-Tick zu warten
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && gameState.timer) {
            if (updateTimerDisplay() <= 0) {
                endGame();
            }
        }
    });

    // Modus-Umschalter (⏱️ Zeitrennen / 🧘 Üben)
    elements.modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            setSelectedMode(button.dataset.mode);
        });
    });

    // Level-Auswahl
    elements.levelButtons.forEach(button => {
        button.addEventListener('click', () => {
            markActiveLevelButton(parseInt(button.dataset.level));
            startGame(parseInt(button.dataset.level), selectedMode);
        });
    });

    // Dial-Pad-Buttons
    elements.dialButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleDialPadClick(button.dataset.value);
        });
    });

    // Backspace-Button
    elements.backspaceButton.addEventListener('click', backspaceInput);

    // Submit-Button (dial pad)
    if (elements.submitButton) {
        elements.submitButton.addEventListener('click', () => {
            checkAnswer();
        });
    }

    // Neues Spiel-Button
    elements.restartButton.addEventListener('click', () => {
        resetGame();
        markActiveLevelButton(null);
        showScreen('start');
    });

    // Stats-Button
    if (elements.statsButton) {
        elements.statsButton.addEventListener('click', () => {
            showStatsScreen(1); // Default: Level 1
        });
    }

    // Stats Back-Button
    if (elements.statsBackButton) {
        elements.statsBackButton.addEventListener('click', () => {
            showScreen('start');
        });
    }

    // Stats Reset-Button
    if (elements.statsResetButton) {
        elements.statsResetButton.addEventListener('click', () => {
            resetAllStatistics();
        });
    }

    // Stats Level-Buttons
    if (elements.statsLevelButtons) {
        elements.statsLevelButtons.forEach(button => {
            button.addEventListener('click', () => {
                const level = parseInt(button.dataset.level);
                updateStatsForLevel(level);

                // Update active state
                elements.statsLevelButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
            });
        });
    }

    // Restart current level button
    // (restart-level button removed; use Zurück to leave and re-enter a level)

    // "Fehler üben"-Button auf dem Ergebnisbildschirm: startet den Fehler-Modus
    // für das zuletzt gespielte Level
    if (elements.practiceMistakesButton) {
        elements.practiceMistakesButton.addEventListener('click', () => {
            if (elements.practiceMistakesButton.disabled) return;
            startGame(gameState.currentLevel, 'mistakes');
        });
    }

    // "Fehler üben"-Button auf der Statistik-Seite: startet den Fehler-Modus
    // für das dort gerade ausgewählte Level
    if (elements.statsPracticeMistakesButton) {
        elements.statsPracticeMistakesButton.addEventListener('click', () => {
            if (elements.statsPracticeMistakesButton.disabled) return;
            markActiveLevelButton(null);
            startGame(currentStatsLevel, 'mistakes');
        });
    }

    // Back button: leave current level and go back to level selection
    if (elements.backButton) {
        elements.backButton.addEventListener('click', () => {
            leaveGame();
            markActiveLevelButton(null);
            showScreen('start');
        });
    }
    
    // Leaderboard-Button (ausgeblendet, wenn window.LEADERBOARD_ENABLED === false, z.B. auf GitHub Pages)
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        if (window.LEADERBOARD_ENABLED === false) {
            leaderboardBtn.style.display = 'none';
        } else {
            leaderboardBtn.addEventListener('click', () => {
                if (typeof LeaderboardScreen !== 'undefined' && LeaderboardScreen.show) {
                    LeaderboardScreen.show();
                }
            });
        }
    }
}

// Gewählten Modus (Zeitrennen/Üben) merken und Umschalter-Buttons aktualisieren
function setSelectedMode(mode) {
    selectedMode = mode;
    elements.modeButtons.forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });
}

// aria-pressed der Level-Buttons auf den gewählten Level setzen (oder alle
// zurücksetzen, wenn level null ist)
function markActiveLevelButton(level) {
    elements.levelButtons.forEach(btn => {
        btn.setAttribute('aria-pressed', String(parseInt(btn.dataset.level) === level));
    });
}

// Spiel starten
// mode: 'timed' (Standard, bisheriges Verhalten), 'practice' (Üben ohne
// Timer) oder 'mistakes' (nur Aufgaben aus der Fehlerliste, siehe Issue #47)
function startGame(level, mode = 'timed') {
    if (!GameLogic.CONFIG.levels[level]) {
        console.error('Ungültiges Level:', level);
        return;
    }

    // Fehler-Modus ohne Fehler zum Üben: Button ist eigentlich deaktiviert,
    // dies ist nur ein Sicherheitsnetz für programmatische Aufrufe (Tests).
    if (mode === 'mistakes' && (!window.Weighting || window.Weighting.getMistakes(level).length === 0)) {
        console.warn('Keine Fehler zum Üben für Level', level);
        return;
    }

    gameState.currentLevel = level;
    gameState.mode = mode;
    gameState.mistakeStreaks = {};
    gameState.mistakesInitialCount = mode === 'mistakes' ? window.Weighting.getMistakes(level).length : 0;
    // Initialize highscore for this level from saved highscores map (if available)
    if (window.__SCHNECHNEN_HIGHSCORES && window.__SCHNECHNEN_HIGHSCORES[level] !== undefined) {
        gameState.highscore = window.__SCHNECHNEN_HIGHSCORES[level];
    } else {
        gameState.highscore = 0;
    }
    gameState.timeLeft = 60;
    gameState.score = 0;
    gameState.totalProblems = 0;

    // Spielbildschirm anzeigen
    showScreen('game');
    updateGameHeaderForMode();

    // Timer nur im Zeitrennen-Modus starten
    if (mode === 'timed') {
        startTimer();
    } else if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }

    // Erste Aufgabe generieren
    generateProblem();

    // Ensure dial-pad is visible when a game starts
    try { const dp = document.getElementById('dial-pad'); if (dp) dp.classList.remove('hidden'); } catch (_e) { /* ignore, dial-pad is optional in some test DOMs */ }

    // Do not focus the input by default to avoid opening the mobile keyboard; keep it readonly by default
    // elements.answerInput.focus();
}

// Blendet je nach Modus die Timer-Anzeige oder die Fortschrittsanzeige
// ("Aufgabe X / Y" bzw. "Noch N Fehler") im Spiel-Header ein.
function updateGameHeaderForMode() {
    const isTimed = gameState.mode === 'timed';
    if (elements.timerDisplay && elements.timerDisplay.classList) {
        elements.timerDisplay.classList.toggle('hidden', !isTimed);
    }
    if (elements.progressDisplay && elements.progressDisplay.classList) {
        elements.progressDisplay.classList.toggle('hidden', isTimed);
    }
    if (!isTimed) {
        updateProgressDisplay();
    }
}

// Aktualisiert Fortschrittstext und -balken für Übungs- und Fehler-Modus
function updateProgressDisplay() {
    if (gameState.mode === 'timed' || !elements.progressText) return;

    if (gameState.mode === 'practice') {
        const total = GameLogic.CONFIG.practiceProblemCount;
        const current = Math.min(gameState.totalProblems + 1, total);
        elements.progressText.textContent = `Aufgabe ${current} / ${total}`;
        if (elements.progressBarFill && elements.progressBarFill.style) {
            elements.progressBarFill.style.width = `${Math.min(100, (gameState.totalProblems / total) * 100)}%`;
        }
    } else if (gameState.mode === 'mistakes') {
        const remaining = window.Weighting ? window.Weighting.getMistakes(gameState.currentLevel).length : 0;
        elements.progressText.textContent = remaining === 1 ? 'Noch 1 Fehler' : `Noch ${remaining} Fehler`;
        if (elements.progressBarFill && elements.progressBarFill.style && gameState.mistakesInitialCount > 0) {
            const solved = gameState.mistakesInitialCount - remaining;
            elements.progressBarFill.style.width = `${Math.min(100, (solved / gameState.mistakesInitialCount) * 100)}%`;
        }
    }
}

// Aktiviert/deaktiviert einen "Fehler üben"-Button je nachdem, ob für das
// angegebene Level Fehler in der Fehlerliste stehen (siehe Issue #47)
function updatePracticeMistakesButton(buttonEl, level) {
    if (!buttonEl) return;
    const count = window.Weighting ? window.Weighting.getMistakes(level).length : 0;
    buttonEl.disabled = count === 0;
    if (count === 0) {
        buttonEl.textContent = 'Keine Fehler zum Üben 🎉';
        buttonEl.title = 'Keine Fehler zum Üben 🎉';
    } else {
        buttonEl.textContent = '❌ Fehler üben';
        buttonEl.title = '';
    }
}

// Timer-Anzeige aus dem Zielzeitpunkt neu berechnen (statt herunterzuzählen),
// damit gedrosselte Hintergrund-Tabs nicht zu einer zu langen Spielzeit führen
function updateTimerDisplay() {
    const left = Math.max(0, Math.ceil((gameState.timerEndAt - Date.now()) / 1000));
    gameState.timeLeft = left;
    elements.timeElement.textContent = left;
    return left;
}

// Timer starten
function startTimer() {
    // Timer stoppen, falls bereits aktiv
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timerEndAt = Date.now() + 60000;
    updateTimerDisplay();

    // Timer starten
    gameState.timer = setInterval(() => {
        if (updateTimerDisplay() <= 0) {
            endGame();
        }
    }, 250);
}

// Neue Aufgabe generieren
function generateProblem() {
    if (gameState.currentLevel === null || gameState.currentLevel === undefined) return;
    
    const levelConfig = GameLogic.CONFIG.levels[gameState.currentLevel];

    let num1, num2, operation, result;

    if (gameState.mode === 'mistakes') {
        // Fehler-Modus: ausschließlich aus der Fehlerliste ziehen (höchster
        // wrongCount zuerst), nie eine neue zufällige Aufgabe generieren
        const mistakeProblem = window.Weighting ? window.Weighting.peekMistake(gameState.currentLevel) : null;
        if (!mistakeProblem) {
            // Liste wurde gerade leer (letzte Aufgabe wurde geschafft) -> Runde beenden
            endGame();
            return;
        }
        num1 = mistakeProblem.num1;
        num2 = mistakeProblem.num2;
        operation = mistakeProblem.operation;
        result = mistakeProblem.result;
    } else {
        // Adaptive Problemgenerierung: 30% Chance, ein häufiges Fehlerproblem zu wiederholen
        const MISTAKE_REPEAT_CHANCE = 0.3;
        const shouldRepeatMistake = Math.random() < MISTAKE_REPEAT_CHANCE;
        const mistakeProblem = window.Weighting ? window.Weighting.peekMistake(gameState.currentLevel) : null;

        if (shouldRepeatMistake && mistakeProblem) {
            // Wiederverwende ein Problem aus der Fehlerliste
            num1 = mistakeProblem.num1;
            num2 = mistakeProblem.num2;
            operation = mistakeProblem.operation;
            result = mistakeProblem.result;
        } else {
            // Generiere ein neues zufälliges Problem über die geteilte Spiellogik
            ({ num1, num2, operation, result } = GameLogic.generateProblemFor(levelConfig));
        }
    }

    // Aufgabe speichern
    gameState.currentProblem = {
        num1: num1,
        num2: num2,
        operation: operation,
        result: result,
        answered: false,
        wrongCount: 0
    };
    
    // Aufgabe anzeigen (use printable operator symbols). Die Operanden werden in
    // eigene Spans geschrieben statt das komplette problemElement.innerHTML neu
    // zu setzen, damit der Antwort-Span (userAnswerElement) stabil bleibt und
    // nicht bei jeder Aufgabe neu aus dem DOM geholt werden muss.
    elements.problemNum1Element.textContent = num1;
    elements.problemOperatorElement.textContent = GameLogic.displayOperator(operation);
    elements.problemNum2Element.textContent = num2;

    // Eingabe zurücksetzen
    elements.userAnswerElement.textContent = '?';

    // Dial-Pad anzeigen
    elements.dialPad.classList.remove('hidden');

    // Fortschrittsanzeige (Übungs-/Fehler-Modus) aktualisieren
    updateProgressDisplay();
}

// Eingabefeld verarbeiten
function handleDialPadClick(value) {
    if (value === 'clear') {
        clearInput();
    } else if (value === 'backspace') {
        backspaceInput();
    } else {
        const currentText = elements.userAnswerElement.textContent;
        if (currentText === '?') {
            elements.userAnswerElement.textContent = value;
        } else {
            elements.userAnswerElement.textContent += value;
        }
    }
}

// Eingabefeld leeren
function clearInput() {
    elements.userAnswerElement.textContent = '?';
}

// Letztes Zeichen löschen
function backspaceInput() {
    const currentText = elements.userAnswerElement.textContent;
    if (currentText.length > 0 && currentText !== '?') {
        const newText = currentText.slice(0, -1);
        elements.userAnswerElement.textContent = newText.length === 0 ? '?' : newText;
    }
}

/**
 * Submit score to leaderboard (skipped during tests)
 * @param {number} level - The level number
 * @param {number} score - The player's score
 */
async function submitScoreToLeaderboard(level, score) {
    // Skip submission during tests
    if (window.__TEST_MODE__) {
        console.log('[Leaderboard] Skipping score submission during test mode');
        return;
    }

    // Skip submission when the leaderboard is disabled (e.g. GitHub Pages, no backend)
    if (window.LEADERBOARD_ENABLED === false) {
        return;
    }

    try {
        const apiBase = window.API_BASE || '/api';
        const response = await fetch(`${apiBase}/leaderboard/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: window.Leaderboard?.getUsername() || 'Anonymous',
                level,
                score
            })
        });

        if (response.ok) {
            console.log('[Leaderboard] Score submitted');
        } else {
            console.warn('[Leaderboard] Score submission rejected:', response.status);
        }
    } catch (e) {
        console.warn('[Leaderboard] Could not submit score - server not reachable:', e.message);
    }
}

// Antwort prüfen
function checkAnswer() {
    if (!gameState.currentProblem || gameState.currentProblem.answered) return;
    
    const userAnswerText = elements.userAnswerElement.textContent;
    const userAnswer = parseInt(userAnswerText);
    // If the input is empty or not a number, ignore the submit
    if (Number.isNaN(userAnswer) || userAnswerText === '?') return;
    const correctAnswer = gameState.currentProblem.result;
    const key = GameLogic.mistakeKey(gameState.currentProblem);

    // Antwort prüfen
    if (userAnswer === correctAnswer) {
    // correct answer detected
        // Richtige Antwort
        gameState.score++;
        gameState.currentProblem.answered = true;
        gameState.currentProblem.wrongCount = 0; // Reset wrong count on correct answer

        if (gameState.mode === 'mistakes') {
            // Fehler-Modus: eine Aufgabe gilt erst als geschafft, wenn sie
            // zweimal in Folge richtig beantwortet wurde
            gameState.mistakeStreaks[key] = (gameState.mistakeStreaks[key] || 0) + 1;
            if (GameLogic.isMistakeMastered(gameState.mistakeStreaks[key])) {
                if (window.Weighting) {
                    window.Weighting.removeMistake(gameState.currentLevel, gameState.currentProblem);
                }
                delete gameState.mistakeStreaks[key];
            }
        } else if (window.Weighting) {
            // Wenn das Problem aus der Fehlerliste war, entferne es
            window.Weighting.removeMistake(gameState.currentLevel, gameState.currentProblem);
        }

        // Treffer für die Einmaleins-Heatmap aufzeichnen (Issue #49)
        if (window.Weighting) {
            window.Weighting.recordAttempt(gameState.currentLevel, gameState.currentProblem, true);
        }

        // Feedback-Animation für richtige Antwort
        showFeedback(true);
    } else {
    // wrong answer detected
        // Falsche Antwort
        gameState.currentProblem.answered = true;
        // WICHTIG: wrongCount wird NICHT hier inkrementiert!
        // Es wird durch addMistake() in weighting.js verwaltet

        if (gameState.mode === 'mistakes') {
            // Falsche Antwort unterbricht die Richtig-in-Folge-Serie
            gameState.mistakeStreaks[key] = 0;
        }

        // Füge Problem zur Weighting-Liste hinzu für adaptives Lernen
        if (window.Weighting) {
            window.Weighting.addMistake(gameState.currentLevel, gameState.currentProblem);
        }

        // Treffer für die Einmaleins-Heatmap aufzeichnen (Issue #49)
        if (window.Weighting) {
            window.Weighting.recordAttempt(gameState.currentLevel, gameState.currentProblem, false);
        }

        // Feedback-Animation für falsche Antwort
        showFeedback(false);
    }

    gameState.totalProblems++;

    // Rundenende prüfen: Übungsmodus nach fester Aufgabenzahl, Fehler-Modus
    // wenn die Fehlerliste leer geworden ist (siehe Issue #47)
    if (gameState.mode === 'practice' && GameLogic.isPracticeRoundComplete(gameState.totalProblems, GameLogic.CONFIG.practiceProblemCount)) {
        setTimeout(() => {
            endGame();
        }, 600);
        return;
    }
    if (gameState.mode === 'mistakes') {
        const remaining = window.Weighting ? window.Weighting.getMistakes(gameState.currentLevel).length : 0;
        if (remaining === 0) {
            setTimeout(() => {
                endGame();
            }, 600);
            return;
        }
    }

    // Nächste Aufgabe generieren
    setTimeout(() => {
        generateProblem();
    }, 600);
}

// Feedback-Animation anzeigen
function showFeedback(isCorrect) {
    const problemElement = elements.problemElement;
    
    // Entferne alte Klassen
    problemElement.classList.remove('correct', 'wrong');
    
    // Füge neue Klasse hinzu
    if (isCorrect) {
        problemElement.classList.add('correct');
    } else {
        problemElement.classList.add('wrong');
    }
    
    // Entferne Klasse nach Animation
    setTimeout(() => {
        problemElement.classList.remove('correct', 'wrong');
    }, 500);
}

// Spiel beenden
function endGame() {
    // Timer stoppen
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    // Ergebnisse anzeigen
    showScreen('result');
    
    // Ergebnisdaten aktualisieren
    elements.resultLevel.textContent = gameState.currentLevel;
    elements.resultScore.textContent = gameState.score;
    elements.totalProblemsElement.textContent = gameState.totalProblems;
    
    // Alten Highscore speichern (für Animation)
    const oldHighscore = gameState.highscore;

    // Highscore, Leaderboard-Übermittlung und Highscore-Animation gelten nur
    // im Zeitrennen-Modus: Übungs- und Fehler-Runden haben eine andere
    // Aufgabenzahl/-dauer und sind daher nicht vergleichbar (siehe Issue #47)
    const countsTowardHighscore = gameState.mode === 'timed';

    if (countsTowardHighscore) {
        // Highscore aktualisieren (Anzahl richtiger Antworten)
        updateHighscore(gameState.score);
    }

    // Spiel-History speichern (inkl. Modus, für die Statistik-Filterung)
    saveGameHistory(gameState.currentLevel, gameState.score, gameState.totalProblems, gameState.mode);

    // Score zu Leaderboard übermitteln (nur wenn nicht im Test-Modus)
    if (countsTowardHighscore && !window.__TEST_MODE__ && window.Leaderboard && gameState.score > 0) {
        submitScoreToLeaderboard(gameState.currentLevel, gameState.score);
    }

    // Aktuelles Ergebnis (Anzahl richtiger Antworten) anzeigen
    elements.highscoreElement.textContent = gameState.score;

    // Highscore-Animation anzeigen, wenn neuer Highscore erreicht
    if (countsTowardHighscore && gameState.score > oldHighscore) {
        // Animationen mit kleiner Verzögerung für bessere UX
        setTimeout(() => {
            showHighscoreAnimation();
        }, 500);
    }

    // Häufig falsch gelöste Aufgaben aus weighting.js anzeigen
    displayMistakes();

    // "Fehler üben"-Button je nach verbleibenden Fehlern für dieses Level (de)aktivieren
    updatePracticeMistakesButton(elements.practiceMistakesButton, gameState.currentLevel);
}

// Zeigt die Highscore-Animation am Ende des Spiels an
function showHighscoreAnimation() {
    if (!elements.highscoreAnimation) return;
    
    // Animationstext setzen
    elements.highscoreAnimation.innerHTML = '🎉 Neuer Highscore! 🎉';
    elements.highscoreAnimation.classList.remove('hidden');
    
    // Konfetti erzeugen
    createConfetti();
    
    // Nach 5s wieder ausblenden
    setTimeout(() => {
        elements.highscoreAnimation.classList.add('hidden');
    }, 5000);
}

// Erzeugt fallende Konfetti-Partikel
function createConfetti() {
    const colors = ['#FF6B35', '#00B4D8', '#9D4EDD', '#FF006E', '#06A77D'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Zufällige horizontale Verschiebung
        const tx = (Math.random() - 0.5) * 300;
        confetti.style.setProperty('--tx', tx + 'px');
        
        // Zufällige Animation-Dauer
        const duration = 3 + Math.random() * 2;
        confetti.style.animation = `confetti-fall ${duration}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        // Entferne Konfetti nach Animation
        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);
    }
}

// Highscore aktualisieren
function updateHighscore(score) {
    if (score > gameState.highscore) {
        gameState.highscore = score;
        saveHighscore();
    }
}

// Highscore speichern
function saveHighscore() {
    try {
        const highscores = JSON.parse(localStorage.getItem('schnechnen-highscores')) || {};
        highscores[gameState.currentLevel] = gameState.highscore;
        localStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));
        
        // Aktualisiere auch das globale Highscore-Objekt
        if (!window.__SCHNECHNEN_HIGHSCORES) {
            window.__SCHNECHNEN_HIGHSCORES = {};
        }
        window.__SCHNECHNEN_HIGHSCORES[gameState.currentLevel] = gameState.highscore;
    } catch (e) {
        console.error('Fehler beim Speichern des Highscores:', e);
    }
}

// Highscore laden
function loadHighscores() {
    try {
        // Load the highscores map for later use. We'll set per-level highscore when a level starts.
        window.__SCHNECHNEN_HIGHSCORES = JSON.parse(localStorage.getItem('schnechnen-highscores')) || {};
    } catch (e) {
        console.error('Fehler beim Laden des Highscores:', e);
        gameState.highscore = 0;
    }
}

// Alle Statistiken löschen
function resetAllStatistics() {
    // Bestätigung vom Spieler erfragen
    if (!confirm('🗑️ Wirklich ALLE Statistiken, Highscores und Fehlerprotokoll löschen? Dies kann nicht rückgängig gemacht werden!')) {
        return;
    }

    try {
        // Lösche localStorage-Einträge
        localStorage.removeItem('schnechnen-highscores');
        localStorage.removeItem('schnechnen-history');
        localStorage.removeItem('schnechnen-mistakes');
        localStorage.removeItem('schnechnen-facts');
        
        // Lösche globale Objekte
        window.__SCHNECHNEN_HIGHSCORES = {};
        
        // Lösche Weighting-Daten
        if (window.Weighting) {
            window.Weighting.clear();
        }
        
        // Aktualisiere Stats-Anzeige
        showStatsScreen(1);
        
        console.log('✅ Alle Statistiken wurden gelöscht');
    } catch (e) {
        console.error('Fehler beim Löschen der Statistiken:', e);
        alert('❌ Fehler beim Löschen der Statistiken');
    }
}

// Häufig falsch gelöste Aufgaben anzeigen
function displayMistakes() {
    // Hole alle Fehler für das aktuelle Level aus weighting.js (alle Sessions)
    const mistakes = window.Weighting ? window.Weighting.getMistakes(gameState.currentLevel) : [];
    
    // Sortiere nach wrongCount (absteigend) und nimm die Top 5
    const sortedMistakes = mistakes
        .slice()
        .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
        .slice(0, 5);
    
    // Liste leeren
    elements.mistakeList.innerHTML = '';
    
    // Aufgaben anzeigen
    if (sortedMistakes.length === 0) {
        elements.mistakeList.innerHTML = '<li>Keine falsch gelösten Aufgaben bisher! 🎉</li>';
        return;
    }
    
    sortedMistakes.forEach(problem => {
        const li = document.createElement('li');
        li.textContent = `${problem.num1} ${GameLogic.displayOperator(problem.operation)} ${problem.num2} = ${problem.result} (${problem.wrongCount}× falsch)`;
        elements.mistakeList.appendChild(li);
    });
}

// Zeige Top 5 Fehler für Statistik-Seite
function displayStatsMistakes(level) {
    // Hole alle Fehler für das Level aus weighting.js
    const mistakes = window.Weighting ? window.Weighting.getMistakes(level) : [];
    
    // Sortiere nach wrongCount (absteigend) und nimm die Top 5
    const sortedMistakes = mistakes
        .slice()
        .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
        .slice(0, 5);
    
    // Liste leeren
    elements.statsMistakeList.innerHTML = '';
    
    // Aufgaben anzeigen
    if (sortedMistakes.length === 0) {
        elements.statsMistakeList.innerHTML = '<li class="no-mistakes">Keine Fehler bisher – perfekt! 🎉</li>';
        return;
    }
    
    sortedMistakes.forEach(problem => {
        const li = document.createElement('li');
        const problemText = `${problem.num1} ${GameLogic.displayOperator(problem.operation)} ${problem.num2} = ${problem.result}`;
        const countBadge = `<span class="mistake-count">${problem.wrongCount}× falsch</span>`;
        li.innerHTML = `${problemText} ${countBadge}`;
        elements.statsMistakeList.appendChild(li);
    });
}

// Spiel zurücksetzen
function resetGame() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    gameState = {
        currentLevel: null,
        mode: 'timed',
        timeLeft: 60,
        timerEndAt: null,
        score: 0,
        totalProblems: 0,
        highscore: 0,
        timer: null,
        currentProblem: null,
        mistakeStreaks: {},
        mistakesInitialCount: 0
    };

    // Anzeige zurücksetzen
    if (elements.userAnswerElement) {
        elements.userAnswerElement.textContent = '?';
    }
}

// Merkt sich den aktuell angezeigten Screen, damit popstate/Zurück-Button
// erkennen können, ob gerade der Game-Screen verlassen wird (siehe leaveGame()).
let currentScreenName = null;

// Bildschirm anzeigen
// pushHistory: false wird vom popstate-Handler übergeben, damit das
// Nachvollziehen einer Browser-Navigation nicht selbst wieder einen neuen
// History-Eintrag erzeugt (sonst History-Endlosschleife, siehe Issue #33).
function showScreen(screenName, { pushHistory = true } = {}) {
    // Alle Screens ausblenden
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.resultScreen.classList.add('hidden');
    if (elements.statsScreen) {
        elements.statsScreen.classList.add('hidden');
    }
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (leaderboardScreen) {
        leaderboardScreen.classList.add('hidden');
    }

    // Angegebenen Screen anzeigen
    if (screenName === 'start') {
        elements.startScreen.classList.remove('hidden');
    } else if (screenName === 'game') {
        elements.gameScreen.classList.remove('hidden');
    } else if (screenName === 'result') {
        elements.resultScreen.classList.remove('hidden');
    } else if (screenName === 'stats') {
        if (elements.statsScreen) {
            elements.statsScreen.classList.remove('hidden');
        }
    } else if (screenName === 'leaderboard') {
        if (leaderboardScreen) {
            leaderboardScreen.classList.remove('hidden');
        }
    }

    currentScreenName = screenName;

    // Update browser history
    if (pushHistory) {
        window.history.pushState({ screen: screenName }, '', `?screen=${screenName}`);
    }
}

// Laufendes Spiel verlassen: Timer stoppen und Spielzustand zurücksetzen.
// Wird sowohl vom Zurück-Button als auch vom popstate-Handler (Browser-Zurück)
// aufgerufen, damit der Timer nicht im Hintergrund weiterläuft, wenn der
// Game-Screen verlassen wird (siehe Issue #33).
function leaveGame() {
    resetGame();
}

// Handle browser back button
window.addEventListener('popstate', (event) => {
    const targetScreen = (event.state && event.state.screen) ? event.state.screen : 'start';

    // Wird der Game-Screen per Browser-Zurück verlassen, muss dieselbe
    // Aufräumlogik laufen wie beim Zurück-Button, sonst tickt der Timer im
    // Hintergrund weiter und wertet das Spiel später unerwartet.
    if (currentScreenName === 'game' && targetScreen !== 'game') {
        leaveGame();
        markActiveLevelButton(null);
    }

    showScreen(targetScreen, { pushHistory: false });
});

// ==================== Statistik-Funktionen ====================

// Spiel-History speichern
function saveGameHistory(level, score, totalProblems, mode = 'timed') {
    try {
        const history = JSON.parse(localStorage.getItem('schnechnen-history')) || {};
        history[level] = history[level] || [];

        const percentage = totalProblems > 0 ? Math.round((score / totalProblems) * 100) : 0;

        history[level].push({
            timestamp: Date.now(),
            score: score,
            totalProblems: totalProblems,
            percentage: percentage,
            mode: mode
        });
        
        // Behalte nur die letzten 50 Spiele pro Level
        if (history[level].length > 50) {
            history[level] = history[level].slice(-50);
        }
        
        localStorage.setItem('schnechnen-history', JSON.stringify(history));
    } catch (e) {
        console.error('Fehler beim Speichern der History:', e);
    }
}

// Hole Game-History für ein Level
function getGameHistory(level) {
    try {
        const history = JSON.parse(localStorage.getItem('schnechnen-history')) || {};
        return history[level] || [];
    } catch (e) {
        console.error('Fehler beim Laden der History:', e);
        return [];
    }
}

// Zeige Statistik-Screen
let chartInstance = null; // Globale Variable für Chart-Instanz

function showStatsScreen(level) {
    showScreen('stats');
    updateStatsForLevel(level);
    
    // Mark the active level button
    if (elements.statsLevelButtons) {
        elements.statsLevelButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        const activeBtn = Array.from(elements.statsLevelButtons).find(btn => parseInt(btn.dataset.level) === level);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-selected', 'true');
        }
    }
}

// Update Statistiken für ein Level
function updateStatsForLevel(level) {
    // Merken, für welches Level der "Fehler üben"-Button auf dieser Seite gilt
    currentStatsLevel = level;

    const history = getGameHistory(level);
    const highscore = window.__SCHNECHNEN_HIGHSCORES[level] || 0;

    // Statistik-Karten aktualisieren (Gespielte Runden zählt alle Modi mit,
    // siehe Issue #47: Übungsrunden zählen in die Spiel-History)
    elements.statHighscore.textContent = highscore;
    elements.statTotalGames.textContent = history.length;

    // Fehler anzeigen
    displayStatsMistakes(level);

    // "Fehler üben"-Button für dieses Level (de)aktivieren
    updatePracticeMistakesButton(elements.statsPracticeMistakesButton, level);

    // Einmaleins-Heatmap: nur für die Level mit Multiplikation/Division
    // relevant (Issue #49). Bewusst vor renderChart(): die Heatmap braucht
    // kein Chart.js und soll auch dann erscheinen, wenn das CDN-Skript nicht
    // geladen werden konnte.
    renderTimesTable(level);

    // Chart rendern: nur Zeitrennen-Runden, da Score/Prozentsätze aus Übungs-
    // und Fehler-Runden (andere Aufgabenzahl, kein Timer) nicht vergleichbar
    // mit den 60-Sekunden-Runden sind. Einträge ohne mode-Feld (vor Issue #47
    // gespeichert) gelten als 'timed'.
    const timedHistory = history.filter(entry => (entry.mode || 'timed') === 'timed');
    renderChart(level, timedHistory);
}

// Level, für die die Einmaleins-Tafel angezeigt wird (Multiplikation kommt
// dort vor: Level 3 Multiplikation, Level 4 Multiplikation & Division,
// Level 5 Chaos-Modus).
const TIMES_TABLE_LEVELS = [3, 4, 5];

// Übersetzt einen Zeitstempel in eine kurze relative Zeitangabe ("vor 3 Tagen").
function formatRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'gerade eben';
    if (diffMinutes < 60) return `vor ${diffMinutes} Minute${diffMinutes === 1 ? '' : 'n'}`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours === 1 ? '' : 'n'}`;
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`;
}

// Kleines, nicht nur farbliches Symbol je Status (Barrierefreiheit: Farbe
// allein ist keine ausreichende Information).
const TIMES_TABLE_STATUS_ICON = {
    gray: '·',
    red: '!',
    yellow: '~',
    green: '✓'
};

const TIMES_TABLE_STATUS_TEXT = {
    gray: 'noch nie abgefragt',
    red: 'übungsbedürftig',
    yellow: 'gemischt',
    green: 'sicher'
};

// Baut den aria-label/Detail-Text für eine Zelle der Einmaleins-Tafel.
function buildTimesTableLabel(row, col, result, fact, status) {
    const statusText = TIMES_TABLE_STATUS_TEXT[status];
    if (!fact) {
        return `${row} × ${col} = ${result}, ${statusText}`;
    }
    const lastSeenText = fact.lastSeen ? `, zuletzt ${formatRelativeTime(fact.lastSeen)}` : '';
    const lastResultText = fact.lastResult ? 'richtig' : 'falsch';
    return `${row} × ${col} = ${result}, ${fact.correct}× richtig, ${fact.wrong}× falsch, zuletzt ${lastResultText}${lastSeenText}`;
}

// Zeigt den Detailtext einer angetippten Zelle unterhalb der Tafel an.
function showTimesTableDetail(text) {
    if (!elements.timesTableDetail) return;
    elements.timesTableDetail.textContent = text;
    elements.timesTableDetail.classList.remove('hidden');
}

// Rendert die 10×10 Einmaleins-Tafel für ein Level. Reines HTML/CSS-Grid
// (kein Chart.js), Zellen als <button> für Tastatur-/Screenreader-Zugriff.
function renderTimesTable(level) {
    if (!elements.timesTableSection || !elements.timesTableGrid) return;

    if (!TIMES_TABLE_LEVELS.includes(level)) {
        elements.timesTableSection.classList.add('hidden');
        return;
    }
    elements.timesTableSection.classList.remove('hidden');

    const grid = elements.timesTableGrid;
    grid.innerHTML = '';

    // Ecke oben links (leer, dekorativ)
    const corner = document.createElement('div');
    corner.className = 'times-table-cell times-table-corner';
    corner.setAttribute('aria-hidden', 'true');
    grid.appendChild(corner);

    // Spaltenköpfe
    for (let col = 1; col <= 10; col++) {
        const colHeader = document.createElement('div');
        colHeader.className = 'times-table-cell times-table-header';
        colHeader.textContent = String(col);
        colHeader.setAttribute('role', 'columnheader');
        grid.appendChild(colHeader);
    }

    for (let row = 1; row <= 10; row++) {
        const rowHeader = document.createElement('div');
        rowHeader.className = 'times-table-cell times-table-header';
        rowHeader.textContent = String(row);
        rowHeader.setAttribute('role', 'rowheader');
        grid.appendChild(rowHeader);

        for (let col = 1; col <= 10; col++) {
            const result = row * col;
            const fact = window.Weighting ? window.Weighting.getMultiplicationFact(level, row, col) : null;
            const status = window.Weighting ? window.Weighting.classifyFact(fact) : 'gray';
            const label = buildTimesTableLabel(row, col, result, fact, status);

            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = `times-table-cell times-table-fact status-${status}`;
            cell.dataset.row = String(row);
            cell.dataset.col = String(col);
            cell.dataset.status = status;
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', label);
            cell.innerHTML = `<span class="times-table-value">${result}</span><span class="times-table-icon" aria-hidden="true">${TIMES_TABLE_STATUS_ICON[status]}</span>`;
            cell.addEventListener('click', () => showTimesTableDetail(label));
            grid.appendChild(cell);
        }
    }
}

// Rendere Chart mit Chart.js
function renderChart(level, history) {
    const ctx = elements.chartCanvas;
    if (!ctx) return;
    
    // Zerstöre vorherige Chart-Instanz
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Wenn keine History vorhanden, zeige eine Nachricht
    if (history.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        const context = ctx.getContext('2d');
        context.font = '16px "Segoe UI", sans-serif';
        context.fillStyle = '#666';
        context.textAlign = 'center';
        context.fillText('Noch keine Spiele gespielt', ctx.width / 2, ctx.height / 2);
        return;
    }
    
    // Erstelle Labels (letzten 20 Spiele)
    const displayHistory = history.slice(-20);
    const labels = displayHistory.map((_, i) => {
        if (history.length <= 20) {
            return `Spiel ${i + 1}`;
        }
        return `#${history.length - 20 + i + 1}`;
    });
    
    // Erstelle Chart
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Richtige Antworten',
                data: displayHistory.map(h => h.score),
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#FF6B35',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: (context) => {
                            return labels[context[0].dataIndex];
                        },
                        label: (context) => {
                            const item = displayHistory[context.dataIndex];
                            return [
                                `Score: ${item.score}/${item.totalProblems}`,
                                `Prozent: ${item.percentage}%`,
                                `Datum: ${new Date(item.timestamp).toLocaleDateString('de-DE')}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Expose a small test API on the window for Playwright/e2e tests
try {
    if (typeof window !== 'undefined') {
        // Only expose test helpers when running locally or when '?e2e-test' is present in the URL
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const isE2EFlag = location.search && location.search.indexOf('e2e-test') !== -1;
        if (isLocal || isE2EFlag) {
            window.__TEST__ = window.__TEST__ || {};
            window.__TEST__.endGame = endGame;
            window.__TEST__.startGame = startGame;
            window.__TEST__.generateProblem = generateProblem;
            // Expose a read-only snapshot of the runtime state for tests
            window.__TEST__.getState = function() {
                return {
                    currentLevel: gameState.currentLevel,
                    mode: gameState.mode,
                    score: gameState.score,
                    totalProblems: gameState.totalProblems,
                    timeLeft: gameState.timeLeft,
                    currentProblem: gameState.currentProblem
                };
            };
            // Helper to submit an answer programmatically in tests
            window.__TEST__.submitAnswer = function(answer) {
                try {
                    const ua = document.getElementById('user-answer');
                    if (ua) ua.textContent = String(answer);
                    // refresh the cached element reference so checkAnswer reads the current span
                    try { if (typeof elements !== 'undefined') elements.userAnswerElement = document.getElementById('user-answer'); } catch (_e) { /* ignore, element reference refresh is best-effort */ }
                    // call the checkAnswer function to process the answer
                    if (typeof checkAnswer === 'function') checkAnswer();
                } catch (e) {
                    console.error('submitAnswer helper failed', e);
                }
            };
            // Allow tests to mutate the internal gameState reliably
            window.__TEST__.setGameState = function(obj) {
                try {
                    if (typeof obj === 'object' && obj !== null) {
                        Object.assign(gameState, obj);
                    }
                } catch (e) {
                    console.error('setGameState failed', e);
                }
            };
        }
    }
} catch (_e) {
    // ignore in non-browser contexts
}

/**
 * Service Worker registrieren (Offline-Betrieb / PWA).
 * Wird im Test-Modus (Unit- und E2E-Tests) übersprungen, damit Tests nicht
 * durch gecachte Antworten oder einen aktiven Controller beeinflusst werden.
 */
function registerServiceWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (typeof window !== 'undefined' && window.__TEST_MODE__) return;

    navigator.serviceWorker.register('./sw.js').then((registration) => {
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateAvailableNotice(newWorker);
                }
            });
        });
    }).catch((err) => {
        console.warn('Service Worker Registrierung fehlgeschlagen:', err);
    });
}

/** Zeigt einen Hinweis "Neue Version verfügbar, neu laden" an. */
function showUpdateAvailableNotice(waitingWorker) {
    if (typeof document === 'undefined') return;
    if (document.getElementById('sw-update-notice')) return;

    const notice = document.createElement('div');
    notice.id = 'sw-update-notice';
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);'
        + 'background:#9D4EDD;color:#fff;padding:12px 20px;border-radius:12px;'
        + 'box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:9999;display:flex;gap:12px;'
        + 'align-items:center;font-family:inherit;';
    notice.innerHTML = '<span>Neue Version verfügbar</span>';

    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = 'Neu laden';
    reloadBtn.style.cssText = 'background:#fff;color:#9D4EDD;border:none;border-radius:8px;'
        + 'padding:6px 12px;font-weight:bold;cursor:pointer;';
    reloadBtn.addEventListener('click', () => {
        waitingWorker.postMessage('SKIP_WAITING');
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    });

    notice.appendChild(reloadBtn);
    document.body.appendChild(notice);
}

try {
    if (typeof window !== 'undefined') {
        window.addEventListener('load', registerServiceWorker);
    }
} catch (_e) {
    // ignore in non-browser contexts
}

// Export Funktionen für Unit-Tests (Node.js Umgebung)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Core game logic functions
        generateProblem: typeof generateProblem !== 'undefined' ? generateProblem : null,
        checkAnswer: typeof checkAnswer !== 'undefined' ? checkAnswer : null,
        displayOperator: GameLogic.displayOperator,
        startGame: typeof startGame !== 'undefined' ? startGame : null,
        endGame: typeof endGame !== 'undefined' ? endGame : null,
        startTimer: typeof startTimer !== 'undefined' ? startTimer : null,
        handleDialPadClick: typeof handleDialPadClick !== 'undefined' ? handleDialPadClick : null,
        backspaceInput: typeof backspaceInput !== 'undefined' ? backspaceInput : null,
        clearInput: typeof clearInput !== 'undefined' ? clearInput : null,
        
        // Utility functions
        updateHighscore: typeof updateHighscore !== 'undefined' ? updateHighscore : null,
        saveHighscore: typeof saveHighscore !== 'undefined' ? saveHighscore : null,
        loadHighscores: typeof loadHighscores !== 'undefined' ? loadHighscores : null,
        resetAllStatistics: typeof resetAllStatistics !== 'undefined' ? resetAllStatistics : null,
        
        // Animation functions
        showHighscoreAnimation: typeof showHighscoreAnimation !== 'undefined' ? showHighscoreAnimation : null,
        createConfetti: typeof createConfetti !== 'undefined' ? createConfetti : null,
        
        // Display functions
        displayMistakes: typeof displayMistakes !== 'undefined' ? displayMistakes : null,
        displayStatsMistakes: typeof displayStatsMistakes !== 'undefined' ? displayStatsMistakes : null,
        
        // Config and state
        CONFIG: GameLogic.CONFIG,
        getGameState: function() { return typeof gameState !== 'undefined' ? gameState : null; },
        resetGameState: function() { 
            if (typeof gameState === 'undefined') return;
            gameState.currentLevel = null;
            gameState.timeLeft = 60;
            gameState.timerEndAt = null;
            gameState.score = 0;
            gameState.totalProblems = 0;
            gameState.currentProblem = null;
            if (gameState.timer) clearInterval(gameState.timer);
        }
    };
}
