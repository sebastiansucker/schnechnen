#!/usr/bin/env node
/**
 * Server with Supabase config injection and secure API routes
 * Reads SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY from environment
 * - ANON_KEY: Used by frontend for INSERT (visible in browser, but only for writes)
 * - SERVICE_ROLE_KEY: Used by backend for SELECT (secret, never exposed to browser)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 8080;

// Supabase configuration (hardcoded for development)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://buncjjcbmvwindpyhnhs.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bmNqamNibXZ3aW5kcHlobmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODQzMjUsImV4cCI6MjA3ODQ2MDMyNX0.sla1FQMlqpnoNq2ebjLBHJpvau_N6DzBw2i511uD2YI';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bmNqamNibXZ3aW5kcHlobmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4NDMyNSwiZXhwIjoyMDc4NDYwMzI1fQ.IQxP-qEVgspURphRJg0o6do_U2KsfJOz7Lh9uBdfr9k';

console.log('[Config] Supabase configuration:');
console.log(`[Config] SUPABASE_URL: ${SUPABASE_URL ? '✓ Set' : '✗ Not set'}`);
console.log(`[Config] SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set'}`);
console.log(`[Config] SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Not set'}`);

// Initialize Supabase client with SERVICE_ROLE_KEY for backend operations
let supabaseServer = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('[Supabase] ✓ Server client initialized with SERVICE_ROLE_KEY');
} else {
    console.warn('[Supabase] ✗ Service Role Key missing - leaderboard reads will not work');
}

// Read index.html once at startup
const indexHtmlPath = path.join(__dirname, 'index.html');
let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Inject Supabase config directly into the HTML (ANON_KEY only - for writes)
const configScript = `<script>
        window.SUPABASE_CONFIG = {
            url: "${SUPABASE_URL.replace(/"/g, '\\"')}",
            anonKey: "${SUPABASE_ANON_KEY.replace(/"/g, '\\"')}"
        };
        console.log('[Init] Supabase config injected:', window.SUPABASE_CONFIG);
    </script>`;

// Insert config script right after the opening <head> tag
indexHtmlContent = indexHtmlContent.replace(
    /(<head[^>]*>)/i,
    '$1\n    ' + configScript
);

// Helper function to parse JSON request body
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
    });
}

// Create custom HTTP server
const server = http.createServer(async (req, res) => {
    const pathname = url.parse(req.url).pathname;
    const query = url.parse(req.url, true).query;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // ==================== API ROUTES ====================
    
    // GET /api/leaderboard/:level - Get top scores for a level
    if (pathname.match(/^\/api\/leaderboard\/\d+$/) && req.method === 'GET') {
        const level = parseInt(pathname.split('/')[3]);
        
        if (!supabaseServer) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service not configured' }));
            return;
        }
        
        try {
            const { data, error } = await supabaseServer
                .from('leaderboard')
                .select('username, level, score, timestamp')
                .eq('level', level)
                .order('score', { ascending: false })
                .limit(10);
            
            if (error) {
                console.error('[API] Leaderboard read error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data || []));
        } catch (e) {
            console.error('[API] Error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }
    
    // GET /api/leaderboard - Get top scores for all levels
    if (pathname === '/api/leaderboard' && req.method === 'GET') {
        if (!supabaseServer) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service not configured' }));
            return;
        }
        
        try {
            const { data, error } = await supabaseServer
                .from('leaderboard')
                .select('username, level, score, timestamp')
                .order('score', { ascending: false })
                .limit(50);
            
            if (error) {
                console.error('[API] Leaderboard read error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data || []));
        } catch (e) {
            console.error('[API] Error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }
    
    // ==================== STATIC FILES ====================
    
    // Serve index.html with injected config
    if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
        res.end(indexHtmlContent);
        return;
    }
    
    // Also serve supabase-config.js for backward compatibility
    if (pathname === '/supabase-config.js') {
        const configContent = `const SUPABASE_CONFIG = {
  url: "${SUPABASE_URL.replace(/"/g, '\\"')}",
  anonKey: "${SUPABASE_ANON_KEY.replace(/"/g, '\\"')}"
};`;
        res.writeHead(200, { 'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*' });
        res.end(configContent);
        return;
    }
    
    // For all other files, serve them normally
    let filePath = path.join(__dirname, pathname);
    
    // Handle directory requests
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        
        // Get content type
        const ext = path.extname(filePath);
        const contentTypes = {
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
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}\n`);
    console.log('📝 API Routes:');
    console.log(`   GET  /api/leaderboard/:level    - Top 10 scores for level`);
    console.log(`   GET  /api/leaderboard           - Top 50 scores all levels\n`);
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
    process.exit(0);
});

