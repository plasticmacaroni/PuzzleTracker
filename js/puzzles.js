// Small pictures of what each kind of puzzle looks like, so a game's row reminds
// you what the game is about. Drawn as tiny SVGs in a 120×72 box; colors come from
// CSS variables (--pz-*) so they follow the theme.
(function (root) {
    const PT = root.PT || (root.PT = {});
    const SVG = 'http://www.w3.org/2000/svg';

    function el(tag, attrs, text) {
        const node = document.createElementNS(SVG, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // Shorthands: r(x, y, w, h, fill-class, radius), c(cx, cy, r, class), t(x, y, text, class, size), p(d, class)
    const r = (x, y, w, h, k = 'c', rx = 2) => el('rect', { x, y, width: w, height: h, rx, class: k });
    const c = (cx, cy, rad, k = 'c') => el('circle', { cx, cy, r: rad, class: k });
    const t = (x, y, text, k = 'ink', size = 11) => el('text', { x, y, class: `${k} pz-text`, 'font-size': size, 'text-anchor': 'middle' }, text);
    const p = (d, k = 'line') => el('path', { d, class: k });

    const KINDS = {
        // Letter tiles: guess the word.
        word: () => ['W', 'O', 'R', 'D', 'S'].flatMap((ch, i) => [r(2 + i * 23.5, 24, 22, 22, ['a', 'k', 'b', 'k', 'a'][i], 3), t(13 + i * 23.5, 40, ch, 'tile-ink', 14)]),
        // Four groups of four.
        groups: () => [0, 1, 2, 3].flatMap(row => [0, 1, 2, 3].map(col => r(8 + col * 27, 6 + row * 16, 24, 13, ['b', 'a', 'd', 'e'][row], 2))),
        price: () => [p('M20 22h56l14 14-14 14H20z', 'card'), c(28, 36, 3, 'bg'), t(56, 41, '$?.??', 'ink', 13), p('M100 18v18m-6-6 6 6 6-6', 'line'), p('M100 54V40m-6 6 6-6 6 6', 'line')],
        shape: () => [p('M18 30c6-14 22-16 30-10 8-8 20-4 22 6 8 2 10 12 4 18-4 10-18 12-26 6-10 4-24 0-28-8-6-2-6-10-2-12z', 'a'), c(96, 34, 15, 'card'), p('M96 22l5 12-5 12-5-12z', 'f'), t(96, 64, '1,204 km', 'ink', 8)],
        globe: () => [c(60, 36, 28, 'd'), p('M36 22c12 6 36 6 48 0M32 36h56M36 50c12-6 36-6 48 0M60 8c-12 16-12 40 0 56M60 8c12 16 12 40 0 56', 'line-soft'), p('M48 24c6-4 12 0 10 6s-10 6-12 2 0-6 2-8z', 'f'), p('M66 38c6-2 10 2 8 6s-8 4-10 0z', 'b'), p('M44 44c4 0 6 4 2 6s-6-2-2-6z', 'e')],
        treemap: () => [r(10, 8, 54, 56, 'a', 1), r(66, 8, 44, 30, 'd', 1), r(66, 40, 22, 24, 'b', 1), r(90, 40, 20, 12, 'f', 1), r(90, 54, 20, 10, 'e', 1)],
        grid9: () => [c(20, 14, 6, 'f'), c(20, 36, 6, 'd'), c(20, 58, 6, 'b'), c(48, 8, 5, 'a'), c(76, 8, 5, 'e'), c(104, 8, 5, 'b'),
            ...[0, 1, 2].flatMap(row => [0, 1, 2].map(col => r(36 + col * 28, 16 + row * 19, 25, 16, (row + col) % 3 === 0 ? 'a' : 'card', 2)))],
        frames: () => [r(6, 14, 108, 44, 'ink', 3), ...[0, 1, 2, 3, 4, 5, 6, 7, 8].flatMap(i => [r(10 + i * 12, 17, 6, 4, 'bg', 1), r(10 + i * 12, 51, 6, 4, 'bg', 1)]),
            r(12, 24, 30, 24, 'd', 1), r(45, 24, 30, 24, 'c', 1), r(78, 24, 30, 24, 'c', 1), p('M14 44l8-10 6 6 6-8 6 12z', 'a')],
        boxoffice: () => [p('M10 20h52v8a6 6 0 0 0 0 12v8H10v-8a6 6 0 0 0 0-12z', 'b'), t(36, 40, 'ADMIT', 'ink', 9), r(74, 40, 8, 22, 'a', 1), r(86, 30, 8, 32, 'a', 1), r(98, 18, 8, 44, 'a', 1), t(90, 14, '$', 'ink', 12)],
        chain: () => [p('M24 36h72', 'line'), c(20, 36, 12, 'd'), c(60, 36, 9, 'b'), c(100, 36, 12, 'a'), t(20, 40, 'A', 'tile-ink', 11), t(100, 40, 'B', 'tile-ink', 11)],
        queens: () => [...[0, 1, 2, 3, 4].flatMap(row => [0, 1, 2, 3, 4].map(col => r(32 + col * 12, 6 + row * 12, 12, 12, ['a', 'a', 'b', 'b', 'b', 'a', 'd', 'd', 'b', 'e', 'f', 'd', 'd', 'e', 'e', 'f', 'f', 'd', 'c', 'e', 'f', 'c', 'c', 'c', 'e'][row * 5 + col], 0))),
            t(38, 16, '♛', 'ink', 10), t(86, 28, '♛', 'ink', 10), t(50, 40, '♛', 'ink', 10)],
        emoji: () => [p('M12 14h96a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H40l-12 10v-10H12a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z', 'card'), t(60, 40, '🎬🦁👑', 'ink', 16)],
        screenshot: () => [r(14, 8, 92, 52, 'ink', 4), r(18, 12, 84, 44, 'd', 2), p('M18 56l20-22 14 14 12-10 26 18z', 'a'), c(88, 22, 5, 'b'), r(50, 62, 20, 4, 'ink', 1)],
        cover: () => [r(36, 6, 48, 60, 'ink', 2), ...[0, 1, 2, 3, 4, 5].flatMap(row => [0, 1, 2, 3].map(col => r(40 + col * 10, 10 + row * 9, 10, 9, ['d', 'a', 'b', 'f', 'c', 'e'][(row * 3 + col) % 6], 0)))],
        artwork: () => [r(18, 8, 84, 56, 'b', 3), r(24, 14, 72, 44, 'bg', 1), p('M24 58c10-14 18-20 26-12s14-10 22-6 14 8 24 0v18H24z', 'a'), c(80, 24, 6, 'f')],
        tags: () => [r(8, 12, 46, 14, 'a', 7), r(58, 12, 54, 14, 'd', 7), r(8, 32, 58, 14, 'b', 7), r(70, 32, 42, 14, 'e', 7), r(8, 52, 40, 14, 'c', 7)],
        clues: () => [r(8, 10, 104, 12, 'card', 3), r(8, 28, 92, 12, 'card', 3), r(8, 46, 72, 12, 'card', 3), t(100, 58, '?', 'f', 16)],
        spelling: () => [r(10, 22, 30, 12, 'k', 2), r(44, 22, 40, 12, 'k', 2), r(88, 22, 22, 12, 'k', 2), p('M44 42q3-4 6 0t6 0 6 0 6 0 6 0 6 0', 'line-bad'), t(60, 62, 'ABC', 'ink', 10)],
        plate: () => [c(52, 38, 26, 'card'), c(52, 38, 17, 'b'), c(46, 34, 4, 'f'), c(58, 42, 4, 'a'), p('M100 22a9 9 0 0 1 9 9c0 8-9 16-9 16s-9-8-9-16a9 9 0 0 1 9-9z', 'f'), c(100, 31, 3, 'bg')],
        points: () => [r(8, 14, 30, 42, 'a', 4), r(45, 14, 30, 42, 'b', 4), r(82, 14, 30, 42, 'c', 4), t(23, 42, '3', 'tile-ink', 18), t(60, 42, '2', 'tile-ink', 18), t(97, 42, '1', 'tile-ink', 18)],
        band: () => [...[18, 30, 12, 36, 24, 40, 16, 28].map((hgt, i) => r(10 + i * 9, 60 - hgt, 6, hgt, i % 2 ? 'd' : 'e', 2)), p('M94 18v26a6 6 0 1 1-3-5V22l16-4v22a6 6 0 1 1-3-5V22', 'line')],
        versus: () => [r(8, 10, 44, 52, 'd', 5), r(68, 10, 44, 52, 'f', 5), c(60, 36, 11, 'bg'), t(60, 40, 'vs', 'ink', 10), t(30, 42, '?', 'tile-ink', 18), t(90, 42, '?', 'tile-ink', 18)],
        character: () => [c(30, 24, 11, 'ink'), p('M12 62c0-14 8-22 18-22s18 8 18 22z', 'ink'), ...[0, 1, 2].flatMap(row => [0, 1, 2, 3].map(col => r(56 + col * 14, 12 + row * 17, 12, 13, (row === 2) || (col + row) % 3 === 0 ? 'a' : (col + row) % 2 ? 'f' : 'b', 2)))],
        waffle: () => [0, 1, 2, 3, 4].flatMap(row => [0, 1, 2, 3, 4].flatMap(col => (row % 2 && col % 2) ? [] : [r(33 + col * 11, 6 + row * 12, 10, 11, (row + col) % 4 === 0 ? 'b' : 'a', 2)])),
        photo: () => [r(8, 8, 60, 56, 'card', 2), r(13, 13, 50, 38, 'd', 1), p('M13 51l14-16 10 10 8-6 18 12z', 'a'), t(38, 61, '19??', 'ink', 9), p('M96 18a10 10 0 0 1 10 10c0 9-10 18-10 18s-10-9-10-18a10 10 0 0 1 10-10z', 'f'), c(96, 28, 3.5, 'bg'), r(80, 52, 32, 8, 'c', 4)],
        faces: () => [c(46, 36, 22, 'b'), c(74, 36, 22, 'e'), c(40, 32, 2.5, 'ink'), c(80, 32, 2.5, 'ink'), p('M50 46q10 6 20 0', 'line')],
        categories: () => [r(8, 10, 40, 10, 'a', 5), r(8, 24, 50, 10, 'd', 5), r(8, 38, 34, 10, 'b', 5), r(8, 52, 44, 10, 'e', 5), r(66, 8, 46, 56, 'card', 3), t(89, 44, '?', 'ink', 22)],
        museum: () => [r(30, 54, 60, 10, 'c', 1), r(40, 48, 40, 6, 'c', 1), p('M52 48c-8-6-8-14 0-20-2-4 0-8 4-10h8c4 2 6 6 4 10 8 6 8 14 0 20z', 'b'), p('M54 34h12', 'line')],
        chart: () => [p('M14 8v52h96', 'line'), p('M16 52l18-14 16 6 18-22 16 8 22-18', 'line-a'), c(68, 22, 3, 'f')],
        rank: () => [1, 2, 3, 4, 5].flatMap(n => [t(14, 4 + n * 13, String(n), 'ink', 10), r(22, n * 13 - 6, [84, 70, 58, 44, 30][n - 1], 9, ['f', 'o', 'b', 'a', 'd'][n - 1], 2)]),
        estimate: () => [t(60, 34, '≈ ?', 'ink', 22), p('M14 50h92', 'line'), ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => p(`M${16 + i * 11} 50v${i % 2 ? 4 : 8}`, 'line'))],
        order: () => [1, 2, 3, 4].flatMap(n => [t(14, 4 + n * 15, String(n), 'ink', 10), r(22, n * 15 - 7, 70, 10, n === 2 ? 'f' : 'a', 2)]).concat([p('M104 22v28m-5-5 5 5 5-5m-10-18 5-5 5 5', 'line')]),
        // Answers sinking deeper the rarer they are (Krillion's ocean).
        rarity: () => [r(0, 0, 120, 72, 'd', 6), p('M0 22h120', 'line-soft'), r(14, 6, 92, 12, 'card', 6), r(16, 26, 34, 10, 'b', 5), r(42, 40, 34, 10, 'o', 5), r(70, 55, 34, 10, 'f', 5), c(24, 52, 3, 'bg'), c(30, 60, 2, 'bg'), c(100, 32, 2.5, 'bg')],
        // A person telling you about themselves, and a pin for where they're from.
        person: () => [c(26, 26, 11, 'ink'), p('M8 66c0-14 8-22 18-22s18 8 18 22z', 'ink'), p('M48 10h44a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H62l-10 8v-8h-4a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z', 'card'), r(52, 17, 30, 4, 'c', 2), r(52, 25, 20, 4, 'c', 2), p('M96 40a10 10 0 0 1 10 10c0 9-10 18-10 18s-10-9-10-18a10 10 0 0 1 10-10z', 'f'), c(96, 50, 3.5, 'bg')],
        quiz: () => [p('M10 8h60a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H30l-10 8v-8H10a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z', 'card'), t(40, 28, '?', 'ink', 16), r(82, 8, 30, 12, 'a', 6), r(82, 26, 30, 12, 'c', 6), r(82, 44, 30, 12, 'c', 6), r(44, 52, 30, 12, 'c', 6)],
    };

    const NAMES = Object.keys(KINDS);

    function picture(kind) {
        const draw = KINDS[kind];
        if (!draw) return null;
        const svg = el('svg', { viewBox: '0 0 120 72', class: `pz pz-${kind}`, 'aria-hidden': 'true', focusable: 'false' });
        for (const shape of draw()) svg.append(shape);
        return svg;
    }

    // The row thumbnail: the puzzle picture with the site's icon as a small badge,
    // or just the site's icon when the game has no picture.
    function thumb(game, size = 40) {
        const pic = picture(game.picture);
        if (!pic) return PT.ui.gameIcon(game, size);
        const wrap = PT.ui.h('span', { class: 'pz-thumb', title: game.about || null });
        wrap.append(pic, PT.ui.gameIcon(game, 18));
        return wrap;
    }

    PT.puzzles = { NAMES, picture, thumb };

    if (typeof module !== 'undefined' && module.exports) module.exports = PT.puzzles;
})(typeof window !== 'undefined' ? window : globalThis);
