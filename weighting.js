// Simple weighting store for mistakes. Uses localStorage when available, otherwise an in-memory store.
const KEY = 'schnechnen-mistakes';

function _getStorage() {
    try {
        if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) {}
    // fallback in-memory
    if (!global.__SCHNECHEN_MEM_STORE) global.__SCHNECHEN_MEM_STORE = {};
    return {
        getItem: (k) => global.__SCHNECHEN_MEM_STORE[k] || null,
        setItem: (k, v) => { global.__SCHNECHEN_MEM_STORE[k] = v; }
    };
}

function _loadAll() {
    const storage = _getStorage();
    try {
        return JSON.parse(storage.getItem(KEY)) || {};
    } catch (e) {
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

module.exports = {
    addMistake,
    getMistakes,
    peekMistake,
    removeMistake,
    clear
};
