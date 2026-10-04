// Tracking rules: a tiny, data-only language for pulling stats out of share text.
//
// A game's `tracking` looks like:
//   {
//     detect: ['Wordle {number} {number}/6', 'Wordle {number} X/6'],
//     stats: [
//       { name: 'Solved',  is: { has: ['{number}/6'] }, show: 'yesno' },
//       { name: 'Guesses', is: { find: ['{number}/6'] }, better: 'lower', max: 6 }
//     ],
//     headline: 'Guesses'
//   }
//
// Patterns are literal text with four placeholders:
//   {number}  a number such as 4, 1,569, 7.564 or 92.5 (captured)
//   {time}    a clock time such as 0:58 or 1:02:03 (captured, as seconds)
//   {skip}    any text, as little as possible (not captured)
//   {line}    the rest of the current line (not captured)
// Matching ignores case, and any run of spaces in a pattern matches any whitespace.
//
// `within` (optional) limits a game to one part of a paste, for games whose share
// text can contain several modes at once; the first matching pattern's text is used.
//
// An expression ("block") is one of:
//   5                                    a number
//   { stat: 'Guesses' }                  the value of an earlier stat
//   { find: [patterns], take: 1 }        first pattern that matches; value of its Nth capture
//   { count: [patterns] }                how many times the patterns appear
//   { has: [patterns], mode: 'any' }     whether any ('all', 'none') of the patterns appear
//   { math: [a, op, b] }                 + - * / or a comparison: = != < <= > >=
//   { if: cond, then: a, else: b }       pick a value
//
// Rules are plain data. Nothing here evaluates code or builds HTML, so a shared or
// imported game definition can't run scripts; validate() rejects anything unexpected.
(function (root) {
    const PT = root.PT || (root.PT = {});

    const LIMITS = {
        patternLength: 200,
        patternsPerList: 12,
        skipsPerPattern: 3,
        stats: 12,
        depth: 6,
        nodes: 60,
        textLength: 6000,
        nameLength: 60,
    };

    const MATH_OPS = ['+', '-', '*', '/', '=', '!=', '<', '<=', '>', '>='];
    const SHOW_KINDS = ['number', 'time', 'percent', 'yesno'];
    const STAT_NAME = /^[A-Za-z][A-Za-z0-9 ]{0,23}$/;
    const GAME_ID = /^[a-z0-9-]{1,60}$/;

    // Invisible characters that vary between platforms (emoji variation selectors,
    // zero-width spaces, BOM). Removed from both text and patterns before matching.
    const INVISIBLE = /[︎️​⁠﻿]/g;

    function normalize(text) {
        return String(text)
            .replace(INVISIBLE, '')
            // "1 932" written with a no-break space is one number.
            .replace(/(\d)[\u00A0\u202F](?=\d{3}(?!\d))/g, '$1')
            .replace(/\r\n?/g, '\n')
            .replace(/[   ]/g, ' ');
    }

    const TOKEN = /\{(number|time|skip|line)\}/g;
    const PIECES = {
        number: '(\\d+(?:[.,]\\d+)*)',
        time: '(\\d{1,2}(?::\\d{2}){1,2})',
        skip: '[\\s\\S]*?',
        line: '[^\\n]*',
    };

    function escapeLiteral(text) {
        // Characters that are syntax in a `u`-flag regex. '-' is deliberately absent:
        // escaping it outside a character class is an error in unicode mode.
        return text
            .replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
            .replace(/\s+/g, '\\s+');
    }

    const compiled = new Map();

    // Returns { source, captures: ['number'|'time', ...] }.
    function compilePattern(pattern) {
        if (compiled.has(pattern)) return compiled.get(pattern);
        const clean = normalize(pattern).trim();
        const captures = [];
        let source = '';
        let last = 0;
        for (const m of clean.matchAll(TOKEN)) {
            source += escapeLiteral(clean.slice(last, m.index)) + PIECES[m[1]];
            if (m[1] === 'number' || m[1] === 'time') captures.push(m[1]);
            last = m.index + m[0].length;
        }
        source += escapeLiteral(clean.slice(last));
        const result = { source, captures };
        compiled.set(pattern, result);
        return result;
    }

    function regex(pattern, flags) {
        return new RegExp(compilePattern(pattern).source, flags);
    }

    // Reads numbers written in any common locale: 1,569 / 1.569 (thousands),
    // 92.5 / 92,5 (decimals), 1,234.5 / 1.234,5 (both).
    function parseNumber(raw) {
        const seps = raw.match(/[.,]/g) || [];
        let digits = raw;
        if (seps.length) {
            const last = Math.max(raw.lastIndexOf('.'), raw.lastIndexOf(','));
            const head = raw.slice(0, last).replace(/[.,]/g, '');
            const tail = raw.slice(last + 1);
            const mixed = seps.some(c => c !== raw[last]);
            const thousands = !mixed && (seps.length > 1 || tail.length === 3);
            digits = thousands ? head + tail : `${head}.${tail}`;
        }
        const n = parseFloat(digits);
        return Number.isFinite(n) ? n : null;
    }

    function toValue(kind, raw) {
        if (raw === undefined) return null;
        if (kind === 'time') {
            const parts = raw.split(':').map(Number);
            return parts.reduce((total, part) => total * 60 + part, 0);
        }
        return parseNumber(raw);
    }

    // Number of literal characters in a pattern; longer means more specific.
    function specificity(pattern) {
        return normalize(pattern).replace(TOKEN, '').replace(/\s+/g, '').length;
    }

    // Blank patterns (e.g. half-typed in the builder) never match anything.
    function usable(patterns) {
        return (patterns || []).filter(p => typeof p === 'string' && p.trim());
    }

    function matchesAny(patterns, rawText) {
        const text = normalize(rawText);
        return usable(patterns).some(p => regex(p, 'iu').test(text));
    }

    // ---- Evaluation -------------------------------------------------------------

    function asNumber(v) {
        if (typeof v === 'boolean') return v ? 1 : 0;
        return typeof v === 'number' && Number.isFinite(v) ? v : null;
    }

    function truthy(v) {
        return v === true || (typeof v === 'number' && v !== 0);
    }

    // Evaluates one expression against normalized text. `values` holds earlier stats.
    function evalExpr(expr, text, values) {
        if (typeof expr === 'number') return expr;
        if (!expr || typeof expr !== 'object') return null;

        if ('stat' in expr) {
            return Object.prototype.hasOwnProperty.call(values, expr.stat) ? values[expr.stat] : null;
        }
        if ('find' in expr) {
            const take = expr.take || 1;
            for (const pattern of usable(expr.find)) {
                const m = regex(pattern, 'iu').exec(text);
                if (m) {
                    const kind = compilePattern(pattern).captures[take - 1];
                    return kind ? toValue(kind, m[take]) : null;
                }
            }
            return null;
        }
        if ('count' in expr) {
            return usable(expr.count).reduce((total, p) => total + (text.match(regex(p, 'giu')) || []).length, 0);
        }
        if ('has' in expr) {
            const list = usable(expr.has);
            if (!list.length) return null;
            const test = p => regex(p, 'iu').test(text);
            if (expr.mode === 'all') return list.every(test);
            if (expr.mode === 'none') return !list.some(test);
            return list.some(test);
        }
        if ('math' in expr) {
            const [left, op, right] = expr.math;
            const a = asNumber(evalExpr(left, text, values));
            const b = asNumber(evalExpr(right, text, values));
            if (a === null || b === null) return null;
            switch (op) {
                case '+': return a + b;
                case '-': return a - b;
                case '*': return a * b;
                case '/': return b === 0 ? null : a / b;
                case '=': return a === b;
                case '!=': return a !== b;
                case '<': return a < b;
                case '<=': return a <= b;
                case '>': return a > b;
                case '>=': return a >= b;
            }
            return null;
        }
        if ('if' in expr) {
            const branch = truthy(evalExpr(expr.if, text, values)) ? expr.then : expr.else;
            return branch === undefined ? null : evalExpr(branch, text, values);
        }
        return null;
    }

    // The part of the text a game looks at: the first `within` match, else everything.
    function sectionOf(tracking, text) {
        for (const p of usable(tracking && tracking.within)) {
            const m = regex(p, 'iu').exec(text);
            if (m) return { text: m[0], matched: true };
        }
        return { text, matched: false };
    }

    function section(tracking, rawText) {
        return sectionOf(tracking, normalize(rawText).slice(0, LIMITS.textLength)).text;
    }

    function withinMatches(tracking, rawText) {
        return sectionOf(tracking, normalize(rawText).slice(0, LIMITS.textLength)).matched;
    }

    // Returns { stat name: value } for every stat that produced a value.
    function evaluate(tracking, rawText) {
        const values = {};
        if (!tracking || !Array.isArray(tracking.stats)) return values;
        const text = sectionOf(tracking, normalize(rawText).slice(0, LIMITS.textLength)).text;
        for (const stat of tracking.stats) {
            const v = evalExpr(stat.is, text, values);
            if (v !== null && v !== undefined && !(typeof v === 'number' && !Number.isFinite(v))) {
                values[stat.name] = v;
            }
        }
        return values;
    }

    // Evaluates a single expression for the builder's live preview.
    function preview(expr, rawText, values = {}) {
        return evalExpr(expr, normalize(rawText).slice(0, LIMITS.textLength), values);
    }

    // Ranks games whose detect patterns match. Highest specificity first.
    function detect(games, rawText) {
        const text = normalize(rawText).slice(0, LIMITS.textLength);
        const hits = [];
        for (const game of games) {
            const patterns = game.tracking && game.tracking.detect;
            if (!patterns) continue;
            let best = -1;
            for (const p of usable(patterns)) {
                if (regex(p, 'iu').test(text)) best = Math.max(best, specificity(p));
            }
            if (best >= 0) hits.push({ game, score: best });
        }
        return hits.sort((a, b) => b.score - a.score);
    }

    // ---- Validation ---------------------------------------------------------------

    function validatePatterns(list, where, errors) {
        if (!Array.isArray(list) || list.length === 0) {
            errors.push(`${where}: needs at least one pattern`);
            return;
        }
        if (list.length > LIMITS.patternsPerList) errors.push(`${where}: at most ${LIMITS.patternsPerList} patterns`);
        for (const p of list) {
            if (typeof p !== 'string' || !p.trim()) { errors.push(`${where}: patterns must be non-empty text`); continue; }
            if (p.length > LIMITS.patternLength) errors.push(`${where}: pattern longer than ${LIMITS.patternLength} characters`);
            const unknown = p.match(/\{(?!number\}|time\}|skip\}|line\})[^}]*\}/);
            if (unknown) errors.push(`${where}: unknown placeholder ${unknown[0]}`);
            if ((p.match(/\{skip\}/g) || []).length > LIMITS.skipsPerPattern) errors.push(`${where}: at most ${LIMITS.skipsPerPattern} {skip} per pattern`);
            if (!normalize(p).replace(TOKEN, '').trim() && !/\{(number|time)\}/.test(p)) errors.push(`${where}: pattern "${p}" matches nothing specific`);
        }
    }

    function onlyKeys(obj, allowed, where, errors) {
        for (const key of Object.keys(obj)) {
            if (!allowed.includes(key)) errors.push(`${where}: unexpected "${key}"`);
        }
    }

    function validateExpr(expr, where, earlier, errors, state, depth) {
        state.nodes += 1;
        if (state.nodes > LIMITS.nodes) { errors.push(`${where}: too many blocks`); return; }
        if (depth > LIMITS.depth) { errors.push(`${where}: blocks nested too deeply`); return; }
        if (typeof expr === 'number') {
            if (!Number.isFinite(expr)) errors.push(`${where}: numbers must be finite`);
            return;
        }
        if (!expr || typeof expr !== 'object' || Array.isArray(expr)) { errors.push(`${where}: empty or invalid block`); return; }

        if ('stat' in expr) {
            onlyKeys(expr, ['stat'], where, errors);
            if (!earlier.includes(expr.stat)) errors.push(`${where}: "${expr.stat}" must be a stat defined above this one`);
        } else if ('find' in expr) {
            onlyKeys(expr, ['find', 'take'], where, errors);
            validatePatterns(expr.find, `${where} › find`, errors);
            if (expr.take !== undefined && !(Number.isInteger(expr.take) && expr.take >= 1 && expr.take <= 6)) errors.push(`${where}: take must be 1–6`);
            if (Array.isArray(expr.find)) {
                const take = expr.take || 1;
                for (const p of expr.find) {
                    if (typeof p === 'string' && compilePattern(p).captures.length < take) {
                        errors.push(`${where}: "${p}" has no value #${take} to take (add {number} or {time})`);
                    }
                }
            }
        } else if ('count' in expr) {
            onlyKeys(expr, ['count'], where, errors);
            validatePatterns(expr.count, `${where} › count`, errors);
        } else if ('has' in expr) {
            onlyKeys(expr, ['has', 'mode'], where, errors);
            validatePatterns(expr.has, `${where} › has`, errors);
            if (expr.mode !== undefined && !['any', 'all', 'none'].includes(expr.mode)) errors.push(`${where}: mode must be any, all or none`);
        } else if ('math' in expr) {
            onlyKeys(expr, ['math'], where, errors);
            if (!Array.isArray(expr.math) || expr.math.length !== 3 || !MATH_OPS.includes(expr.math[1])) {
                errors.push(`${where}: math needs [left, operator, right]`);
            } else {
                validateExpr(expr.math[0], where, earlier, errors, state, depth + 1);
                validateExpr(expr.math[2], where, earlier, errors, state, depth + 1);
            }
        } else if ('if' in expr) {
            onlyKeys(expr, ['if', 'then', 'else'], where, errors);
            validateExpr(expr.if, where, earlier, errors, state, depth + 1);
            validateExpr(expr.then, where, earlier, errors, state, depth + 1);
            if (expr.else !== undefined) validateExpr(expr.else, where, earlier, errors, state, depth + 1);
        } else {
            errors.push(`${where}: unknown block`);
        }
    }

    function validateTracking(tracking, errors) {
        if (typeof tracking !== 'object' || tracking === null || Array.isArray(tracking)) {
            errors.push('tracking must be an object');
            return;
        }
        onlyKeys(tracking, ['detect', 'within', 'stats', 'headline'], 'tracking', errors);
        validatePatterns(tracking.detect, 'Recognize', errors);
        if (tracking.within !== undefined) validatePatterns(tracking.within, 'Only look at', errors);
        if (!Array.isArray(tracking.stats)) { errors.push('stats must be a list'); return; }
        if (tracking.stats.length > LIMITS.stats) errors.push(`at most ${LIMITS.stats} stats`);
        const names = [];
        tracking.stats.forEach((stat, i) => {
            const where = stat && stat.name ? `Stat "${stat.name}"` : `Stat #${i + 1}`;
            if (!stat || typeof stat !== 'object') { errors.push(`${where}: invalid`); return; }
            onlyKeys(stat, ['name', 'is', 'show', 'better', 'max', 'unit'], where, errors);
            if (typeof stat.name !== 'string' || !STAT_NAME.test(stat.name)) errors.push(`${where}: name must be letters, numbers and spaces (max 24)`);
            if (names.includes(stat.name)) errors.push(`${where}: duplicate name`);
            if (stat.show !== undefined && !SHOW_KINDS.includes(stat.show)) errors.push(`${where}: show must be one of ${SHOW_KINDS.join(', ')}`);
            if (stat.better !== undefined && !['lower', 'higher'].includes(stat.better)) errors.push(`${where}: better must be lower or higher`);
            if (stat.max !== undefined && !(typeof stat.max === 'number' && Number.isFinite(stat.max) && stat.max > 0)) errors.push(`${where}: max must be a positive number`);
            if (stat.unit !== undefined && !(typeof stat.unit === 'string' && stat.unit.length <= 12 && /^[^<>{}]*$/.test(stat.unit))) errors.push(`${where}: unit must be short text`);
            validateExpr(stat.is, where, names, errors, { nodes: 0 }, 1);
            names.push(stat.name);
        });
        if (tracking.headline !== undefined && !names.includes(tracking.headline)) errors.push(`headline "${tracking.headline}" is not one of the stats`);
    }

    function isSafeUrl(url) {
        try {
            const u = new URL(url);
            return u.protocol === 'https:' || u.protocol === 'http:';
        } catch (_) {
            return false;
        }
    }

    // Returns a list of human-readable problems; empty means valid.
    function validateGame(game) {
        const errors = [];
        if (!game || typeof game !== 'object') return ['not a game object'];
        if (typeof game.id !== 'string' || !GAME_ID.test(game.id)) errors.push('id must be lowercase letters, numbers and dashes');
        if (typeof game.name !== 'string' || !game.name.trim() || game.name.length > LIMITS.nameLength) errors.push(`name must be 1–${LIMITS.nameLength} characters`);
        if (!isSafeUrl(game.url)) errors.push('link must start with https:// or http://');
        if (game.tracking !== undefined) validateTracking(game.tracking, errors);
        return errors;
    }

    // Problems with just the tracking rules (used when loading saved games, whose
    // names and ids may predate the current limits).
    function trackingErrors(tracking) {
        const errors = [];
        validateTracking(tracking, errors);
        return errors;
    }

    PT.rules = {
        LIMITS, MATH_OPS, SHOW_KINDS,
        normalize, parseNumber, compilePattern, specificity, matchesAny,
        evaluate, preview, detect, section, withinMatches,
        validateGame, trackingErrors, isSafeUrl,
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = PT.rules;
})(typeof window !== 'undefined' ? window : globalThis);
