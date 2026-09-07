// Simple weighting store for mistakes. Uses localStorage when available, otherwise an in-memory store.
const KEY = 'schnechnen-mistakes';
// Store für Treffer/Fehler pro Aufgabe (Einmaleins-Heatmap, Issue #49).
const FACTS_KEY = 'schnechnen-facts';

function _getStorage() {
    try {
        if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (_e) {
        // localStorage not available (e.g. private mode or Node.js); fall back to in-memory store
    }
    // fallback in-memory
    // Use globalThis for a safe cross-environment in-memory store
    if (typeof globalThis.__SCHNECHNEN_MEM_STORE === 'undefined') globalThis.__SCHNECHNEN_MEM_STORE = {};
    return {
        getItem: (k) => globalThis.__SCHNECHNEN_MEM_STORE[k] || null,
        setItem: (k, v) => { globalThis.__SCHNECHNEN_MEM_STORE[k] = v; }
    };
}

function _loadAll() {
    const storage = _getStorage();
    try {
        return JSON.parse(storage.getItem(KEY)) || {};
    } catch (_e) {
        return {};
    }
}

function _saveAll(obj) {
    const storage = _getStorage();
    storage.setItem(KEY, JSON.stringify(obj));
}

function clear() {
    const storage = _getStorage();
    storage.setItem(KEY, JSON.stringify({}));
    storage.setItem(FACTS_KEY, JSON.stringify({}));
}

function addMistake(level, problem) {
    const all = _loadAll();
    const lvl = String(level);
    all[lvl] = all[lvl] || [];

    // Try to find an existing matching problem (same nums and operation)
    const existing = all[lvl].find(p => p.num1 === problem.num1 && p.num2 === problem.num2 && p.operation === problem.operation && p.result === problem.result);
    if (existing) {
        existing.wrongCount = (existing.wrongCount || 0) + 1;
    } else {
        const copy = Object.assign({}, problem);
        copy.wrongCount = copy.wrongCount || 1;
        all[lvl].push(copy);
    }
    _saveAll(all);
}

function getMistakes(level) {
    const all = _loadAll();
    return all[String(level)] || [];
}

// peek the next mistake for a level (does not remove it)
function peekMistake(level) {
    const list = getMistakes(level);
    if (list.length === 0) return null;
    // return the one with highest wrongCount
    return list.slice().sort((a,b) => (b.wrongCount||0) - (a.wrongCount||0))[0];
}

// remove a specific mistake (used when answered correctly or explicitly cleared)
function removeMistake(level, problem) {
    const all = _loadAll();
    const lvl = String(level);
    if (!all[lvl]) return;
    all[lvl] = all[lvl].filter(p => !(p.num1 === problem.num1 && p.num2 === problem.num2 && p.operation === problem.operation && p.result === problem.result));
    _saveAll(all);
}

function _loadAllFacts() {
    const storage = _getStorage();
    try {
        return JSON.parse(storage.getItem(FACTS_KEY)) || {};
    } catch (_e) {
        return {};
    }
}

function _saveAllFacts(obj) {
    const storage = _getStorage();
    storage.setItem(FACTS_KEY, JSON.stringify(obj));
}

// Baut einen kommutativ normalisierten Schlüssel für eine Aufgabe. Addition
// und Multiplikation sind kommutativ, daher werden die Operanden sortiert
// (7 × 8 und 8 × 7 landen auf demselben Schlüssel). Division wird auf die
// zugehörige Multiplikationsaufgabe abgebildet: 56 ÷ 7 = 8 gehört zur
// gleichen Zelle wie 7 × 8, da num2 (Divisor) und result (Quotient) die
// beiden Faktoren sind. Subtraktion ist nicht kommutativ und bleibt
// unverändert.
function normalizeFactKey(problem) {
    const { num1, num2, operation, result } = problem;
    if (operation === '+' || operation === '*') {
        const a = Math.min(num1, num2);
        const b = Math.max(num1, num2);
        return `${a}|${operation}|${b}`;
    }
    if (operation === '/') {
        const a = Math.min(num2, result);
        const b = Math.max(num2, result);
        return `${a}|*|${b}`;
    }
    return `${num1}|${operation}|${num2}`;
}

// Zeichnet einen Lösungsversuch (richtig oder falsch) für die Einmaleins-
// Heatmap auf. Wird für jede beantwortete Aufgabe aufgerufen, unabhängig vom
// Ergebnis (siehe checkAnswer() in script.js).
function recordAttempt(level, problem, isCorrect) {
    const all = _loadAllFacts();
    const lvl = String(level);
    all[lvl] = all[lvl] || {};

    const key = normalizeFactKey(problem);
    const [numA, operation, numB] = key.split('|');
    const fact = all[lvl][key] || {
        num1: Number(numA),
        operation,
        num2: Number(numB),
        correct: 0,
        wrong: 0,
        lastResult: null,
        lastSeen: null
    };

    if (isCorrect) {
        fact.correct += 1;
    } else {
        fact.wrong += 1;
    }
    fact.lastResult = !!isCorrect;
    fact.lastSeen = Date.now();

    all[lvl][key] = fact;
    _saveAllFacts(all);
}

// Liefert alle aufgezeichneten Aufgaben-Fakten für ein Level als Objekt,
// geschlüsselt über normalizeFactKey().
function getFacts(level) {
    const all = _loadAllFacts();
    return all[String(level)] || {};
}

// Liefert den Fakt für eine bestimmte Multiplikationszelle (a × b), egal in
// welcher Reihenfolge a und b übergeben werden. null, wenn die Aufgabe noch
// nie abgefragt wurde.
function getMultiplicationFact(level, a, b) {
    const facts = getFacts(level);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return facts[`${lo}|*|${hi}`] || null;
}

// Klassifiziert einen Fakt für die Heatmap-Einfärbung:
// - 'gray': noch nie abgefragt
// - 'red': zuletzt falsch beantwortet oder mehr falsch als richtig
// - 'green': sicher (mindestens 3 richtig, zuletzt richtig)
// - 'yellow': alles andere (gemischtes Bild)
function classifyFact(fact) {
    if (!fact || (fact.correct === 0 && fact.wrong === 0)) return 'gray';
    if (fact.lastResult === false || fact.wrong > fact.correct) return 'red';
    if (fact.correct >= 3 && fact.lastResult === true) return 'green';
    return 'yellow';
}

// Export für Node.js (Unit Tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addMistake,
        getMistakes,
        peekMistake,
        removeMistake,
        clear,
        recordAttempt,
        getFacts,
        getMultiplicationFact,
        classifyFact,
        normalizeFactKey
    };
}

// Export für Browser
if (typeof window !== 'undefined') {
    window.Weighting = {
        addMistake,
        getMistakes,
        peekMistake,
        removeMistake,
        clear,
        recordAttempt,
        getFacts,
        getMultiplicationFact,
        classifyFact,
        normalizeFactKey
    };
}
