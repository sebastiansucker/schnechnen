// Unit Tests für Schnechnen Spiel

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
    
    console.log('Alle Tests abgeschlossen.');
}

function testConfig() {
    console.log('Teste Konfiguration...');
    
    // Prüfe, ob alle Level konfiguriert sind
    if (!mockConfig.levels[1] || !mockConfig.levels[2] || !mockConfig.levels[3] || !mockConfig.levels[4]) {
        console.error('Fehler: Nicht alle Level konfiguriert');
        return false;
    }
    
    console.log('✓ Konfiguration erfolgreich');
    return true;
}

function testProblemGeneration() {
    console.log('Teste Problemgenerierung...');
    
    // Teste verschiedene Level
    for (let level = 1; level <= 4; level++) {
        try {
            // Simuliere Problemgenerierung
            const config = mockConfig.levels[level];
            let num1, num2, operation, result;
            
            // Generiere ein paar Aufgaben
            for (let i = 0; i < 10; i++) {
                operation = config.operations[Math.floor(Math.random() * config.operations.length)];
                
                if (operation === '+') {
                    num1 = Math.floor(Math.random() * config.maxNumber) + 1;
                    num2 = Math.floor(Math.random() * (config.maxNumber - num1 + 1)) + 1;
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
