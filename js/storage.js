class Storage {
    constructor(localStorageOverride = null) {
        console.log("[[[[[ Storage Constructor Called ]]]]]");
        this.localStorage = localStorageOverride || window.localStorage;
        console.log("[[[[[ Storage Constructor: this.localStorage is mock?", this.localStorage.getItem.toString().includes("VIA SPY"), "]]]]]");
        this.data = {
            gameResults: {},
            hiddenGames: [],
            lastUpdated: new Date().toISOString()
        };

        // Remove the automatic loading of games schema
        // We'll do this explicitly after GAMES_DEFAULT is ready
    }

    static async create(localStorageOverride = null) {
        const instance = new Storage(localStorageOverride);
        await instance._initialize();
        return instance;
    }

    // Renamed from initialize to _initialize
    async _initialize() {
        try {
            this.data = await this.loadData();
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }

    async loadData() {
        console.log('Loading data...');
        // Load from localStorage
        const savedData = this.localStorage.getItem('guessrTrackerData');
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
        this.localStorage.setItem('guessrTrackerData', JSON.stringify(this.data));
        console.log('Data saved to localStorage');
    }

    saveGamesSchema(games) {
        this.localStorage.setItem('guessrTrackerGames', JSON.stringify(games));
        console.log('Games schema saved to localStorage');
    }

    mergeGameSchemas(baseGames, newGames) {
        // Start with a deep copy of base games
        const mergedGames = JSON.parse(JSON.stringify(baseGames));
        const mergedGamesMap = new Map(mergedGames.map(game => [game.id, game]));

        // Process each game in the new schema
        newGames.forEach(newGame => {
            const existingGame = mergedGamesMap.get(newGame.id);
            if (existingGame) {
                // Merge existing game with new game
                const merged = { ...existingGame };

                // Preserve specific fields from new game if they exist
                Object.keys(newGame).forEach(key => {
                    if (key === 'stats' && newGame.stats) {
                        // Merge stats arrays
                        merged.stats = merged.stats || [];
                        const existingStatsMap = new Map(merged.stats.map(stat => [stat.name, stat]));
                        newGame.stats.forEach(stat => {
                            if (!existingStatsMap.has(stat.name)) {
                                merged.stats.push(JSON.parse(JSON.stringify(stat)));
                            }
                        });
                    } else if (newGame[key] !== undefined) {
                        // For non-stats fields, prefer the new value if it exists
                        merged[key] = JSON.parse(JSON.stringify(newGame[key]));
                    }
                });

                mergedGamesMap.set(newGame.id, merged);
            } else {
                // Add new game
                mergedGamesMap.set(newGame.id, JSON.parse(JSON.stringify(newGame)));
            }
        });

        return Array.from(mergedGamesMap.values());
    }

    loadGamesSchema() {
        // Ensure GAMES_DEFAULT exists
        if (!window.GAMES_DEFAULT || !Array.isArray(window.GAMES_DEFAULT)) {
            console.error('GAMES_DEFAULT not available');
            return false;
        }

        const savedGames = this.localStorage.getItem('guessrTrackerGames');
        if (savedGames) {
            try {
                const parsedGames = JSON.parse(savedGames);
                if (Array.isArray(parsedGames) && parsedGames.length > 0) {
                    // Merge saved games with defaults
                    window.GAMES = this.mergeGameSchemas(window.GAMES_DEFAULT, parsedGames);
                    return true;
                }
            } catch (error) {
                console.error('Error parsing saved games schema:', error);
            }
        }
        return false;
    }

    async addGameResult(gameId, rawOutput) {
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

        await this.saveData();
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

        if (results.length === 0) {
            return null;
        }

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

            const resultsAfterDateFilter = results.filter(result => {
                const resultDate = new Date(result.date);
                const comparison = resultDate >= cutoffDate;
                return comparison;
            });

            const validResults = resultsAfterDateFilter
                .map(result => {
                    try {
                        const parsed = parser.parse(gameId, result.rawOutput);
                        console.log(`[DEBUG] Parsed result for ${gameId}:`, parsed);
                        if (parsed.CompletionState === false) {
                            // console.log(`[STATS] Excluding failed result for ${gameId} on ${result.date}`);
                            return null;
                        }

                        if (parsed[field] === undefined) {
                            console.error(`[STATS ERROR] Field ${field} not found in parsed result for ${gameId} on ${result.date}. Available fields:`, Object.keys(parsed));
                            return null;
                        }

                        return parsed[field];
                    } catch (error) {
                        console.error(`[STATS ERROR] Parsing error for ${gameId} on ${result.date}:`, error);
                        return null;
                    }
                })
                .filter(value => value !== null);

            if (validResults.length === 0) {
                // console.warn(`[STATS] No valid results for ${gameId} with field ${field}`);
                return null;
            }

            if (validResults.length === 1) {
                // Ensure single results are also formatted according to template if possible, or default to string
                const singleValue = validResults[0];
                if (game && game.average_display && game.average_display.template) {
                    const formatMatch = game.average_display.template.match(/{avg:([^}]+)}/);
                    if (formatMatch) {
                        const formatStr = formatMatch[1];
                        // Apply specific formatting if rules match (e.g., for decimals)
                        if (formatStr.includes(',.0f')) {
                            return Number(singleValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                        } else if (formatStr.includes(',.1f')) {
                            return Number(singleValue).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                        } else if (formatStr.includes(',.2f')) {
                            return Number(singleValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        // If no specific decimal format in template like {avg:0.0}, but a general {avg:format} exists,
                        // we might need a more general formatting function here based on formatStr if other formats are introduced.
                        // For now, if it's not one of the specific decimal ones, fall through to default string conversion for single value.
                    }
                }
                // Default for single value if no specific template format matched for it:
                return String(singleValue); // Convert to string, e.g., 0 becomes "0"
            }

            const sum = validResults.reduce((a, b) => a + b, 0);
            const avg = sum / validResults.length;

            if (game && game.average_display && game.average_display.template) {
                const formatMatch = game.average_display.template.match(/{avg:([^}]+)}/);
                if (formatMatch) {
                    const formatStr = formatMatch[1];
                    if (formatStr.includes(',.0f')) {
                        return avg.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                    } else if (formatStr.includes(',.1f')) {
                        return avg.toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                        });
                    } else if (formatStr.includes(',.2f')) {
                        return avg.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                }
            }

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

    getLatestGameResult(gameId, dateString) {
        const results = this.getGameResults(gameId);
        if (!results || results.length === 0) {
            return null;
        }
        // Assuming one result per day, find the one matching the dateString.
        // If multiple results for the same day were possible, this would need more logic
        // to determine which is truly the "latest". For now, simple date match.
        return results.find(result => result.date === dateString) || null;
    }

    exportData() {
        // Export includes all user data and the complete current game schema state
        const exportData = {
            userData: this.data,
            gameSchemaState: window.GAMES // Export a snapshot of the current window.GAMES array
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

                    if (importedData.userData && importedData.gameSchemaState && Array.isArray(importedData.gameSchemaState)) {
                        // Import user data
                        this.data = importedData.userData;
                        if (!this.data.hiddenGames) {
                            this.data.hiddenGames = [];
                        }

                        // Merge imported game schema with current schema
                        window.GAMES = this.mergeGameSchemas(window.GAMES_DEFAULT, importedData.gameSchemaState);
                        this.saveGamesSchema(window.GAMES);
                    } else if ((importedData.userData && importedData.customGames) || (importedData.gameResults && importedData.lastUpdated)) {
                        // Handle legacy formats...
                        console.warn("Importing data from a legacy format.");
                        if (importedData.userData && importedData.customGames) {
                            this.data = importedData.userData;
                            if (!this.data.hiddenGames) this.data.hiddenGames = [];
                            // Merge custom games with current schema
                            window.GAMES = this.mergeGameSchemas(window.GAMES_DEFAULT, importedData.customGames);
                            this.saveGamesSchema(window.GAMES);
                        } else if (importedData.gameResults && importedData.lastUpdated) {
                            this.data = importedData;
                            if (!this.data.hiddenGames) this.data.hiddenGames = [];
                        }
                    } else {
                        throw new Error('Invalid or unrecognized data format for import');
                    }

                    this.saveData();
                    app.showToast('Success', 'Data imported successfully!', 'success');
                    resolve();
                } catch (error) {
                    console.error("Error during importData processing:", error);
                    reject(new Error('Invalid file format or processing error: ' + error.message));
                }
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    // Get custom games (games not in the default set)
    // This method might still be useful for other parts of the app (e.g., schema export GUI)
    // but is not directly used by the new importData logic for merging.
    getCustomGames() {
        if (!window.GAMES_DEFAULT || !Array.isArray(window.GAMES_DEFAULT)) {
            return [];
        }

        const defaultGameIds = new Set(window.GAMES_DEFAULT.map(game => game.id));
        return window.GAMES.filter(game => !defaultGameIds.has(game.id));
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

    // Helper function to get today's date in local timezone
    getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Create a global instance
// const storage = new Storage(); // Commented out for testing to ensure test-specific instances are used 
// const storage = new Storage(); // Commented out for testing to ensure test-specific instances are used 