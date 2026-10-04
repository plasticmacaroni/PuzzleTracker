// Two small charts: a Wordle-style distribution and a trend line. Plain DOM/SVG,
// colored by CSS variables so they follow the theme.
(function (root) {
    const PT = root.PT || (root.PT = {});
    const { h } = PT.ui;
    const SVG = 'http://www.w3.org/2000/svg';

    function distribution(buckets, highlight) {
        const most = Math.max(1, ...buckets.map(b => b.count));
        return h('div', { class: 'dist', role: 'list' }, buckets.map(b => h('div', { class: 'dist-row', role: 'listitem' },
            h('span', { class: 'dist-label', text: b.label }),
            h('span', { class: 'dist-track' },
                h('span', {
                    class: `dist-bar${b.label === highlight ? ' is-today' : ''}${b.label === 'X' ? ' is-loss' : ''}`,
                    style: { '--w': `${Math.max(b.count ? 8 : 0, (b.count / most) * 100)}%` },
                }, h('span', { class: 'dist-count', text: String(b.count) }))))));
    }

    function svg(tag, attrs) {
        const el = document.createElementNS(SVG, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        return el;
    }

    // Points plus a rolling average of the last 7 results.
    function trend(points, stat) {
        if (points.length < 2) return h('p', { class: 'muted small', text: 'The trend appears after two results.' });
        const W = 600, H = 180, PAD = { l: 44, r: 12, t: 12, b: 26 };
        const values = points.map(p => p.value);
        let lo = Math.min(...values), hi = Math.max(...values);
        if (stat && stat.max && stat.show !== 'time') hi = Math.max(hi, stat.max);
        if (lo === hi) { lo -= 1; hi += 1; }
        if (lo > 0 && lo / hi < 0.5) lo = 0;
        const x = i => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
        const y = v => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);

        const chart = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'trend', role: 'img', 'aria-label': `${stat ? stat.name : 'Value'} over the last ${points.length} results` });
        for (const v of [lo, (lo + hi) / 2, hi]) {
            chart.append(svg('line', { x1: PAD.l, x2: W - PAD.r, y1: y(v), y2: y(v), class: 'trend-grid' }));
            const label = svg('text', { x: PAD.l - 8, y: y(v) + 4, class: 'trend-axis', 'text-anchor': 'end' });
            label.textContent = PT.stats.format(stat, v, { digits: 0, withMax: false });
            chart.append(label);
        }
        const rolling = values.map((_, i) => {
            const window = values.slice(Math.max(0, i - 6), i + 1);
            return window.reduce((a, b) => a + b, 0) / window.length;
        });
        chart.append(svg('polyline', { points: rolling.map((v, i) => `${x(i)},${y(v)}`).join(' '), class: 'trend-avg' }));
        points.forEach((p, i) => {
            const dot = svg('circle', { cx: x(i), cy: y(p.value), r: points.length > 60 ? 2.5 : 3.5, class: 'trend-dot' });
            const title = svg('title', {});
            title.textContent = `${p.date}: ${PT.stats.format(stat, p.value)}`;
            dot.append(title);
            chart.append(dot);
        });
        for (const i of [0, points.length - 1]) {
            const label = svg('text', { x: x(i), y: H - 6, class: 'trend-axis', 'text-anchor': i ? 'end' : 'start' });
            label.textContent = PT.stats.parseDate(points[i].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            chart.append(label);
        }
        return h('div', { class: 'trend-wrap' }, chart,
            h('p', { class: 'muted small legend' }, h('span', { class: 'legend-dot' }), 'each result  ', h('span', { class: 'legend-line' }), '7-result average'));
    }

    PT.charts = { distribution, trend };
})(typeof window !== 'undefined' ? window : globalThis);
