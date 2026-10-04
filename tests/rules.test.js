// Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../js/rules.js');

const tracking = stats => ({ detect: ['x'], stats });

test('find captures numbers with thousands separators and decimals', () => {
    assert.equal(rules.preview({ find: ['{number}/50,000'] }, 'TimeGuessr #500 33,553/50,000'), 33553);
    assert.equal(rules.preview({ find: ['Total Score: {number}'] }, 'Total Score: 92.0'), 92);
});

test('find takes the requested capture', () => {
    const expr = { find: ['Wordle {number} {number}/6'], take: 2 };
    assert.equal(rules.preview(expr, 'Wordle 1,569 4/6'), 4);
    assert.equal(rules.preview({ find: ['Wordle {number} {number}/6'] }, 'Wordle 1,569 4/6'), 1569);
});

test('find converts {time} to seconds', () => {
    assert.equal(rules.preview({ find: ['{time}'] }, 'Queens #512 | 1:47 👑'), 107);
    assert.equal(rules.preview({ find: ['{time}'] }, 'took 1:02:03'), 3723);
});

test('find tries patterns in order and returns null when none match', () => {
    const expr = { find: ['= {number}', 'in {number} guesses'] };
    assert.equal(rules.preview(expr, 'got it in 7 guesses'), 7);
    assert.equal(rules.preview(expr, 'nothing here'), null);
});

test('{skip} spans text and lines; spaces match any whitespace', () => {
    assert.equal(rules.preview({ find: ['Queens {skip}{time}'] }, 'Queens #512\n1:47 👑'), 107);
    assert.equal(rules.preview({ find: ['Queens {skip}{time}'] }, 'Queens Nr. 323 | 0:58 und fehlerfrei'), 58);
    assert.equal(rules.preview({ has: ['Connections Puzzle #{number}'] }, 'Connections\nPuzzle #845'), true);
});

test('matching ignores case', () => {
    assert.equal(rules.preview({ has: ['x/6'] }, 'Bandle #890 X/6'), true);
});

test('count sums occurrences and ignores emoji variation selectors', () => {
    assert.equal(rules.preview({ count: ['🟥', '🟩'] }, '🎥 🟥 🟥 🟩 ⬛ ⬛ ⬛'), 3);
    // ➡️ is U+27A1 U+FE0F; a pattern typed with or without the selector counts once per arrow.
    assert.equal(rules.preview({ count: ['➡'] }, '🎬➡️🧑➡️🎬'), 2);
    assert.equal(rules.preview({ count: ['➡️'] }, '🎬➡🧑➡🎬'), 2);
});

test('zero-width characters do not break matching', () => {
    assert.equal(rules.preview({ has: ['Connections: Sports Edition'] }, '​Connections: Sports Edition #740'), true);
});

test('has supports any and all', () => {
    const groups = ['🟨🟨🟨🟨', '🟩🟩🟩🟩', '🟦🟦🟦🟦', '🟪🟪🟪🟪'];
    const won = '🟨🟨🟨🟨\n🟩🟦🟩🟩\n🟩🟩🟩🟩\n🟦🟦🟦🟦\n🟪🟪🟪🟪';
    const lost = '🟨🟨🟨🟨\n🟩🟦🟩🟩\n🟩🟦🟩🟪\n🟩🟦🟪🟩\n🟩🟦🟩🟩';
    assert.equal(rules.preview({ has: groups, mode: 'all' }, won), true);
    assert.equal(rules.preview({ has: groups, mode: 'all' }, lost), false);
    assert.equal(rules.preview({ has: groups }, lost), true);
});

test('math does arithmetic, comparisons, and propagates missing values', () => {
    assert.equal(rules.preview({ math: [{ count: ['🟥'] }, '+', 1] }, '🟥🟥'), 3);
    assert.equal(rules.preview({ math: [10, '/', 4] }, ''), 2.5);
    assert.equal(rules.preview({ math: [1, '/', 0] }, ''), null);
    assert.equal(rules.preview({ math: [{ find: ['{number}'] }, '>=', 5] }, 'score 7'), true);
    assert.equal(rules.preview({ math: [{ find: ['{number}'] }, '+', 1] }, 'none'), null);
});

test('if picks a branch; a missing else yields no value', () => {
    const stars = { if: { has: ['X/5'] }, then: 0, else: { find: ['{number}/5'] } };
    assert.equal(rules.preview(stars, '#waffle1234 X/5'), 0);
    assert.equal(rules.preview(stars, '#waffle1234 3/5'), 3);
    assert.equal(rules.preview({ if: { has: ['nope'] }, then: 1 }, 'text'), null);
});

test('evaluate runs stats in order and lets later stats use earlier ones', () => {
    const t = tracking([
        { name: 'Rows', is: { math: [{ count: ['🟨', '🟩', '🟦', '🟪'] }, '/', 4] } },
        { name: 'Groups', is: { count: ['🟨🟨🟨🟨', '🟩🟩🟩🟩', '🟦🟦🟦🟦', '🟪🟪🟪🟪'] } },
        { name: 'Mistakes', is: { math: [{ stat: 'Rows' }, '-', { stat: 'Groups' }] } },
    ]);
    const v = rules.evaluate(t, '🟨🟨🟨🟨\n🟩🟦🟩🟩\n🟩🟩🟩🟩\n🟦🟦🟦🟦\n🟪🟪🟪🟪');
    assert.deepEqual(v, { Rows: 5, Groups: 4, Mistakes: 1 });
});

test('evaluate omits stats with no value', () => {
    const v = rules.evaluate(tracking([{ name: 'Score', is: { find: ['Score: {number}'] } }]), 'no score');
    assert.deepEqual(v, {});
});

test('regex syntax in patterns is literal text', () => {
    assert.equal(rules.preview({ has: ['(.*)+$'] }, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'), false);
    assert.equal(rules.preview({ has: ['(.*)+$'] }, 'look: (.*)+$'), true);
    assert.equal(rules.preview({ find: ['Pick-{number}'] }, 'OEC Pick-5'), 5);
});

test('blank patterns never match', () => {
    assert.equal(rules.preview({ has: [''] }, 'anything'), null);
    assert.equal(rules.preview({ count: ['', '🟩'] }, '🟩🟩'), 2);
    assert.equal(rules.matchesAny(['  '], 'anything'), false);
});

test('detect ranks the most specific matching game first', () => {
    const games = [
        { id: 'wordle', tracking: { detect: ['Wordle {number}'], stats: [] } },
        { id: 'costcodle', tracking: { detect: ['Costcodle #{number}'], stats: [] } },
        { id: 'quordle', tracking: { detect: ['Daily Quordle {number}'], stats: [] } },
    ];
    assert.deepEqual(rules.detect(games, 'Costcodle #500 3/6').map(h => h.game.id), ['costcodle']);
    assert.deepEqual(rules.detect(games, '🙂 Daily Quordle 1576\n2️⃣8️⃣').map(h => h.game.id), ['quordle']);
    assert.deepEqual(rules.detect(games, 'hello').map(h => h.game.id), []);
});

test('validateGame accepts a well-formed game', () => {
    const game = {
        id: 'wordle', name: 'Wordle', url: 'https://www.nytimes.com/games/wordle/index.html',
        tracking: {
            detect: ['Wordle {number}'],
            stats: [
                { name: 'Solved', is: { has: ['{number}/6'] }, show: 'yesno' },
                { name: 'Guesses', is: { find: ['{number}/6'] }, better: 'lower', max: 6 },
            ],
            headline: 'Guesses',
        },
    };
    assert.deepEqual(rules.validateGame(game), []);
});

test('validateGame rejects code-like or malformed content', () => {
    const base = { id: 'g', name: 'G', url: 'https://example.com' };
    const errs = t => rules.validateGame({ ...base, tracking: t });
    assert.ok(rules.validateGame({ ...base, url: 'javascript:alert(1)' }).length, 'javascript: links are refused');
    assert.ok(rules.validateGame({ ...base, url: 'data:text/html,<script>' }).length, 'data: links are refused');
    assert.ok(errs({ detect: ['g'], stats: [{ name: 'S', is: { find: ['{number}'] }, transform: 'alert(1)' }] }).length, 'unknown stat keys are refused');
    assert.ok(errs({ detect: ['g'], stats: [{ name: 'S', is: { eval: 'alert(1)' } }] }).length, 'unknown blocks are refused');
    assert.ok(errs({ detect: ['g'], stats: [{ name: 'S', is: { find: ['{number}'], regex: '.*' } }] }).length, 'extra block keys are refused');
    assert.ok(errs({ detect: ['g'], stats: [{ name: 'S', is: { find: ['{regex}'] } }] }).length, 'unknown placeholders are refused');
    assert.ok(errs({ detect: ['g'], stats: [{ name: 'S', is: { stat: 'Later' } }, { name: 'Later', is: 1 }] }).length, 'stats can only use earlier stats');
    assert.ok(errs({ detect: ['g'], stats: [{ name: '<img>', is: 1 }] }).length, 'stat names are plain words');
    assert.ok(errs({ detect: ['g'], stats: [{ name: 'S', is: { math: [1, '**', 2] } }] }).length, 'unknown operators are refused');
    assert.ok(errs({ detect: ['g'], stats: [{ name: 'S', is: { find: ['{number}'], take: 2 } }] }).length, 'take must refer to a capture');
    assert.ok(errs({ detect: [], stats: [] }).length, 'needs a detect pattern');
});

test('validateGame limits nesting depth', () => {
    let deep = 1;
    for (let i = 0; i < 10; i++) deep = { math: [deep, '+', 1] };
    const errors = rules.validateGame({ id: 'g', name: 'G', url: 'https://example.com', tracking: { detect: ['g'], stats: [{ name: 'S', is: deep }] } });
    assert.ok(errors.some(e => /deep/.test(e)));
});

test('long pasted text is capped before matching', () => {
    const huge = 'a'.repeat(100000) + ' 4/6';
    assert.equal(rules.preview({ find: ['{number}/6'] }, huge), null);
});

test('numbers are read in any common locale', () => {
    const n = rules.parseNumber;
    assert.equal(n('1,569'), 1569);
    assert.equal(n('7.564'), 7564);
    assert.equal(n('92.5'), 92.5);
    assert.equal(n('13,5'), 13.5);
    assert.equal(n('85.44'), 85.44);
    assert.equal(n('1,234,567'), 1234567);
    assert.equal(n('1.234,5'), 1234.5);
    assert.equal(n('1,234.5'), 1234.5);
    assert.equal(rules.preview({ find: ['{number}/50'] }, 'TimeGuessr #1221 — 35.823/50.000'), 35823);
    // A no-break space can separate thousands ("1 932" in French).
    assert.equal(rules.preview({ find: ['Wordle {number}'] }, 'Wordle 1 932 X/6'), 1932);
});

test('{line} matches to the end of the line', () => {
    assert.equal(rules.preview({ count: ['🟥'] }, '🟥🟥\n🟥'), 3);
    const t = { detect: ['x'], within: ['🔑 ({line} {line}'], stats: [{ name: 'Red', is: { count: ['🟥'] } }] };
    assert.deepEqual(rules.evaluate(t, '🕹️ (Cover) #1:\n🟥🟥🟩\n🔑 (Keywords) #2:\n🟥🟩⬜\n🔍 (Guess) #3:\n🟥🟥🟥🟥'), { Red: 1 });
});

test('within falls back to the whole text when no section matches', () => {
    const t = { detect: ['x'], within: ['nope{line}'], stats: [{ name: 'Red', is: { count: ['🟥'] } }] };
    assert.deepEqual(rules.evaluate(t, '🟥🟥'), { Red: 2 });
    assert.equal(rules.withinMatches(t, '🟥🟥'), false);
});

test('has none of', () => {
    assert.equal(rules.preview({ has: ['Game Over'], mode: 'none' }, '12 tries - Game Over'), false);
    assert.equal(rules.preview({ has: ['Game Over'], mode: 'none' }, '4 tries'), true);
});
