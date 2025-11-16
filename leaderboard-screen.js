// ==================== Leaderboard Screen Logic ====================
// Handles UI interactions and data loading for the leaderboard screen

const LeaderboardScreen = (() => {
    let currentLevel = 0;
    
    /**
     * Initialize leaderboard screen event listeners
     */
    function init() {
        // Level selector buttons
        const levelBtns = document.querySelectorAll('#leaderboard-screen .stats-level-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.dataset.level);
                selectLevel(level);
            });
        });
        
        // Back button
        const backBtn = document.getElementById('leaderboard-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof showScreen === 'function') {
                    showScreen('start');
                }
            });
        }
        
        // Reset name button
        const resetNameBtn = document.getElementById('player-reset-name-btn');
        if (resetNameBtn) {
            resetNameBtn.addEventListener('click', () => {
                if (window.Leaderboard) {
                    window.Leaderboard.resetUsername();
                    updatePlayerName();
                }
            });
        }
        
        // Set initial level
        selectLevel(0);
    }
    
    /**
     * Change the active level tab and load leaderboard
     */
    function selectLevel(level) {
        if (level < 0 || level > 5) return;
        currentLevel = level;
        
        // Update active button
        document.querySelectorAll('#leaderboard-screen .stats-level-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.level) === level) {
                btn.classList.add('active');
            }
        });
        
        // Load and display leaderboard
        loadLeaderboard(level);
    }
    
    /**
     * Load and display top scores for a level
     */
    async function loadLeaderboard(level) {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;
        
        // Show loading state
        list.innerHTML = '<li class="leaderboard-loading">Lade Rekorde...</li>';
        
        try {
            let scores = [];
            
            // Try backend API first (for local development with Node.js server)
            // Use AbortController with 2 second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            try {
                const response = await fetch(`/api/leaderboard/${level}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    scores = await response.json();
                    console.log('[Leaderboard] Loaded from backend API');
                }
            } catch (e) {
                clearTimeout(timeoutId);
                // Backend not available, try direct Supabase
                console.warn('[Leaderboard] Backend API not available, using direct Supabase:', e.message);
            }
            
            // If backend didn't work, try direct Supabase connection
            if (!scores || scores.length === 0) {
                // Wait a moment for Supabase client to be ready
                let retries = 0;
                while (!window.supabaseClient && retries < 50) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    retries++;
                }
                
                if (window.supabaseClient) {
                    try {
                        console.log('[Leaderboard] Fetching from Supabase for level', level);
                        const { data, error } = await window.supabaseClient
                            .from('leaderboard')
                            .select('username, level, score, timestamp')
                            .eq('level', level)
                            .order('score', { ascending: false })
                            .limit(10);
                        
                        if (error) {
                            console.warn('[Leaderboard] Supabase error:', error);
                            scores = [];
                        } else {
                            scores = data || [];
                            console.log('[Leaderboard] Loaded from Supabase:', scores.length, 'scores');
                        }
                    } catch (e) {
                        console.warn('[Leaderboard] Supabase connection failed:', e.message);
                        scores = [];
                    }
                } else {
                    console.warn('[Leaderboard] Supabase client not available after retry');
                }
            }
            
            // Render results
            if (!scores || scores.length === 0) {
                list.innerHTML = '<li class="leaderboard-empty">📭 Noch keine Scores für dieses Level</li>';
                return;
            }
            
            // Render leaderboard
            list.innerHTML = '';
            scores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'leaderboard-item';
                
                const rank = index + 1;
                const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
                
                // Format timestamp
                let timeStr = '';
                if (entry.timestamp) {
                    try {
                        const date = new Date(entry.timestamp);
                        timeStr = date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
                    } catch (e) {
                        timeStr = '';
                    }
                }
                
                li.innerHTML = `
                    <div class="leaderboard-rank ${rankClass}">${rank}</div>
                    <div class="leaderboard-player-info">
                        <div class="leaderboard-player-name">${escapeHtml(entry.username)}</div>
                        ${timeStr ? `<div class="leaderboard-date">${timeStr}</div>` : ''}
                    </div>
                    <div class="leaderboard-player-score">
                        <span class="leaderboard-score">${entry.score}</span>
                    </div>
                `;
                list.appendChild(li);
            });
        } catch (e) {
            console.error('Error loading leaderboard:', e);
            list.innerHTML = '<li class="leaderboard-empty">🌐 Rekord-Server nicht erreichbar. Bitte später versuchen.</li>';
        }
    }
    
    /**
     * Update displayed player username
     */
    function updatePlayerName() {
        const usernameEl = document.getElementById('player-username');
        if (usernameEl && window.Leaderboard) {
            const username = window.Leaderboard.getUsername();
            usernameEl.textContent = escapeHtml(username);
        }
    }
    
    /**
     * Show leaderboard screen
     */
    function show() {
        if (typeof showScreen === 'function') {
            showScreen('leaderboard');
            updatePlayerName();
            loadLeaderboard(currentLevel);
        }
    }
    
    /**
     * Simple HTML escape to prevent XSS
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    // Public API
    return {
        init,
        selectLevel,
        loadLeaderboard,
        updatePlayerName,
        show
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay initialization slightly to ensure showScreen is defined
        setTimeout(() => {
            if (typeof LeaderboardScreen !== 'undefined') {
                LeaderboardScreen.init();
            }
        }, 100);
    });
} else {
    // DOM already loaded - delay to ensure showScreen is defined
    setTimeout(() => {
        if (typeof LeaderboardScreen !== 'undefined') {
            LeaderboardScreen.init();
        }
    }, 100);
}

// Make available globally
if (typeof window !== 'undefined') {
    window.LeaderboardScreen = LeaderboardScreen;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardScreen;
}
