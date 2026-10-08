// PuzzleTracker: today's list, paste-anywhere import, game details and game management.
(function () {
    const { h, fill, icon, gameIcon, sheet, sheetHeader, toast, menu, relativeDay } = PT.ui;
    const { localDate, addDays, format, summarize, statOf } = PT.stats;
    const { rowSummary, statChips } = PT.cards;

    let store;
    try {
        store = new PT.Store();
    } catch (error) {
        fill(document.getElementById('app'), h('div', { class: 'fatal' },
            h('h1', { text: 'Your saved data could not be read' }),
            h('p', { text: 'Nothing has been changed or deleted. Details: ' + error.message })));
        throw error;
    }

    const PENDING_KEY = 'pt.pending';
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const canHover = window.matchMedia('(hover: hover)').matches;
    let today = localDate();

    // ---- theme --------------------------------------------------------------------

    function applyTheme() {
        const theme = store.theme();
        if (theme) document.documentElement.dataset.theme = theme;
        else delete document.documentElement.dataset.theme;
    }

    function effectiveTheme() {
        return store.theme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    function toggleTheme() {
        store.setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
        applyTheme();
        render();
    }

    // ---- home ---------------------------------------------------------------------

    function render() {
        const games = store.myGames();
        const rows = games.map(game => ({ game, s: summarize(game, store.results(game.id), today) }));
        const todo = rows.filter(r => !r.s.today);
        const done = rows.filter(r => r.s.today);

        const app = document.getElementById('app');
        fill(app, 
            topBar(),
            todayHeader(done.length, rows.length),
            pasteZone(),
            pendingCallout(),
            games.length === 0 ? emptyState() : null,
            onboarding(),
            todo.length ? section(`Up next`, todo.length, todo.map(r => gameRow(r.game, r.s)), addGamesLink()) : null,
            done.length ? section('Done today', done.length, done.map(r => gameRow(r.game, r.s)), todo.length ? null : addGamesLink()) : null,
            games.length && !todo.length ? h('p', { class: 'all-done', text: 'All done for today. See you tomorrow!' }) : null,
            footer());
    }

    function topBar() {
        const dark = effectiveTheme() === 'dark';
        return h('header', { class: 'topbar' },
            h('div', { class: 'brand' }, PT.whimsy.wordmark()),
            h('div', { class: 'topbar-actions' },
                PT.profiles.button(store, { onChange: render }),
                h('button', { class: 'icon-btn', type: 'button', title: dark ? 'Light theme' : 'Dark theme', 'aria-label': dark ? 'Switch to light theme' : 'Switch to dark theme', onclick: toggleTheme }, icon(dark ? 'sun' : 'moon')),
                h('button', {
                    class: 'icon-btn', type: 'button', 'aria-label': 'Menu', 'aria-haspopup': 'menu',
                    onclick: e => menu(e.currentTarget, [
                        { label: 'Manage games', icon: 'list', onSelect: openManage },
                        { label: 'Create a game', icon: 'plus', onSelect: () => PT.builder.open(null, builderOptions()) },
                        { label: 'Profiles', icon: 'user', onSelect: () => PT.profiles.open(store, { onChange: render }) },
                        { label: 'Back up my data', icon: 'download', onSelect: exportData },
                        { label: 'Restore from backup', icon: 'upload', onSelect: importData },
                    ]),
                }, icon('more'))));
    }

    function todayHeader(doneCount, total) {
        const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        const pct = total ? doneCount / total : 0;
        return h('section', { class: 'today' },
            h('div', { class: 'today-text' },
                h('h1', { text: 'Today' }),
                h('p', { class: 'muted today-date', text: date }),
                h('p', { class: 'fact' }, h('span', { class: 'fact-label', text: 'Did you know?' }), PT.whimsy.factFor(today))),
            total ? h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': doneCount, 'aria-label': 'Games done today' },
                h('div', { class: 'progress-track' }, h('div', { class: 'progress-fill', style: { '--p': String(pct) } })),
                h('span', { class: 'progress-label', text: PT.whimsy.quip(doneCount, total) })) : null);
    }

    function pasteZone() {
        const keys = isMac ? ['⌘', 'V'] : ['Ctrl', 'V'];
        return h('button', { class: 'paste-zone', type: 'button', onclick: pasteFromButton },
            h('span', { class: 'paste-icon' }, icon('clipboard', { size: 22 })),
            h('span', { class: 'paste-text' },
                h('strong', { text: 'Paste a result' }),
                h('span', { class: 'muted' }, canHover
                    ? ['Copy your share text in any game, then press ', h('kbd', { text: keys[0] }), ' ', h('kbd', { text: keys[1] }), ' anywhere here.']
                    : 'Copy your share text in any game, then tap here.')));
    }

    function section(title, count, rows, action) {
        return h('section', { class: 'list-section' },
            h('div', { class: 'section-head' },
                h('h2', { class: 'section-title' }, title, h('span', { class: 'count', text: String(count) })),
                action),
            h('ul', { class: 'rows' }, rows));
    }

    function addGamesLink() {
        return h('button', { class: 'section-action', type: 'button', onclick: openManage }, '+ Add games');
    }

    function gameRow(game, s) {
        return h('li', { class: `row${s.today ? ' is-done' : ''}`, dataset: { tint: String(tint(game.id)) } },
            h('button', { class: 'row-main', type: 'button', onclick: () => openGame(game.id) }, rowSummary(game, s)),
            game.safeUrl && !s.today
                ? h('a', { class: 'btn btn-play', href: game.safeUrl, target: '_blank', rel: 'noopener noreferrer', onclick: () => markPending(game.id) }, 'Play', icon('external', { size: 15 }))
                : h('button', { class: 'icon-btn row-chevron', type: 'button', 'aria-label': `Open ${game.name}`, tabindex: '-1', onclick: () => openGame(game.id) }, icon('chevron')));
    }

    // A stable color (one of six) per game, so each card keeps its color.
    function tint(id) {
        let n = 0;
        for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 997;
        return n % 6;
    }

    // First visit: a handwritten note with a drawn arrow pointing at "+ Add games".
    // It goes away once dismissed or once the first result is logged.
    function onboarding() {
        const hasResults = Object.values(store.data.gameResults).some(list => list.length);
        let dismissed = false;
        try { dismissed = localStorage.getItem('pt.welcomed') === '1'; } catch (_) { /* storage blocked */ }
        if (hasResults || dismissed || !store.myGames().length) return null;
        const dismiss = () => { try { localStorage.setItem('pt.welcomed', '1'); } catch (_) { /* storage blocked */ } render(); };
        const SVG = 'http://www.w3.org/2000/svg';
        const arrow = document.createElementNS(SVG, 'svg');
        arrow.setAttribute('viewBox', '0 0 80 72');
        arrow.setAttribute('class', 'onboard-arrow');
        arrow.setAttribute('aria-hidden', 'true');
        for (const d of ['M3 16c14-9 33-12 46-4 11 7 15 21 14 40', 'M55 45l8 12 7-13']) {
            const path = document.createElementNS(SVG, 'path');
            path.setAttribute('d', d);
            arrow.append(path);
        }
        return h('div', { class: 'onboard', role: 'note' },
            h('div', { class: 'onboard-note' },
                h('p', { class: 'onboard-text', text: `Psst! There are ${store.allGames().length} games to pick from. Add more suggested games here` }),
                h('button', { class: 'onboard-dismiss', type: 'button', onclick: dismiss }, 'Got it')),
            arrow);
    }

    function emptyState() {
        return h('div', { class: 'empty' },
            h('h2', { text: 'Pick the games you play' }),
            h('p', { class: 'muted', text: 'Add your daily games to build a routine. You can paste results from any game we know, even ones not on your list.' }),
            h('button', { class: 'btn btn-primary', type: 'button', onclick: openManage }, icon('plus', { size: 18 }), 'Choose games'));
    }

    function footer() {
        const last = store.data.lastExport;
        const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / PT.stats.DAY) : null;
        const stale = Object.keys(store.data.gameResults).length > 0 && (days === null || days >= 14);
        return h('footer', { class: `footer${stale ? ' is-stale' : ''}` },
            h('p', {},
                'Your results are saved in this browser only. ',
                h('span', { text: last ? `Last backup ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}.` : 'No backup yet.' })),
            h('div', { class: 'footer-actions' },
                h('button', { class: 'link-btn', type: 'button', onclick: exportData, text: 'Back up' }),
                h('button', { class: 'link-btn', type: 'button', onclick: importData, text: 'Restore' }),
                h('button', { class: 'link-btn', type: 'button', onclick: openManage, text: 'Manage games' })));
    }

    // ---- "play, then paste" -------------------------------------------------------

    function markPending(id) {
        try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id, at: Date.now() })); } catch (_) { /* private mode */ }
    }

    function pendingGame() {
        try {
            const p = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
            if (!p || Date.now() - p.at > 3 * 60 * 60 * 1000) return null;
            const game = store.game(p.id);
            return game && !store.resultOn(game.id, today) ? game : null;
        } catch (_) {
            return null;
        }
    }

    function clearPending() {
        try { sessionStorage.removeItem(PENDING_KEY); } catch (_) { /* private mode */ }
    }

    function pendingCallout() {
        const game = pendingGame();
        if (!game) return null;
        return h('div', { class: 'callout', role: 'status' },
            gameIcon(game, 28),
            h('span', { class: 'callout-text' }, h('strong', { text: `Back from ${game.name}?` }), ' Paste your result to log it.'),
            h('button', { class: 'btn btn-small', type: 'button', onclick: pasteFromButton }, 'Paste'),
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Dismiss', onclick: () => { clearPending(); render(); } }, icon('x', { size: 18 })));
    }

    // ---- paste anywhere -----------------------------------------------------------

    function isTextField(el) {
        return el && (el.isContentEditable || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes(el.type)));
    }

    document.addEventListener('paste', e => {
        if (isTextField(e.target) || document.querySelector('dialog[open]')) return;
        const text = e.clipboardData && e.clipboardData.getData('text/plain');
        if (!text || !text.trim()) return;
        e.preventDefault();
        openConfirm(text);
    });

    async function pasteFromButton() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    openConfirm(text);
                    return;
                }
            } catch (_) { /* permission denied or unsupported: fall back to a paste box */ }
        }
        openConfirm('');
    }

    // Games ordered for a picker: the player's games first, then the rest by name.
    function pickerGames() {
        const mine = store.myGames();
        const mineIds = new Set(mine.map(g => g.id));
        const rest = store.allGames().filter(g => !mineIds.has(g.id)).sort((a, b) => a.name.localeCompare(b.name));
        return { mine, rest };
    }

    function gameSelect(selectedId, onChange, { placeholder } = {}) {
        const { mine, rest } = pickerGames();
        const option = g => h('option', { value: g.id, selected: g.id === selectedId, text: g.name });
        return h('select', { class: 'select', onchange: e => onChange(e.target.value) },
            placeholder ? h('option', { value: '', text: placeholder, selected: !selectedId, disabled: true }) : null,
            mine.length ? h('optgroup', { label: 'My games' }, mine.map(option)) : null,
            h('optgroup', { label: mine.length ? 'Other games' : 'All games' }, rest.map(option)));
    }

    // Shows what was detected and lets the player confirm the game(s) and date.
    // A paste that holds several games' sections (e.g. Gamedle's "all dailies"
    // share) can be logged to each of them at once.
    function openConfirm(initialText, { gameId } = {}) {
        let text = initialText;
        let chosen = gameId || null;
        let several = [];
        let date = today;

        const body = h('div', { class: 'sheet-body' });
        const { close } = sheet(h('div', {}, sheetHeader('Log a result', () => close()), body), { label: 'Log a result' });

        function detectGame() {
            if (gameId || !text.trim()) return;
            const hits = PT.rules.detect(store.allGames().filter(g => g.tracking), text);
            const sectioned = hits.filter(hit => hit.game.tracking.within && PT.rules.withinMatches(hit.game.tracking, text));
            several = sectioned.length > 1 ? sectioned.map(hit => ({ id: hit.game.id, checked: true })) : [];
            const pending = pendingGame();
            if (hits.length) {
                const mine = hits.find(hit => store.isMine(hit.game.id) && hit.score === hits[0].score);
                chosen = (mine || hits[0]).game.id;
            } else if (pending) {
                chosen = pending.id;
            } else {
                chosen = null;
            }
        }

        function dayField(note) {
            return h('div', { class: 'confirm-date' },
                h('label', { class: 'field inline' },
                    h('span', { class: 'field-label', text: 'Day' }),
                    h('input', { class: 'input', type: 'date', value: date, max: today, onchange: e => { date = e.target.value || today; draw(); } })),
                note);
        }

        function saved(games, outcomes) {
            for (const game of games) if (!store.isMine(game.id)) store.addToMine(game.id);
            clearPending();
            close();
            render();
            cheer();
            if (games.length === 1) {
                toast(outcomes[0] === 'replaced' ? `Updated ${games[0].name}` : `Logged ${games[0].name}`, { tone: 'good', action: 'View', onAction: () => openGame(games[0].id) });
            } else {
                toast(`Logged ${games.length} games`, { tone: 'good' });
            }
        }

        function drawSeveral() {
            const picked = several.filter(m => m.checked).map(m => store.game(m.id));
            const replacing = picked.filter(g => store.resultOn(g.id, date));
            fill(body,
                h('p', { class: 'muted', text: `This paste has results for ${several.length} games.` }),
                h('ul', { class: 'multi-list' }, several.map(m => {
                    const game = store.game(m.id);
                    return h('li', {},
                        h('label', { class: `multi-row${m.checked ? '' : ' is-off'}` },
                            h('input', { type: 'checkbox', checked: m.checked, onchange: e => { m.checked = e.target.checked; draw(); } }),
                            gameIcon(game, 36),
                            h('span', { class: 'multi-text' }, h('strong', { text: game.name }), statChips(game, text))));
                })),
                h('pre', { class: 'share-text', text: text.trim() }),
                dayField(replacing.length ? h('span', { class: 'warn small', text: `Replaces ${replacing.map(g => g.name).join(', ')} for ${relativeDay(date, today).toLowerCase()}.` }) : null),
                h('div', { class: 'sheet-actions' },
                    h('button', { class: 'btn btn-quiet', type: 'button', text: 'Log as one game', onclick: () => { several = []; draw(); } }),
                    h('span', { class: 'spacer' }),
                    h('button', { class: 'btn', type: 'button', onclick: () => close(), text: 'Cancel' }),
                    h('button', {
                        class: 'btn btn-primary', type: 'button', disabled: !picked.length, autofocus: picked.length > 0,
                        onclick: () => saved(picked, picked.map(g => store.setResult(g.id, date, text.trim()))),
                    }, icon('check', { size: 18 }), `Save ${picked.length} result${picked.length === 1 ? '' : 's'}`)));
        }

        function drawOne() {
            const game = chosen ? store.game(chosen) : null;
            const existing = game ? store.resultOn(game.id, date) : null;
            const detected = game && game.tracking && PT.rules.matchesAny(game.tracking.detect, text);
            fill(body,
                text.trim() ? null : h('label', { class: 'field' },
                    h('span', { class: 'field-label', text: 'Share text' }),
                    h('textarea', {
                        class: 'textarea', rows: 6, placeholder: 'Paste the text from the game\u2019s Share button',
                        oninput: e => { text = e.target.value; if (text.trim()) { detectGame(); draw(); } },
                    })),
                text.trim() ? h('div', { class: 'confirm-game' },
                    game ? gameIcon(game, 44) : h('span', { class: 'game-icon game-icon-unknown', style: { '--size': '44px' } }, '?'),
                    h('div', { class: 'confirm-game-text' },
                        h('span', { class: 'muted small', text: game ? (detected ? 'Recognized as' : 'Saving to') : 'Which game is this?' }),
                        gameSelect(chosen, id => { chosen = id; draw(); }, { placeholder: 'Choose a game' }))) : null,
                text.trim() ? statChips(game, text) : null,
                text.trim() ? h('pre', { class: 'share-text', text: text.trim() }) : null,
                text.trim() ? dayField(existing ? h('span', { class: 'warn small', text: `Replaces the ${game.name} result already saved for ${relativeDay(date, today).toLowerCase()}.` }) : null) : null,
                h('div', { class: 'sheet-actions' },
                    h('button', { class: 'btn', type: 'button', onclick: () => close(), text: 'Cancel' }),
                    h('button', {
                        class: 'btn btn-primary', type: 'button', disabled: !game || !text.trim(), autofocus: Boolean(game && text.trim()),
                        onclick: () => saved([game], [store.setResult(game.id, date, text.trim())]),
                    }, icon('check', { size: 18 }), existing ? 'Replace result' : 'Save result')));
        }

        function draw() {
            if (several.length > 1) drawSeveral();
            else drawOne();
            const area = body.querySelector('textarea');
            if (area) area.focus();
            else body.querySelector('[autofocus]')?.focus();
        }

        detectGame();
        draw();
    }

    // ---- game sheet ---------------------------------------------------------------

    function openGame(id) {
        const content = h('div', {});
        let close;
        let showAll = false;

        function draw() {
            const game = store.game(id);
            if (!game) { close(); return; }
            const s = summarize(game, store.results(id), today);
            const tiles = [
                ['Played', String(s.played)],
                s.solvedRate !== null ? ['Solved', `${Math.round(s.solvedRate * 100)}%`] : null,
                ['Streak', String(s.streak)],
                ['Best streak', String(s.bestStreak)],
                s.stat && s.average !== null ? [`Avg ${s.stat.name.toLowerCase()}`, format(s.stat, s.average, { withMax: false })] : null,
            ].filter(Boolean);

            const todayLabel = s.today && s.stat && s.today.values.Solved !== false && typeof s.today.values[s.stat.name] === 'number'
                ? String(s.today.values[s.stat.name]) : s.today && s.today.values.Solved === false ? 'X' : null;

            fill(content, 
                sheetHeader(h('span', { class: 'game-title' }, gameIcon(game, 32), h('span', { text: game.name })), () => close(),
                    game.safeUrl ? h('a', { class: 'btn btn-small', href: game.safeUrl, target: '_blank', rel: 'noopener noreferrer', onclick: () => markPending(game.id) }, 'Play', icon('external', { size: 14 })) : null,
                    h('button', {
                        class: 'icon-btn', type: 'button', 'aria-label': 'More', 'aria-haspopup': 'menu',
                        onclick: e => menu(e.currentTarget, [
                            { label: 'Edit tracking rules', icon: 'sliders', onSelect: () => PT.builder.open(game.id, builderOptions(draw)) },
                            store.isMine(id)
                                ? { label: 'Remove from my games', icon: 'x', onSelect: () => { store.removeFromMine(id); render(); draw(); toast(`Removed ${game.name} from your games`, { action: 'Undo', onAction: () => { store.addToMine(id); render(); draw(); } }); } }
                                : { label: 'Add to my games', icon: 'plus', onSelect: () => { store.addToMine(id); render(); draw(); } },
                        ]),
                    }, icon('more'))),
                h('div', { class: 'sheet-body' },
                    game.about || game.picture ? h('div', { class: 'about' },
                        PT.puzzles.picture(game.picture) ? h('span', { class: 'about-pic' }, PT.puzzles.picture(game.picture)) : null,
                        game.about ? h('p', { class: 'about-text', text: game.about }) : null) : null,
                    !game.tracking ? h('div', { class: 'notice' },
                        h('p', { text: game.legacy ? 'This game used old-style rules that are no longer supported. Rebuild them with blocks to see stats again; your history is safe.' : 'Stats aren’t set up for this game yet. Your results are still saved.' }),
                        h('button', { class: 'btn btn-small', type: 'button', onclick: () => PT.builder.open(game.id, builderOptions(draw)) }, icon('sliders', { size: 16 }), 'Set up tracking')) : null,
                    h('div', { class: 'tiles' }, tiles.map(([label, value]) => h('div', { class: 'tile' }, h('strong', { text: value }), h('span', { text: label })))),
                    s.played && s.distribution ? h('div', { class: 'panel' }, h('h3', { class: 'panel-title', text: `${s.stat.name} distribution` }), PT.charts.distribution(s.distribution, todayLabel)) : null,
                    s.played && !s.distribution && s.trend.length ? h('div', { class: 'panel' }, h('h3', { class: 'panel-title', text: `${s.stat.name} over time` }), PT.charts.trend(s.trend, s.stat)) : null,
                    addResultPanel(game, draw),
                    historyPanel(game, s, showAll, () => { showAll = true; draw(); }, draw)));
        }

        ({ close } = sheet(content, { className: 'sheet-game', label: 'Game details' }));
        draw();
    }

    function addResultPanel(game, redraw) {
        let date = today;
        const preview = h('div', { class: 'preview' });
        const area = h('textarea', {
            class: 'textarea', rows: 4, placeholder: `Paste a ${game.name} result`,
            oninput: () => update(),
        });
        const save = h('button', {
            class: 'btn btn-primary', type: 'button', disabled: true,
            onclick: () => {
                const outcome = store.setResult(game.id, date, area.value.trim());
                if (!store.isMine(game.id)) store.addToMine(game.id);
                clearPending();
                render();
                redraw();
                cheer();
                toast(outcome === 'replaced' ? `Updated ${game.name}` : `Logged ${game.name}`, { tone: 'good' });
            },
        }, icon('check', { size: 18 }), 'Save');
        function update() {
            const text = area.value.trim();
            save.disabled = !text;
            const existing = store.resultOn(game.id, date);
            fill(preview, text ? statChips(game, text) : null,
                text && existing ? h('p', { class: 'warn small', text: `Replaces the result saved for ${relativeDay(date, today).toLowerCase()}.` }) : null);
        }
        return h('div', { class: 'panel' },
            h('h3', { class: 'panel-title', text: store.resultOn(game.id, today) ? 'Add or replace a result' : 'Log today’s result' }),
            area, preview,
            h('div', { class: 'row-actions' },
                h('input', { class: 'input', type: 'date', value: date, max: today, 'aria-label': 'Day', onchange: e => { date = e.target.value || today; update(); } }),
                save));
    }

    function historyPanel(game, s, showAll, onShowAll, redraw) {
        if (!s.entries.length) return null;
        const visible = showAll ? s.entries : s.entries.slice(0, 15);
        return h('div', { class: 'panel' },
            h('h3', { class: 'panel-title', text: 'History' }),
            h('ul', { class: 'history' }, visible.map(entry => historyItem(game, entry, redraw))),
            !showAll && s.entries.length > visible.length
                ? h('button', { class: 'btn btn-quiet wide', type: 'button', onclick: onShowAll, text: `Show all ${s.entries.length}` }) : null);
    }

    function historyItem(game, entry, redraw) {
        const stats = (game.tracking && game.tracking.stats) || [];
        const summary = stats.filter(st => entry.values[st.name] !== undefined && st.name !== 'Solved').slice(0, 3)
            .map(st => `${st.name} ${format(st, entry.values[st.name])}`).join(' · ');
        const lost = entry.values.Solved === false;
        const details = h('details', { class: 'history-item' },
            h('summary', {},
                h('span', { class: 'history-date', text: relativeDay(entry.date, today) }),
                h('span', { class: `history-summary${lost ? ' is-loss' : ''}`, text: lost ? ['Not solved', summary].filter(Boolean).join(' · ') : summary || (stats.length ? 'No stats read' : 'Saved') }),
                icon('down', { size: 16 })),
            h('pre', { class: 'share-text', text: entry.raw }),
            h('div', { class: 'history-actions' },
                h('label', { class: 'field inline' },
                    h('span', { class: 'field-label', text: 'Day' }),
                    h('input', {
                        class: 'input', type: 'date', value: entry.date, max: today,
                        onchange: e => {
                            try { store.updateResult(game.id, entry.date, { date: e.target.value }); render(); redraw(); }
                            catch (err) { toast(err.message, { tone: 'bad' }); e.target.value = entry.date; }
                        },
                    })),
                h('button', {
                    class: 'btn btn-small', type: 'button',
                    onclick: e => {
                        e.currentTarget.disabled = true;
                        const pre = details.querySelector('pre');
                        const editor = h('textarea', { class: 'textarea', rows: Math.min(10, entry.raw.split('\n').length + 1), value: entry.raw });
                        pre.replaceWith(editor);
                        editor.focus();
                        const saveBtn = h('button', { class: 'btn btn-small btn-primary', type: 'button', text: 'Save text', onclick: () => {
                            if (!editor.value.trim()) { toast('Text can’t be empty. Delete the result instead.', { tone: 'bad' }); return; }
                            store.updateResult(game.id, entry.date, { rawOutput: editor.value.trim() });
                            render(); redraw();
                        } });
                        details.querySelector('.history-actions').append(saveBtn);
                    },
                }, icon('pencil', { size: 15 }), 'Edit text'),
                h('button', {
                    class: 'btn btn-small btn-danger', type: 'button',
                    onclick: () => {
                        store.deleteResult(game.id, entry.date);
                        render(); redraw();
                        toast(`Deleted ${relativeDay(entry.date, today).toLowerCase()}’s result`, { action: 'Undo', onAction: () => { store.setResult(game.id, entry.date, entry.raw); render(); redraw(); } });
                    },
                }, icon('trash', { size: 15 }), 'Delete')));
        return h('li', {}, details);
    }

    // Confetti for a logged result; a bigger burst when every game is done today.
    function cheer() {
        const mine = store.myGames();
        PT.whimsy.celebrate(mine.length > 0 && mine.every(g => store.resultOn(g.id, today)));
    }

    // ---- manage games -------------------------------------------------------------

    function openManage() {
        let query = '';
        const content = h('div', {});
        const { close } = sheet(content, { className: 'sheet-manage', label: 'Manage games', onClose: render });

        function draw() {
            const mine = store.myGames();
            const all = store.allGames().sort((a, b) => a.name.localeCompare(b.name));
            const q = query.trim().toLowerCase();
            const others = all.filter(g => !store.isMine(g.id) && (!q || g.name.toLowerCase().includes(q)));
            // Popular picks first, unless searching.
            const suggested = q ? [] : PT.games.suggested.map(id => others.find(g => g.id === id)).filter(Boolean);
            const rest = others.filter(g => !suggested.includes(g));
            const addItem = game => h('li', { class: 'manage-item' },
                PT.puzzles.thumb(game, 32),
                manageName(game, !game.builtIn ? h('span', { class: 'badge', text: 'custom' }) : null),
                h('button', { class: 'btn btn-small', type: 'button', onclick: () => { store.addToMine(game.id); draw(); } }, icon('plus', { size: 16 }), 'Add'));
            const body = h('div', { class: 'sheet-body' },
                h('h3', { class: 'panel-title', text: `My games (${mine.length})` }),
                mine.length ? h('ul', { class: 'manage-list' }, mine.map((game, i) => h('li', { class: 'manage-item' },
                    PT.puzzles.thumb(game, 32),
                    manageName(game, !game.tracking ? h('span', { class: 'badge', text: 'no stats' }) : null),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Move ${game.name} up`, disabled: i === 0, onclick: () => { store.moveMine(game.id, -1); draw(); } }, icon('up', { size: 18 })),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Move ${game.name} down`, disabled: i === mine.length - 1, onclick: () => { store.moveMine(game.id, 1); draw(); } }, icon('down', { size: 18 })),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Edit ${game.name} tracking`, onclick: () => PT.builder.open(game.id, builderOptions(draw)) }, icon('sliders', { size: 18 })),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Remove ${game.name}`, onclick: () => { store.removeFromMine(game.id); draw(); } }, icon('x', { size: 18 }))))) : h('p', { class: 'muted small', text: 'No games yet. Add some below.' }),
                h('div', { class: 'manage-add-head' },
                    h('h3', { class: 'panel-title', text: 'Add games' }),
                    h('button', { class: 'btn btn-small', type: 'button', onclick: () => PT.builder.open(null, builderOptions(draw)) }, icon('plus', { size: 16 }), 'Create a game')),
                h('label', { class: 'search' }, icon('search', { size: 18 }),
                    h('input', { class: 'input', type: 'search', placeholder: 'Search games', value: query, 'aria-label': 'Search games', oninput: e => { query = e.target.value; draw(); requestAnimationFrame(() => { const el = content.querySelector('.search input'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }); } })),
                suggested.length ? h('h4', { class: 'manage-group', text: 'Suggested' }) : null,
                suggested.length ? h('ul', { class: 'manage-list' }, suggested.map(addItem)) : null,
                suggested.length && rest.length ? h('h4', { class: 'manage-group', text: 'More games' }) : null,
                h('ul', { class: 'manage-list' }, rest.map(addItem)),
                others.length ? null : h('p', { class: 'muted small', text: q ? 'No matching games.' : 'Every game is on your list.' }));
            fill(content, sheetHeader('Manage games', () => close()), body);
        }
        draw();
    }

    // A game's name with its one-line description underneath.
    function manageName(game, badge) {
        return h('span', { class: 'manage-name' },
            h('span', { class: 'manage-title' }, h('span', { text: game.name }), badge),
            game.about ? h('span', { class: 'manage-about', text: game.about }) : null);
    }

    function builderOptions(after) {
        return {
            store,
            onSaved: () => { render(); if (after) after(); },
        };
    }

    // ---- backup -------------------------------------------------------------------

    function exportData() {
        PT.profiles.exportData(store, { today, onDone: render });
    }

    function importData() {
        PT.profiles.importData(store, { onDone: render });
    }

    // ---- day changes --------------------------------------------------------------

    function refreshDay() {
        const now = localDate();
        if (now !== today) {
            today = now;
            render();
        }
    }

    function scheduleMidnight() {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
        setTimeout(() => { refreshDay(); scheduleMidnight(); }, next - now);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshDay();
            if (pendingGame()) render();
        }
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);

    applyTheme();
    render();
    scheduleMidnight();

    PT.app = { store, render, openGame, openConfirm, openManage };
})();
