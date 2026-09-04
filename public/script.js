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
            levelButtons: document.querySelectorAll('.level-btn'),
            timeElement: document.getElementById('time'),
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
            restartButton: document.getElementById('restart-btn'),
            backButton: document.getElementById('back-btn'),
            statsButton: document.getElementById('stats-btn'),
            statsBackButton: document.getElementById('stats-back-btn'),
            statsResetButton: document.getElementById('stats-reset-btn'),
            statsLevelButtons: document.querySelectorAll('#stats-screen .stats-level-btn'),
            statHighscore: document.getElementById('stat-highscore'),
            statTotalGames: document.getElementById('stat-total-games'),
            statAvgScore: document.getElementById('stat-avg-score'),
            chartCanvas: document.getElementById('highscore-chart'),
            statsMistakeList: document.getElementById('stats-mistake-list')
        };
    }

    // Node.js placeholders for unit tests (provide minimal API used by functions)
    return {
        startScreen: { classList: { add: () => {}, remove: () => {} } },
        gameScreen: { classList: { add: () => {}, remove: () => {} } },
        resultScreen: { classList: { add: () => {}, remove: () => {} } },
        levelButtons: [],
        timeElement: { textContent: '' },
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
        restartButton: { addEventListener: () => {} },
        backButton: { addEventListener: () => {} },
        statsMistakeList: { innerHTML: '' }
    };
}


const elements = createElements();

// Highscore-Animation-Element referenzieren
elements.highscoreAnimation = document.getElementById('highscore-animation');

// Spielzustand
let gameState = {
    currentLevel: null,
    timeLeft: 60,
    timerEndAt: null,
    score: 0,
    totalProblems: 0,
    highscore: 0,
    timer: null,
    currentProblem: null
};

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

    // Level-Auswahl
    elements.levelButtons.forEach(button => {
        button.addEventListener('click', () => {
            markActiveLevelButton(parseInt(button.dataset.level));
            startGame(parseInt(button.dataset.level));
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

// aria-pressed der Level-Buttons auf den gewählten Level setzen (oder alle
// zurücksetzen, wenn level null ist)
function markActiveLevelButton(level) {
    elements.levelButtons.forEach(btn => {
        btn.setAttribute('aria-pressed', String(parseInt(btn.dataset.level) === level));
    });
}

// Spiel starten
function startGame(level) {
    if (!GameLogic.CONFIG.levels[level]) {
        console.error('Ungültiges Level:', level);
        return;
    }

    gameState.currentLevel = level;
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
    
    // Timer starten
    startTimer();
    
    // Erste Aufgabe generieren
    generateProblem();

    // Ensure dial-pad is visible when a game starts
    try { const dp = document.getElementById('dial-pad'); if (dp) dp.classList.remove('hidden'); } catch (_e) { /* ignore, dial-pad is optional in some test DOMs */ }
    
    // Do not focus the input by default to avoid opening the mobile keyboard; keep it readonly by default
    // elements.answerInput.focus();
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
    
    // Antwort prüfen
    if (userAnswer === correctAnswer) {
    // correct answer detected
        // Richtige Antwort
        gameState.score++;
        gameState.currentProblem.answered = true;
        gameState.currentProblem.wrongCount = 0; // Reset wrong count on correct answer
        
        // Wenn das Problem aus der Fehlerliste war, entferne es
        if (window.Weighting) {
            window.Weighting.removeMistake(gameState.currentLevel, gameState.currentProblem);
        }
        
        // Feedback-Animation für richtige Antwort
        showFeedback(true);
    } else {
    // wrong answer detected
        // Falsche Antwort
        gameState.currentProblem.answered = true;
        // WICHTIG: wrongCount wird NICHT hier inkrementiert!
        // Es wird durch addMistake() in weighting.js verwaltet

        // Füge Problem zur Weighting-Liste hinzu für adaptives Lernen
        if (window.Weighting) {
            window.Weighting.addMistake(gameState.currentLevel, gameState.currentProblem);
        }
        
        // Feedback-Animation für falsche Antwort
        showFeedback(false);
    }
    
    gameState.totalProblems++;
    
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
    
    // Highscore aktualisieren (Anzahl richtiger Antworten)
    updateHighscore(gameState.score);
    
    // Spiel-History speichern
    saveGameHistory(gameState.currentLevel, gameState.score, gameState.totalProblems);
    
    // Score zu Leaderboard übermitteln (nur wenn nicht im Test-Modus)
    if (!window.__TEST_MODE__ && window.Leaderboard && gameState.score > 0) {
        submitScoreToLeaderboard(gameState.currentLevel, gameState.score);
    }
    
    // Aktuelles Ergebnis (Anzahl richtiger Antworten) anzeigen
    elements.highscoreElement.textContent = gameState.score;
    
    // Highscore-Animation anzeigen, wenn neuer Highscore erreicht
    if (gameState.score > oldHighscore) {
        // Animationen mit kleiner Verzögerung für bessere UX
        setTimeout(() => {
            showHighscoreAnimation();
        }, 500);
    }
    
    // Häufig falsch gelöste Aufgaben aus weighting.js anzeigen
    displayMistakes();
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
        timeLeft: 60,
        timerEndAt: null,
        score: 0,
        totalProblems: 0,
        highscore: 0,
        timer: null,
        currentProblem: null
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
function saveGameHistory(level, score, totalProblems) {
    try {
        const history = JSON.parse(localStorage.getItem('schnechnen-history')) || {};
        history[level] = history[level] || [];
        
        const percentage = totalProblems > 0 ? Math.round((score / totalProblems) * 100) : 0;
        
        history[level].push({
            timestamp: Date.now(),
            score: score,
            totalProblems: totalProblems,
            percentage: percentage
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
    const history = getGameHistory(level);
    const highscore = window.__SCHNECHNEN_HIGHSCORES[level] || 0;
    
    // Statistik-Karten aktualisieren
    elements.statHighscore.textContent = highscore;
    elements.statTotalGames.textContent = history.length;
    
    // Fehler anzeigen
    displayStatsMistakes(level);
    
    // Chart rendern
    renderChart(level, history);
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
