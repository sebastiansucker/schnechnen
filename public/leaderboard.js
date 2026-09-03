// ==================== Leaderboard Module ====================
// Anonymous player management and leaderboard submission

const Leaderboard = (() => {
    const STORAGE_KEY = 'schnechnen-username';
    
    // Adjectives for random name generation (German, cute, nominative singular)
    const adjectives = [
        'Süßer', 'Flauschiger', 'Froher', 'Lustiger', 'Schneller', 'Wilder', 'Mutiger',
        'Kluger', 'Stiller', 'Starker', 'Sanfter', 'Lieber', 'Kecker', 'Tapferer',
        'Zierlicher', 'Goldener', 'Silberner', 'Zarter', 'Kühler', 'Warmer',
        'Hüpfender', 'Verspielter', 'Frecher', 'Schlauerr', 'Träumerischer', 'Würdiger',
        'Schneller', 'Quirliger', 'Verschmitzter', 'Zauberhafter', 'Mystischer', 'Heiterer',
        'Märchenhafter', 'Witziger', 'Flinkerer', 'Strahlender', 'Glücklicher', 'Ewiger'
    ];
    
    // Animals for random name generation (German, cute, masculine nominative singular only - "der ...")
    const animals = [
        'Panda', 'Tiger', 'Adler', 'Delfin', 'Wolf', 'Löwe', 'Fuchs',
        'Bär', 'Habicht', 'Pinguin', 'Häschen', 'Otter', 'Phoenix',
        'Drache', 'Rabe', 'Gepard', 'Wal', 'Luchs', 'Kobra', 'Storch',
        'Jaguar', 'Dachs', 'Kojote', 'Falke', 'Igel', 'Leguan',
        'Schakal', 'Koala', 'Lemur', 'Elch', 'Narwal', 'Ozelot',
        'Waschbär', 'Papagei', 'Kuckuck', 'Sperling', 'Specht', 'Kranich', 'Pfau'
    ];
    
    /**
     * Generates a random anonymous username
     * Format: "Adjective" + " " + "Animal" + random 2-digit number
     * Example: "Süßer Panda42", "Flauschiger Häschen15"
     * @returns {string} Random username
     */
    function generateRandomName() {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const num = Math.floor(Math.random() * 100);
        return `${adj} ${animal}${num}`;
    }
    
    /**
     * Gets or creates the current player's username
     * Stored in localStorage, persists across sessions
     * @returns {string} The player's username
     */
    function getUsername() {
        try {
            let username = localStorage.getItem(STORAGE_KEY);
            if (!username) {
                username = generateRandomName();
                localStorage.setItem(STORAGE_KEY, username);
            }
            return username;
        } catch (e) {
            console.warn('localStorage not available, generating temporary username');
            return generateRandomName();
        }
    }
    
    /**
     * Resets the player's username (generates a new one)
     * Called when user explicitly requests a new identity
     * @returns {string} The new username
     */
    function resetUsername() {
        try {
            const newUsername = generateRandomName();
            localStorage.setItem(STORAGE_KEY, newUsername);
            return newUsername;
        } catch (e) {
            console.warn('Could not reset username:', e);
            return generateRandomName();
        }
    }
    
    /**
     * Gets the current username without generating if not exists
     * @returns {string|null} The username or null if not set
     */
    function getCurrentUsername() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }
    
    // Public API
    return {
        generateRandomName,
        getUsername,
        resetUsername,
        getCurrentUsername
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.Leaderboard = Leaderboard;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Leaderboard;
}
