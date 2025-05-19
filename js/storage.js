class Storage {
    constructor() {
        this.data = {
            gameResults: {},
            lastUpdated: new Date().toISOString()
        };
        this.initialize();
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
            lastUpdated: new Date().toISOString()
        };
    }

    async saveData() {
        this.data.lastUpdated = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem('guessrTrackerData', JSON.stringify(this.data));
        console.log('Data saved to localStorage');
    }

    addGameResult(gameId, rawOutput) {
        if (!this.data.gameResults[gameId]) {
            this.data.gameResults[gameId] = [];
        }

        const today = new Date().toISOString().split('T')[0];

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

        // Parse and filter results
        const validResults = results
            .filter(result => new Date(result.date) >= cutoffDate)
            .map(result => {
                try {
                    const parsed = parser.parse(gameId, result.rawOutput);
                    // Only exclude results that were explicitly failures
                    // If there's no CompletionState, include the result
                    if (parsed.CompletionState === false) {
                        return null;
                    }
                    return parsed[field];
                } catch (error) {
                    const game = GAMES.find(g => g.id === gameId);
                    console.warn(`Error parsing result for ${game.name} (${gameId}) on ${result.date}:`, error);
                    return null;
                }
            })
            .filter(value => value !== null);

        if (validResults.length === 0) return null;

        // Calculate average
        const sum = validResults.reduce((a, b) => a + b, 0);
        const avg = sum / validResults.length;

        // Format number: remove trailing zeros and unnecessary decimal point
        return Number(avg.toFixed(1)).toString();
    }

    isGameCompletedToday(gameId) {
        const results = this.getGameResults(gameId);
        const today = new Date().toISOString().split('T')[0];
        return results.some(result => result.date === today);
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `guessr-tracker-export-${new Date().toISOString().split('T')[0]}.json`;

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

                    // Validate the imported data structure
                    if (!importedData.gameResults || !importedData.lastUpdated) {
                        throw new Error('Invalid data format');
                    }

                    this.data = importedData;
                    this.saveData();
                    resolve();
                } catch (error) {
                    reject(new Error('Invalid file format'));
                }
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    validResults(gameId, results) {
        return results.filter(result => {
            try {
                const parsed = parser.parse(gameId, result.rawOutput);
                return parsed && Object.keys(parsed).length > 0;
            } catch (error) {
                const game = GAMES.find(g => g.id === gameId);
                console.error(`Error parsing result for ${game.name} (${gameId}) on ${result.date}:`, error);
                return false;
            }
        });
    }
}

// Create a global instance
const storage = new Storage(); 