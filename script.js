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
            statsLevelButtons: document.querySelectorAll('.stats-level-btn'),
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

// DOM elements are initialized via createElements() at the top of the file

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

    // Neues Spiel-Button
    elements.restartButton.addEventListener('click', () => {
        resetGame();
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

    // Stats Level-Buttons
    if (elements.statsLevelButtons) {
        elements.statsLevelButtons.forEach(button => {
            button.addEventListener('click', () => {
                const level = parseInt(button.dataset.level);
                updateStatsForLevel(level);
                
                // Update active state
                elements.statsLevelButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

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
        // Generiere ein neues zufälliges Problem
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
    
    // Aufgabe anzeigen (use printable operator symbols)
    elements.problemElement.innerHTML = `${num1} ${displayOperator(operation)} ${num2} = <span id="user-answer" class="user-answer">?</span>`;
    
    // User-Answer Element neu holen (weil innerHTML neu gesetzt wurde)
    elements.userAnswerElement = document.getElementById('user-answer');
    
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
        // Falsche Antwort
        gameState.currentProblem.answered = true;
        gameState.currentProblem.wrongCount++;
        // Falsche Aufgaben in Liste speichern
        gameState.problems.push(gameState.currentProblem);
        
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
    
    // Highscore aktualisieren (Anzahl richtiger Antworten)
    updateHighscore(gameState.score);
    
    // Spiel-History speichern
    saveGameHistory(gameState.currentLevel, gameState.score, gameState.totalProblems);
    
    // Aktuelles Ergebnis (Anzahl richtiger Antworten) anzeigen
    elements.highscoreElement.textContent = gameState.score;
    
    // Häufig falsch gelöste Aufgaben aus weighting.js anzeigen
    displayMistakes();
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
        li.textContent = `${problem.num1} ${displayOperator(problem.operation)} ${problem.num2} = ${problem.result} (${problem.wrongCount}× falsch)`;
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
        const problemText = `${problem.num1} ${displayOperator(problem.operation)} ${problem.num2} = ${problem.result}`;
        const countBadge = `<span class="mistake-count">${problem.wrongCount}× falsch</span>`;
        li.innerHTML = `${problemText} ${countBadge}`;
        elements.statsMistakeList.appendChild(li);
    });
}

// Helper: map internal operator tokens to printable symbols
function displayOperator(op) {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
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
    
    // Anzeige zurücksetzen
    if (elements.userAnswerElement) {
        elements.userAnswerElement.textContent = '?';
    }
}

// Bildschirm anzeigen
function showScreen(screenName) {
    // Alle Screens ausblenden
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.resultScreen.classList.add('hidden');
    if (elements.statsScreen) {
        elements.statsScreen.classList.add('hidden');
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
    }
}

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
}

// Update Statistiken für ein Level
function updateStatsForLevel(level) {
    const history = getGameHistory(level);
    const highscore = window.__SCHNECHEN_HIGHSCORES[level] || 0;
    
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
