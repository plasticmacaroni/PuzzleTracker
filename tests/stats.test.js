// Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/rules.js');
const stats = require('../js/stats.js');

const wordle = {
    id: 'wordle',
    tracking: {
        detect: ['Wordle {number}'],
        stats: [
            { name: 'Solved', is: { has: ['Wordle {number} {number}/6'] }, show: 'yesno' },
            { name: 'Guesses', is: { find: ['Wordle {number} {number}/6'], take: 2 }, better: 'lower', max: 6 },
        ],
        headline: 'Guesses',
    },
};
const r = (date, guesses) => ({ date, rawOutput: `Wordle 1,500 ${guesses}/6` });

test('streaks count consecutive days, allowing today to be unplayed', () => {
    const results = [r('2026-10-01', 3), r('2026-10-02', 4), r('2026-10-03', 'X'), r('2026-09-20', 2)];
    const s = stats.summarize(wordle, results, '2026-10-04');
    assert.equal(s.streak, 3);
    assert.equal(s.bestStreak, 3);
    assert.equal(stats.summarize(wordle, results, '2026-10-05').streak, 0);
});

test('streaks cross month and year boundaries', () => {
    const results = [r('2025-12-31', 3), r('2026-01-01', 4)];
    assert.equal(stats.summarize(wordle, results, '2026-01-01').streak, 2);
});

test('solve rate counts losses; average counts only solved results', () => {
    const results = [r('2026-10-01', 3), r('2026-10-02', 5), r('2026-10-03', 'X'), r('2026-10-04', 4)];
    const s = stats.summarize(wordle, results, '2026-10-04');
    assert.equal(s.solvedRate, 0.75);
    assert.equal(s.average, 4);
    assert.equal(s.today.values.Guesses, 4);
});

test('average uses the last 30 days', () => {
    const results = [r('2026-08-01', 6), r('2026-10-01', 2), r('2026-10-02', 4)];
    assert.equal(stats.summarize(wordle, results, '2026-10-04').average, 3);
});

test('distribution buckets guesses and losses', () => {
    const results = [r('2026-10-01', 3), r('2026-10-02', 3), r('2026-10-03', 'X'), r('2026-10-04', 6)];
    const d = stats.summarize(wordle, results, '2026-10-04').distribution;
    assert.deepEqual(d.map(b => [b.label, b.count]), [['1', 0], ['2', 0], ['3', 2], ['4', 0], ['5', 0], ['6', 1], ['X', 1]]);
});

test('format handles numbers, max, time, percent and yes/no', () => {
    assert.equal(stats.format({ max: 6 }, 4), '4/6');
    assert.equal(stats.format({ max: 6 }, 3.8571), '3.9/6');
    assert.equal(stats.format({ show: 'time' }, 107), '1:47');
    assert.equal(stats.format({ show: 'time' }, 3723), '1:02:03');
    assert.equal(stats.format({ show: 'percent' }, 92.5), '92.5%');
    assert.equal(stats.format({ show: 'yesno' }, true), 'Yes');
    assert.equal(stats.format({ unit: 'pts' }, 33553), '33,553 pts');
    assert.equal(stats.format(null, null), '—');
});

test('dates are handled as local days', () => {
    assert.equal(stats.addDays('2026-03-08', 1), '2026-03-09');
    assert.equal(stats.addDays('2026-11-01', 1), '2026-11-02');
    assert.equal(stats.addDays('2026-01-01', -1), '2025-12-31');
});

test('large averages drop the decimal', () => {
    assert.equal(stats.format({ max: 50000 }, 33654.7, { withMax: false }), '33,655');
    assert.equal(stats.format({}, 3.86), '3.9');
});
