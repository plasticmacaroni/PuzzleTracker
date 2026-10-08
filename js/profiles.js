// Profiles: the top-bar switcher, the Profiles sheet, and backing up and restoring
// one or more profiles at once. Restoring always shows what each profile in the
// file holds, and what it would add, before anything changes.
(function (root) {
    const PT = root.PT || (root.PT = {});
    const { h, fill, icon, sheet, sheetHeader, toast, menu } = PT.ui;

    const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;
    const initial = name => [...name.trim()][0]?.toUpperCase() || '?';

    // Profiles take the card colors in list order, so neighbours never match.
    function tint(store, id) {
        return String(Math.max(0, store.profiles().findIndex(p => p.id === id)) % 6);
    }

    // '2026-08-28' -> 'Aug 28, 2026'
    function day(date) {
        const [y, m, d] = date.slice(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function span(first, last) {
        if (!first) return '';
        return first === last ? day(first) : `${day(first)} – ${day(last)}`;
    }

    // "625 results · May 18, 2025 – Aug 28, 2026", or "No results yet".
    function contents(s) {
        return s.count ? `${plural(s.count, 'result')} · ${span(s.first, s.last)}` : 'No results yet';
    }

    function badge(store, profile, size = 'small') {
        return h('span', { class: `profile-badge is-${size}`, dataset: { tint: tint(store, profile.id) }, 'aria-hidden': 'true', text: initial(profile.name) });
    }

    // ---- top bar --------------------------------------------------------------

    function button(store, { onChange }) {
        const current = store.profile();
        const all = store.profiles();
        return h('button', {
            class: 'profile-btn', type: 'button', title: 'Profiles',
            'aria-label': `Profile: ${current.name}. Switch profiles`, 'aria-haspopup': 'menu',
            onclick: e => menu(e.currentTarget, [
                ...all.map(p => ({
                    label: p.name, icon: p.active ? 'check' : 'user',
                    onSelect: () => { if (!p.active) switchTo(store, p.id, onChange); },
                })),
                { label: 'Add a profile', icon: 'plus', onSelect: () => open(store, { onChange, adding: true }) },
                { label: 'Manage profiles', icon: 'sliders', onSelect: () => open(store, { onChange }) },
            ]),
        }, badge(store, current), all.length > 1 ? h('span', { class: 'profile-btn-name', text: current.name }) : null);
    }

    function switchTo(store, id, onChange) {
        store.switchProfile(id);
        onChange();
        toast(`Switched to ${store.profile().name}`);
    }

    // ---- the Profiles sheet ---------------------------------------------------

    function open(store, { onChange, adding = false }) {
        const content = h('div', {});
        const { close } = sheet(content, { className: 'sheet-profiles', label: 'Profiles', onClose: onChange });
        let editing = null;   // id being renamed
        let deleting = null;  // id waiting for delete confirmation

        function row(p) {
            const s = store.profileSummary(p.id);
            const many = store.profiles().length > 1;
            let actions;
            if (editing === p.id) {
                const input = h('input', { class: 'input', value: p.name, maxlength: 30, 'aria-label': 'Profile name' });
                const save = () => {
                    try { store.renameProfile(p.id, input.value); editing = null; draw(); }
                    catch (err) { toast(err.message, { tone: 'bad' }); input.focus(); }
                };
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') save();
                    if (e.key === 'Escape') { e.preventDefault(); editing = null; draw(); }
                });
                requestAnimationFrame(() => { input.focus(); input.select(); });
                return h('li', { class: 'profile-item is-editing' }, badge(store, p, 'large'),
                    h('div', { class: 'profile-rename' }, input,
                        h('button', { class: 'btn btn-small btn-primary', type: 'button', onclick: save }, 'Save'),
                        h('button', { class: 'btn btn-small btn-quiet', type: 'button', onclick: () => { editing = null; draw(); } }, 'Cancel')));
            }
            if (deleting === p.id) {
                actions = h('div', { class: 'profile-confirm' },
                    h('span', { text: s.count ? `Delete ${p.name} and ${plural(s.count, 'result')} from this browser?` : `Delete ${p.name}?` }),
                    h('button', {
                        class: 'btn btn-small btn-danger', type: 'button',
                        onclick: () => { store.deleteProfile(p.id); deleting = null; draw(); onChange(); toast(`Deleted ${p.name}`); },
                    }, icon('trash', { size: 15 }), 'Delete'),
                    h('button', { class: 'btn btn-small btn-quiet', type: 'button', onclick: () => { deleting = null; draw(); } }, 'Cancel'));
            } else {
                actions = h('div', { class: 'profile-actions' },
                    p.active
                        ? h('span', { class: 'badge', text: 'Current' })
                        : h('button', { class: 'btn btn-small', type: 'button', onclick: () => { switchTo(store, p.id, onChange); close(); } }, 'Switch'),
                    h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Rename ${p.name}`, onclick: () => { editing = p.id; deleting = null; draw(); } }, icon('pencil', { size: 18 })),
                    many ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Delete ${p.name}`, onclick: () => { deleting = p.id; editing = null; draw(); } }, icon('trash', { size: 18 })) : null);
            }
            return h('li', { class: `profile-item${p.active ? ' is-active' : ''}` },
                badge(store, p, 'large'),
                h('span', { class: 'profile-text' },
                    h('span', { class: 'profile-name', text: p.name }),
                    h('span', { class: 'profile-meta', text: contents(s) })),
                actions);
        }

        function draw() {
            const name = h('input', { class: 'input', placeholder: 'Name, like Sam or Grandpa', maxlength: 30, 'aria-label': 'New profile name' });
            const add = () => {
                try {
                    const id = store.createProfile(name.value);
                    store.switchProfile(id);
                    close();
                    toast(`Made ${store.profile().name}’s profile. Add their games with “+ Add games”.`, { tone: 'good', duration: 6000 });
                } catch (err) {
                    toast(err.message, { tone: 'bad' });
                    name.focus();
                }
            };
            name.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
            fill(content,
                sheetHeader('Profiles', () => close()),
                h('div', { class: 'sheet-body' },
                    h('ul', { class: 'profile-list' }, store.profiles().map(row)),
                    h('section', { class: 'panel' },
                        h('h3', { class: 'panel-title', text: 'Add a profile' }),
                        h('div', { class: 'profile-add' }, name,
                            h('button', { class: 'btn btn-primary', type: 'button', onclick: add }, icon('plus', { size: 18 }), 'Add')),
                        h('p', { class: 'muted small', text: 'Each profile has its own results and game list. Custom games and the theme are shared.' }))));
            if (adding) {
                adding = false;
                requestAnimationFrame(() => name.focus());
            }
        }
        draw();
    }

    // ---- back up ----------------------------------------------------------------

    function download(store, ids, today, onDone) {
        const blob = new Blob([store.exportJson(ids)], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `puzzletracker-backup-${today}.json` });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        onDone();
        toast(ids.length > 1 ? `Backup downloaded with ${ids.length} profiles` : 'Backup downloaded', { tone: 'good' });
    }

    // With one profile this downloads straight away; with more, pick which to include.
    function exportData(store, { today, onDone }) {
        const all = store.profiles();
        if (all.length === 1) {
            download(store, [all[0].id], today, onDone);
            return;
        }
        const chosen = new Set(all.map(p => p.id));
        const content = h('div', {});
        const { close } = sheet(content, { className: 'sheet-backup', label: 'Back up profiles' });

        function draw() {
            const summaries = new Map(all.map(p => [p.id, store.profileSummary(p.id)]));
            const total = [...chosen].reduce((n, id) => n + summaries.get(id).count, 0);
            fill(content,
                sheetHeader('Back up profiles', () => close()),
                h('div', { class: 'sheet-body' },
                    h('div', { class: 'panel-head' },
                        h('p', { class: 'muted small', text: 'Everything you tick goes into one file.' }),
                        h('button', {
                            class: 'link-btn', type: 'button',
                            text: chosen.size === all.length ? 'Select none' : 'Select all',
                            onclick: () => { if (chosen.size === all.length) chosen.clear(); else all.forEach(p => chosen.add(p.id)); draw(); },
                        })),
                    h('ul', { class: 'pick-list' }, all.map(p => {
                        const s = summaries.get(p.id);
                        const days = s.lastExport ? Math.floor((Date.now() - new Date(s.lastExport).getTime()) / PT.stats.DAY) : null;
                        return h('li', {},
                            h('label', { class: `pick-item${chosen.has(p.id) ? '' : ' is-off'}` },
                                h('input', { type: 'checkbox', checked: chosen.has(p.id), onchange: e => { if (e.target.checked) chosen.add(p.id); else chosen.delete(p.id); draw(); } }),
                                badge(store, p, 'large'),
                                h('span', { class: 'profile-text' },
                                    h('span', { class: 'profile-name', text: p.name }),
                                    h('span', { class: 'profile-meta', text: contents(s) }),
                                    h('span', { class: 'profile-meta', text: s.lastExport ? `Last backed up ${days === 0 ? 'today' : days === 1 ? 'yesterday' : day(s.lastExport)}` : 'Never backed up' }))));
                    })),
                    h('div', { class: 'sheet-actions' },
                        h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => close() }, 'Cancel'),
                        h('button', {
                            class: 'btn btn-primary', type: 'button', disabled: !chosen.size,
                            onclick: () => { download(store, all.filter(p => chosen.has(p.id)).map(p => p.id), today, onDone); close(); },
                        }, icon('download', { size: 18 }), chosen.size ? `Download ${plural(chosen.size, 'profile')} (${plural(total, 'result')})` : 'Pick a profile'))));
        }
        draw();
    }

    // ---- restore ----------------------------------------------------------------

    function importData(store, { onDone }) {
        const input = h('input', { type: 'file', accept: '.json,application/json' });
        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file) return;
            let backup;
            try {
                backup = store.readBackup(await file.text());
            } catch (error) {
                toast(`Couldn’t read that file: ${error.message}`, { tone: 'bad', duration: 8000 });
                return;
            }
            review(store, backup, onDone);
        });
        input.click();
    }

    // Shows each profile in the file: its dates, what it would add, and where it goes.
    function review(store, backup, onDone) {
        const plan = store.planImport(backup);
        const targets = plan.slice();
        // Profiles with nothing new start unticked; their row says why.
        const included = backup.profiles.map((p, i) => targets[i] === 'new' ? p.count > 0 : store.compareImport(p, targets[i]).added > 0);
        const fresh = backup.profiles.map((p, i) => i).filter(i => plan[i] === 'new');
        const label = p => p.name || 'Saved results';
        const content = h('div', {});
        const { close } = sheet(content, { className: 'sheet-restore', label: 'Restore from backup' });

        function finish(chosen) {
            let summary;
            try {
                summary = store.applyImport(backup, chosen);
            } catch (error) {
                toast(`Couldn’t restore: ${error.message}`, { tone: 'bad', duration: 8000 });
                return;
            }
            close();
            onDone();
            const parts = summary.profiles.map(p => p.created
                ? `new profile ${p.name} (${plural(p.added, 'result')})`
                : `${plural(p.added, 'result')} added to ${p.name}`);
            if (summary.games) parts.push(plural(summary.games, 'custom game'));
            toast(parts.length ? `Restored: ${parts.join(', ')}.` : 'Nothing was restored.', { tone: 'good', duration: 9000 });
        }

        function item(p, i) {
            const target = targets[i];
            const c = store.compareImport(p, target);
            let note;
            if (target === 'new') {
                note = h('p', { class: 'import-note is-new', text: p.count ? `Adds a new profile with all ${plural(p.count, 'result')}.` : 'Adds a new, empty profile.' });
            } else if (c.added) {
                note = h('p', { class: 'import-note is-new' },
                    h('strong', { text: `${plural(c.added, 'result')} you don’t have` }), `, ${span(c.first, c.last)}.`);
            } else {
                note = h('p', { class: 'import-note', text: `Nothing new: ${store.profiles().find(l => l.id === target).name} already has ${p.count === 1 ? 'it' : `all ${p.count.toLocaleString()}`}.` });
            }
            const local = store.profiles();
            return h('li', { class: `import-item${included[i] ? '' : ' is-off'}` },
                h('label', { class: 'import-head' },
                    h('input', { type: 'checkbox', checked: included[i], onchange: e => { included[i] = e.target.checked; draw(); } }),
                    h('span', { class: 'profile-text' },
                        h('span', { class: 'profile-name', text: label(p) }),
                        h('span', { class: 'profile-meta', text: contents(p) }))),
                h('label', { class: 'field inline import-into' },
                    h('span', { class: 'field-label', text: 'Into' }),
                    h('select', {
                        class: 'select', disabled: !included[i],
                        onchange: e => { targets[i] = e.target.value; draw(); },
                    },
                    h('option', { value: 'new', selected: target === 'new', text: `A new profile${p.name ? ` called ${store.uniqueName(p.name)}` : ''}` }),
                    local.map(l => h('option', { value: l.id, selected: target === l.id, text: `${l.name}${l.active ? ' (current)' : ''}` })))),
                note,
                target !== 'new' && c.conflicts ? h('p', { class: 'import-note is-warn', text: `${plural(c.conflicts, 'day')} ${c.conflicts === 1 ? 'differs' : 'differ'} from yours. Yours are kept.` }) : null);
        }

        function draw() {
            const chosen = targets.map((t, i) => (included[i] ? t : null));
            const count = chosen.filter(Boolean).length;
            const duplicateTarget = chosen.filter(t => t && t !== 'new').some((t, i, list) => list.indexOf(t) !== i);
            fill(content,
                sheetHeader('Restore from backup', () => close()),
                h('div', { class: 'sheet-body' },
                    h('p', { class: 'muted small', text: `${backup.exportedAt ? `Backed up ${day(backup.exportedAt)}` : 'Backup'} · ${plural(backup.profiles.length, 'profile')}. Nothing you have is overwritten.` }),
                    fresh.length && backup.profiles.length > 1
                        ? h('div', { class: 'callout' },
                            h('span', { class: 'callout-text' }, h('strong', { text: `New here: ${fresh.map(i => label(backup.profiles[i])).join(', ')}.` })),
                            h('button', {
                                class: 'btn btn-small', type: 'button',
                                onclick: () => finish(backup.profiles.map((p, i) => (plan[i] === 'new' ? 'new' : null))),
                            }, `Add ${fresh.length === 1 ? 'it' : `all ${fresh.length}`} as new profile${fresh.length === 1 ? '' : 's'}`))
                        : null,
                    h('ul', { class: 'import-list' }, backup.profiles.map(item)),
                    duplicateTarget ? h('p', { class: 'warn small', text: 'Two profiles from the file are going into the same profile here; their results will be combined.' }) : null,
                    h('div', { class: 'sheet-actions' },
                        h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => close() }, 'Cancel'),
                        h('button', { class: 'btn btn-primary', type: 'button', disabled: !count, onclick: () => finish(chosen) },
                            icon('upload', { size: 18 }), count ? `Import ${plural(count, 'profile')}` : 'Nothing selected'))));
        }
        draw();
    }

    PT.profiles = { button, open, exportData, importData };
})(typeof window !== 'undefined' ? window : globalThis);
