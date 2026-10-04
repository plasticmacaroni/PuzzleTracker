// Derived numbers for a game: streaks, solve rate, averages, distribution, trend.
// Everything is recomputed from stored share text, so fixing a rule fixes history.
(function (root) {
    const PT = root.PT || (root.PT = {});

    const DAY = 24 * 60 * 60 * 1000;

    function localDate(d = new Date()) {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    // Parses YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC midnight).
    function parseDate(s) {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function addDays(s, n) {
        const d = parseDate(s);
        d.setDate(d.getDate() + n);
        return localDate(d);
    }

    function statOf(game, name) {
        const stats = (game.tracking && game.tracking.stats) || [];
        return stats.find(s => s.name === name) || null;
    }

    function headlineStat(game) {
        const t = game.tracking;
        if (!t || !t.stats || !t.stats.length) return null;
        return statOf(game, t.headline) || t.stats.find(s => s.name !== 'Solved' && s.show !== 'yesno') || null;
    }

    function trimNumber(n, digits = 1) {
        return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
    }

    function formatTime(seconds) {
        const s = Math.round(seconds);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = String(s % 60).padStart(2, '0');
        return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
    }

    // Formats a stat value for display, e.g. "4/6", "1:47", "92%", "Yes".
    function format(stat, value, { digits, withMax = true } = {}) {
        if (value === null || value === undefined) return '—';
        if (digits === undefined) digits = Math.abs(value) >= 100 ? 0 : 1;
        if (typeof value === 'boolean' || (stat && stat.show === 'yesno')) return value ? 'Yes' : 'No';
        if (stat && stat.show === 'time') return formatTime(value);
        let text = trimNumber(value, digits);
        if (stat && stat.show === 'percent') return `${text}%`;
        if (stat && withMax && stat.max) text += `/${trimNumber(stat.max, 0)}`;
        if (stat && stat.unit) text += ` ${stat.unit}`;
        return text;
    }

    function parseEntries(game, results) {
        return results
            .map(r => ({ date: r.date, raw: r.rawOutput, values: PT.rules.evaluate(game.tracking, r.rawOutput) }))
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    }

    function streaks(dates, today) {
        const set = new Set(dates);
        let current = 0;
        let day = set.has(today) ? today : addDays(today, -1);
        while (set.has(day)) {
            current += 1;
            day = addDays(day, -1);
        }
        let best = 0;
        let run = 0;
        let prev = null;
        for (const d of [...set].sort()) {
            run = prev && addDays(prev, 1) === d ? run + 1 : 1;
            best = Math.max(best, run);
            prev = d;
        }
        return { current, best };
    }

    // Integer-valued headline stats with a small max get a bar distribution
    // (like Wordle's guess histogram); everything else gets a trend line.
    function distribution(game, entries, stat) {
        if (!stat || stat.show === 'time' || stat.show === 'percent') return null;
        const solved = statOf(game, 'Solved');
        const values = entries.map(e => e.values[stat.name]).filter(v => typeof v === 'number');
        if (values.some(v => !Number.isInteger(v))) return null;
        // Without a fixed maximum (e.g. Bandle's limit changes daily), use the
        // highest value seen, for small guess-count style stats only.
        const top = stat.max || (stat.better === 'lower' && values.length ? Math.max(...values) : 0);
        if (!top || top > 12) return null;
        const min = values.some(v => v === 0) ? 0 : 1;
        const buckets = [];
        for (let i = min; i <= top; i++) buckets.push({ label: String(i), count: 0, value: i });
        const lost = { label: 'X', count: 0, value: null };
        for (const e of entries) {
            if (solved && e.values.Solved === false) { lost.count += 1; continue; }
            const v = e.values[stat.name];
            const bucket = buckets.find(b => b.value === v);
            if (bucket) bucket.count += 1;
        }
        if (solved) buckets.push(lost);
        return buckets;
    }

    function summarize(game, results, today = localDate()) {
        const entries = parseEntries(game, results || []);
        const stat = headlineStat(game);
        const hasSolved = Boolean(statOf(game, 'Solved'));
        const { current, best } = streaks(entries.map(e => e.date), today);

        const judged = entries.filter(e => typeof e.values.Solved === 'boolean');
        const solvedRate = hasSolved && judged.length ? judged.filter(e => e.values.Solved).length / judged.length : null;

        // Average over the last 30 days, counting only solved results when the game
        // tracks solving. Losses show up in the solve rate instead.
        const cutoff = addDays(today, -29);
        const recent = entries.filter(e => e.date >= cutoff && e.date <= today);
        const averaged = (recent.length ? recent : entries)
            .filter(e => !(hasSolved && e.values.Solved === false))
            .map(e => (stat ? e.values[stat.name] : undefined))
            .filter(v => typeof v === 'number');
        const average = averaged.length ? averaged.reduce((a, b) => a + b, 0) / averaged.length : null;

        const trend = stat
            ? entries.filter(e => typeof e.values[stat.name] === 'number').slice(0, 90).reverse()
                .map(e => ({ date: e.date, value: e.values[stat.name] }))
            : [];

        return {
            entries,
            stat,
            today: entries.find(e => e.date === today) || null,
            played: entries.length,
            streak: current,
            bestStreak: best,
            solvedRate,
            average,
            averageFromRecent: recent.length > 0,
            distribution: distribution(game, entries, stat),
            trend,
        };
    }

    PT.stats = { localDate, parseDate, addDays, statOf, headlineStat, format, formatTime, summarize, DAY };

    if (typeof module !== 'undefined' && module.exports) module.exports = PT.stats;
})(typeof window !== 'undefined' ? window : globalThis);
