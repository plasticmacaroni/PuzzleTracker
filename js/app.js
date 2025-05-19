// Game configuration
const GAMES = [
    {
        id: 'wordle',
        name: 'Wordle',
        url: 'https://www.nytimes.com/games/wordle/index.html',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "\\d/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "attempts",
                    regex: "(\\d)/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Attempts",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Attempts",
            template: "30-day avg: {avg}/6",
            days: 30
        }
    },
    {
        id: 'oec-pick-5',
        name: 'OEC Pick-5',
        url: 'https://oec.world/en/games/pick-5',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "\\d/5",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "percentage",
                    regex: "(\\d+\\.\\d+)%",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Percentage",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                },
                {
                    name: "correct_guesses",
                    regex: "(\\d)/5",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Correct Guesses",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Percentage",
            template: "30-day avg: {avg}%",
            days: 30
        }
    },
    {
        id: 'pokedoku',
        name: 'PokeDoku',
        url: 'https://pokedoku.com'
    },
    {
        id: 'framed',
        name: 'Framed',
        url: 'https://framed.wtf',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🎥",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'daily-dozen-trivia',
        name: 'Daily Dozen Trivia',
        url: 'https://dailydozentrivia.com'
    },
    {
        id: 'nyt-connections',
        name: 'NYT Connections',
        url: 'https://www.nytimes.com/games/connections'
    },
    {
        id: 'globle',
        name: 'Globle',
        url: 'https://globle-game.com'
    },
    {
        id: 'box-office-game',
        name: 'Box Office Game',
        url: 'https://boxofficega.me'
    },
    {
        id: 'costcodle',
        name: 'Costcodle',
        url: 'https://costcodle.com'
    },
    {
        id: 'movie-to-movie',
        name: 'Movie to Movie',
        url: 'https://movietomovie.com'
    },
    {
        id: 'guessthe-game',
        name: 'GuessThe.Game',
        url: 'https://guessthe.game'
    },
    {
        id: 'gamedle',
        name: 'Gamedle',
        url: 'https://gamedle.wtf'
    },
    {
        id: 'puckdoku',
        name: 'Puckdoku',
        url: 'https://puckdoku.com'
    },
    {
        id: 'moviegrid',
        name: 'MovieGrid.io',
        url: 'https://moviegrid.io'
    },
    {
        id: 'spellcheck-game',
        name: 'Spellcheck Game',
        url: 'https://spellcheckgame.com/'
    },
    {
        id: 'foodguessr',
        name: 'FoodGuessr',
        url: 'https://foodguessr.com'
    },
    {
        id: 'thrice',
        name: 'Thrice',
        url: 'https://thrice.geekswhodrink.com'
    },
    {
        id: 'relatle',
        name: 'Relatle.io',
        url: 'https://relatle.io/'
    },
    {
        id: 'disorderly',
        name: 'Disorderly',
        url: 'https://playdisorderly.com/'
    },
    {
        id: 'harmonies',
        name: 'Harmonies',
        url: 'https://harmonies.io'
    },
    {
        id: 'bandle',
        name: 'Bandle',
        url: 'https://bandle.app'
    },
    {
        id: 'juxtastat',
        name: 'Juxtastat',
        url: 'https://urbanstats.org/quiz.html'
    },
    {
        id: 'scrandle',
        name: 'Scrandle',
        url: 'https://scrandle.com/',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "(\\d+)/10",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg}/10",
            days: 30
        }
    }
];

class App {
    constructor() {
        this.currentGameId = null;
        this.initializeEventListeners();
        this.startCardPolling();
        this.initializeToastContainer();
    }

    initializeToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    showToast(title, message, type = 'info', duration = 5000) {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    }

    removeToast(toast) {
        if (toast.classList.contains('removing')) return;

        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }

    initializeEventListeners() {
        // Export/Import buttons
        document.getElementById('exportData').addEventListener('click', () => storage.exportData());
        document.getElementById('importData').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Schema editor
        document.getElementById('editSchema').addEventListener('click', () => this.showSchemaModal());
        document.getElementById('editSchemaManually').addEventListener('click', () => this.showSchemaEditor());
        document.getElementById('saveSchema').addEventListener('click', () => this.saveSchema());
        document.getElementById('cancelSchema').addEventListener('click', () => this.hideSchemaEditor());

        // Result submit button
        document.getElementById('submitResult').addEventListener('click', () => this.handleResultSubmit());
    }

    async handleImport(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                await storage.importData(file);
                this.updateCardPositions();
                this.showToast('Success', 'Data imported successfully!', 'success');
            } catch (error) {
                this.showToast('Error', 'Error importing data: ' + error.message, 'error');
            }
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    startCardPolling() {
        // Initial render
        this.updateCardPositions();

        // Poll every second
        setInterval(() => this.updateCardPositions(), 1000);
    }

    updateCardPositions() {
        const activeList = document.getElementById('gameList');
        const completedList = document.getElementById('completedGameList');
        const today = new Date().toISOString().split('T')[0];

        // Track current positions
        const currentPositions = new Map();
        GAMES.forEach(game => {
            const results = storage.getGameResults(game.id);
            const hasTodayResult = results.some(result => result.date === today);
            currentPositions.set(game.id, hasTodayResult);
        });

        // Only update if positions have changed
        let needsUpdate = false;
        GAMES.forEach(game => {
            const card = document.querySelector(`[data-game-id="${game.id}"]`);
            if (!card) {
                needsUpdate = true;
                return;
            }
            const isInCompleted = card.closest('#completedGameList') !== null;
            const shouldBeCompleted = currentPositions.get(game.id);
            if (isInCompleted !== shouldBeCompleted) {
                needsUpdate = true;
            }
        });

        if (!needsUpdate) return;

        // Clear both lists
        activeList.innerHTML = '';
        completedList.innerHTML = '';

        // Sort games into appropriate lists based only on today's date
        GAMES.forEach(game => {
            const card = this.createGameCard(game);
            const hasTodayResult = currentPositions.get(game.id);

            if (hasTodayResult) {
                completedList.appendChild(card);
            } else {
                activeList.appendChild(card);
            }
        });
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-game-id', game.id);
        const isCompleted = storage.isGameCompletedToday(game.id);
        if (isCompleted) {
            card.classList.add('completed');
        }

        // Get average if configured
        let averageDisplay = '';
        if (game.average_display) {
            const avg = storage.getGameAverage(
                game.id,
                game.average_display.field,
                game.average_display.days
            );

            if (avg) {
                averageDisplay = game.average_display.template.replace('{avg}', avg);
            } else {
                averageDisplay = 'New Game!';
            }
        }

        card.innerHTML = `
            <div class="card-header">
                <h3>${game.name}</h3>
                ${averageDisplay ? `<div class="average-display">${averageDisplay}</div>` : ''}
            </div>
            <div class="game-actions">
                <button class="btn play-btn" data-url="${game.url}">Play</button>
                <button class="btn stats-btn" data-game="${game.id}">Stats</button>
                <button class="btn result-btn" data-game="${game.id}">Enter Result</button>
            </div>
        `;

        // Add event listeners
        card.querySelector('.play-btn').addEventListener('click', () => window.open(game.url, '_blank'));
        card.querySelector('.stats-btn').addEventListener('click', () => this.showStats(game.id));
        card.querySelector('.result-btn').addEventListener('click', () => this.showResultInput(game.id));

        return card;
    }

    showStats(gameId) {
        const results = storage.getGameResults(gameId);

        if (results.length === 0) {
            this.showToast('No Data', 'Enter your first result to start tracking stats', 'info');
            return;
        }

        const modal = document.getElementById('statsModal');

        // Parse all results for visualization
        const parsedResults = results.map(result => {
            try {
                const parsed = parser.parse(gameId, result.rawOutput);
                return {
                    date: result.date,
                    ...parsed
                };
            } catch (error) {
                console.error(`Error parsing result for ${result.date}:`, error);
                return null;
            }
        }).filter(Boolean);

        // Create chart with parsed data
        gameCharts.createChart('statsChart', gameId, parsedResults);

        // Display raw history
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        results.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(result => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';

            const header = document.createElement('div');
            header.className = 'history-header';

            const dateContainer = document.createElement('div');
            dateContainer.className = 'date-container';

            const date = document.createElement('input');
            date.type = 'date';
            date.className = 'date-input';
            date.value = result.date;
            date.title = 'Click to edit date';

            // Add date change handler
            date.addEventListener('change', () => {
                const newDate = date.value;
                if (!newDate) return;

                // Check if the new date already exists
                const existingResult = results.find(r => r.date === newDate);
                if (existingResult && existingResult !== result) {
                    this.showToast('Error', 'A result already exists for this date', 'error');
                    date.value = result.date;
                    return;
                }

                try {
                    // Update the result with the new date
                    storage.updateGameResult(gameId, result.date, result.rawOutput, newDate);
                    // Refresh the stats view
                    this.showStats(gameId);
                } catch (error) {
                    this.showToast('Error', 'Error updating date: ' + error.message, 'error');
                    date.value = result.date;
                }
            });

            dateContainer.appendChild(date);

            const actions = document.createElement('div');
            actions.className = 'history-actions';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn delete-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete this entry';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this entry?')) {
                    storage.deleteGameResult(gameId, result.date);
                    this.showStats(gameId);
                }
            });

            const editBtn = document.createElement('button');
            editBtn.className = 'btn edit-btn';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit this entry';
            editBtn.addEventListener('click', () => {
                content.contentEditable = true;
                content.focus();
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            header.appendChild(dateContainer);
            header.appendChild(actions);

            const content = document.createElement('pre');
            content.textContent = result.rawOutput;
            content.contentEditable = false;

            // Add edit handlers
            content.addEventListener('focus', () => {
                entry.classList.add('editing');
            });

            content.addEventListener('blur', () => {
                entry.classList.remove('editing');
                content.contentEditable = false;

                if (content.textContent.trim() === '') {
                    if (confirm('Empty content will delete this entry. Continue?')) {
                        storage.deleteGameResult(gameId, result.date);
                        this.showStats(gameId);
                    } else {
                        content.textContent = result.rawOutput;
                    }
                    return;
                }

                // Store the raw output without validation
                storage.updateGameResult(gameId, result.date, content.textContent);
                // Refresh the stats view
                this.showStats(gameId);
            });

            entry.appendChild(header);
            entry.appendChild(content);
            historyList.appendChild(entry);
        });

        modal.style.display = 'block';
    }

    showResultInput(gameId) {
        this.currentGameId = gameId;
        const modal = document.getElementById('resultModal');
        document.getElementById('resultInput').value = '';
        modal.style.display = 'block';
    }

    async handleResultSubmit() {
        const input = document.getElementById('resultInput').value.trim();
        if (!input) return;

        const game = GAMES.find(g => g.id === this.currentGameId);
        storage.addGameResult(this.currentGameId, input);
        this.closeModals();
        this.updateCardPositions();
        this.showToast('Nice job!', `Completed today's ${game.name}`, 'success');
    }

    showSchemaModal() {
        const modal = document.getElementById('schemaModal');
        modal.style.display = 'block';
    }

    showSchemaEditor() {
        const editor = document.getElementById('schemaEditor');
        editor.style.display = 'block';

        // Initialize CodeMirror if not already done
        if (!this.schemaEditor) {
            const textarea = document.getElementById('schemaInput');
            this.schemaEditor = CodeMirror.fromTextArea(textarea, {
                mode: 'application/json',
                theme: 'monokai',
                lineNumbers: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                gutters: ['CodeMirror-lint-markers'],
                lint: true,
                extraKeys: {
                    'Ctrl-Space': 'autocomplete'
                }
            });
        }

        // Set the content
        this.schemaEditor.setValue(JSON.stringify(GAMES, null, 2));
    }

    hideSchemaEditor() {
        document.getElementById('schemaEditor').style.display = 'none';
    }

    async saveSchema() {
        try {
            const newSchema = JSON.parse(this.schemaEditor.getValue());
            // Validate schema structure
            if (!Array.isArray(newSchema)) {
                throw new Error('Schema must be an array of games');
            }
            newSchema.forEach(game => {
                if (!game.id || !game.name || !game.url) {
                    throw new Error('Each game must have id, name, and url');
                }
            });

            // Update the games array
            GAMES.length = 0;
            GAMES.push(...newSchema);

            // Refresh the display
            this.updateCardPositions();
            this.hideSchemaEditor();
            document.getElementById('schemaModal').style.display = 'none';
            this.showToast('Success', 'Schema updated successfully!', 'success');
        } catch (error) {
            this.showToast('Error', 'Invalid schema format: ' + error.message, 'error');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 