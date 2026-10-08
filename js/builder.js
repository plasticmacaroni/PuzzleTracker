// Visual tracking-rule builder. Rules are assembled from five block types
// (Find, Count, Has, Math, If) plus numbers and references to earlier stats, and
// every block shows its live value against an example result.
(function (root) {
    const PT = root.PT || (root.PT = {});
    const { h, fill, icon, sheet, sheetHeader, toast, gameIcon } = PT.ui;

    const BLOCKS = {
        find: { label: 'Find', help: 'Finds a pattern and takes its {number} or {time}.', make: () => ({ find: ['{number}'] }) },
        count: { label: 'Count', help: 'Counts how many times something appears, like 🟩.', make: () => ({ count: [''] }) },
        has: { label: 'Has', help: 'Yes or no: does the text contain this?', make: () => ({ has: [''] }) },
        math: { label: 'Math', help: 'Adds, subtracts, multiplies, divides or compares two values.', make: () => ({ math: [null, '+', 1] }) },
        if: { label: 'If', help: 'Picks one value or another, depending on a yes/no.', make: () => ({ if: null, then: null, else: null }) },
    };

    const OP_LABELS = { '+': '+', '-': '−', '*': '×', '/': '÷', '=': '=', '!=': '≠', '<': '<', '<=': '≤', '>': '>', '>=': '≥' };
    const SHOW_LABELS = { number: 'Number', time: 'Time', percent: 'Percent', yesno: 'Yes / No' };

    const TEMPLATES = {
        guesses: {
            label: 'Guesses out of 6',
            tracking: name => ({
                detect: [name || ''],
                stats: [
                    { name: 'Solved', is: { has: ['{number}/6'] }, show: 'yesno' },
                    { name: 'Guesses', is: { find: ['{number}/6'] }, better: 'lower', max: 6 },
                ],
                headline: 'Guesses',
            }),
        },
        time: {
            label: 'Time to solve',
            tracking: name => ({ detect: [name || ''], stats: [{ name: 'Time', is: { find: ['{time}'] }, show: 'time', better: 'lower' }], headline: 'Time' }),
        },
        points: {
            label: 'Points',
            tracking: name => ({ detect: [name || ''], stats: [{ name: 'Score', is: { find: ['Score: {number}'] }, better: 'higher' }], headline: 'Score' }),
        },
        squares: {
            label: 'Emoji squares',
            tracking: name => ({
                detect: [name || ''],
                stats: [
                    { name: 'Solved', is: { has: ['🟩'] }, show: 'yesno' },
                    { name: 'Guesses', is: { count: ['🟥', '🟨', '🟩'] }, better: 'lower', max: 6 },
                ],
                headline: 'Guesses',
            }),
        },
        blank: { label: 'Start blank', tracking: name => ({ detect: [name || ''], stats: [] }) },
    };

    const clone = value => JSON.parse(JSON.stringify(value));

    function slugify(name, taken) {
        const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'game';
        let id = base;
        for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
        return id;
    }

    function showValue(v) {
        if (v === null || v === undefined) return '—';
        if (typeof v === 'boolean') return v ? 'yes' : 'no';
        return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    // Removes blank optional fields and blank patterns so the saved rules are tidy.
    function tidy(tracking) {
        const patterns = list => {
            const kept = (list || []).map(p => String(p)).filter(p => p.trim());
            return kept.length ? kept : list;
        };
        const walk = node => {
            if (!node || typeof node !== 'object') return node;
            if ('find' in node) return { find: patterns(node.find), ...(node.take > 1 ? { take: node.take } : {}) };
            if ('count' in node) return { count: patterns(node.count) };
            if ('has' in node) return { has: patterns(node.has), ...(node.mode === 'all' || node.mode === 'none' ? { mode: node.mode } : {}) };
            if ('math' in node) return { math: [walk(node.math[0]), node.math[1], walk(node.math[2])] };
            if ('if' in node) {
                const out = { if: walk(node.if), then: walk(node.then) };
                if (node.else !== null && node.else !== undefined) out.else = walk(node.else);
                return out;
            }
            return node;
        };
        const within = (tracking.within || []).filter(p => String(p).trim());
        const out = {
            detect: patterns(tracking.detect),
            ...(within.length ? { within } : {}),
            stats: tracking.stats.map(s => {
                const stat = { name: s.name.trim(), is: walk(s.is) };
                if (s.show && s.show !== 'number') stat.show = s.show;
                if (s.better) stat.better = s.better;
                if (s.max !== '' && s.max !== undefined && s.max !== null) stat.max = Number(s.max);
                if (s.unit && s.unit.trim()) stat.unit = s.unit.trim();
                return stat;
            }),
        };
        const headline = tracking.headline && out.stats.some(s => s.name === tracking.headline)
            ? tracking.headline
            : (out.stats.find(s => s.show !== 'yesno') || {}).name;
        if (headline) out.headline = headline;
        return out;
    }

    function renameRefs(node, from, to) {
        if (!node || typeof node !== 'object') return;
        if (node.stat === from) node.stat = to;
        if ('math' in node) { renameRefs(node.math[0], from, to); renameRefs(node.math[2], from, to); }
        if ('if' in node) { renameRefs(node.if, from, to); renameRefs(node.then, from, to); renameRefs(node.else, from, to); }
    }

    function open(gameId, { store, onSaved }) {
        const original = gameId ? store.game(gameId) : null;
        const isNew = !original;
        const draft = {
            id: original ? original.id : '',
            name: original ? original.name : '',
            url: original ? (original.url || '') : 'https://',
            about: original ? (original.about || '') : '',
            picture: original ? (original.picture || '') : '',
            tracking: clone((original && (original.tracking || original.draft)) || TEMPLATES.guesses.tracking(original ? original.name : '')),
        };
        draft.tracking.stats = draft.tracking.stats || [];
        draft.tracking.detect = draft.tracking.detect || [''];
        const latest = original ? [...store.results(original.id)].sort((a, b) => (a.date < b.date ? 1 : -1))[0] : null;
        let sample = latest ? latest.rawOutput : (original && original.example) || '';

        let refreshers = [];
        let lastFocused = null;
        const content = h('div', { class: 'builder' });
        const { close } = sheet(content, { className: 'sheet-builder', label: 'Tracking rules' });

        // The part of the example the stats read (all of it unless "Only look at" is set).
        function scoped() {
            return PT.rules.section(draft.tracking, sample);
        }

        // Values of the stats above each stat, for live previews of blocks.
        function evaluateStats() {
            const values = {};
            const before = [];
            const text = scoped();
            draft.tracking.stats.forEach((stat, i) => {
                before[i] = { ...values };
                const v = PT.rules.preview(stat.is, text, values);
                if (v !== null && v !== undefined && !(typeof v === 'number' && !Number.isFinite(v))) values[stat.name] = v;
            });
            return { values, before };
        }

        function refresh() {
            const ctx = evaluateStats();
            refreshers.forEach(fn => fn(ctx));
        }

        // ---- patterns ---------------------------------------------------------------

        function patternList(list, { kind }) {
            const wrap = h('span', { class: 'patterns' });
            const draw = () => {
                fill(wrap, ...list.map((p, i) => {
                    const input = h('input', {
                        class: 'pattern-input', value: p, size: Math.max(4, Math.ceil(p.length * 1.2) + 2), spellcheck: 'false',
                        placeholder: kind === 'count' ? '🟩' : 'text',
                        'aria-label': 'Pattern',
                        onfocus: e => { lastFocused = e.target; },
                        oninput: e => {
                            list[i] = e.target.value;
                            e.target.size = Math.max(4, Math.ceil(e.target.value.length * 1.2) + 2);
                            refresh();
                        },
                    });
                    refreshers.push(() => {
                        const against = kind === 'detect' || kind === 'within' ? sample : scoped();
                        const hit = sample.trim() && list[i].trim() ? PT.rules.matchesAny([list[i]], against) : null;
                        input.classList.toggle('is-hit', hit === true);
                        input.classList.toggle('is-miss', hit === false);
                    });
                    return h('span', { class: 'pattern' },
                        i > 0 ? h('span', { class: 'pattern-or', text: 'or' }) : null,
                        input,
                        list.length > 1 ? h('button', { class: 'pattern-x', type: 'button', 'aria-label': 'Remove pattern', onclick: () => { list.splice(i, 1); rebuild(); } }, icon('x', { size: 12 })) : null);
                }), h('button', { class: 'pattern-add', type: 'button', title: 'Add another pattern', onclick: () => { list.push(''); rebuild(); } }, '+ or'));
            };
            draw();
            return wrap;
        }

        // ---- blocks -----------------------------------------------------------------

        function bubbleFor(node, statIndex) {
            const out = h('output', { class: 'bubble' });
            refreshers.push(ctx => {
                const v = PT.rules.preview(node, scoped(), ctx.before[statIndex] || {});
                out.textContent = sample.trim() ? showValue(v) : '';
                out.classList.toggle('is-empty', v === null || v === undefined);
                out.hidden = !sample.trim();
            });
            return out;
        }

        function picker(set, statIndex) {
            const earlier = draft.tracking.stats.slice(0, statIndex).map(s => s.name).filter(Boolean);
            return h('select', {
                class: 'slot-picker', 'aria-label': 'Choose a block',
                onchange: e => {
                    const v = e.target.value;
                    if (BLOCKS[v]) set(BLOCKS[v].make());
                    else if (v === 'number') set(0);
                    else if (v.startsWith('stat:')) set({ stat: v.slice(5) });
                },
            },
            h('option', { value: '', text: '+ block', selected: true, disabled: true }),
            h('optgroup', { label: 'Blocks' }, Object.entries(BLOCKS).map(([k, b]) => h('option', { value: k, text: b.label }))),
            h('optgroup', { label: 'Values' },
                h('option', { value: 'number', text: 'Number' }),
                earlier.map(name => h('option', { value: `stat:${name}`, text: `Stat: ${name}` }))));
        }

        function removeButton(set) {
            return h('button', { class: 'block-x', type: 'button', 'aria-label': 'Remove block', title: 'Remove', onclick: () => set(null) }, icon('x', { size: 12 }));
        }

        // Renders the block in one slot. `set(value)` replaces it and redraws;
        // `set(value, true)` stores it without redrawing (used while typing).
        function slot(node, set, statIndex) {
            if (node === null || node === undefined) return picker(set, statIndex);

            if (typeof node === 'number') {
                return h('span', { class: 'block block-value' },
                    h('input', {
                        class: 'num-input', type: 'number', step: 'any', value: String(node), 'aria-label': 'Number',
                        oninput: e => { const n = parseFloat(e.target.value); set(Number.isFinite(n) ? n : 0, true); refresh(); },
                    }),
                    removeButton(set));
            }

            if ('stat' in node) {
                const earlier = draft.tracking.stats.slice(0, statIndex).map(s => s.name);
                return h('span', { class: 'block block-stat' },
                    h('select', { class: 'inline-select', 'aria-label': 'Stat', onchange: e => set({ stat: e.target.value }) },
                        (earlier.includes(node.stat) ? earlier : [node.stat, ...earlier]).map(name => h('option', { value: name, selected: name === node.stat, text: name }))),
                    bubbleFor(node, statIndex), removeButton(set));
            }

            if ('find' in node) {
                const captures = Math.max(1, ...node.find.map(p => PT.rules.compilePattern(p || '').captures.length));
                return h('div', { class: 'block block-find' },
                    h('span', { class: 'block-label', text: 'find' }),
                    patternList(node.find, { kind: 'find' }),
                    captures > 1 ? h('span', { class: 'block-word', text: 'take value' }) : null,
                    captures > 1 ? h('select', { class: 'inline-select', 'aria-label': 'Which value', onchange: e => { node.take = Number(e.target.value); rebuild(); } },
                        Array.from({ length: captures }, (_, i) => h('option', { value: i + 1, selected: (node.take || 1) === i + 1, text: `#${i + 1}` }))) : null,
                    bubbleFor(node, statIndex), removeButton(set));
            }

            if ('count' in node) {
                return h('div', { class: 'block block-count' },
                    h('span', { class: 'block-label', text: 'count' }),
                    patternList(node.count, { kind: 'count' }),
                    bubbleFor(node, statIndex), removeButton(set));
            }

            if ('has' in node) {
                return h('div', { class: 'block block-has' },
                    h('span', { class: 'block-label', text: 'has' }),
                    h('select', { class: 'inline-select', 'aria-label': 'Any or all', onchange: e => { node.mode = e.target.value; refresh(); } },
                        h('option', { value: 'any', selected: node.mode !== 'all', text: 'any of' }),
                        h('option', { value: 'all', selected: node.mode === 'all', text: 'all of' }),
                        h('option', { value: 'none', selected: node.mode === 'none', text: 'none of' })),
                    patternList(node.has, { kind: 'has' }),
                    bubbleFor(node, statIndex), removeButton(set));
            }

            if ('math' in node) {
                return h('div', { class: 'block block-math' },
                    slot(node.math[0], (v, quiet) => { node.math[0] = v; if (!quiet) rebuild(); }, statIndex),
                    h('select', { class: 'inline-select op', 'aria-label': 'Operator', onchange: e => { node.math[1] = e.target.value; refresh(); } },
                        PT.rules.MATH_OPS.map(op => h('option', { value: op, selected: node.math[1] === op, text: OP_LABELS[op] }))),
                    slot(node.math[2], (v, quiet) => { node.math[2] = v; if (!quiet) rebuild(); }, statIndex),
                    bubbleFor(node, statIndex), removeButton(set));
            }

            if ('if' in node) {
                return h('div', { class: 'block block-if' },
                    h('span', { class: 'block-label', text: 'if' }),
                    slot(node.if, (v, quiet) => { node.if = v; if (!quiet) rebuild(); }, statIndex),
                    h('span', { class: 'block-word', text: 'then' }),
                    slot(node.then, (v, quiet) => { node.then = v; if (!quiet) rebuild(); }, statIndex),
                    h('span', { class: 'block-word', text: 'else' }),
                    slot(node.else, (v, quiet) => { node.else = v; if (!quiet) rebuild(); }, statIndex),
                    bubbleFor(node, statIndex), removeButton(set));
            }

            return h('span', { class: 'block block-bad', text: 'Unknown block' }, removeButton(set));
        }

        // ---- stats ------------------------------------------------------------------

        function statCard(stat, i) {
            const stats = draft.tracking.stats;
            const value = h('output', { class: 'stat-value' });
            refreshers.push(ctx => {
                const v = ctx.values[stat.name];
                value.textContent = sample.trim() ? (v === undefined ? 'no value' : PT.stats.format(stat, v)) : '';
                value.classList.toggle('is-empty', v === undefined);
            });
            return h('div', { class: 'stat-card' },
                h('div', { class: 'stat-head' },
                    h('input', {
                        class: 'input stat-name', value: stat.name, placeholder: 'Stat name', 'aria-label': 'Stat name', maxlength: 24,
                        oninput: e => {
                            const from = stat.name;
                            stat.name = e.target.value;
                            stats.slice(i + 1).forEach(s => renameRefs(s.is, from, stat.name));
                            if (draft.tracking.headline === from) draft.tracking.headline = stat.name;
                            refresh();
                        },
                        onchange: rebuild,
                    }),
                    h('span', { class: 'stat-equals', text: '=' }),
                    value,
                    h('span', { class: 'spacer' }),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move stat up', disabled: i === 0, onclick: () => { [stats[i - 1], stats[i]] = [stats[i], stats[i - 1]]; rebuild(); } }, icon('up', { size: 16 })),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move stat down', disabled: i === stats.length - 1, onclick: () => { [stats[i + 1], stats[i]] = [stats[i], stats[i + 1]]; rebuild(); } }, icon('down', { size: 16 })),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete stat', onclick: () => { stats.splice(i, 1); rebuild(); } }, icon('trash', { size: 16 }))),
                h('div', { class: 'stat-expr' }, slot(stat.is, (v, quiet) => { stat.is = v; if (!quiet) rebuild(); }, i)),
                h('div', { class: 'stat-options' },
                    h('label', { class: 'mini-field' }, 'Shows as',
                        h('select', { class: 'inline-select', onchange: e => { stat.show = e.target.value; rebuild(); } },
                            PT.rules.SHOW_KINDS.map(k => h('option', { value: k, selected: (stat.show || 'number') === k, text: SHOW_LABELS[k] })))),
                    stat.show === 'yesno' ? null : h('label', { class: 'mini-field' }, 'Better',
                        h('select', { class: 'inline-select', onchange: e => { stat.better = e.target.value || undefined; refresh(); } },
                            h('option', { value: '', selected: !stat.better, text: '—' }),
                            h('option', { value: 'lower', selected: stat.better === 'lower', text: 'Lower' }),
                            h('option', { value: 'higher', selected: stat.better === 'higher', text: 'Higher' }))),
                    stat.show === 'yesno' || stat.show === 'time' ? null : h('label', { class: 'mini-field' }, 'Out of',
                        h('input', { class: 'input mini', type: 'number', min: 1, value: stat.max === undefined ? '' : String(stat.max), placeholder: '—', oninput: e => { stat.max = e.target.value === '' ? undefined : Number(e.target.value); refresh(); } })),
                    stat.show === 'yesno' || stat.show === 'time' ? null : h('label', { class: 'mini-field' }, 'Unit',
                        h('input', { class: 'input mini', value: stat.unit || '', placeholder: 'pts', maxlength: 12, oninput: e => { stat.unit = e.target.value; refresh(); } }))));
        }

        // ---- layout -----------------------------------------------------------------

        function tokenBar() {
            const insert = token => {
                const input = lastFocused && content.contains(lastFocused) ? lastFocused : null;
                if (!input) { toast('Click into a pattern first, then add a placeholder.'); return; }
                const start = input.selectionStart ?? input.value.length;
                const end = input.selectionEnd ?? input.value.length;
                input.value = input.value.slice(0, start) + token + input.value.slice(end);
                input.dispatchEvent(new Event('input'));
                input.focus();
                input.setSelectionRange(start + token.length, start + token.length);
            };
            return h('div', { class: 'token-bar' },
                h('span', { class: 'muted small', text: 'Insert into a pattern:' }),
                h('button', { class: 'token', type: 'button', onmousedown: e => e.preventDefault(), onclick: () => insert('{number}'), title: 'Captures a number like 4, 1,569 or 92.5' }, '{number}'),
                h('button', { class: 'token', type: 'button', onmousedown: e => e.preventDefault(), onclick: () => insert('{time}'), title: 'Captures a time like 1:47, as seconds' }, '{time}'),
                h('button', { class: 'token', type: 'button', onmousedown: e => e.preventDefault(), onclick: () => insert('{skip}'), title: 'Skips over any text' }, '{skip}'),
                h('button', { class: 'token', type: 'button', onmousedown: e => e.preventDefault(), onclick: () => insert('{line}'), title: 'The rest of the line' }, '{line}'));
        }

        // The example as it would appear on the Today list and when logged.
        function previewPanel() {
            const box = h('div', { class: 'preview-card' });
            refreshers.push(() => {
                if (!sample.trim()) {
                    fill(box, h('p', { class: 'muted small', text: 'Paste an example result to see how it will look.' }));
                    return;
                }
                const prepared = PT.games.prepare({ id: draft.id || 'preview', name: draft.name.trim() || 'New game', url: draft.url, tracking: tidy(draft.tracking) });
                // Half-built rules still preview, even though they can't be saved yet.
                const game = { ...prepared, tracking: prepared.tracking || prepared.draft };
                const today = PT.stats.localDate();
                const s = PT.stats.summarize(game, [{ date: today, rawOutput: sample }], today);
                const recognized = PT.rules.matchesAny(game.tracking.detect, sample);
                fill(box,
                    h('ul', { class: 'rows' }, h('li', { class: 'row is-done' }, h('div', { class: 'row-main' }, PT.cards.rowSummary(game, s)))),
                    PT.cards.statChips(game, sample),
                    recognized ? null : h('p', { class: 'warn small', text: 'Pasting this wouldn\u2019t pick this game automatically; you\u2019d choose it by hand.' }));
            });
            return h('div', { class: 'panel' },
                h('h3', { class: 'panel-title', text: 'Preview' }),
                h('p', { class: 'muted small', text: 'How the example result shows on your Today list, and the stats saved when you log it.' }),
                box);
        }

        function legend() {
            return h('details', { class: 'legend-help' },
                h('summary', { text: 'How blocks work' }),
                h('ul', { class: 'legend-list' },
                    Object.entries(BLOCKS).map(([k, b]) => h('li', {}, h('span', { class: `block-chip block-${k}`, text: b.label }), h('span', { text: b.help }))),
                    h('li', {}, h('span', { class: 'block-chip block-value', text: '5' }), h('span', { text: 'A number, or a stat defined above, can go in any slot.' }))),
                h('p', { class: 'muted small' },
                    'Patterns are plain text. ', h('code', { text: '{number}' }), ' and ', h('code', { text: '{time}' }),
                    ' capture values, ', h('code', { text: '{skip}' }), ' jumps over anything and ', h('code', { text: '{line}' }),
                    ' takes the rest of a line. Capital letters and extra spaces don’t matter. A Yes / No stat named ',
                    h('strong', { text: 'Solved' }), ' powers the solve rate and marks misses.'));
        }

        function rebuild() {
            refreshers = [];
            const t = draft.tracking;
            const errorsBox = h('div', { class: 'builder-errors', role: 'alert' });
            const saveBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: save }, icon('check', { size: 18 }), 'Save');
            const recognized = h('p', { class: 'recognized small' });

            refreshers.push(() => {
                const errors = PT.rules.validateGame(candidate());
                fill(errorsBox, ...errors.slice(0, 6).map(e => h('p', { text: e })));
                errorsBox.hidden = !errors.length;
                saveBtn.disabled = errors.length > 0;
                const ok = sample.trim() ? PT.rules.matchesAny(t.detect, sample) : null;
                recognized.textContent = ok === null ? 'Paste an example to test your rules.' : ok ? 'This example is recognized as this game.' : 'Not recognized yet: add a pattern that appears in every result.';
                recognized.className = `recognized small ${ok === true ? 'good' : ok === false ? 'warn' : 'muted'}`;
            });

            const statsList = t.stats.map(statCard);

            fill(content, 
                sheetHeader(isNew ? 'Create a game' : h('span', { class: 'game-title' }, gameIcon(original, 28), h('span', { text: `${original.name} tracking` })), () => close()),
                h('div', { class: 'sheet-body builder-body' },
                    h('div', { class: 'builder-col' },
                        isNew ? h('div', { class: 'panel' },
                            h('h3', { class: 'panel-title', text: 'Start from' }),
                            h('div', { class: 'template-row' }, Object.entries(TEMPLATES).map(([key, tpl]) => h('button', {
                                class: 'btn btn-small', type: 'button', text: tpl.label,
                                onclick: () => { draft.tracking = tpl.tracking(draft.name); rebuild(); },
                            })))) : null,
                        h('div', { class: 'panel' },
                            h('label', { class: 'field' }, h('span', { class: 'field-label', text: 'Name' }),
                                h('input', { class: 'input', value: draft.name, maxlength: 60, oninput: e => { draft.name = e.target.value; refresh(); } })),
                            h('label', { class: 'field' }, h('span', { class: 'field-label', text: 'Link to play' }),
                                h('input', { class: 'input', type: 'url', value: draft.url, placeholder: 'https://', oninput: e => { draft.url = e.target.value.trim(); refresh(); } })),
                            h('label', { class: 'field' }, h('span', { class: 'field-label', text: 'What you do' }),
                                h('input', { class: 'input', value: draft.about, maxlength: 100, placeholder: 'Guess the 5-letter word in 6 tries', oninput: e => { draft.about = e.target.value; refresh(); } })),
                            h('div', { class: 'field' }, h('span', { class: 'field-label', text: 'Picture' }),
                                h('div', { class: 'picture-pick' },
                                    h('select', { class: 'select', 'aria-label': 'Picture', onchange: e => { draft.picture = e.target.value; rebuild(); } },
                                        h('option', { value: '', selected: !draft.picture, text: 'None (use the site icon)' }),
                                        PT.puzzles.NAMES.map(n => h('option', { value: n, selected: draft.picture === n, text: n }))),
                                    draft.picture ? h('span', { class: 'about-pic small' }, PT.puzzles.picture(draft.picture)) : null))),
                        h('div', { class: 'panel' },
                            h('h3', { class: 'panel-title', text: 'Example result' }),
                            h('textarea', { class: 'textarea mono', rows: 6, value: sample, placeholder: 'Paste a share text from this game to test your rules against it', oninput: e => { sample = e.target.value; refresh(); } }),
                            recognized),
                        h('div', { class: 'panel' },
                            h('h3', { class: 'panel-title', text: 'Recognize it by' }),
                            h('p', { class: 'muted small', text: 'Text that appears in every result from this game, like its name or link. Used to figure out which game a paste came from.' }),
                            h('div', { class: 'detect-list' }, patternList(t.detect, { kind: 'detect' }))),
                        h('div', { class: 'panel' },
                            h('div', { class: 'panel-head' },
                                h('h3', { class: 'panel-title', text: 'Only look at' }),
                                t.within
                                    ? h('button', { class: 'btn btn-small btn-quiet', type: 'button', onclick: () => { delete t.within; rebuild(); } }, 'Use the whole paste')
                                    : h('button', { class: 'btn btn-small', type: 'button', onclick: () => { t.within = ['']; rebuild(); } }, icon('plus', { size: 16 }), 'Limit to a section')),
                            h('p', { class: 'muted small', text: t.within
                                ? 'Stats read only the first part of the paste that matches. Useful when one share holds several games or modes.'
                                : 'Optional. For shares that hold several games or modes, stats can read just this game’s part.' }),
                            t.within ? h('div', { class: 'detect-list' }, patternList(t.within, { kind: 'within' })) : null),
                        legend()),
                    h('div', { class: 'builder-col' },
                        h('div', { class: 'panel' },
                            h('div', { class: 'panel-head' },
                                h('h3', { class: 'panel-title', text: 'Stats' }),
                                h('button', { class: 'btn btn-small', type: 'button', disabled: t.stats.length >= PT.rules.LIMITS.stats, onclick: () => { t.stats.push({ name: `Stat ${t.stats.length + 1}`, is: null }); rebuild(); } }, icon('plus', { size: 16 }), 'Add stat')),
                            tokenBar(),
                            statsList.length ? h('div', { class: 'stat-list' }, statsList) : h('p', { class: 'muted small', text: 'No stats yet. Results will be saved as text only.' }),
                            t.stats.some(s => s.show !== 'yesno') ? h('label', { class: 'field inline' },
                                h('span', { class: 'field-label', text: 'Main stat' }),
                                h('select', { class: 'select', onchange: e => { t.headline = e.target.value; refresh(); } },
                                    t.stats.filter(s => s.show !== 'yesno').map(s => h('option', { value: s.name, selected: s.name === (t.headline || ''), text: s.name })))) : null),
                        previewPanel())),
                h('footer', { class: 'builder-foot' },
                    errorsBox,
                    h('div', { class: 'sheet-actions' },
                        original && original.builtIn && original.edited ? h('button', { class: 'btn btn-quiet', type: 'button', onclick: resetToBuiltIn, text: 'Reset to built-in rules' }) : null,
                        original && !original.builtIn ? h('button', { class: 'btn btn-danger', type: 'button', onclick: deleteGame }, icon('trash', { size: 16 }), 'Delete game') : null,
                        h('span', { class: 'spacer' }),
                        h('button', { class: 'btn', type: 'button', onclick: () => close(), text: 'Cancel' }),
                        saveBtn)));
            refresh();
        }

        function candidate() {
            const taken = new Set(store.allGames().map(g => g.id));
            const id = draft.id || slugify(draft.name || 'game', taken);
            return {
                id, name: draft.name.trim(), url: draft.url, tracking: tidy(draft.tracking),
                ...(draft.about.trim() ? { about: draft.about.trim() } : {}),
                ...(draft.picture ? { picture: draft.picture } : {}),
                ...(sample.trim() ? { example: sample.trim().slice(0, 2000) } : {}),
            };
        }

        function save() {
            const game = candidate();
            const errors = PT.rules.validateGame(game);
            if (errors.length) { toast(errors[0], { tone: 'bad' }); return; }
            if (original && original.builtIn) delete game.example;
            store.saveGame(game);
            if (isNew) store.addToMine(game.id);
            close();
            onSaved();
            toast(isNew ? `Created ${game.name}` : `Saved ${game.name} tracking`, { tone: 'good' });
        }

        function resetToBuiltIn() {
            store.resetGame(original.id);
            close();
            onSaved();
            toast(`${original.name} is back to its built-in rules`);
        }

        function deleteGame() {
            if (!confirm(`Delete ${original.name}? Its saved results stay in your data and come back if you recreate a game with the same name.`)) return;
            store.deleteCustomGame(original.id);
            close();
            onSaved();
            toast(`Deleted ${original.name}`);
        }

        rebuild();
    }

    PT.builder = { open, tidy, TEMPLATES, BLOCKS };
})(typeof window !== 'undefined' ? window : globalThis);
