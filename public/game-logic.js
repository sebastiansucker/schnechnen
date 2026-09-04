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

// Obergrenze für das Neuziehen bei der Addition (siehe generateProblemFor).
const MAX_ADDITION_ATTEMPTS = 100;

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
    let num1, num2, operation, result;

    do {
        operation = levelConfig.operations[Math.floor(rng() * levelConfig.operations.length)];

        if (operation === '+') {
            // Beide Operanden unabhängig und gleichverteilt ziehen; Kombinationen
            // über maxResult werden verworfen und neu gezogen.
            //
            // Früher wurde stattdessen num2 auf maxResult - num1 begrenzt. Das
            // erzeugt bei maxNumber === maxResult (Level 0, 1, 2 sowie die
            // Addition im Chaos Mode) eine deutliche Schieflage: ein kleines num1
            // lässt num2 viel Spielraum, ein großes fast keinen mehr, wodurch die
            // Summe systematisch zum Randwert maxResult gezogen wird. In Level 0
            // kam so das Ergebnis 10 in ~31 % der Aufgaben vor, das Ergebnis 2
            // dagegen nur in ~1 %, und "9 + 1" war mit ~11 % die mit Abstand
            // häufigste Einzelaufgabe.
            //
            // Verwerfen statt Begrenzen macht jede gültige Aufgabe exakt gleich
            // wahrscheinlich (Level 0: 45 mögliche Aufgaben zu je ~2,2 %).
            const addMaxNumber = levelConfig.maxNumber;
            const addMaxResult = levelConfig.maxResult || levelConfig.maxNumber;
            // Ein Operand kann höchstens addMaxResult - 1 werden, damit für den
            // anderen (mindestens 1) noch Platz bleibt.
            const operandMax = Math.max(1, Math.min(addMaxNumber, addMaxResult - 1));

            // Bewusst hier verwerfen und nicht in der äußeren do-while-Schleife:
            // dort würde bei jedem Versuch neu ausgewürfelt, welche Rechenart
            // drankommt. Da nur die Addition verworfen wird, verschöbe sich die
            // Mischung in Level 1/2 spürbar zugunsten der Subtraktion.
            let attempts = 0;
            do {
                num1 = Math.floor(rng() * operandMax) + 1;
                num2 = Math.floor(rng() * operandMax) + 1;
                result = num1 + num2;
            } while (result > addMaxResult && ++attempts < MAX_ADDITION_ATTEMPTS);

            if (result > addMaxResult) {
                // Sicherheitsnetz gegen eine Endlosschleife. Bei allen echten
                // Konfigurationen liegt die Trefferquote über 50 %, dieser Zweig
                // ist also praktisch unerreichbar; er greift nur bei einer
                // degenerierten Konfiguration mit maxResult < 2.
                num1 = 1;
                num2 = 1;
                result = 2;
            }
        } else if (operation === '-') {
            // For subtraction: both operands must be <= maxNumber
            const subMaxNumber = levelConfig.maxNumber;
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
