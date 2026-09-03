// Unit Tests für server.js (SQLite-Leaderboard-Backend)

const assert = require('assert');
const {
    openDatabase,
    getTopScores,
    getTopScoresAllLevels,
    insertScore,
    validateSubmission,
    parseJsonBody,
    createRateLimiter,
    resolveStaticPath
} = require('../server.js');

let failures = 0;

function check(description, fn) {
    try {
        fn();
        console.log(`✓ ${description}`);
    } catch (error) {
        failures++;
        console.error(`❌ ${description}`);
        console.error(`   ${error.message}`);
    }
}

async function checkAsync(description, fn) {
    try {
        await fn();
        console.log(`✓ ${description}`);
    } catch (error) {
        failures++;
        console.error(`❌ ${description}`);
        console.error(`   ${error.message}`);
    }
}

function testValidation() {
    console.log('\n--- TEST: validateSubmission ---');

    check('akzeptiert eine gültige Submission', () => {
        const { error, value } = validateSubmission({ username: 'Panda42', level: 2, score: 15 });
        assert.strictEqual(error, undefined);
        assert.deepStrictEqual(value, { username: 'Panda42', level: 2, score: 15 });
    });

    check('trimmt Whitespace im username', () => {
        const { value } = validateSubmission({ username: '  Panda42  ', level: 0, score: 0 });
        assert.strictEqual(value.username, 'Panda42');
    });

    check('lehnt leeren username ab', () => {
        const { error } = validateSubmission({ username: '   ', level: 0, score: 0 });
        assert.ok(error);
    });

    check('lehnt fehlenden username ab', () => {
        const { error } = validateSubmission({ level: 0, score: 0 });
        assert.ok(error);
    });

    check('lehnt username über 40 Zeichen ab', () => {
        const { error } = validateSubmission({ username: 'x'.repeat(41), level: 0, score: 0 });
        assert.ok(error);
    });

    check('akzeptiert username mit genau 40 Zeichen', () => {
        const { error } = validateSubmission({ username: 'x'.repeat(40), level: 0, score: 0 });
        assert.strictEqual(error, undefined);
    });

    check('lehnt level außerhalb 0-5 ab', () => {
        assert.ok(validateSubmission({ username: 'a', level: -1, score: 0 }).error);
        assert.ok(validateSubmission({ username: 'a', level: 6, score: 0 }).error);
    });

    check('lehnt nicht-ganzzahliges level ab', () => {
        assert.ok(validateSubmission({ username: 'a', level: 1.5, score: 0 }).error);
        assert.ok(validateSubmission({ username: 'a', level: '1', score: 0 }).error);
    });

    check('lehnt score außerhalb 0-200 ab', () => {
        assert.ok(validateSubmission({ username: 'a', level: 0, score: -1 }).error);
        assert.ok(validateSubmission({ username: 'a', level: 0, score: 201 }).error);
    });

    check('akzeptiert score-Grenzwerte 0 und 200', () => {
        assert.strictEqual(validateSubmission({ username: 'a', level: 0, score: 0 }).error, undefined);
        assert.strictEqual(validateSubmission({ username: 'a', level: 0, score: 200 }).error, undefined);
    });

    check('lehnt nicht-ganzzahligen score ab', () => {
        assert.ok(validateSubmission({ username: 'a', level: 0, score: 'lol' }).error);
        assert.ok(validateSubmission({ username: 'a', level: 0, score: 1.5 }).error);
    });

    check('lehnt fehlenden Body ab', () => {
        assert.ok(validateSubmission(null).error);
        assert.ok(validateSubmission(undefined).error);
    });
}

function testDatabase() {
    console.log('\n--- TEST: SQLite-Zugriff ---');

    check('legt das Schema an und erlaubt Insert + Read', () => {
        const db = openDatabase(':memory:');
        try {
            insertScore(db, { username: 'Alice', level: 1, score: 10 });
            insertScore(db, { username: 'Bob', level: 1, score: 20 });
            insertScore(db, { username: 'Carol', level: 2, score: 5 });

            const level1 = getTopScores(db, 1, 10);
            assert.strictEqual(level1.length, 2);
            // Höchster Score zuerst
            assert.strictEqual(level1[0].username, 'Bob');
            assert.strictEqual(level1[1].username, 'Alice');

            const level2 = getTopScores(db, 2, 10);
            assert.strictEqual(level2.length, 1);
            assert.strictEqual(level2[0].username, 'Carol');
        } finally {
            db.close();
        }
    });

    check('respektiert das limit', () => {
        const db = openDatabase(':memory:');
        try {
            for (let i = 0; i < 15; i++) {
                insertScore(db, { username: `Player${i}`, level: 0, score: i });
            }
            const top = getTopScores(db, 0, 10);
            assert.strictEqual(top.length, 10);
            assert.strictEqual(top[0].score, 14);
        } finally {
            db.close();
        }
    });

    check('getTopScoresAllLevels liefert Level-übergreifend sortiert', () => {
        const db = openDatabase(':memory:');
        try {
            insertScore(db, { username: 'Alice', level: 0, score: 10 });
            insertScore(db, { username: 'Bob', level: 3, score: 50 });
            const all = getTopScoresAllLevels(db, 50);
            assert.strictEqual(all.length, 2);
            assert.strictEqual(all[0].username, 'Bob');
        } finally {
            db.close();
        }
    });

    check('CREATE TABLE IF NOT EXISTS ist idempotent (Neuöffnen derselben Datei-DB)', () => {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const dbPath = path.join(os.tmpdir(), `schnechnen-server-test-${Date.now()}.db`);
        try {
            const db1 = openDatabase(dbPath);
            insertScore(db1, { username: 'Persisted', level: 4, score: 33 });
            db1.close();

            const db2 = openDatabase(dbPath);
            const scores = getTopScores(db2, 4, 10);
            assert.strictEqual(scores.length, 1);
            assert.strictEqual(scores[0].username, 'Persisted');
            db2.close();
        } finally {
            fs.rmSync(dbPath, { force: true });
        }
    });
}

async function testParseJsonBody() {
    console.log('\n--- TEST: parseJsonBody ---');

    function fakeRequest(chunks) {
        const listeners = {};
        const req = {
            on(event, handler) {
                listeners[event] = handler;
                return req;
            },
            destroy() {
                this.destroyed = true;
            }
        };
        setImmediate(() => {
            chunks.forEach(chunk => listeners.data && listeners.data(Buffer.from(chunk)));
            listeners.end && listeners.end();
        });
        return req;
    }

    await checkAsync('parst gültiges JSON', async () => {
        const body = await parseJsonBody(fakeRequest(['{"a":1}']), 1024);
        assert.deepStrictEqual(body, { a: 1 });
    });

    await checkAsync('liefert {} für leeren Body', async () => {
        const body = await parseJsonBody(fakeRequest([]), 1024);
        assert.deepStrictEqual(body, {});
    });

    await checkAsync('lehnt ungültiges JSON mit statusCode 400 ab', async () => {
        try {
            await parseJsonBody(fakeRequest(['not json']), 1024);
            throw new Error('sollte werfen');
        } catch (e) {
            assert.strictEqual(e.statusCode, 400);
        }
    });

    await checkAsync('lehnt zu große Bodies mit statusCode 413 ab', async () => {
        try {
            await parseJsonBody(fakeRequest(['x'.repeat(2000)]), 10);
            throw new Error('sollte werfen');
        } catch (e) {
            assert.strictEqual(e.statusCode, 413);
        }
    });
}

function testRateLimiter() {
    console.log('\n--- TEST: createRateLimiter ---');

    check('lässt Anfragen bis zum Limit durch und blockt danach', () => {
        const isRateLimited = createRateLimiter(60000, 3);
        assert.strictEqual(isRateLimited('1.2.3.4'), false);
        assert.strictEqual(isRateLimited('1.2.3.4'), false);
        assert.strictEqual(isRateLimited('1.2.3.4'), false);
        assert.strictEqual(isRateLimited('1.2.3.4'), true);
    });

    check('behandelt unterschiedliche IPs unabhängig voneinander', () => {
        const isRateLimited = createRateLimiter(60000, 1);
        assert.strictEqual(isRateLimited('1.1.1.1'), false);
        assert.strictEqual(isRateLimited('2.2.2.2'), false);
    });
}

function testResolveStaticPath() {
    console.log('\n--- TEST: resolveStaticPath (Path Traversal Schutz) ---');

    check('löst normale Pfade innerhalb von public/ auf', () => {
        const resolved = resolveStaticPath('/style.css');
        assert.ok(resolved.endsWith(require('path').join('public', 'style.css')));
    });

    check('blockt Path Traversal mit ../', () => {
        const resolved = resolveStaticPath('/../server.js');
        assert.strictEqual(resolved, null);
    });

    check('blockt tiefe Path Traversal Versuche', () => {
        const resolved = resolveStaticPath('/../../../../etc/passwd');
        assert.strictEqual(resolved, null);
    });

    check('blockt encodierte Path Traversal Versuche', () => {
        const resolved = resolveStaticPath('/..%2f..%2fserver.js');
        // '%2f' bleibt nach decodeURIComponent ein Slash, muss also ebenfalls geblockt werden
        assert.strictEqual(resolved, null);
    });
}

async function runServerTests() {
    console.log('Starte Server Unit Tests (SQLite-Backend)...');

    testValidation();
    testDatabase();
    await testParseJsonBody();
    testRateLimiter();
    testResolveStaticPath();

    console.log(`\nServer-Tests abgeschlossen: ${failures === 0 ? 'alle bestanden ✓' : `${failures} fehlgeschlagen ❌`}`);

    if (failures > 0) {
        process.exitCode = 1;
    }
}

runServerTests();
