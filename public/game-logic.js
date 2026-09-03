/**
 * Reine Spiellogik ohne DOM-Abhängigkeiten (kein window, kein document).
 *
 * script.js lädt dieses Modul und kümmert sich selbst nur noch um DOM und
 * Spielzustand. Unit-Tests importieren dieses Modul direkt, damit sie gegen
 * die echte Konfiguration und Aufgabengenerierung laufen statt gegen eine
 * separat gepflegte Kopie.
 */

// Spielkonfiguration
const CONFIG = {
    levels: {
        0: {
            name: "Addition bis 10",
            operations: ['+'],
            maxNumber: 10,
            minResult: 0,
            maxResult: 10
        },
        1: {
            name: "Addition & Subtraktion bis 10",
            operations: ['+', '-'],
            maxNumber: 10,
            minResult: 0,
            maxResult: 10
        },
        2: {
            name: "Addition & Subtraktion bis 100",
            operations: ['+', '-'],
            maxNumber: 100,
            minResult: 0,
            maxResult: 100
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
        },
        5: {
            name: "🌪️ Chaos Mode",
            operations: ['+', '-', '*', '/'],
            maxNumber: 1000,
            minResult: 0,
            maxResult: 1000,
            multiplicationMaxResult: 100,  // Multiplikation nur bis 100
            chaosMode: true
        }
    }
};

// Helper: map internal operator tokens to printable symbols
function displayOperator(op) {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
}

/**
 * Generiert eine neue zufällige Rechenaufgabe für ein Level.
 * `rng` ist injizierbar (Standard: Math.random), damit Grenzfälle in Tests
 * deterministisch nachgestellt werden können.
 *
 * @param {object} levelConfig - Ein Eintrag aus CONFIG.levels
 * @param {() => number} [rng] - Zufallszahlengenerator, liefert Werte in [0, 1)
 * @returns {{num1: number, num2: number, operation: string, result: number}}
 */
function generateProblemFor(levelConfig, rng = Math.random) {
    const isChaosMode = levelConfig.chaosMode;

    let num1, num2, operation, result;

    do {
        operation = levelConfig.operations[Math.floor(rng() * levelConfig.operations.length)];

        if (operation === '+') {
            // For addition: generate independently, let do-while enforce maxResult
            const addMaxNumber = isChaosMode ? 1000 : levelConfig.maxNumber;
            const addMaxResult = levelConfig.maxResult || levelConfig.maxNumber;
            // Generate num1 first (must be at least 1, at most addMaxResult-1 to leave room for num2)
            num1 = Math.floor(rng() * Math.min(addMaxNumber, addMaxResult - 1)) + 1;
            // Generate num2 to ensure result <= maxResult (num2 must be at least 1)
            const num2Max = Math.min(addMaxNumber, addMaxResult - num1);
            num2 = Math.floor(rng() * num2Max) + 1;
            result = num1 + num2;
        } else if (operation === '-') {
            // For subtraction: both operands must be <= maxNumber
            const subMaxNumber = isChaosMode ? 1000 : levelConfig.maxNumber;
            const subMaxResult = levelConfig.maxResult || levelConfig.maxNumber;
            // Generate result first to control outcome
            result = Math.floor(rng() * Math.min(subMaxResult, subMaxNumber)) + 0; // Can be 0
            // Generate num2 between 1 and min of (subMaxNumber, subMaxNumber - result)
            const num2Max = Math.min(subMaxNumber, subMaxNumber - result);
            num2 = Math.floor(rng() * num2Max) + 1;
            // Calculate num1
            num1 = result + num2;
        } else if (operation === '*') {
            // For multiplication: use multiplicationMaxResult (chaos mode) or maxResult or maxNumber
            const multMaxResult = levelConfig.multiplicationMaxResult || levelConfig.maxResult || levelConfig.maxNumber;
            num1 = Math.floor(rng() * Math.sqrt(multMaxResult)) + 1;
            num2 = Math.floor(rng() * Math.sqrt(multMaxResult)) + 1;
            result = num1 * num2;
        } else if (operation === '/') {
            // For division: use multiplicationMaxResult (chaos mode) or maxResult or maxNumber
            const divMaxResult = levelConfig.multiplicationMaxResult || levelConfig.maxResult || levelConfig.maxNumber;
            num2 = Math.floor(rng() * Math.sqrt(divMaxResult)) + 1;
            result = Math.floor(rng() * Math.sqrt(divMaxResult)) + 1;
            num1 = num2 * result;
        }
    } while (
        result < levelConfig.minResult ||
        (levelConfig.maxResult && result > levelConfig.maxResult) ||
        (levelConfig.multiplicationMaxResult && (operation === '*' || operation === '/') && result > levelConfig.multiplicationMaxResult)
    );

    return { num1, num2, operation, result };
}

// Export für Node.js (Unit Tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        generateProblemFor,
        displayOperator
    };
}

// Export für Browser
if (typeof window !== 'undefined') {
    window.GameLogic = {
        CONFIG,
        generateProblemFor,
        displayOperator
    };
}
