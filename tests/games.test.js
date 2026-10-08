// Run with: node --test
// Checks every built-in game against real share texts (tests/fixtures/share-texts.json).
// Evidence: C = pasted by a real player, S = rebuilt from the game's own code, U = unverified.
const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../js/rules.js');
const { defaults } = require('../js/games.js');
const fixtures = require('./fixtures/share-texts.json');

const tracked = defaults.filter(g => g.tracking);

test('every built-in game is valid', () => {
    for (const game of defaults) assert.deepEqual(rules.validateGame(game), [], game.id);
});

test('every built-in game has a short description and a known picture', () => {
    const { NAMES } = require('../js/puzzles.js');
    for (const game of defaults) {
        assert.ok(game.about && game.about.length <= 70, `${game.id} description`);
        assert.ok(NAMES.includes(game.picture), `${game.id} picture "${game.picture}"`);
    }
});

test('game ids are unique', () => {
    const ids = defaults.map(g => g.id);
    assert.equal(new Set(ids).size, ids.length);
});

test('every built-in game with tracking has fixtures and a recognized example', () => {
    for (const game of tracked) {
        assert.ok(fixtures[game.id] && fixtures[game.id].length, `${game.id} has fixtures`);
        assert.ok(rules.matchesAny(game.tracking.detect, game.example), `${game.id} example is recognized`);
    }
});

// The games a paste is logged to: the best match, or every game whose own section
// matched when several games share one paste (e.g. Gamedle's "all dailies" share).
function loggedGames(text) {
    const hits = rules.detect(tracked, text);
    const sectioned = hits.filter(h => h.game.tracking.within && rules.withinMatches(h.game.tracking, text));
    if (sectioned.length > 1) return sectioned.map(h => h.game.id);
    return hits.length ? [hits[0].game.id] : [];
}

for (const [id, examples] of Object.entries(fixtures)) {
    const game = defaults.find(g => g.id === id);
    test(`${id}: ${examples.length} share texts`, () => {
        assert.ok(game, `${id} is a built-in game`);
        examples.forEach((example, i) => {
            const label = `${id} example ${i + 1} (${example.outcome}, ${example.evidence}): ${JSON.stringify(example.text.slice(0, 60))}`;
            const logged = loggedGames(example.text);
            if (example.recognized === false) {
                assert.ok(!logged.includes(id), `${label} should not be logged as ${id}`);
                return;
            }
            // Some shares carry no identifying text at all; the player picks the game.
            if (example.detectable !== false) assert.ok(logged.includes(id), `${label} detected as [${logged}]`);
            const values = rules.evaluate(game.tracking, example.text);
            for (const stat of game.tracking.stats) {
                if (!(stat.name in example.expected)) continue;
                const want = example.expected[stat.name];
                const got = values[stat.name];
                if (want === null) assert.equal(got, undefined, `${label} → ${stat.name}`);
                else assert.equal(got, want, `${label} → ${stat.name}`);
            }
        });
    });
}
