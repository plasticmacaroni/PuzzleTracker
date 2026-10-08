// How a game and its results look on a card: the home list row and the stat chips
// shown when logging a result. Shared by the home screen and the rule builder's
// preview so both always match.
(function (root) {
    const PT = root.PT || (root.PT = {});
    const { h, icon, gameIcon } = PT.ui;
    const { format } = PT.stats;

    function metaLine(game, s) {
        const parts = [];
        if (s.streak > 1) parts.push(h('span', { class: 'meta-streak' }, icon('flame', { size: 14 }), String(s.streak)));
        if (s.average !== null && s.stat) parts.push(h('span', { text: `avg ${s.stat.name.toLowerCase()} ${format(s.stat, s.average, { withMax: false })}` }));
        if (s.solvedRate !== null) parts.push(h('span', { text: `${Math.round(s.solvedRate * 100)}% solved` }));
        if (!game.tracking) parts.push(h('span', { text: game.draft || game.legacy ? 'Tracking needs setup' : 'History only' }));
        // Unplayed is the normal state, so it isn't labeled.
        if (!parts.length && s.played) parts.push(h('span', { text: `${s.played} played` }));
        return h('span', { class: 'row-meta' }, parts.flatMap((p, i) => (i ? [h('span', { class: 'dot', 'aria-hidden': 'true', text: '·' }), p] : [p])));
    }

    function resultChip(game, s) {
        if (!s.today) return null;
        const v = s.today.values;
        const lost = v.Solved === false;
        const text = s.stat && v[s.stat.name] !== undefined ? format(s.stat, v[s.stat.name]) : lost ? 'Missed' : 'Done';
        return h('span', { class: `chip ${lost ? 'chip-bad' : 'chip-good'}` }, icon(lost ? 'x' : 'check', { size: 14 }), h('span', { text }));
    }

    // "Solved · 3/6" or "Missed" once today's result is in; nothing before that.
    function statusLabel(game, s) {
        if (!s.today) return null;
        const v = s.today.values;
        if (v.Solved === false) return h('span', { class: 'row-status is-missed', text: 'Missed' });
        const score = s.stat && v[s.stat.name] !== undefined ? ` \u00b7 ${format(s.stat, v[s.stat.name])}` : '';
        return h('span', { class: 'row-status is-solved', text: `Solved${score}` });
    }

    // Picture, today's status, name and the stats line, as on the Today list.
    function rowSummary(game, s) {
        return [
            PT.puzzles.thumb(game, 40),
            h('span', { class: 'row-text' },
                h('span', { class: 'row-title' }, h('span', { text: game.name }), resultChip(game, s)),
                metaLine(game, s)),
            statusLabel(game, s),
        ];
    }

    // One chip per stat read from a share text.
    function statChips(game, text) {
        if (!game) return null;
        if (!game.tracking) {
            return h('p', { class: 'muted small', text: 'This game has no tracking rules yet, so the text is saved as-is. You can add rules later from the game’s page.' });
        }
        const values = PT.rules.evaluate(game.tracking, text);
        const chips = game.tracking.stats.filter(s => values[s.name] !== undefined).map(s =>
            h('span', { class: `chip ${s.name === 'Solved' ? (values.Solved ? 'chip-good' : 'chip-bad') : ''}` },
                h('span', { class: 'chip-label', text: s.name }), h('strong', { text: format(s, values[s.name]) })));
        if (!chips.length) return h('p', { class: 'warn small', text: `Couldn’t read any ${game.name} stats from this text. It will still be saved, and stats will appear if the rules are fixed later.` });
        return h('div', { class: 'chips' }, chips);
    }

    PT.cards = { metaLine, resultChip, rowSummary, statChips };
})(typeof window !== 'undefined' ? window : globalThis);
