// Spielkonfiguration
const CONFIG = {
    levels: {
        1: {
            name: "Addition & Subtraktion bis 10",
            operations: ['+', '-'],
            maxNumber: 10,
            minResult: 0
        },
        2: {
            name: "Addition & Subtraktion bis 100",
            operations: ['+', '-'],
            maxNumber: 100,
            minResult: 0
        },
        3: {
            name: "Multiplikation bis 100",
            operations: ['*'],
            maxNumber: 100,
            minResult: 0
        },
        4: {
            name: "Multiplikation & Division bis 100",
            operations: ['*', '/'],
            maxNumber: 100,
            minResult: 0
        }
    }
};

// Spielzustand
let gameState = {
    currentLevel: null,
    timeLeft: 60,
    score: 0,
    totalProblems: 0,
    problems: [],
    highscore: 0,
    timer: null,
    currentProblem: null
};

// DOM-Elemente
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultScreen: document.getElementById('result-screen'),
    levelButtons: document.querySelectorAll('.level-btn'),
    timeElement: document.getElementById('time'),
    scoreElement: document.getElementById('score'),
    currentLevelElement: document.getElementById('current-level'),
    problemElement: document.getElementById('problem'),
    answerInput: document.getElementById('answer-input'),
    toggleKeyboard: document.getElementById('toggle-keyboard'),
    dialPad: document.getElementById('dial-pad'),
    // Only select numeric dial buttons that provide a data-value attribute
    dialButtons: document.querySelectorAll('.dial-btn[data-value]'),
    backspaceButton: document.getElementById('backspace-btn'),
    submitButton: document.getElementById('submit-btn'),
    resultLevel: document.getElementById('result-level'),
    resultScore: document.getElementById('result-score'),
    totalProblemsElement: document.getElementById('total-problems'),
    resultPercentage: document.getElementById('result-percentage'),
    highscoreElement: document.getElementById('highscore'),
    mistakeList: document.getElementById('mistake-list'),
    restartButton: document.getElementById('restart-btn'),
    backButton: document.getElementById('back-btn')
};

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadHighscores();
});

// Ereignis-Listener initialisieren
function initEventListeners() {
    // Level-Auswahl
    elements.levelButtons.forEach(button => {
        button.addEventListener('click', () => {
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

    // Toggle system keyboard
    if (elements.toggleKeyboard) {
        elements.toggleKeyboard.addEventListener('click', () => {
            const input = elements.answerInput;
            if (input.hasAttribute('readonly')) {
                // enable system keyboard
                input.removeAttribute('readonly');
                input.focus();
                elements.toggleKeyboard.textContent = 'Dial-Pad verwenden';
            } else {
                // disable system keyboard
                input.setAttribute('readonly', '');
                input.blur();
                elements.toggleKeyboard.textContent = 'Tastatur verwenden';
            }
        });
    }

    // Eingabefeld
    elements.answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // Neues Spiel-Button
    elements.restartButton.addEventListener('click', () => {
        resetGame();
        showScreen('start');
    });

    // Restart current level button
    // (restart-level button removed; use Zurück to leave and re-enter a level)

    // Back button: leave current level and go back to level selection
    if (elements.backButton) {
        elements.backButton.addEventListener('click', () => {
            if (gameState.timer) clearInterval(gameState.timer);
            // Reset runtime state but keep highscores
            gameState.currentLevel = null;
            gameState.timeLeft = 60;
            gameState.score = 0;
            gameState.totalProblems = 0;
            gameState.problems = [];
            gameState.currentProblem = null;
            // Show start screen
            resetGame();
            showScreen('start');
        });
    }
}

// Spiel starten
function startGame(level) {
    if (!CONFIG.levels[level]) {
        console.error('Ungültiges Level:', level);
        return;
    }

    gameState.currentLevel = level;
    // Initialize highscore for this level from saved highscores map (if available)
    if (window.__SCHNECHEN_HIGHSCORES && window.__SCHNECHEN_HIGHSCORES[level] !== undefined) {
        gameState.highscore = window.__SCHNECHEN_HIGHSCORES[level];
    } else {
        gameState.highscore = 0;
    }
    gameState.timeLeft = 60;
    gameState.score = 0;
    gameState.totalProblems = 0;
    gameState.problems = [];
    
    // Spielbildschirm anzeigen
    showScreen('game');
    
    // Aktuelles Level anzeigen
    elements.currentLevelElement.textContent = level;
    
    // Timer starten
    startTimer();
    
    // Erste Aufgabe generieren
    generateProblem();
    
    // Do not focus the input by default to avoid opening the mobile keyboard; keep it readonly by default
    // elements.answerInput.focus();
}

// Timer starten
function startTimer() {
    // Timer stoppen, falls bereits aktiv
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    // Timer starten
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        elements.timeElement.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// Neue Aufgabe generieren
function generateProblem() {
    if (!gameState.currentLevel) return;
    
    const levelConfig = CONFIG.levels[gameState.currentLevel];
    
    let num1, num2, operation, result;
    
    // Aufgabe generieren
    do {
        operation = levelConfig.operations[Math.floor(Math.random() * levelConfig.operations.length)];
        
        if (operation === '+') {
            num1 = Math.floor(Math.random() * levelConfig.maxNumber) + 1;
            num2 = Math.floor(Math.random() * (levelConfig.maxNumber - num1 + 1)) + 1;
            result = num1 + num2;
        } else if (operation === '-') {
            num1 = Math.floor(Math.random() * levelConfig.maxNumber) + 1;
            num2 = Math.floor(Math.random() * num1) + 1;
            result = num1 - num2;
        } else if (operation === '*') {
            num1 = Math.floor(Math.random() * Math.sqrt(levelConfig.maxNumber)) + 1;
            num2 = Math.floor(Math.random() * Math.sqrt(levelConfig.maxNumber)) + 1;
            result = num1 * num2;
        } else if (operation === '/') {
            num2 = Math.floor(Math.random() * Math.sqrt(levelConfig.maxNumber)) + 1;
            result = Math.floor(Math.random() * Math.sqrt(levelConfig.maxNumber)) + 1;
            num1 = num2 * result;
        }
    } while (result < levelConfig.minResult); // Sicherstellen, dass Ergebnis mindestens minResult ist
    
    // Aufgabe speichern
    gameState.currentProblem = {
        num1: num1,
        num2: num2,
        operation: operation,
        result: result,
        answered: false,
        wrongCount: 0
    };
    
    // Aufgabe anzeigen
    elements.problemElement.textContent = `${num1} ${operation} ${num2} = ?`;
    
    // Eingabefeld zurücksetzen
    elements.answerInput.value = '';
    elements.answerInput.focus();
    
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
        elements.answerInput.value += value;
        elements.answerInput.focus();
    }
}

// Eingabefeld leeren
function clearInput() {
    elements.answerInput.value = '';
    elements.answerInput.focus();
}

// Letztes Zeichen löschen
function backspaceInput() {
    elements.answerInput.value = elements.answerInput.value.slice(0, -1);
    elements.answerInput.focus();
}

// Antwort prüfen
function checkAnswer() {
    if (!gameState.currentProblem || gameState.currentProblem.answered) return;
    
    const userAnswer = parseInt(elements.answerInput.value);
    // If the input is empty or not a number, ignore the submit
    if (Number.isNaN(userAnswer)) return;
    const correctAnswer = gameState.currentProblem.result;
    
    // Antwort prüfen
    if (userAnswer === correctAnswer) {
        // Richtige Antwort
        gameState.score++;
        gameState.currentProblem.answered = true;
        gameState.currentProblem.wrongCount = 0; // Reset wrong count on correct answer
    } else {
        // Falsche Antwort
        gameState.currentProblem.answered = true;
        gameState.currentProblem.wrongCount++;
        // Falsche Aufgaben in Liste speichern
        gameState.problems.push(gameState.currentProblem);
    }
    
    gameState.totalProblems++;
    
    // Aktualisieren der Anzeige
    elements.scoreElement.textContent = gameState.score;
    
    // Nächste Aufgabe generieren
    setTimeout(() => {
        generateProblem();
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
    
    // Prozentsatz berechnen
    const percentage = gameState.totalProblems > 0 ? Math.round((gameState.score / gameState.totalProblems) * 100) : 0;
    elements.resultPercentage.textContent = percentage;
    
    // Highscore aktualisieren
    updateHighscore(percentage);
    
    // Häufig falsch gelöste Aufgaben anzeigen
    displayMistakes();
    
    // Highscore anzeigen
    elements.highscoreElement.textContent = gameState.highscore;
}

// Highscore aktualisieren
function updateHighscore(percentage) {
    if (percentage > gameState.highscore) {
        gameState.highscore = percentage;
        saveHighscore();
    }
}

// Highscore speichern
function saveHighscore() {
    try {
        const highscores = JSON.parse(localStorage.getItem('schnechnen-highscores')) || {};
        highscores[gameState.currentLevel] = gameState.highscore;
        localStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));
    } catch (e) {
        console.error('Fehler beim Speichern des Highscores:', e);
    }
}

// Highscore laden
function loadHighscores() {
    try {
        // Load the highscores map for later use. We'll set per-level highscore when a level starts.
        window.__SCHNECHEN_HIGHSCORES = JSON.parse(localStorage.getItem('schnechnen-highscores')) || {};
    } catch (e) {
        console.error('Fehler beim Laden des Highscores:', e);
        gameState.highscore = 0;
    }
}

// Häufig falsch gelöste Aufgaben anzeigen
function displayMistakes() {
    // Sortiere Aufgaben nach Anzahl falscher Antworten (absteigend)
    const sortedProblems = [...gameState.problems]
        .filter(problem => problem.wrongCount > 0)
        .sort((a, b) => b.wrongCount - a.wrongCount)
        .slice(0, 5); // Nur die 5 häufigsten falschen Aufgaben
    
    // Liste leeren
    elements.mistakeList.innerHTML = '';
    
    // Aufgaben anzeigen
    if (sortedProblems.length === 0) {
        elements.mistakeList.innerHTML = '<li>Keine falsch gelösten Aufgaben bisher</li>';
        return;
    }
    
    sortedProblems.forEach(problem => {
        const li = document.createElement('li');
        li.textContent = `${problem.num1} ${problem.operation} ${problem.num2} = ${problem.result} (Falsch: ${problem.wrongCount}x)`;
        elements.mistakeList.appendChild(li);
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
        score: 0,
        totalProblems: 0,
        problems: [],
        highscore: 0,
        timer: null,
        currentProblem: null
    };
    
    // Eingabefeld leeren
    elements.answerInput.value = '';
}

// Bildschirm anzeigen
function showScreen(screenName) {
    // Alle Screens ausblenden
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.resultScreen.classList.add('hidden');
    
    // Angegebenen Screen anzeigen
    if (screenName === 'start') {
        elements.startScreen.classList.remove('hidden');
    } else if (screenName === 'game') {
        elements.gameScreen.classList.remove('hidden');
    } else if (screenName === 'result') {
        elements.resultScreen.classList.remove('hidden');
    }
}

// Exportiere Funktionen für Tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        generateProblem,
        checkAnswer,
        startGame,
        endGame,
        resetGame
    };
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
        }
    }
} catch (e) {
    // ignore in non-browser contexts
}
