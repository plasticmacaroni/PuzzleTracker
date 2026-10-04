// Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/rules.js');
require('../js/stats.js');
require('../js/games.js');
const Store = require('../js/store.js');

class MemoryStorage {
    constructor(items = {}) { this.items = { ...items }; }
    getItem(k) { return Object.prototype.hasOwnProperty.call(this.items, k) ? this.items[k] : null; }
    setItem(k, v) { this.items[k] = String(v); }
    removeItem(k) { delete this.items[k]; }
}

const v1Data = {
    gameResults: {
        wordle: [{ date: '2026-10-01', rawOutput: 'Wordle 1,566 3/6' }],
        'my-custom': [{ date: '2026-10-01', rawOutput: 'custom text' }],
    },
    hiddenGames: ['nyt-connections'],
    lastUpdated: '2026-10-01T10:00:00.000Z',
};
const v1Custom = [{ id: 'my-custom', name: 'My Custom', url: 'https://example.com', result_parsing_rules: { extractors: [{ regex: '(\\d+)', capture_groups_mapping: [{ transform: 'alert(1)' }] }] } }];

test('a new player starts with the starter games', () => {
    const store = new Store(new MemoryStorage());
    assert.equal(store.isNewPlayer, true);
    assert.deepEqual(store.data.myGames, globalThis.PT.games.starter);
});

test('version 1 data migrates: hidden games become an ordered list of my games', () => {
    const storage = new MemoryStorage({ guessrTrackerData: JSON.stringify(v1Data), guessrTrackerGames: JSON.stringify(v1Custom) });
    const store = new Store(storage);
    assert.equal(store.isNewPlayer, false);
    assert.ok(!store.data.myGames.includes('nyt-connections'), 'hidden games stay off the list');
    assert.ok(store.data.myGames.includes('wordle'));
    assert.ok(store.data.myGames.includes('my-custom'), 'custom games stay on the list');
    assert.equal('hiddenGames' in store.data, false);
    assert.deepEqual(store.results('wordle'), v1Data.gameResults.wordle, 'results are untouched');
    const saved = JSON.parse(storage.getItem('guessrTrackerData'));
    assert.deepEqual(saved.myGames, store.data.myGames, 'migration is saved');
});

test('legacy custom-game rules are preserved but never run', () => {
    const storage = new MemoryStorage({ guessrTrackerData: JSON.stringify(v1Data), guessrTrackerGames: JSON.stringify(v1Custom) });
    const store = new Store(storage);
    const game = store.game('my-custom');
    assert.equal(game.legacy, true);
    assert.equal(game.tracking, undefined);
    assert.deepEqual(JSON.parse(storage.getItem('guessrTrackerGames'))[0].result_parsing_rules, v1Custom[0].result_parsing_rules);
    store.saveGame({ id: 'my-custom', name: 'My Custom', url: 'https://example.com', tracking: { detect: ['custom'], stats: [] } });
    const resaved = JSON.parse(storage.getItem('guessrTrackerGames'))[0];
    assert.deepEqual(resaved.result_parsing_rules, v1Custom[0].result_parsing_rules, 'old rules are kept alongside new ones');
    assert.deepEqual(resaved.tracking, { detect: ['custom'], stats: [] });
});

test('games with unsafe links or invalid rules load without running them', () => {
    const storage = new MemoryStorage({
        guessrTrackerData: JSON.stringify({ gameResults: {}, myGames: ['evil'] }),
        guessrTrackerGames: JSON.stringify([{ id: 'evil', name: 'Evil', url: 'javascript:alert(1)', tracking: { detect: ['x'], stats: [{ name: 'S', is: { eval: '1' } }] } }]),
    });
    const game = new Store(storage).game('evil');
    assert.equal(game.safeUrl, null);
    assert.equal(game.tracking, undefined);
    assert.ok(game.problems.length);
});

test('setResult adds, then replaces the same day', () => {
    const store = new Store(new MemoryStorage());
    assert.equal(store.setResult('wordle', '2026-10-04', 'Wordle 1,569 4/6'), 'added');
    assert.equal(store.setResult('wordle', '2026-10-04', 'Wordle 1,569 3/6'), 'replaced');
    assert.deepEqual(store.results('wordle'), [{ date: '2026-10-04', rawOutput: 'Wordle 1,569 3/6' }]);
});

test('updateResult refuses to move onto a day that already has a result', () => {
    const store = new Store(new MemoryStorage());
    store.setResult('wordle', '2026-10-03', 'a');
    store.setResult('wordle', '2026-10-04', 'b');
    assert.throws(() => store.updateResult('wordle', '2026-10-04', { date: '2026-10-03' }));
    store.updateResult('wordle', '2026-10-04', { date: '2026-10-02' });
    assert.deepEqual(store.results('wordle').map(r => r.date).sort(), ['2026-10-02', '2026-10-03']);
});

test('import merges and never overwrites local results', () => {
    const store = new Store(new MemoryStorage());
    store.setResult('wordle', '2026-10-03', 'local');
    const backup = JSON.stringify({
        userData: {
            gameResults: {
                wordle: [{ date: '2026-10-03', rawOutput: 'theirs' }, { date: '2026-10-02', rawOutput: 'new' }],
                'their-game': [{ date: '2026-10-02', rawOutput: 'x' }],
            },
            hiddenGames: [],
        },
        gameSchemaState: [{ id: 'their-game', name: 'Their Game', url: 'https://example.org' }, { id: 'wordle', name: 'Wordle override', url: 'https://bad.example' }],
    });
    const summary = store.importJson(backup);
    assert.deepEqual(summary, { added: 2, same: 0, conflicts: 1, games: 1 });
    assert.equal(store.resultOn('wordle', '2026-10-03').rawOutput, 'local');
    assert.equal(store.resultOn('wordle', '2026-10-02').rawOutput, 'new');
    assert.ok(store.isMine('their-game'), 'games with imported results join my list');
    assert.equal(store.game('wordle').name, 'Wordle', 'backups cannot replace built-in games');
});

test('export then import into a fresh browser round-trips everything', () => {
    const a = new Store(new MemoryStorage());
    a.setResult('wordle', '2026-10-01', 'Wordle 1,566 3/6');
    a.saveGame({ id: 'mine', name: 'Mine', url: 'https://example.com', tracking: { detect: ['mine'], stats: [] } });
    a.addToMine('mine');
    a.setResult('mine', '2026-10-01', 'mine 5');
    const b = new Store(new MemoryStorage());
    b.importJson(a.exportJson());
    assert.deepEqual(b.data.gameResults, a.data.gameResults);
    assert.deepEqual(b.custom, a.custom);
    for (const id of a.data.myGames) assert.ok(b.isMine(id));
    // Importing twice changes nothing.
    const again = b.importJson(a.exportJson());
    assert.equal(again.added, 0);
});

test('import rejects files that are not backups', () => {
    const store = new Store(new MemoryStorage());
    assert.throws(() => store.importJson('{"hello": 1}'), /not a PuzzleTracker backup/);
    assert.throws(() => store.importJson('not json'));
});

test('editing a built-in game can be reset', () => {
    const store = new Store(new MemoryStorage());
    store.saveGame({ id: 'wordle', name: 'Wordle', url: 'https://www.nytimes.com/games/wordle/index.html', tracking: { detect: ['Wordle'], stats: [] } });
    assert.equal(store.game('wordle').edited, true);
    assert.deepEqual(store.game('wordle').tracking.stats, []);
    store.resetGame('wordle');
    assert.equal(store.game('wordle').edited, undefined);
    assert.ok(store.game('wordle').tracking.stats.length > 0);
});

test('theme falls back to the old preference key', () => {
    const store = new Store(new MemoryStorage({ darkModePreference: 'dark' }));
    assert.equal(store.theme(), 'dark');
    store.setTheme('light');
    assert.equal(store.theme(), 'light');
});
