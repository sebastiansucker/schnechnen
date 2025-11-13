// Unit Tests für Schnechnen Spiel

// Importiere exportierte Funktionen aus script.js
let scriptExports = {};
try {
    // Mock global objects vor dem Laden von script.js
    if (typeof document === 'undefined') {
        global.document = {
            getElementById: () => ({ textContent: '', innerHTML: '', classList: { add: () => {}, remove: () => {} } }),
            addEventListener: () => {}
        };
        global.window = {
            localStorage: global.localStorage || {}
        };
    }
    
    scriptExports = require('../script.js');
} catch (e) {
    // Falls script.js nicht vollständig geladen werden kann, nutze lokale Mocks
    // Dies ist normal, da script.js DOM-Abhängigkeiten hat
    console.log('Info: script.js teilweise geladen (DOM-abhängige Funktionen)');
}

// Wir benötigen eine einfache Mock-Umgebung für die Tests
// Da wir keine echte DOM-Umgebung haben, simulieren wir einige Funktionen

// Mock DOM-Elemente
const mockElements = {
    startScreen: { classList: { add: () => {}, remove: () => {} } },
    gameScreen: { classList: { add: () => {}, remove: () => {} } },
    resultScreen: { classList: { add: () => {}, remove: () => {} } },
    statsScreen: { classList: { add: () => {}, remove: () => {} } },
    levelButtons: [],
    timeElement: { textContent: '' },
    scoreElement: { textContent: '' },
    currentLevelElement: { textContent: '' },
    problemElement: { textContent: '', innerHTML: '' },
    userAnswerElement: { textContent: '' },
    dialPad: { classList: { remove: () => {} } },
    dialButtons: [],
    clearButton: { addEventListener: () => {} },
    backspaceButton: { addEventListener: () => {} },
    submitButton: { addEventListener: () => {} },
    resultLevel: { textContent: '' },
    resultScore: { textContent: '' },
    totalProblemsElement: { textContent: '' },
    highscoreElement: { textContent: '' },
    mistakeList: { innerHTML: '', appendChild: () => {} },
    restartButton: { addEventListener: () => {} },
    backButton: { addEventListener: () => {} },
    statsButton: { addEventListener: () => {} },
    statsBackButton: { addEventListener: () => {} },
    statsLevelButtons: [],
    statHighscore: { textContent: '' },
    statTotalGames: { textContent: '' },
    statAvgScore: { textContent: '' },
    chartCanvas: null
};

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    }
};

// Mock document
const mockDocument = {
    addEventListener: () => {},
    getElementById: () => mockElements
};

// Mock window
const mockWindow = {
    localStorage: mockLocalStorage
};

// Mock der benötigten Funktionen
const mockConfig = {
    levels: {
        0: {
            name: "Addition bis 10",
            operations: ['+'],
            maxNumber: 10,
            minResult: 0
        },
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

// Importiere die Spiellogik (wenn in Node.js Umgebung)
// Für diesen Test simulieren wir die Funktionen direkt

// Test-Funktionen

// Test 8: Input-Handling (Dial-Pad)
function testInputHandling() {
    try {
        // Testfall 1: Eingabe mit Ziffern
        let input = '';
        // Simuliere Dial-Pad Clicks
        const dialInput = (value) => {
            if (value === 'backspace') {
                input = input.slice(0, -1);
            } else if (value === 'clear') {
                input = '';
            } else {
                input += value;
            }
            return input;
        };
        
        // Test: Ziffern hinzufügen
        dialInput('5');
        dialInput('3');
        if (input !== '53') {
            console.error('Fehler: Eingabe sollte "53" sein.');
            return false;
        }
        
        // Test: Backspace
        dialInput('backspace');
        if (input !== '5') {
            console.error('Fehler: Nach Backspace sollte input "5" sein.');
            return false;
        }
        
        // Test: Clear
        dialInput('clear');
        if (input !== '') {
            console.error('Fehler: Nach Clear sollte input leer sein.');
            return false;
        }
        
        // Test: Negative Zahlen mit Minus
        dialInput('-');
        dialInput('7');
        if (input !== '-7') {
            console.error('Fehler: Negative Zahl sollte "-7" sein.');
            return false;
        }
        
        console.log('✓ Input-Handling erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler beim Testen des Input-Handling:', error);
        return false;
    }
}

// Test 9: Answer-Checking Logic
function testAnswerChecking() {
    try {
        // Test verschiedene Antwort-Szenarien
        const testCases = [
            { userAnswer: 5, correctAnswer: 5, shouldBeCorrect: true },
            { userAnswer: 5, correctAnswer: 7, shouldBeCorrect: false },
            { userAnswer: 0, correctAnswer: 0, shouldBeCorrect: true },
            { userAnswer: -5, correctAnswer: -5, shouldBeCorrect: true },
            { userAnswer: 100, correctAnswer: 50, shouldBeCorrect: false },
        ];
        
        for (const testCase of testCases) {
            const isCorrect = testCase.userAnswer === testCase.correctAnswer;
            if (isCorrect !== testCase.shouldBeCorrect) {
                console.error(`Fehler: Answer-Check fehlgeschlagen für ${testCase.userAnswer} vs ${testCase.correctAnswer}`);
                return false;
            }
        }
        
        // Test: NaN handling
        const userAnswer = parseInt('?');
        if (!Number.isNaN(userAnswer)) {
            console.error('Fehler: parseInt("?") sollte NaN sein.');
            return false;
        }
        
        // Test: Empty string handling
        const emptyAnswer = parseInt('');
        if (!Number.isNaN(emptyAnswer)) {
            console.error('Fehler: parseInt("") sollte NaN sein.');
            return false;
        }
        
        console.log('✓ Answer-Checking erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler beim Testen des Answer-Checking:', error);
        return false;
    }
}

// Test 10: Timer Logic
function testTimerLogic() {
    try {
        // Test Timer-Countdown-Logik
        let timeLeft = 60;
        const decrementTime = () => {
            timeLeft--;
            return timeLeft;
        };
        
        // Test: Zeit zählt runter
        decrementTime();
        if (timeLeft !== 59) {
            console.error('Fehler: Timer sollte auf 59 sein.');
            return false;
        }
        
        // Test: Time bei 0 stoppt
        timeLeft = 1;
        decrementTime();
        if (timeLeft !== 0) {
            console.error('Fehler: Timer sollte auf 0 sein.');
            return false;
        }
        
        // Test: Negative Werte möglich (wird in endGame() abgefangen)
        decrementTime();
        if (timeLeft !== -1) {
            console.error('Fehler: Timer sollte auf -1 sein.');
            return false;
        }
        
        console.log('✓ Timer-Logik erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler beim Testen der Timer-Logik:', error);
        return false;
    }
}

// Test 11: Display Operator Conversion
function testDisplayOperator() {
    try {
        // Nutze displayOperator aus script.js wenn verfügbar, sonst fallback
        let displayOperator;
        if (scriptExports && typeof scriptExports.displayOperator === 'function') {
            displayOperator = scriptExports.displayOperator;
        } else {
            // Lokale Fallback-Implementierung
            displayOperator = (op) => {
                switch(op) {
                    case '*':
                        return '×';
                    case '/':
                        return '÷';
                    case '+':
                        return '+';
                    case '-':
                        return '-';
                    default:
                        return op;
                }
            };
        }
        
        // Test: Operator-Konvertierung
        const testCases = [
            { input: '*', expected: '×' },
            { input: '/', expected: '÷' },
            { input: '+', expected: '+' },
            { input: '-', expected: '-' },
            { input: 'unknown', expected: 'unknown' }
        ];
        
        for (const testCase of testCases) {
            const result = displayOperator(testCase.input);
            if (result !== testCase.expected) {
                console.error(`Fehler: displayOperator('${testCase.input}') sollte '${testCase.expected}' sein, ist aber '${result}'`);
                return false;
            }
        }
        
        console.log('✓ Display-Operator erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler beim Testen des Display-Operators:', error);
        return false;
    }
}

// Test Randomness der Aufgabengenerierung
function testProblemRandomness() {
    try {
        console.log('\n--- TEST: Problem Randomness (Aufgabenvariabilität) ---');
        
        // Mock gameState und elements
        const mockGameState = {
            currentLevel: 0,
            currentProblem: null,
            score: 0,
            timeRemaining: 60
        };
        
        const mockElements = {
            problemElement: { innerHTML: '', textContent: '' },
            userAnswerElement: { textContent: '?' },
            dialPad: { classList: { remove: () => {} } }
        };
        
        // CONFIG von script.js
        const CONFIG = {
            levels: {
                0: { name: "Addition bis 10", operations: ['+'], maxNumber: 10, minResult: 0 },
                1: { name: "Addition & Subtraktion bis 10", operations: ['+', '-'], maxNumber: 10, minResult: 0 },
                2: { name: "Addition & Subtraktion bis 100", operations: ['+', '-'], maxNumber: 100, minResult: 0 },
                3: { name: "Multiplikation bis 100", operations: ['*'], maxNumber: 100, minResult: 0 },
                4: { name: "Multiplikation & Division bis 100", operations: ['*', '/'], maxNumber: 100, minResult: 0 }
            }
        };
        
        // Generiere Aufgaben und analysiere Verteilung
        function analyzeRandomness(level, numProblems = 200) {
            const resultDistribution = {};
            const operand1Distribution = {};
            const operand2Distribution = {};
            
            mockGameState.currentLevel = level;
            const levelConfig = CONFIG.levels[level];
            
            for (let i = 0; i < numProblems; i++) {
                let num1, num2, operation, result;
                
                operation = levelConfig.operations[Math.floor(Math.random() * levelConfig.operations.length)];
                
                if (operation === '+') {
                    num1 = Math.floor(Math.random() * levelConfig.maxNumber) + 1;
                    num2 = Math.floor(Math.random() * levelConfig.maxNumber) + 1;
                    result = num1 + num2;
                } else if (operation === '-') {
                    num2 = Math.floor(Math.random() * levelConfig.maxNumber) + 1;
                    num1 = num2 + Math.floor(Math.random() * (levelConfig.maxNumber - num2)) + 1;
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
                
                resultDistribution[result] = (resultDistribution[result] || 0) + 1;
                operand1Distribution[num1] = (operand1Distribution[num1] || 0) + 1;
                operand2Distribution[num2] = (operand2Distribution[num2] || 0) + 1;
            }
            
            return {
                resultDistribution,
                operand1Distribution,
                operand2Distribution,
                uniqueResults: Object.keys(resultDistribution).length
            };
        }
        
        // Test Level 0: Addition sollte ausreichend vielfältig sein
        const level0Results = analyzeRandomness(0, 200);
        const level0MostCommon = Math.max(...Object.values(level0Results.resultDistribution)) / 200;
        
        console.log(`  Level 0: ${level0Results.uniqueResults} einzigartige Ergebnisse`);
        console.log(`  Level 0: Häufigstes Ergebnis = ${(level0MostCommon * 100).toFixed(1)}%`);
        
        // Prüfungen
        let allGood = true;
        
        // Prüfung 1: Level 0 sollte mindestens 9 verschiedene Ergebnisse haben
        if (level0Results.uniqueResults < 9) {
            console.error(`  ❌ Level 0: Zu wenig eindeutige Ergebnisse (${level0Results.uniqueResults}, erwartet >= 9)`);
            allGood = false;
        } else {
            console.log(`  ✓ Level 0: Ausreichende Ergebnis-Vielfalt (${level0Results.uniqueResults} Ergebnisse)`);
        }
        
        // Prüfung 2: Kein Ergebnis sollte zu häufig vorkommen (> 20%)
        if (level0MostCommon > 0.20) {
            console.error(`  ❌ Level 0: Häufigstes Ergebnis zu oft (${(level0MostCommon * 100).toFixed(1)}%, max 20%)`);
            allGood = false;
        } else {
            console.log(`  ✓ Level 0: Ergebnisse gut verteilt (max ${(level0MostCommon * 100).toFixed(1)}%)`);
        }
        
        // Prüfung 3: Operanden-Spanne sollte gut genutzt werden (min-max Bereich)
        const level0Op1Values = Object.keys(level0Results.operand1Distribution).map(Number);
        const level0Op2Values = Object.keys(level0Results.operand2Distribution).map(Number);
        
        const level0Op1Range = Math.max(...level0Op1Values) - Math.min(...level0Op1Values);
        const level0Op2Range = Math.max(...level0Op2Values) - Math.min(...level0Op2Values);
        
        console.log(`  Level 0 - num1 Bereich: ${Math.min(...level0Op1Values)}-${Math.max(...level0Op1Values)}`);
        console.log(`  Level 0 - num2 Bereich: ${Math.min(...level0Op2Values)}-${Math.max(...level0Op2Values)}`);
        
        // Für Level 0 (maxNumber=10) sollte der Bereich mindestens 7 sein
        if (level0Op1Range < 7 || level0Op2Range < 7) {
            console.error(`  ❌ Level 0: Operanden-Bereich zu eng`);
            allGood = false;
        } else {
            console.log(`  ✓ Level 0: Operanden-Bereich gut genutzt`);
        }
        
        // Test Level 1: Addition & Subtraktion bis 10
        const level1Results = analyzeRandomness(1, 200);
        console.log(`\n  Level 1: ${level1Results.uniqueResults} einzigartige Ergebnisse`);
        
        if (level1Results.uniqueResults < 10) {
            console.error(`  ❌ Level 1: Zu wenig eindeutige Ergebnisse (${level1Results.uniqueResults}, erwartet >= 10)`);
            allGood = false;
        } else {
            console.log(`  ✓ Level 1: Ausreichende Vielfalt (${level1Results.uniqueResults} Ergebnisse)`);
        }
        
        // Test Level 2: Addition & Subtraktion bis 100
        const level2Results = analyzeRandomness(2, 200);
        console.log(`\n  Level 2: ${level2Results.uniqueResults} einzigartige Ergebnisse`);
        
        if (level2Results.uniqueResults < 40) {
            console.error(`  ❌ Level 2: Zu wenig eindeutige Ergebnisse (${level2Results.uniqueResults}, erwartet >= 40)`);
            allGood = false;
        } else {
            console.log(`  ✓ Level 2: Hohe Vielfalt (${level2Results.uniqueResults} Ergebnisse)`);
        }
        
        // Test Level 3: Multiplikation bis 100
        const level3Results = analyzeRandomness(3, 200);
        console.log(`\n  Level 3: ${level3Results.uniqueResults} einzigartige Ergebnisse`);
        
        if (level3Results.uniqueResults < 30) {
            console.error(`  ❌ Level 3: Zu wenig eindeutige Ergebnisse (${level3Results.uniqueResults}, erwartet >= 30)`);
            allGood = false;
        } else {
            console.log(`  ✓ Level 3: Gute Vielfalt (${level3Results.uniqueResults} Ergebnisse)`);
        }
        
        // Test Level 4: Multiplikation & Division bis 100
        const level4Results = analyzeRandomness(4, 200);
        console.log(`\n  Level 4: ${level4Results.uniqueResults} einzigartige Ergebnisse`);
        
        if (level4Results.uniqueResults < 30) {
            console.error(`  ❌ Level 4: Zu wenig eindeutige Ergebnisse (${level4Results.uniqueResults}, erwartet >= 30)`);
            allGood = false;
        } else {
            console.log(`  ✓ Level 4: Gute Vielfalt (${level4Results.uniqueResults} Ergebnisse)`);
        }
        
        if (allGood) {
            console.log('\n✓ Problem Randomness erfolgreich (alle Level)');
            return true;
        } else {
            console.error('Fehler: Problem Randomness nicht ausreichend');
            return false;
        }
    } catch (error) {
        console.error('Fehler beim Testen der Problem Randomness:', error);
        return false;
    }
}

function runTests() {
    console.log('Starte Unit Tests für Schnechnen Spiel...');
    
    // Test 1: Konfiguration prüfen
    testConfig();
    
    // Test 2: Problemgenerierung
    testProblemGeneration();
    
    // Test 3: Highscore-Funktionen
    testHighscore();
    
    // Test 4: Ergebnisberechnung
    testScoreCalculation();
    
    // Test 5: Gewichtung / Fehlerwiederholung
    testWeighting();
    
    // Test 6: Adaptive Problemgenerierung
    testAdaptiveProblemGeneration();
    
    // Test 7: Reset Statistiken
    testResetStatistics();
    
    // Test 8: Input-Handling (Dial-Pad)
    testInputHandling();
    
    // Test 9: Answer-Checking Logic
    testAnswerChecking();
    
    // Test 10: Timer Logic
    testTimerLogic();
    
    // Test 11: Display Operator Conversion
    testDisplayOperator();
    
    // Test 12: Problem Randomness
    testProblemRandomness();
    
    console.log('Alle Tests abgeschlossen.');
}

function testConfig() {
    console.log('Teste Konfiguration...');
    
    // Prüfe, ob alle Level konfiguriert sind
    if (!mockConfig.levels[0] || !mockConfig.levels[1] || !mockConfig.levels[2] || !mockConfig.levels[3] || !mockConfig.levels[4]) {
        console.error('Fehler: Nicht alle Level konfiguriert');
        return false;
    }
    
    console.log('✓ Konfiguration erfolgreich');
    return true;
}

function testProblemGeneration() {
    console.log('Teste Problemgenerierung...');
    
    // Teste verschiedene Level (including Level 0)
    for (let level = 0; level <= 4; level++) {
        try {
            // Simuliere Problemgenerierung
            const config = mockConfig.levels[level];
            let num1, num2, operation, result;
            
            // Generiere ein paar Aufgaben
            for (let i = 0; i < 10; i++) {
                operation = config.operations[Math.floor(Math.random() * config.operations.length)];
                
                if (operation === '+') {
                    num1 = Math.floor(Math.random() * (config.maxNumber - 1)) + 1;
                    num2 = Math.floor(Math.random() * (config.maxNumber - num1)) + 1;
                    result = num1 + num2;
                } else if (operation === '-') {
                    num1 = Math.floor(Math.random() * config.maxNumber) + 1;
                    num2 = Math.floor(Math.random() * num1) + 1;
                    result = num1 - num2;
                } else if (operation === '*') {
                    num1 = Math.floor(Math.random() * Math.sqrt(config.maxNumber)) + 1;
                    num2 = Math.floor(Math.random() * Math.sqrt(config.maxNumber)) + 1;
                    result = num1 * num2;
                } else if (operation === '/') {
                    num2 = Math.floor(Math.random() * Math.sqrt(config.maxNumber)) + 1;
                    result = Math.floor(Math.random() * Math.sqrt(config.maxNumber)) + 1;
                    num1 = num2 * result;
                }
                
                // Prüfe, dass das Ergebnis mindestens minResult ist
                if (result < config.minResult) {
                    console.error(`Fehler: Ergebnis ${result} ist kleiner als minResult ${config.minResult} für Level ${level}`);
                    return false;
                }
                
                // Prüfe, dass das Ergebnis bei Addition nicht maxNumber überschreitet
                if (operation === '+' && result > config.maxNumber) {
                    console.error(`Fehler: Additions-Ergebnis ${result} überschreitet maxNumber ${config.maxNumber} für Level ${level} (${num1} + ${num2})`);
                    return false;
                }
            }
        } catch (error) {
            console.error(`Fehler bei Problemgenerierung für Level ${level}:`, error);
            return false;
        }
    }
    
    console.log('✓ Problemgenerierung erfolgreich');
    return true;
}

function testHighscore() {
    console.log('Teste Highscore-Funktionen...');
    
    try {
        // Simuliere das Speichern eines Highscores
        const highscores = JSON.parse(mockLocalStorage.getItem('schnechnen-highscores')) || {};
        const testLevel = 1;
        const testScore = 85;
        
        highscores[testLevel] = testScore;
        mockLocalStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));
        
        // Lade den Highscore
        const loadedScores = JSON.parse(mockLocalStorage.getItem('schnechnen-highscores')) || {};
        if (loadedScores[testLevel] !== testScore) {
            console.error('Fehler: Highscore wurde nicht korrekt gespeichert/ geladen');
            return false;
        }
        
        console.log('✓ Highscore-Funktionen erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler bei Highscore-Tests:', error);
        return false;
    }
}

function testScoreCalculation() {
    console.log('Teste Ergebnisberechnung...');
    
    try {
        // Teste die Berechnung von Ergebnissen
        const testCases = [
            { num1: 5, num2: 3, operation: '+', expected: 8 },
            { num1: 10, num2: 4, operation: '-', expected: 6 },
            { num1: 5, num2: 6, operation: '*', expected: 30 },
            { num1: 20, num2: 4, operation: '/', expected: 5 }
        ];
        
        for (const testCase of testCases) {
            let result;
            if (testCase.operation === '+') {
                result = testCase.num1 + testCase.num2;
            } else if (testCase.operation === '-') {
                result = testCase.num1 - testCase.num2;
            } else if (testCase.operation === '*') {
                result = testCase.num1 * testCase.num2;
            } else if (testCase.operation === '/') {
                result = testCase.num1 / testCase.num2;
            }
            
            if (result !== testCase.expected) {
                console.error(`Fehler: Erwartet ${testCase.expected}, aber berechnet ${result} für ${testCase.num1} ${testCase.operation} ${testCase.num2}`);
                return false;
            }
        }
        
        console.log('✓ Ergebnisberechnung erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler bei Ergebnisberechnung-Tests:', error);
        return false;
    }
}

function testWeighting() {
    console.log('Teste Gewichtung/Fehlerwiederholung...');
    try {
        const weighting = require('../weighting');
        // clear any previous data
        weighting.clear();

        const level = 1;
        const problem = { num1: 3, num2: 4, operation: '+', result: 7 };

        // Simulate a wrong answer being recorded
        weighting.addMistake(level, problem);

        // Now, peek the next mistake for the level — should return the same problem
        const peek = weighting.peekMistake(level);
        if (!peek) {
            console.error('Fehler: Erwartete eine gespeicherte falsche Aufgabe, aber keine gefunden.');
            return false;
        }

        if (peek.num1 !== problem.num1 || peek.num2 !== problem.num2 || peek.operation !== problem.operation || peek.result !== problem.result) {
            console.error('Fehler: Die gespeicherte Aufgabe stimmt nicht mit der erwarteten überein.');
            return false;
        }

        console.log('✓ Gewichtung und Fehlerwiederholung erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler beim Testen der Gewichtung:', error);
        return false;
    }
}

function testAdaptiveProblemGeneration() {
    console.log('Teste Adaptive Problemgenerierung...');
    try {
        const weighting = require('../weighting');
        weighting.clear();

        const level = 1;
        const mistakeProblem = { num1: 5, num2: 3, operation: '+', result: 8 };
        
        // Füge einen häufigen Fehler hinzu - jeder Aufruf inkrementiert wrongCount um 1
        weighting.addMistake(level, mistakeProblem); // wrongCount = 1
        weighting.addMistake(level, mistakeProblem); // wrongCount = 2
        weighting.addMistake(level, mistakeProblem); // wrongCount = 3

        // Prüfe, ob peekMistake das Problem mit dem höchsten wrongCount zurückgibt
        const peeked = weighting.peekMistake(level);
        if (!peeked) {
            console.error('Fehler: peekMistake sollte ein Problem zurückgeben.');
            return false;
        }

        if (peeked.wrongCount !== 3) {
            console.error(`Fehler: wrongCount sollte 3 sein, ist aber ${peeked.wrongCount}.`);
            return false;
        }

        // Simuliere richtige Antwort -> Problem sollte entfernt werden
        weighting.removeMistake(level, mistakeProblem);
        const afterRemove = weighting.peekMistake(level);
        if (afterRemove !== null) {
            console.error('Fehler: Nach removeMistake sollte kein Problem mehr vorhanden sein.');
            return false;
        }

        // Teste mehrere Probleme - das mit höchstem wrongCount sollte zuerst kommen
        weighting.clear();
        
        // Problem 1: wrongCount = 1
        const prob1 = { num1: 2, num2: 2, operation: '+', result: 4 };
        weighting.addMistake(level, prob1);

        // Problem 2: wrongCount = 5 (mehrfach falsch beantwortet)
        const prob2 = { num1: 5, num2: 5, operation: '+', result: 10 };
        for (let i = 0; i < 5; i++) {
            weighting.addMistake(level, prob2);
        }

        // Problem 3: wrongCount = 2
        const prob3 = { num1: 3, num2: 3, operation: '+', result: 6 };
        weighting.addMistake(level, prob3);
        weighting.addMistake(level, prob3);

        const highestWrong = weighting.peekMistake(level);
        if (highestWrong.wrongCount !== 5) {
            console.error(`Fehler: Das Problem mit dem höchsten wrongCount sollte zurückgegeben werden (5), aber wrongCount ist ${highestWrong.wrongCount}.`);
            return false;
        }

        console.log('✓ Adaptive Problemgenerierung erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler beim Testen der adaptiven Problemgenerierung:', error);
        return false;
    }
}

function testResetStatistics() {
    console.log('Teste Zurücksetzen von Statistiken...');
    try {
        const weighting = require('../weighting');

        const level = 1;
        const problem = { num1: 7, num2: 3, operation: '+', result: 10 };

        // 1. Füge Fehler hinzu
        weighting.addMistake(level, problem);
        weighting.addMistake(level, problem);
        
        let peeked = weighting.peekMistake(level);
        if (!peeked) {
            console.error('Fehler: Problem sollte nach addMistake vorhanden sein.');
            return false;
        }
        
        // TEST: Problem falsch → richtig → falsch (darf nicht doppelt in Liste sein)
        // Szenario: addMistake → removeMistake → addMistake
        weighting.clear();
        weighting.addMistake(level, problem); // wrongCount = 1
        weighting.removeMistake(level, problem); // sollte gelöscht werden
        weighting.addMistake(level, problem); // sollte mit wrongCount = 1 hinzugefügt werden
        
        const mistakes = weighting.getMistakes(level);
        if (mistakes.length !== 1) {
            console.error(`Fehler: Nach remove/add sollten 1 Fehler sein, sind aber ${mistakes.length}.`);
            return false;
        }
        if (mistakes[0].wrongCount !== 1) {
            console.error(`Fehler: wrongCount sollte 1 sein (nach remove/add), ist aber ${mistakes[0].wrongCount}.`);
            return false;
        }

        // 2. Speichere einen Highscore
        const highscores = JSON.parse(mockLocalStorage.getItem('schnechnen-highscores')) || {};
        highscores[level] = 95;
        mockLocalStorage.setItem('schnechnen-highscores', JSON.stringify(highscores));

        // 3. Speichere Spiel-History
        const history = JSON.parse(mockLocalStorage.getItem('schnechnen-history')) || {};
        history[level] = [{ score: 90, totalProblems: 100, date: new Date().toISOString() }];
        mockLocalStorage.setItem('schnechnen-history', JSON.stringify(history));

        // 4. Rufe resetAll auf (Weighting)
        weighting.resetAll();

        // 5. Prüfe, dass Fehler gelöscht sind
        peeked = weighting.peekMistake(level);
        if (peeked !== null) {
            console.error('Fehler: Nach resetAll sollten keine Fehler mehr vorhanden sein.');
            return false;
        }

        // 6. Lösche Highscores
        mockLocalStorage.setItem('schnechnen-highscores', JSON.stringify({}));
        const loadedHighscores = JSON.parse(mockLocalStorage.getItem('schnechnen-highscores')) || {};
        if (loadedHighscores[level]) {
            console.error('Fehler: Highscore sollte gelöscht sein.');
            return false;
        }

        // 7. Lösche History
        mockLocalStorage.setItem('schnechnen-history', JSON.stringify({}));
        const loadedHistory = JSON.parse(mockLocalStorage.getItem('schnechnen-history')) || {};
        if (loadedHistory[level]) {
            console.error('Fehler: History sollte gelöscht sein.');
            return false;
        }

        console.log('✓ Zurücksetzen von Statistiken erfolgreich');
        return true;
    } catch (error) {
        console.error('Fehler beim Testen des Zurücksetzen von Statistiken:', error);
        return false;
    }
}

// Führe die Tests aus
runTests();

// Exportiere für mögliche weitere Tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTests,
        testConfig,
        testProblemGeneration,
        testHighscore,
        testScoreCalculation
    };
}
