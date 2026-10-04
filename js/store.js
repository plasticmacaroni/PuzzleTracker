// Local storage for results, the player's game list, and custom game definitions.
//
// Keys (kept from earlier versions so existing data keeps working):
//   guessrTrackerData   { gameResults: { [gameId]: [{ date, rawOutput }] }, myGames, lastExport, lastUpdated, version }
//   guessrTrackerGames  custom games and edited copies of built-in games
// Results are stored as the pasted share text; stats are derived on read.
(function (root) {
    const PT = root.PT || (root.PT = {});

    const DATA_KEY = 'guessrTrackerData';
    const GAMES_KEY = 'guessrTrackerGames';
    const THEME_KEY = 'pt.theme';
    const LEGACY_THEME_KEY = 'darkModePreference';
    const VERSION = 2;

    class Store {
        constructor(storage = root.localStorage) {
            this.storage = storage;
            this.isNewPlayer = false;
            this.data = this.loadData();
            this.custom = this.loadCustomGames();
            this.migrate();
        }

        // ---- persistence ----------------------------------------------------------

        loadData() {
            const saved = this.storage.getItem(DATA_KEY);
            if (!saved) {
                this.isNewPlayer = true;
                return { gameResults: {}, lastUpdated: new Date().toISOString() };
            }
            const data = JSON.parse(saved);
            if (!data.gameResults || typeof data.gameResults !== 'object') data.gameResults = {};
            return data;
        }

        loadCustomGames() {
            try {
                const saved = JSON.parse(this.storage.getItem(GAMES_KEY) || '[]');
                return Array.isArray(saved) ? saved.filter(g => g && typeof g.id === 'string') : [];
            } catch (_) {
                return [];
            }
        }

        save() {
            this.data.lastUpdated = new Date().toISOString();
            this.storage.setItem(DATA_KEY, JSON.stringify(this.data));
        }

        saveCustomGames() {
            this.storage.setItem(GAMES_KEY, JSON.stringify(this.custom));
        }

        // Version 1 kept a list of hidden games; version 2 keeps the player's own
        // ordered list. Older custom games keep their old regex rules in storage, but
        // those rules are no longer run (they could contain code).
        migrate() {
            if (Array.isArray(this.data.myGames)) return;
            if (this.isNewPlayer) {
                this.data.myGames = PT.games.starter.slice();
            } else {
                const hidden = new Set(this.data.hiddenGames || []);
                this.data.myGames = this.allGames().map(g => g.id).filter(id => !hidden.has(id));
            }
            delete this.data.hiddenGames;
            this.data.version = VERSION;
            if (!this.isNewPlayer) this.save();
        }

        // ---- games ----------------------------------------------------------------

        // Built-in games, with any edited copy replacing the original, then custom games.
        allGames() {
            const overrides = new Map(this.custom.map(g => [g.id, g]));
            const builtIn = PT.games.defaults.map(g => {
                const edited = overrides.get(g.id);
                return edited ? { ...g, ...edited, builtIn: true, edited: true } : { ...g, builtIn: true };
            });
            const builtInIds = new Set(PT.games.defaults.map(g => g.id));
            const extras = this.custom.filter(g => !builtInIds.has(g.id)).map(g => ({ ...g, builtIn: false }));
            return [...builtIn, ...extras].map(PT.games.prepare);
        }

        game(id) {
            return this.allGames().find(g => g.id === id) || null;
        }

        myGames() {
            const byId = new Map(this.allGames().map(g => [g.id, g]));
            return this.data.myGames.map(id => byId.get(id)).filter(Boolean);
        }

        isMine(id) {
            return this.data.myGames.includes(id);
        }

        addToMine(id) {
            if (!this.isMine(id)) {
                this.data.myGames.push(id);
                this.save();
            }
        }

        removeFromMine(id) {
            this.data.myGames = this.data.myGames.filter(x => x !== id);
            this.save();
        }

        moveMine(id, delta) {
            const list = this.data.myGames;
            const i = list.indexOf(id);
            const j = i + delta;
            if (i < 0 || j < 0 || j >= list.length) return;
            [list[i], list[j]] = [list[j], list[i]];
            this.save();
        }

        // Saves a custom game, or an edited copy of a built-in game.
        saveGame(game) {
            const clean = { id: game.id, name: game.name, url: game.url };
            if (game.tracking) clean.tracking = game.tracking;
            if (typeof game.example === 'string' && game.example) clean.example = game.example.slice(0, 2000);
            const i = this.custom.findIndex(g => g.id === game.id);
            if (i >= 0) {
                // Keep anything we don't model (e.g. legacy rules) alongside the new fields.
                const { result_parsing_rules, average_display, stats } = this.custom[i];
                const legacy = Object.fromEntries(Object.entries({ result_parsing_rules, average_display, stats }).filter(([, v]) => v !== undefined));
                this.custom[i] = { ...legacy, ...clean };
            } else {
                this.custom.push(clean);
            }
            this.saveCustomGames();
        }

        // Drops the edited copy of a built-in game, restoring the shipped rules.
        resetGame(id) {
            this.custom = this.custom.filter(g => g.id !== id);
            this.saveCustomGames();
        }

        deleteCustomGame(id) {
            this.custom = this.custom.filter(g => g.id !== id);
            this.saveCustomGames();
            this.removeFromMine(id);
        }

        // ---- results --------------------------------------------------------------

        results(id) {
            return this.data.gameResults[id] || [];
        }

        resultOn(id, date) {
            return this.results(id).find(r => r.date === date) || null;
        }

        // Returns 'added' or 'replaced'.
        setResult(id, date, rawOutput) {
            const list = this.data.gameResults[id] || (this.data.gameResults[id] = []);
            const existing = list.find(r => r.date === date);
            if (existing) existing.rawOutput = rawOutput;
            else list.push({ date, rawOutput });
            this.save();
            return existing ? 'replaced' : 'added';
        }

        updateResult(id, oldDate, { date = oldDate, rawOutput }) {
            const list = this.results(id);
            const entry = list.find(r => r.date === oldDate);
            if (!entry) return;
            if (date !== oldDate && list.some(r => r.date === date)) {
                throw new Error('There is already a result on that date');
            }
            entry.date = date;
            if (rawOutput !== undefined) entry.rawOutput = rawOutput;
            this.save();
        }

        deleteResult(id, date) {
            const list = this.results(id);
            const i = list.findIndex(r => r.date === date);
            if (i >= 0) {
                list.splice(i, 1);
                this.save();
            }
        }

        // ---- backup ---------------------------------------------------------------

        exportJson() {
            this.data.lastExport = new Date().toISOString();
            this.save();
            return JSON.stringify({
                app: 'PuzzleTracker',
                version: VERSION,
                exportedAt: this.data.lastExport,
                data: this.data,
                customGames: this.custom,
            }, null, 2);
        }

        // Merges a backup into what's here. Nothing local is overwritten: when both
        // sides have a different result for the same game and day, the local one stays.
        importJson(text) {
            const parsed = JSON.parse(text);
            let data;
            let customs = [];
            if (parsed && parsed.app === 'PuzzleTracker' && parsed.data) {
                data = parsed.data;
                customs = parsed.customGames || [];
            } else if (parsed && parsed.userData) {
                data = parsed.userData;
                customs = parsed.gameSchemaState || parsed.customGames || [];
            } else if (parsed && parsed.gameResults) {
                data = parsed;
            } else {
                throw new Error('This file is not a PuzzleTracker backup');
            }

            const builtInIds = new Set(PT.games.defaults.map(g => g.id));
            const summary = { added: 0, same: 0, conflicts: 0, games: 0 };

            for (const game of customs) {
                if (!game || typeof game.id !== 'string' || builtInIds.has(game.id)) continue;
                if (!this.custom.some(g => g.id === game.id)) {
                    this.custom.push(game);
                    summary.games += 1;
                }
            }

            const incomingIds = new Set();
            for (const [id, list] of Object.entries(data.gameResults || {})) {
                if (!Array.isArray(list)) continue;
                for (const r of list) {
                    if (!r || typeof r.date !== 'string' || typeof r.rawOutput !== 'string') continue;
                    incomingIds.add(id);
                    const local = this.resultOn(id, r.date);
                    if (!local) {
                        (this.data.gameResults[id] || (this.data.gameResults[id] = [])).push({ date: r.date, rawOutput: r.rawOutput });
                        summary.added += 1;
                    } else if (local.rawOutput === r.rawOutput) {
                        summary.same += 1;
                    } else {
                        summary.conflicts += 1;
                    }
                }
            }

            // A backup with a game list brings that list; older backups only say
            // which games were hidden, so add the games that have results and
            // weren't hidden.
            const hidden = new Set(data.hiddenGames || []);
            const wanted = Array.isArray(data.myGames) ? data.myGames : [...incomingIds].filter(id => !hidden.has(id));
            const known = new Set(this.allGames().map(g => g.id));
            for (const id of wanted) {
                if (known.has(id) && !this.isMine(id)) this.data.myGames.push(id);
            }

            this.saveCustomGames();
            this.save();
            return summary;
        }

        // ---- preferences ----------------------------------------------------------

        theme() {
            const saved = this.storage.getItem(THEME_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
            const legacy = this.storage.getItem(LEGACY_THEME_KEY);
            return legacy === 'light' || legacy === 'dark' ? legacy : null;
        }

        setTheme(theme) {
            this.storage.setItem(THEME_KEY, theme);
        }
    }

    PT.Store = Store;

    if (typeof module !== 'undefined' && module.exports) module.exports = Store;
})(typeof window !== 'undefined' ? window : globalThis);
