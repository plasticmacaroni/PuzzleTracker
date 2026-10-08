// Local storage for profiles, their results and game lists, and custom game definitions.
//
// Keys (kept from earlier versions so existing data keeps working):
//   guessrTrackerData        the first profile's save:
//                            { gameResults: { [gameId]: [{ date, rawOutput }] }, myGames, lastExport, lastUpdated, version }
//   guessrTrackerData:<id>   every other profile's save, in the same shape
//   guessrTrackerProfiles    { active, profiles: [{ id, name }] }; written once a second profile exists
//   guessrTrackerGames       custom games and edited copies of built-in games, shared by all profiles
// Results are stored as the pasted share text; stats are derived on read.
(function (root) {
    const PT = root.PT || (root.PT = {});

    const DATA_KEY = 'guessrTrackerData';
    const GAMES_KEY = 'guessrTrackerGames';
    const PROFILES_KEY = 'guessrTrackerProfiles';
    const FIRST_PROFILE = 'default';
    const THEME_KEY = 'pt.theme';
    const LEGACY_THEME_KEY = 'darkModePreference';
    const VERSION = 2;
    const BACKUP_VERSION = 3;
    const NAME_MAX = 30;

    const dataKey = id => (id === FIRST_PROFILE ? DATA_KEY : `${DATA_KEY}:${id}`);
    const validId = id => typeof id === 'string' && /^[a-z0-9-]{1,40}$/.test(id);
    const cleanName = name => (typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) : '');
    const newId = () => `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    // How many results a save holds and the days they span.
    function describe(data) {
        const dates = [];
        for (const list of Object.values((data && data.gameResults) || {})) {
            if (!Array.isArray(list)) continue;
            for (const r of list) if (r && typeof r.date === 'string' && typeof r.rawOutput === 'string') dates.push(r.date);
        }
        dates.sort();
        return { count: dates.length, first: dates[0] || null, last: dates[dates.length - 1] || null };
    }

    class Store {
        constructor(storage = root.localStorage) {
            this.storage = storage;
            this.registry = this.loadRegistry();
            this.custom = this.loadCustomGames();
            this.load(this.registry.active);
        }

        // ---- persistence ----------------------------------------------------------

        load(id) {
            this.profileId = id;
            this.isNewPlayer = false;
            this.data = this.loadData(id);
            this.migrate();
        }

        loadData(id = this.profileId) {
            const saved = this.storage.getItem(dataKey(id));
            if (!saved) {
                this.isNewPlayer = true;
                return { gameResults: {}, lastUpdated: new Date().toISOString() };
            }
            const data = JSON.parse(saved);
            if (!data.gameResults || typeof data.gameResults !== 'object') data.gameResults = {};
            return data;
        }

        // A browser that has never had a second profile has no registry: its one
        // save is the first profile.
        loadRegistry() {
            let saved = null;
            try { saved = JSON.parse(this.storage.getItem(PROFILES_KEY) || 'null'); } catch (_) { /* rebuilt below */ }
            const profiles = saved && Array.isArray(saved.profiles)
                ? saved.profiles.filter(p => p && validId(p.id) && cleanName(p.name)).map(p => ({ id: p.id, name: cleanName(p.name) }))
                : [];
            // Never hide a save that exists: the first profile's data comes back if the list lost it.
            if (!profiles.length || (!profiles.some(p => p.id === FIRST_PROFILE) && this.storage.getItem(DATA_KEY))) {
                profiles.unshift({ id: FIRST_PROFILE, name: profiles.some(p => p.name.toLowerCase() === 'me') ? 'Me (2)' : 'Me' });
            }
            const active = saved && profiles.some(p => p.id === saved.active) ? saved.active : profiles[0].id;
            return { active, profiles };
        }

        saveRegistry() {
            this.storage.setItem(PROFILES_KEY, JSON.stringify(this.registry));
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
            this.storage.setItem(dataKey(this.profileId), JSON.stringify(this.data));
        }

        // Any profile's save, without switching to it.
        readProfile(id) {
            if (id === this.profileId) return this.data;
            const saved = this.storage.getItem(dataKey(id));
            const data = saved ? JSON.parse(saved) : { gameResults: {}, myGames: [], version: VERSION };
            if (!data.gameResults || typeof data.gameResults !== 'object') data.gameResults = {};
            return data;
        }

        writeProfile(id, data) {
            if (id === this.profileId) {
                this.data = data;
                this.save();
                return;
            }
            data.lastUpdated = new Date().toISOString();
            this.storage.setItem(dataKey(id), JSON.stringify(data));
        }

        // ---- profiles -------------------------------------------------------------

        profiles() {
            return this.registry.profiles.map(p => ({ ...p, active: p.id === this.profileId }));
        }

        profile() {
            return this.registry.profiles.find(p => p.id === this.profileId);
        }

        profileSummary(id) {
            const data = this.readProfile(id);
            return { ...describe(data), lastExport: data.lastExport || null };
        }

        // Profile names are trimmed, at most 30 characters, and unique (ignoring case).
        checkName(name, exceptId = null) {
            const clean = cleanName(name);
            if (!clean) throw new Error('Give the profile a name');
            if (this.registry.profiles.some(p => p.id !== exceptId && p.name.toLowerCase() === clean.toLowerCase())) {
                throw new Error(`There is already a profile called ${clean}`);
            }
            return clean;
        }

        // "Sam", or "Sam (2)" if that name is taken.
        uniqueName(name) {
            const base = cleanName(name) || 'Profile';
            const taken = new Set(this.registry.profiles.map(p => p.name.toLowerCase()));
            if (!taken.has(base.toLowerCase())) return base;
            for (let n = 2; ; n++) {
                const candidate = `${base.slice(0, NAME_MAX - String(n).length - 3)} (${n})`;
                if (!taken.has(candidate.toLowerCase())) return candidate;
            }
        }

        // New profiles start with the starter games; returns the new profile's id.
        createProfile(name, { id, data } = {}) {
            const clean = this.checkName(name);
            const profileId = validId(id) && !this.registry.profiles.some(p => p.id === id) ? id : newId();
            const save = data || { gameResults: {}, myGames: PT.games.starter.slice(), version: VERSION };
            save.lastUpdated = new Date().toISOString();
            this.storage.setItem(dataKey(profileId), JSON.stringify(save));
            this.registry.profiles.push({ id: profileId, name: clean });
            this.saveRegistry();
            return profileId;
        }

        renameProfile(id, name) {
            const profile = this.registry.profiles.find(p => p.id === id);
            if (!profile) throw new Error('That profile no longer exists');
            profile.name = this.checkName(name, id);
            this.saveRegistry();
        }

        switchProfile(id) {
            if (!this.registry.profiles.some(p => p.id === id)) throw new Error('That profile no longer exists');
            this.registry.active = id;
            this.saveRegistry();
            this.load(id);
        }

        // Deletes a profile and its save. The last profile can't be deleted.
        deleteProfile(id) {
            if (this.registry.profiles.length < 2) throw new Error('You need at least one profile');
            if (!this.registry.profiles.some(p => p.id === id)) return;
            this.registry.profiles = this.registry.profiles.filter(p => p.id !== id);
            this.storage.removeItem(dataKey(id));
            if (id === this.profileId) {
                this.registry.active = this.registry.profiles[0].id;
                this.load(this.registry.active);
            }
            this.saveRegistry();
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
            if (typeof game.about === 'string' && game.about.trim()) clean.about = game.about.trim().slice(0, 100);
            if (typeof game.picture === 'string' && game.picture) clean.picture = game.picture;
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

        // One file holding the chosen profiles (the current one by default).
        exportJson(ids = [this.profileId]) {
            const exportedAt = new Date().toISOString();
            const profiles = ids.map(id => {
                const meta = this.registry.profiles.find(p => p.id === id);
                if (!meta) throw new Error('That profile no longer exists');
                const data = this.readProfile(id);
                data.lastExport = exportedAt;
                this.writeProfile(id, data);
                return { id, name: meta.name, data };
            });
            return JSON.stringify({ app: 'PuzzleTracker', version: BACKUP_VERSION, exportedAt, profiles, customGames: this.custom }, null, 2);
        }

        // Reads any backup this app has written: profile backups, single-save
        // backups, and the original tracker's format. Single saves have no profile
        // id or name.
        readBackup(text) {
            const parsed = JSON.parse(text);
            const single = (data, customGames = [], exportedAt = null) => ({
                exportedAt: exportedAt || (data && data.lastUpdated) || null,
                profiles: [{ id: null, name: null, data }],
                customGames,
            });
            let backup;
            if (parsed && parsed.app === 'PuzzleTracker' && Array.isArray(parsed.profiles)) {
                const profiles = parsed.profiles
                    .filter(p => p && p.data && typeof p.data === 'object')
                    .map(p => ({ id: validId(p.id) ? p.id : null, name: cleanName(p.name) || null, data: p.data }));
                if (!profiles.length) throw new Error('This backup has no profiles in it');
                backup = { exportedAt: parsed.exportedAt || null, profiles, customGames: parsed.customGames || [] };
            } else if (parsed && parsed.app === 'PuzzleTracker' && parsed.data) {
                backup = single(parsed.data, parsed.customGames || [], parsed.exportedAt);
            } else if (parsed && parsed.userData) {
                backup = single(parsed.userData, parsed.gameSchemaState || parsed.customGames || []);
            } else if (parsed && parsed.gameResults) {
                backup = single(parsed);
            } else {
                throw new Error('This file is not a PuzzleTracker backup');
            }
            if (!Array.isArray(backup.customGames)) backup.customGames = [];
            for (const p of backup.profiles) Object.assign(p, describe(p.data));
            return backup;
        }

        // Where each profile in a backup goes unless the player changes it: the
        // profile with the same id, then the same name; a single save goes to the
        // current profile; anything else becomes a new profile.
        planImport(backup) {
            const claimed = new Set();
            return backup.profiles.map(p => {
                const local = this.registry.profiles.find(l => p.id && l.id === p.id)
                    || this.registry.profiles.find(l => p.name && l.name.toLowerCase() === p.name.toLowerCase())
                    || (!p.id && !p.name ? this.registry.profiles.find(l => l.id === this.profileId) : null);
                const target = local && !claimed.has(local.id) ? local.id : 'new';
                if (target !== 'new') claimed.add(target);
                return target;
            });
        }

        // What merging a backup profile into a local one (or 'new') would bring:
        // results the local profile doesn't have, and the days they cover.
        compareImport(incoming, target) {
            if (target === 'new') {
                const all = describe(incoming.data);
                return { added: all.count, first: all.first, last: all.last, same: 0, conflicts: 0 };
            }
            const local = this.readProfile(target).gameResults;
            const result = { added: 0, first: null, last: null, same: 0, conflicts: 0 };
            for (const [id, list] of Object.entries(incoming.data.gameResults || {})) {
                if (!Array.isArray(list)) continue;
                for (const r of list) {
                    if (!r || typeof r.date !== 'string' || typeof r.rawOutput !== 'string') continue;
                    const mine = (local[id] || []).find(x => x.date === r.date);
                    if (!mine) {
                        result.added += 1;
                        if (!result.first || r.date < result.first) result.first = r.date;
                        if (!result.last || r.date > result.last) result.last = r.date;
                    } else if (mine.rawOutput === r.rawOutput) {
                        result.same += 1;
                    } else {
                        result.conflicts += 1;
                    }
                }
            }
            return result;
        }

        // Imports a backup. targets[i] says where backup.profiles[i] goes: a local
        // profile id (merged), 'new', or null (skipped). Nothing local is
        // overwritten: when both sides have a different result for the same game
        // and day, the local one stays.
        applyImport(backup, targets) {
            const summary = { added: 0, same: 0, conflicts: 0, games: 0, profiles: [] };
            if (!targets.some(Boolean)) return summary;

            const builtInIds = new Set(PT.games.defaults.map(g => g.id));
            for (const game of backup.customGames) {
                if (!game || typeof game.id !== 'string' || builtInIds.has(game.id)) continue;
                if (!this.custom.some(g => g.id === game.id)) {
                    this.custom.push(game);
                    summary.games += 1;
                }
            }
            this.saveCustomGames();

            backup.profiles.forEach((incoming, i) => {
                const target = targets[i];
                if (!target) return;
                let id = target;
                if (target === 'new') {
                    const fallback = `Imported ${(backup.exportedAt || new Date().toISOString()).slice(0, 10)}`;
                    id = this.createProfile(this.uniqueName(incoming.name || fallback), {
                        id: incoming.id,
                        data: { gameResults: {}, myGames: [], version: VERSION },
                    });
                } else if (!this.registry.profiles.some(p => p.id === target)) {
                    throw new Error('That profile no longer exists');
                }
                const data = this.readProfile(id);
                if (!Array.isArray(data.myGames)) data.myGames = [];
                const merged = this.mergeInto(data, incoming.data);
                this.writeProfile(id, data);
                const name = this.registry.profiles.find(p => p.id === id).name;
                summary.profiles.push({ id, name, created: target === 'new', ...merged });
                summary.added += merged.added;
                summary.same += merged.same;
                summary.conflicts += merged.conflicts;
            });
            return summary;
        }

        mergeInto(data, incoming) {
            const result = { added: 0, same: 0, conflicts: 0 };
            const incomingIds = new Set();
            for (const [id, list] of Object.entries(incoming.gameResults || {})) {
                if (!Array.isArray(list)) continue;
                for (const r of list) {
                    if (!r || typeof r.date !== 'string' || typeof r.rawOutput !== 'string') continue;
                    incomingIds.add(id);
                    const local = (data.gameResults[id] || []).find(x => x.date === r.date);
                    if (!local) {
                        (data.gameResults[id] || (data.gameResults[id] = [])).push({ date: r.date, rawOutput: r.rawOutput });
                        result.added += 1;
                    } else if (local.rawOutput === r.rawOutput) {
                        result.same += 1;
                    } else {
                        result.conflicts += 1;
                    }
                }
            }

            // A backup with a game list brings that list; older backups only say
            // which games were hidden, so add the games that have results and
            // weren't hidden.
            const hidden = new Set(incoming.hiddenGames || []);
            const wanted = Array.isArray(incoming.myGames) ? incoming.myGames : [...incomingIds].filter(id => !hidden.has(id));
            const known = new Set(this.allGames().map(g => g.id));
            for (const id of wanted) {
                if (known.has(id) && !data.myGames.includes(id)) data.myGames.push(id);
            }
            return result;
        }

        // Imports everything where planImport would put it.
        importJson(text) {
            const backup = this.readBackup(text);
            const { added, same, conflicts, games } = this.applyImport(backup, this.planImport(backup));
            return { added, same, conflicts, games };
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

    Store.describe = describe;
    PT.Store = Store;

    if (typeof module !== 'undefined' && module.exports) module.exports = Store;
})(typeof window !== 'undefined' ? window : globalThis);
