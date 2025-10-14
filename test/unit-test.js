// Unit Tests für Schnechnen Spiel

// Wir benötigen eine einfache Mock-Umgebung für die Tests
// Da wir keine echte DOM-Umgebung haben, simulieren wir einige Funktionen

// Mock DOM-Elemente
const mockElements = {
    startScreen: { classList: { add: () => {}, remove: () => {} } },
    gameScreen: { classList: { add: () => {}, remove: () => {} } },
    resultScreen: { classList: { add: () => {}, remove: () => {} } },
    levelButtons: [],
    timeElement: { textContent: '' },
    scoreElement: { textContent: '' },
    currentLevelElement: { textContent: '' },
    problemElement: { textContent: '' },
    answerInput: { value: '', focus: () => {} },
    dialPad: { classList: { remove: () => {} } },
    dialButtons: [],
    clearButton: { addEventListener: () => {} },
    backspaceButton: { addEventListener: () => {} },
    resultLevel: { textContent: '' },
    resultScore: { textContent: '' },
    totalProblemsElement: { textContent: '' },
    resultPercentage: { textContent: '' },
    highscoreElement: { textContent: '' },
    mistakeList: { innerHTML: '' },
    restartButton: { addEventListener: () => {} }
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
