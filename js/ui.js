// Small DOM helpers. Text is always inserted as text (never as HTML), so names,
// share text and imported game definitions can't inject markup.
(function (root) {
    const PT = root.PT || (root.PT = {});
    const SVG = 'http://www.w3.org/2000/svg';

    function h(tag, props, ...children) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(props || {})) {
            if (value === null || value === undefined || value === false) continue;
            if (key === 'class') el.className = value;
            else if (key === 'text') el.textContent = value;
            else if (key === 'style') for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
            else if (key === 'dataset') Object.assign(el.dataset, value);
            else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
            else if (key === 'value' || key === 'checked' || key === 'selected' || key === 'disabled') el[key] = value;
            else el.setAttribute(key, value === true ? '' : String(value));
        }
        append(el, children);
        return el;
    }

    // Replaces an element's children, skipping null/false (unlike the native
    // replaceChildren, which would print them as text).
    function fill(el, ...children) {
        el.replaceChildren();
        return append(el, children);
    }

    function append(el, children) {
        for (const child of children.flat(Infinity)) {
            if (child === null || child === undefined || child === false) continue;
            el.append(child instanceof Node ? child : String(child));
        }
        return el;
    }

    // Icon paths (24×24, stroked), in the style of Lucide.
    const ICONS = {
        external: ['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'],
        clipboard: ['M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'],
        chevron: ['m9 18 6-6-6-6'],
        more: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
        sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
        moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
        plus: ['M5 12h14', 'M12 5v14'],
        check: ['M20 6 9 17l-5-5'],
        x: ['M18 6 6 18', 'm6 6 12 12'],
        flame: ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z'],
        trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
        pencil: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'],
        up: ['m18 15-6-6-6 6'],
        down: ['m6 9 6 6 6-6'],
        search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'm21 21-4.3-4.3'],
        download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
        upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
        sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
        user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'],
        list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
        puzzle: ['M19.44 7.85c-.05.32.06.65.29.88l1.57 1.57c.47.47.7 1.09.7 1.7s-.23 1.24-.7 1.71l-1.61 1.61a.98.98 0 0 1-.84.28c-.47-.07-.8-.48-.97-.93a2.5 2.5 0 1 0-3.21 3.21c.45.17.86.5.93.97a.98.98 0 0 1-.28.84l-1.61 1.61a2.4 2.4 0 0 1-1.7.7 2.4 2.4 0 0 1-1.71-.7l-1.57-1.57a1.03 1.03 0 0 0-.88-.29c-.49.07-.84.5-1.02.97a2.5 2.5 0 1 1-3.24-3.24c.47-.18.9-.53.97-1.02a1.03 1.03 0 0 0-.29-.88l-1.57-1.57A2.4 2.4 0 0 1 2 12c0-.62.24-1.23.7-1.7L4.23 8.77c.24-.24.58-.35.92-.3.51.08.88.53 1.07 1.01a2.5 2.5 0 1 0 3.26-3.26c-.48-.2-.93-.56-1.01-1.07-.05-.34.06-.68.3-.92L10.3 2.7A2.4 2.4 0 0 1 12 2c.62 0 1.23.24 1.7.7l1.57 1.57c.23.23.56.34.88.29.49-.07.84-.5 1.02-.97a2.5 2.5 0 1 1 3.24 3.24c-.47.18-.9.53-.97 1.02Z'],
    };

    function icon(name, { size = 20, label } = {}) {
        const svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('class', 'icon');
        if (label) {
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', label);
        } else {
            svg.setAttribute('aria-hidden', 'true');
        }
        for (const d of ICONS[name] || []) {
            const path = document.createElementNS(SVG, 'path');
            path.setAttribute('d', d);
            svg.append(path);
        }
        return svg;
    }

    // Game icon: the site's favicon, falling back to a letter tile.
    function gameIcon(game, size = 40) {
        const letter = h('span', { class: 'game-icon-letter', text: (game.name || '?').trim().charAt(0).toUpperCase() });
        const wrap = h('span', { class: 'game-icon', style: { '--size': `${size}px`, '--hue': String(hue(game.id)) } }, letter);
        if (game.safeUrl) {
            const img = h('img', { alt: '', loading: 'lazy', width: size, height: size, referrerpolicy: 'no-referrer' });
            img.addEventListener('load', () => wrap.classList.add('has-img'));
            img.addEventListener('error', () => img.remove());
            img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(game.safeUrl).hostname)}&sz=64`;
            wrap.append(img);
        }
        return wrap;
    }

    function hue(text) {
        let n = 0;
        for (const ch of String(text)) n = (n * 31 + ch.codePointAt(0)) % 360;
        return n;
    }

    // Opens a modal sheet (bottom sheet on phones). Returns { dialog, close }.
    function sheet(content, { className = '', onClose, label } = {}) {
        const dialog = h('dialog', { class: `sheet ${className}`, 'aria-label': label || null });
        dialog.append(content);
        document.body.append(dialog);
        const close = () => dialog.close();
        dialog.addEventListener('close', () => {
            dialog.remove();
            if (onClose) onClose();
        });
        // Click on the backdrop closes the sheet.
        dialog.addEventListener('mousedown', e => {
            if (e.target === dialog) dialog.dataset.backdrop = '1';
        });
        dialog.addEventListener('click', e => {
            if (e.target === dialog && dialog.dataset.backdrop) close();
            delete dialog.dataset.backdrop;
        });
        dialog.showModal();
        return { dialog, close };
    }

    function sheetHeader(title, close, ...extra) {
        return h('header', { class: 'sheet-head' },
            h('div', { class: 'sheet-title' }, title),
            ...extra,
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: close }, icon('x')));
    }

    let toastTimer = null;
    function toast(message, { action, onAction, tone = 'plain', duration = 4500 } = {}) {
        let host = document.querySelector('.toast-host');
        if (!host) {
            host = h('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite' });
            document.body.append(host);
        }
        fill(host);
        const el = h('div', { class: `toast toast-${tone}` },
            h('span', { text: message }),
            action ? h('button', { class: 'toast-action', type: 'button', text: action, onclick: () => { el.remove(); onAction(); } }) : null);
        host.append(el);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.remove(), duration);
    }

    // A small dropdown menu anchored to a button.
    function menu(anchor, items) {
        document.querySelectorAll('.menu').forEach(m => m.remove());
        const list = h('div', { class: 'menu', role: 'menu' },
            items.filter(Boolean).map(item => h('button', {
                class: `menu-item${item.danger ? ' danger' : ''}`, type: 'button', role: 'menuitem',
                onclick: () => { list.remove(); item.onSelect(); },
            }, item.icon ? icon(item.icon, { size: 18 }) : null, h('span', { text: item.label }))));
        const host = anchor.closest('dialog') || document.body;
        host.append(list);
        const r = anchor.getBoundingClientRect();
        const hostRect = host === document.body ? { top: -window.scrollY, left: 0 } : host.getBoundingClientRect();
        const scroll = host === document.body ? 0 : host.scrollTop;
        list.style.setProperty('top', `${r.bottom - hostRect.top + scroll + 6}px`);
        list.style.setProperty('right', `${Math.max(8, (host === document.body ? document.documentElement.clientWidth : hostRect.left + host.clientWidth) - r.right)}px`);
        const dismiss = e => {
            if (!list.contains(e.target)) {
                list.remove();
                document.removeEventListener('pointerdown', dismiss, true);
            }
        };
        setTimeout(() => document.addEventListener('pointerdown', dismiss, true));
        list.querySelector('button')?.focus();
    }

    function relativeDay(date, today) {
        if (date === today) return 'Today';
        if (date === PT.stats.addDays(today, -1)) return 'Yesterday';
        const d = PT.stats.parseDate(date);
        const sameYear = date.slice(0, 4) === today.slice(0, 4);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' });
    }

    PT.ui = { h, append, fill, icon, gameIcon, sheet, sheetHeader, toast, menu, relativeDay };
})(typeof window !== 'undefined' ? window : globalThis);
