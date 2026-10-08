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

test('import respects the backup\'s game list and older hidden lists', () => {
    const store = new Store(new MemoryStorage({ guessrTrackerData: JSON.stringify({ gameResults: {}, myGames: ['wordle'] }) }));
    const results = { wordle: [{ date: '2026-10-01', rawOutput: 'a' }], waffle: [{ date: '2026-10-01', rawOutput: 'b' }], framed: [{ date: '2026-10-01', rawOutput: 'c' }] };
    store.importJson(JSON.stringify({ app: 'PuzzleTracker', version: 2, data: { gameResults: results, myGames: ['wordle', 'framed'] }, customGames: [] }));
    assert.deepEqual(store.data.myGames, ['wordle', 'framed'], 'waffle has results but was not on the backup\'s list');
    const legacy = new Store(new MemoryStorage({ guessrTrackerData: JSON.stringify({ gameResults: {}, myGames: [] }) }));
    legacy.importJson(JSON.stringify({ userData: { gameResults: results, hiddenGames: ['waffle'] }, gameSchemaState: [] }));
    assert.deepEqual(legacy.data.myGames.sort(), ['framed', 'wordle']);
});

// ---- profiles -------------------------------------------------------------------

test('an existing save becomes the first profile without being moved or rewritten', () => {
    const saved = JSON.stringify({ gameResults: { wordle: [{ date: '2026-10-01', rawOutput: 'a' }] }, myGames: ['wordle'], version: 2 });
    const storage = new MemoryStorage({ guessrTrackerData: saved });
    const store = new Store(storage);
    assert.deepEqual(store.profiles(), [{ id: 'default', name: 'Me', active: true }]);
    assert.equal(storage.getItem('guessrTrackerData'), saved);
    assert.equal(storage.getItem('guessrTrackerProfiles'), null, 'nothing new is written until a second profile exists');
});

test('profiles keep separate results and game lists, and the active one is remembered', () => {
    const storage = new MemoryStorage();
    const store = new Store(storage);
    store.setResult('wordle', '2026-10-01', 'mine');
    const sam = store.createProfile('  Sam  ');
    assert.equal(store.profileId, 'default', 'creating a profile does not switch to it');
    store.switchProfile(sam);
    assert.equal(store.profile().name, 'Sam');
    assert.deepEqual(store.results('wordle'), []);
    assert.deepEqual(store.data.myGames, globalThis.PT.games.starter);
    store.setResult('waffle', '2026-10-02', 'sam');
    store.removeFromMine('wordle');

    const reopened = new Store(storage);
    assert.equal(reopened.profileId, sam);
    assert.deepEqual(reopened.results('waffle'), [{ date: '2026-10-02', rawOutput: 'sam' }]);
    assert.ok(!reopened.isMine('wordle'));
    reopened.switchProfile('default');
    assert.deepEqual(reopened.results('wordle'), [{ date: '2026-10-01', rawOutput: 'mine' }]);
    assert.deepEqual(reopened.results('waffle'), []);
    assert.ok(reopened.isMine('wordle'));
});

test('profile names are required, trimmed and unique', () => {
    const store = new Store(new MemoryStorage());
    assert.throws(() => store.createProfile('   '), /name/);
    assert.throws(() => store.createProfile('me'), /already/);
    const id = store.createProfile('Sam');
    assert.throws(() => store.renameProfile(id, 'ME'), /already/);
    store.renameProfile(id, 'Samantha');
    assert.equal(store.profiles()[1].name, 'Samantha');
    store.renameProfile(id, 'samantha');
    assert.equal(store.profiles()[1].name, 'samantha', 'changing only the case is allowed');
    assert.equal(store.uniqueName('Me'), 'Me (2)');
});

test('deleting a profile removes its save; the last profile stays', () => {
    const storage = new MemoryStorage();
    const store = new Store(storage);
    const sam = store.createProfile('Sam');
    store.switchProfile(sam);
    store.setResult('wordle', '2026-10-01', 'sam');
    assert.ok(storage.getItem(`guessrTrackerData:${sam}`));
    store.deleteProfile(sam);
    assert.equal(storage.getItem(`guessrTrackerData:${sam}`), null);
    assert.equal(store.profileId, 'default', 'deleting the current profile switches to another');
    assert.throws(() => store.deleteProfile('default'), /at least one/);
});

// Two browsers: "Me" and "Sam" on one, a different "Me" save on the other.
function twoProfileBackup() {
    const a = new Store(new MemoryStorage());
    a.setResult('wordle', '2026-09-01', 'me 1');
    a.setResult('wordle', '2026-09-02', 'me 2');
    const sam = a.createProfile('Sam');
    a.switchProfile(sam);
    a.setResult('framed', '2026-08-15', 'sam 1');
    a.setResult('framed', '2026-08-20', 'sam 2');
    return { a, sam, text: a.exportJson(['default', sam]) };
}

test('export puts the chosen profiles in one file and marks them backed up', () => {
    const { a, sam, text } = twoProfileBackup();
    const file = JSON.parse(text);
    assert.equal(file.version, 3);
    assert.deepEqual(file.profiles.map(p => [p.id, p.name]), [['default', 'Me'], [sam, 'Sam']]);
    assert.equal(a.profileSummary('default').lastExport, file.exportedAt);
    assert.equal(a.profileSummary(sam).lastExport, file.exportedAt);
    assert.deepEqual(JSON.parse(a.exportJson()).profiles.map(p => p.name), ['Sam'], 'the current profile by default');
});

test('import lists each profile\'s dates and what is new, matching by id, then name', () => {
    const { sam, text } = twoProfileBackup();
    const b = new Store(new MemoryStorage());
    b.setResult('wordle', '2026-09-01', 'me 1');
    b.setResult('wordle', '2026-09-02', 'different');
    const backup = b.readBackup(text);
    assert.deepEqual(backup.profiles.map(p => [p.name, p.count, p.first, p.last]),
        [['Me', 2, '2026-09-01', '2026-09-02'], ['Sam', 2, '2026-08-15', '2026-08-20']]);
    assert.deepEqual(b.planImport(backup), ['default', 'new']);
    assert.deepEqual(b.compareImport(backup.profiles[0], 'default'), { added: 0, first: null, last: null, same: 1, conflicts: 1 });
    assert.deepEqual(b.compareImport(backup.profiles[1], 'new'), { added: 2, first: '2026-08-15', last: '2026-08-20', same: 0, conflicts: 0 });

    const sammy = b.createProfile('sam');
    b.switchProfile(sammy);
    b.setResult('framed', '2026-08-15', 'sam 1');
    assert.deepEqual(b.planImport(backup), ['default', sammy], 'same name, ignoring case');
    assert.deepEqual(b.compareImport(backup.profiles[1], sammy), { added: 1, first: '2026-08-20', last: '2026-08-20', same: 1, conflicts: 0 });
    assert.ok(sam !== sammy);
});

test('importing new profiles keeps their ids, so the next import matches them', () => {
    const { sam, text } = twoProfileBackup();
    const b = new Store(new MemoryStorage());
    const backup = b.readBackup(text);
    const summary = b.applyImport(backup, ['default', 'new']);
    assert.deepEqual(summary.profiles.map(p => [p.name, p.created, p.added]), [['Me', false, 2], ['Sam', true, 2]]);
    assert.deepEqual(b.profiles().map(p => p.id), ['default', sam]);
    assert.deepEqual(b.readProfile(sam).gameResults.framed.map(r => r.rawOutput), ['sam 1', 'sam 2']);
    assert.equal(b.profileId, 'default', 'importing does not switch profiles');
    assert.deepEqual(b.planImport(b.readBackup(text)), ['default', sam]);
    const again = b.applyImport(b.readBackup(text), b.planImport(b.readBackup(text)));
    assert.equal(again.added, 0, 'importing twice changes nothing');
    assert.equal(b.profiles().length, 2);
});

test('import can skip a profile or add it as a new one under a free name', () => {
    const { text } = twoProfileBackup();
    const b = new Store(new MemoryStorage());
    const backup = b.readBackup(text);
    const summary = b.applyImport(backup, ['new', null]);
    assert.deepEqual(b.profiles().map(p => p.name), ['Me', 'Me (2)']);
    assert.equal(summary.profiles.length, 1);
    assert.equal(b.applyImport(backup, [null, null]).added, 0);
});

test('a single-save backup goes to the current profile, or to a new one', () => {
    const b = new Store(new MemoryStorage());
    const sam = b.createProfile('Sam');
    b.switchProfile(sam);
    const old = JSON.stringify({ app: 'PuzzleTracker', version: 2, exportedAt: '2026-10-04T11:39:08.340Z', data: { gameResults: { wordle: [{ date: '2026-10-01', rawOutput: 'a' }] }, myGames: ['wordle'] }, customGames: [] });
    const backup = b.readBackup(old);
    assert.deepEqual(backup.profiles.map(p => [p.name, p.count]), [[null, 1]]);
    assert.deepEqual(b.planImport(backup), [sam]);
    b.applyImport(backup, ['new']);
    assert.equal(b.profiles()[2].name, 'Imported 2026-10-04');
    assert.deepEqual(b.readProfile(b.profiles()[2].id).myGames, ['wordle']);
});

test('backups without any profiles are rejected', () => {
    const store = new Store(new MemoryStorage());
    assert.throws(() => store.readBackup(JSON.stringify({ app: 'PuzzleTracker', version: 3, profiles: [] })), /no profiles/);
});
