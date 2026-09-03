#!/usr/bin/env node
/**
 * Self-hosted server: static file server + leaderboard API backed by node:sqlite.
 * No external services, no API keys - a single SQLite file is the whole database.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8080;
const DB_PATH = process.env.DB_PATH || '/data/leaderboard.db';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MAX_BODY_SIZE = 10 * 1024; // 10 KB is plenty for a leaderboard submission
const MAX_USERNAME_LENGTH = 40;
const MIN_LEVEL = 0;
const MAX_LEVEL = 5;
const MIN_SCORE = 0;
const MAX_SCORE = 200;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const CONTENT_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// ==================== Database ====================

function ensureDbDirectory(dbPath) {
    if (dbPath === ':memory:') return;
    const dir = path.dirname(dbPath);
    if (dir && dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function openDatabase(dbPath) {
    ensureDbDirectory(dbPath);
    const db = new DatabaseSync(dbPath);
    db.exec(`
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            level INTEGER NOT NULL,
            score INTEGER NOT NULL,
            timestamp TEXT NOT NULL
        )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_leaderboard_level_score ON leaderboard(level, score DESC)');
    return db;
}

function getTopScores(db, level, limit) {
    const stmt = db.prepare(
        'SELECT username, level, score, timestamp FROM leaderboard WHERE level = ? ORDER BY score DESC, timestamp ASC LIMIT ?'
    );
    return stmt.all(level, limit);
}

function getTopScoresAllLevels(db, limit) {
    const stmt = db.prepare(
        'SELECT username, level, score, timestamp FROM leaderboard ORDER BY score DESC, timestamp ASC LIMIT ?'
    );
    return stmt.all(limit);
}

function insertScore(db, { username, level, score }) {
    const timestamp = new Date().toISOString();
    const stmt = db.prepare(
        'INSERT INTO leaderboard (username, level, score, timestamp) VALUES (?, ?, ?, ?)'
    );
    stmt.run(username, level, score, timestamp);
    return { username, level, score, timestamp };
}

// ==================== Validation ====================

function validateSubmission(body) {
    if (!body || typeof body !== 'object') {
        return { error: 'Ungültiger Request-Body' };
    }

    const { username, level, score } = body;

    if (typeof username !== 'string' || username.trim().length === 0) {
        return { error: 'username muss ein nicht-leerer String sein' };
    }
    if (username.length > MAX_USERNAME_LENGTH) {
        return { error: `username darf maximal ${MAX_USERNAME_LENGTH} Zeichen lang sein` };
    }
    if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
        return { error: `level muss eine ganze Zahl zwischen ${MIN_LEVEL} und ${MAX_LEVEL} sein` };
    }
    if (!Number.isInteger(score) || score < MIN_SCORE || score > MAX_SCORE) {
        return { error: `score muss eine ganze Zahl zwischen ${MIN_SCORE} und ${MAX_SCORE} sein` };
    }

    return { value: { username: username.trim(), level, score } };
}

// ==================== Request body parsing ====================

function parseJsonBody(req, maxSize) {
    return new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        let rejected = false;

        req.on('data', chunk => {
            if (rejected) return;
            size += chunk.length;
            if (size > maxSize) {
                rejected = true;
                const err = new Error('Payload too large');
                err.statusCode = 413;
                req.destroy();
                reject(err);
                return;
            }
            body += chunk;
        });
        req.on('end', () => {
            if (rejected) return;
            if (!body) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                const err = new Error('Invalid JSON');
                err.statusCode = 400;
                reject(err);
            }
        });
        req.on('error', (e) => {
            if (!rejected) {
                rejected = true;
                reject(e);
            }
        });
    });
}

// ==================== Rate limiting ====================

function createRateLimiter(windowMs, maxRequests) {
    const hits = new Map();
    return function isRateLimited(key) {
        const now = Date.now();
        const entry = hits.get(key);
        if (!entry || now - entry.windowStart > windowMs) {
            hits.set(key, { windowStart: now, count: 1 });
            return false;
        }
        entry.count += 1;
        return entry.count > maxRequests;
    };
}

// ==================== Static files ====================

function resolveStaticPath(pathname) {
    const publicRoot = path.resolve(PUBLIC_DIR);
    let decoded;
    try {
        decoded = decodeURIComponent(pathname);
    } catch (e) {
        return null;
    }
    const requested = path.resolve(publicRoot, '.' + decoded);
    if (requested !== publicRoot && !requested.startsWith(publicRoot + path.sep)) {
        return null;
    }
    return requested;
}

function serveStaticFile(pathname, res) {
    let filePath = resolveStaticPath(pathname === '/' ? '/index.html' : pathname);

    if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }

        const ext = path.extname(filePath);
        const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
        res.end(data);
    });
}

// ==================== Request handling ====================

function createRequestListener(db) {
    const isRateLimited = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

    return async function requestListener(req, res) {
        let pathname;
        try {
            pathname = new URL(req.url, 'http://localhost').pathname;
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ungültige URL' }));
            return;
        }

        if (CORS_ORIGIN) {
            res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // ---------- Health check ----------
        if (pathname === '/healthz' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
            return;
        }

        // ---------- GET /api/leaderboard/:level ----------
        const levelMatch = pathname.match(/^\/api\/leaderboard\/(\d+)$/);
        if (levelMatch && req.method === 'GET') {
            const level = parseInt(levelMatch[1], 10);
            if (level < MIN_LEVEL || level > MAX_LEVEL) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `level muss zwischen ${MIN_LEVEL} und ${MAX_LEVEL} liegen` }));
                return;
            }
            try {
                const scores = getTopScores(db, level, 10);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(scores));
            } catch (e) {
                console.error('[API] Leaderboard read error:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Interner Serverfehler' }));
            }
            return;
        }

        // ---------- GET /api/leaderboard ----------
        if (pathname === '/api/leaderboard' && req.method === 'GET') {
            try {
                const scores = getTopScoresAllLevels(db, 50);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(scores));
            } catch (e) {
                console.error('[API] Leaderboard read error:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Interner Serverfehler' }));
            }
            return;
        }

        // ---------- POST /api/leaderboard/submit ----------
        if (pathname === '/api/leaderboard/submit' && req.method === 'POST') {
            const ip = req.socket.remoteAddress || 'unknown';
            if (isRateLimited(ip)) {
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Zu viele Anfragen, bitte später erneut versuchen' }));
                return;
            }

            let body;
            try {
                body = await parseJsonBody(req, MAX_BODY_SIZE);
            } catch (e) {
                const statusCode = e.statusCode || 400;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: statusCode === 413 ? 'Payload zu groß' : 'Ungültiges JSON' }));
                return;
            }

            const { error, value } = validateSubmission(body);
            if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error }));
                return;
            }

            try {
                const entry = insertScore(db, value);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: entry }));
            } catch (e) {
                console.error('[API] Leaderboard submit error:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Interner Serverfehler' }));
            }
            return;
        }

        // ---------- Static files ----------
        if (req.method === 'GET' || req.method === 'HEAD') {
            serveStaticFile(pathname, res);
            return;
        }

        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    };
}

// ==================== Exports (for tests) ====================

module.exports = {
    openDatabase,
    getTopScores,
    getTopScoresAllLevels,
    insertScore,
    validateSubmission,
    parseJsonBody,
    createRateLimiter,
    resolveStaticPath,
    createRequestListener,
    MIN_LEVEL,
    MAX_LEVEL,
    MIN_SCORE,
    MAX_SCORE,
    MAX_USERNAME_LENGTH
};

// ==================== Bootstrap ====================

if (require.main === module) {
    process.on('unhandledRejection', (reason) => {
        console.error('[UnhandledRejection]', reason);
    });

    console.log(`[Config] DB_PATH: ${DB_PATH}`);

    let db;
    try {
        db = openDatabase(DB_PATH);
    } catch (err) {
        console.error(`\n❌ Konnte die SQLite-Datenbank nicht öffnen: ${DB_PATH}`);
        console.error(`   ${err.message}`);
        console.error(`\nMeist liegt das daran, dass "${path.dirname(DB_PATH)}" nicht existiert oder für den`);
        console.error('Container-User "node" (UID 1000) nicht beschreibbar ist - z.B. weil ein');
        console.error('gemountetes Host-Verzeichnis einem anderen User gehört. Auf dem Host beheben mit:');
        console.error(`   chown -R 1000:1000 <host-verzeichnis>\n`);
        process.exit(1);
    }

    const server = http.createServer(createRequestListener(db));

    server.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 Datenbank: ${DB_PATH}`);
        console.log('📝 API Routes:');
        console.log('   GET  /api/leaderboard/:level    - Top 10 scores for level');
        console.log('   GET  /api/leaderboard           - Top 50 scores all levels');
        console.log('   POST /api/leaderboard/submit     - Submit a score');
        console.log('   GET  /healthz                    - Health check\n');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use`);
        } else {
            console.error('Server error:', err);
        }
        process.exit(1);
    });

    process.on('SIGINT', () => {
        console.log('\nServer stopped');
        db.close();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        db.close();
        process.exit(0);
    });
}
