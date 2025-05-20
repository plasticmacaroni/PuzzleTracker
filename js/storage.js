class Storage {
    constructor() {
        this.data = {
            gameResults: {},
            hiddenGames: [],
            lastUpdated: new Date().toISOString()
        };
        this.initialize();

        // Wait for DOM content loaded to ensure GAMES is defined
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Try to load games schema after page is fully loaded
                setTimeout(() => this.loadGamesSchema(), 100);
            });
        } else {
            // If DOM is already loaded, try after a short delay
            setTimeout(() => this.loadGamesSchema(), 100);
        }
    }

    // Helper function to get today's date in local timezone
    getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async initialize() {
        try {
            this.data = await this.loadData();
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }

    async loadData() {
        console.log('Loading data...');
        // Load from localStorage
        const savedData = localStorage.getItem('guessrTrackerData');
        if (savedData) {
            console.log('Data loaded from localStorage');
            return JSON.parse(savedData);
        }

        // If no data found, return empty data
        console.log('No data found, using empty data');
        return {
            gameResults: {},
            hiddenGames: [],
            lastUpdated: new Date().toISOString()
        };
    }

    async saveData() {
        this.data.lastUpdated = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem('guessrTrackerData', JSON.stringify(this.data));
        console.log('Data saved to localStorage');
    }

    saveGamesSchema(games) {
        localStorage.setItem('guessrTrackerGames', JSON.stringify(games));
        console.log('Games schema saved to localStorage');
    }

    loadGamesSchema() {
        const savedGames = localStorage.getItem('guessrTrackerGames');
        if (savedGames) {
            try {
                const parsedGames = JSON.parse(savedGames);
                if (Array.isArray(parsedGames) && parsedGames.length > 0 && typeof window.GAMES !== 'undefined') {
                    // Clear existing games and replace with saved ones
                    window.GAMES.length = 0;
                    window.GAMES.push(...parsedGames);
                    console.log('Games schema loaded from localStorage');
                    return true;
                }
            } catch (error) {
                console.error('Error parsing saved games schema:', error);
            }
        }
        return false;
    }

    addGameResult(gameId, rawOutput) {
        if (!this.data.gameResults[gameId]) {
            this.data.gameResults[gameId] = [];
        }

        const today = this.getLocalDateString();

        // Check if we already have a result for today
        const existingIndex = this.data.gameResults[gameId].findIndex(result => result.date === today);

        if (existingIndex !== -1) {
            // Update existing result
            this.data.gameResults[gameId][existingIndex].rawOutput = rawOutput;
            app.showToast('Updated', 'Today\'s result has been updated', 'info');
        } else {
            // Add new result
            this.data.gameResults[gameId].push({
                date: today,
                rawOutput: rawOutput
            });
        }

        this.saveData();
    }

    updateGameResult(gameId, oldDate, rawOutput, newDate = oldDate) {
        const results = this.data.gameResults[gameId];
        if (!results) return;

        const index = results.findIndex(result => result.date === oldDate);
        if (index === -1) return;

        // If the date is changing, check for conflicts
        if (oldDate !== newDate) {
            const existingResult = results.find(result => result.date === newDate);
            if (existingResult) {
                throw new Error('A result already exists for this date');
            }
        }

        results[index] = {
            date: newDate,
            rawOutput: rawOutput
        };

        this.saveData();
        app.showToast('Success', 'Result updated successfully', 'success');
    }

    deleteGameResult(gameId, date) {
        const results = this.data.gameResults[gameId];
        if (!results) return;

        const index = results.findIndex(result => result.date === date);
        if (index === -1) return;

        results.splice(index, 1);
        this.saveData();
        app.showToast('Success', 'Result deleted successfully', 'success');
    }

    getGameResults(gameId) {
        return this.data.gameResults[gameId] || [];
    }

    getGameAverage(gameId, field, days = 30) {
        const results = this.getGameResults(gameId);
        if (results.length === 0) return null;

        // Get the last N days of results
        const today = new Date();
        const cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - days);

        try {
            const game = window.GAMES.find(g => g.id === gameId);
            if (!game) {
                console.error(`[STATS ERROR] Game not found: ${gameId}`);
                return null;
            }
            if (!game.average_display || game.average_display.field !== field) {
                console.error(`[STATS ERROR] Invalid average field: ${field} for game ${gameId}`);
            }

            // Parse and filter results
            const validResults = results
                .filter(result => new Date(result.date) >= cutoffDate)
                .map(result => {
                    try {
                        const parsed = parser.parse(gameId, result.rawOutput);
                        // Only exclude results that were explicitly failures
                        // If there's no CompletionState, include the result
                        if (parsed.CompletionState === false) {
                            console.log(`[STATS] Excluding failed result for ${gameId} on ${result.date}`);
                            return null;
                        }

                        if (parsed[field] === undefined) {
                            console.error(`[STATS ERROR] Field ${field} not found in parsed result for ${gameId} on ${result.date}`);
                            return null;
                        }

                        return parsed[field];
                    } catch (error) {
                        console.error(`[STATS ERROR] Parsing error for ${gameId} on ${result.date}:`, error);
                        return null;
                    }
                })
                .filter(value => value !== null);

            // Handle even single results for games that are just starting 
            if (validResults.length === 0) {
                console.warn(`[STATS] No valid results for ${gameId} with field ${field}`);
                return null;
            }

            // For games with just one result, still show the average
            if (validResults.length === 1) return validResults[0];

            // Calculate average
            const sum = validResults.reduce((a, b) => a + b, 0);
            const avg = sum / validResults.length;

            // Get the game's average display template
            if (game && game.average_display && game.average_display.template) {
                // Check if the template has a format specifier like {avg:([^}]+)}
                const formatMatch = game.average_display.template.match(/{avg:([^}]+)}/);
                if (formatMatch) {
                    const formatStr = formatMatch[1];
                    // Handle common format specifiers
                    if (formatStr.includes(',.0f')) {
                        // Format with commas and no decimal places
                        return avg.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                    } else if (formatStr.includes(',.1f')) {
                        // Format with commas and one decimal place
                        return avg.toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        });
                    } else if (formatStr.includes(',.2f')) {
                        // Format with commas and two decimal places
                        return avg.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                }
            }

            // Default format: trim trailing zeros
            return Number(avg.toFixed(1)).toString();
        } catch (error) {
            console.error(`[STATS ERROR] Fatal error calculating average for ${gameId}:`, error);
            return null;
        }
    }

    isGameCompletedToday(gameId) {
        const results = this.getGameResults(gameId);
        const today = this.getLocalDateString();
        return results.some(result => result.date === today);
    }

    exportData() {
        // Enhanced export that includes both user data and custom games
        const exportData = {
            userData: this.data,
            customGames: this.getCustomGames()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `guessr-tracker-export-${this.getLocalDateString()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        app.showToast('Success', 'Data exported successfully', 'success');
    }

    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // Check for new export format (with userData and customGames)
                    if (importedData.userData && importedData.customGames) {
                        // Handle new format
                        if (!importedData.userData.gameResults || !importedData.userData.lastUpdated) {
                            throw new Error('Invalid user data format');
                        }

                        // Import user data
                        this.data = importedData.userData;

                        // Ensure hiddenGames exists
                        if (!this.data.hiddenGames) {
                            this.data.hiddenGames = [];
                        }

                        // Import custom games by merging with existing games
                        this.mergeCustomGames(importedData.customGames);
                    }
                    // Check for old export format (direct data)
                    else if (importedData.gameResults && importedData.lastUpdated) {
                        // Handle legacy format (just user data)
                        this.data = importedData;

                        // Ensure hiddenGames exists for legacy imports
                        if (!this.data.hiddenGames) {
                            this.data.hiddenGames = [];
                        }
                    }
                    else {
                        throw new Error('Invalid data format');
                    }

                    this.saveData();
                    resolve();
                } catch (error) {
                    reject(new Error('Invalid file format: ' + error.message));
                }
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    // Get custom games (games not in the default set)
    getCustomGames() {
        if (!window.GAMES_DEFAULT || !Array.isArray(window.GAMES_DEFAULT)) {
            return [];
        }

        const defaultGameIds = new Set(window.GAMES_DEFAULT.map(game => game.id));
        return window.GAMES.filter(game => !defaultGameIds.has(game.id));
    }

    // Merge imported custom games with existing games
    mergeCustomGames(customGames) {
        if (!Array.isArray(customGames) || customGames.length === 0) {
            return;
        }

        // Get current custom games
        const currentCustomGames = this.getCustomGames();
        const currentCustomGameIds = new Set(currentCustomGames.map(game => game.id));

        // Start with default games
        const newGames = [...window.GAMES_DEFAULT];

        // Add current custom games
        currentCustomGames.forEach(game => {
            newGames.push(game);
        });

        // Add imported custom games that don't already exist
        customGames.forEach(importedGame => {
            if (!currentCustomGameIds.has(importedGame.id)) {
                newGames.push(importedGame);
            }
        });

        // Update window.GAMES and save
        window.GAMES.length = 0;
        window.GAMES.push(...newGames);

        this.saveGamesSchema(window.GAMES);
    }

    // Enhanced method to safely update game schema
    updateGameSchema(newDefaultGames) {
        // Only run if we have new default games
        if (!Array.isArray(newDefaultGames) || newDefaultGames.length === 0) {
            return false;
        }

        // Create map of default games by ID for easy access
        const defaultGamesMap = new Map();
        newDefaultGames.forEach(game => {
            defaultGamesMap.set(game.id, game);
        });

        // Get custom (user-added) games
        const customGames = this.getCustomGames();

        // Start with updated default games
        const updatedGames = [...newDefaultGames];

        // Add user's custom games
        customGames.forEach(game => {
            updatedGames.push(game);
        });

        // Update window.GAMES and save
        window.GAMES.length = 0;
        window.GAMES.push(...updatedGames);

        // Update the default games reference
        window.GAMES_DEFAULT = JSON.parse(JSON.stringify(newDefaultGames));

        // Save to localStorage
        this.saveGamesSchema(window.GAMES);
        return true;
    }

    validResults(gameId, results) {
        return results.filter(result => {
            try {
                const parsed = parser.parse(gameId, result.rawOutput);
                return parsed && Object.keys(parsed).length > 0;
            } catch (error) {
                const game = window.GAMES ? window.GAMES.find(g => g.id === gameId) : null;
                const gameName = game ? game.name : gameId;
                console.error(`Error parsing result for ${gameName} (${gameId}) on ${result.date}:`, error);
                return false;
            }
        });
    }

    // Game hiding/showing methods
    hideGame(gameId) {
        const game = window.GAMES.find(g => g.id === gameId);
        if (!game) return false;

        // Get hidden games array
        if (!this.data.hiddenGames) {
            this.data.hiddenGames = [];
        }

        // Add to hidden games if not already there
        if (!this.data.hiddenGames.includes(gameId)) {
            this.data.hiddenGames.push(gameId);
            this.saveData();
            return true;
        }

        return false;
    }

    unhideGame(gameId) {
        // Check if hiddenGames exists
        if (!this.data.hiddenGames) {
            this.data.hiddenGames = [];
            return false;
        }

        // Find index of game in hiddenGames
        const index = this.data.hiddenGames.indexOf(gameId);
        if (index !== -1) {
            this.data.hiddenGames.splice(index, 1);
            this.saveData();
            return true;
        }

        return false;
    }

    getHiddenGames() {
        return this.data.hiddenGames || [];
    }

    isGameHidden(gameId) {
        return this.data.hiddenGames && this.data.hiddenGames.includes(gameId);
    }

    // Export just the game schema (for sharing configurations)
    exportGameSchema() {
        const customGames = this.getCustomGames();

        const dataStr = JSON.stringify(customGames, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `guessr-tracker-schema-${this.getLocalDateString()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        app.showToast('Success', 'Schema exported successfully', 'success');
    }

    // Import just the game schema
    async importGameSchema(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // Validate the schema structure
                    if (!importedData.games || !Array.isArray(importedData.games) || importedData.games.length === 0) {
                        throw new Error('Invalid schema format');
                    }

                    // Confirm with the user if they want to replace their game schema
                    if (confirm(`This will import ${importedData.games.length} games and replace your current game schema. Your game history will be preserved. Continue?`)) {

                        // Update the games array
                        window.GAMES.length = 0;
                        window.GAMES.push(...importedData.games);

                        // Save to localStorage
                        this.saveGamesSchema(window.GAMES);

                        resolve();
                        app.showToast('Success', 'Game schema imported successfully', 'success');
                    } else {
                        reject(new Error('Import cancelled by user'));
                    }
                } catch (error) {
                    reject(new Error('Invalid schema format: ' + error.message));
                }
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }
}

// Create a global instance
const storage = new Storage(); 