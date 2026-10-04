// Built-in games. Each `tracking` is plain data for js/rules.js; `example` is a real
// share text shown in the rule builder. tests/games.test.js checks every game against
// the share texts in tests/fixtures/share-texts.json.
(function (root) {
    const PT = root.PT || (root.PT = {});

    // Shorthands for common shapes.
    const solved = (...patterns) => ({ name: 'Solved', is: { has: patterns }, show: 'yesno' });
    const guessesIfSolved = (squares, max) => ({ name: 'Guesses', is: { if: { stat: 'Solved' }, then: { count: squares } }, better: 'lower', ...(max ? { max } : {}) });
    // "N/6"-style games: solved when a number appears before "/6", which is also the guess count.
    const outOfSix = header => [
        solved(`${header} {number}/6`),
        { name: 'Guesses', is: { find: [`${header} {number}/6`], take: 2 }, better: 'lower', max: 6 },
    ];
    // Connections-style grids: four rows of one color mean solved; extra rows are mistakes.
    const groupsGame = colors => {
        const groups = colors.map(c => c.repeat(4));
        return [
            { name: 'Solved', is: { has: groups, mode: 'all' }, show: 'yesno' },
            { name: 'Mistakes', is: { math: [{ math: [{ count: colors }, '/', 4] }, '-', { count: groups }] }, better: 'lower', max: 4 },
        ];
    };
    // One Gamedle mode, which may arrive alone or inside a multi-mode share.
    const gamedleMode = (icon, max) => ({
        detect: [`${icon}{skip}Gamedle`, `Gamedle{skip}${icon} (`],
        within: [`${icon} ({line} {line}`, `${icon} Gamedle{line}`],
        stats: [solved('🟩'), guessesIfSolved(['🟥', '🟨', '🟩'], max)],
        headline: 'Guesses',
    });

    const defaults = [
        {
            id: 'wordle',
            name: 'Wordle',
            url: 'https://www.nytimes.com/games/wordle/index.html',
            tracking: {
                detect: ['Wordle {number}'],
                stats: [solved('{number}/6'), { name: 'Guesses', is: { find: ['{number}/6'] }, better: 'lower', max: 6 }],
                headline: 'Guesses',
            },
            example: 'Wordle 1,932 3/6*\n\n⬜⬜⬜⬜🟩\n⬜⬜⬜🟨🟩\n🟩🟩🟩🟩🟩',
        },
        {
            id: 'disorderly',
            name: 'Disorderly',
            url: 'https://playdisorderly.com/',
            tracking: {
                detect: ['I just played Disorderly', 'playdisorderly.com'],
                // One row per item (numbered with keycaps 1⃣ 2⃣ …), one circle per guess.
                stats: [{ name: 'Guesses', is: { math: [{ count: ['🟢', '🔴'] }, '/', { count: ['⃣'] }] }, better: 'lower' }],
                headline: 'Guesses',
            },
            example: 'I just played Disorderly! - Sort these video game consoles by how many units they\'ve sold\nhttps://playdisorderly.com/\n\n1️⃣ 🔴 🟢 🟢\n2️⃣ 🔴 🔴 🟢\n3️⃣ 🟢 🟢 🟢\n4️⃣ 🔴 🔴 🟢\n5️⃣ 🔴 🟢 🟢\n6️⃣ 🔴 🟢 🟢',
        },
        {
            id: 'nyt-connections',
            name: 'NYT Connections',
            url: 'https://www.nytimes.com/games/connections',
            tracking: { detect: ['Connections Puzzle #{number}'], stats: groupsGame(['🟨', '🟩', '🟦', '🟪']), headline: 'Mistakes' },
            example: 'Connections\nPuzzle #1206\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟨🟦🟨🟨\n🟦🟦🟨🟦\n🟦🟦🟦🟦\n🟨🟨🟨🟨\n🟪🟪🟪🟪',
        },
        {
            id: 'costcodle',
            name: 'Costcodle',
            url: 'https://costcodle.com',
            tracking: { detect: ['Costcodle #{number}'], stats: outOfSix('Costcodle #{number}'), headline: 'Guesses' },
            example: 'Costcodle #1100 5/6\n⬇️🟨\n⬇️🟨\n⬆️🟨\n⬆️🟨\n✅\n https://costcodle.com/',
        },
        {
            id: 'worldle',
            name: 'Worldle',
            url: 'https://worldle.teuteuf.fr',
            tracking: {
                detect: ['#Worldle #{number}'],
                stats: [
                    solved('{number}/6 ('),
                    { name: 'Guesses', is: { find: ['{number}/6 ('] }, better: 'lower', max: 6 },
                    { name: 'Closest', is: { find: ['/6 ({number}%)'] }, show: 'percent', better: 'higher' },
                ],
                headline: 'Guesses',
            },
            example: '#Worldle #1716 (03.10.2026) 4/6 (100%)\n🔥 Current Win Streak: 9 days\n🟩🟩🟩🟨⬜↗️\n🟩🟩🟩🟩⬜⬅️\n🟩🟩🟩🟩🟨➡️\n🟩🟩🟩🟩🟩🎉\n🧭⭐🚩📜🛡️🔤👫🏙📐\nhttps://worldle.teuteuf.fr/share',
        },
        {
            id: 'oec-pick-5',
            name: 'OEC Pick-5',
            url: 'https://oec.world/en/games/pick-5',
            tracking: {
                detect: ['Pick5 #{number}', 'oec.world/en/games/pick-5'],
                stats: [
                    { name: 'Percent', is: { find: ['{number}%'] }, show: 'percent', better: 'higher' },
                    { name: 'Top five', is: { find: ['{number}/5'] }, better: 'higher', max: 5 },
                ],
                headline: 'Percent',
            },
            example: 'Pick5 #879 - Developed Exposed Photographic Material \n🥈 85.44%\n🟢 🟢 🟢 🟡 🟢 4/5\nPlay #oecGames today!\nhttps://oec.world/en/games/pick-5',
        },
        {
            id: 'pokedoku',
            name: 'PokeDoku',
            url: 'https://pokedoku.com',
            tracking: {
                detect: ['PokeDoku Summary', 'PokeDoku Champion'],
                stats: [
                    { name: 'Score', is: { find: ['Score: {number}/9'] }, better: 'higher', max: 9 },
                    { name: 'Uniqueness', is: { find: ['Uniqueness: {number}'] }, better: 'lower' },
                ],
                headline: 'Score',
            },
            example: '🔴 PokeDoku Summary ⚪️\n📅 2026-07-21\n\nScore: 7/9\nUniqueness: 300 (best possible: 69)\nBetter than 10.2% of players today\n\n✅ 🟥 🟥 \n✅ ✅ ✅ \n✅ ✅ ✅ \n\nPlay at: https://pokedoku.com/share/HrUp24GX5EPo',
        },
        {
            id: 'framed',
            name: 'Framed',
            url: 'https://framed.wtf',
            tracking: {
                detect: ['Framed #{number}'],
                stats: [solved('🟩'), guessesIfSolved(['🟥', '🟩'], 6)],
                headline: 'Guesses',
            },
            example: 'Framed #758\n🎥 🟥 🟥 🟥 🟩 ⬛ ⬛\n\nhttps://framed.wtf',
        },
        {
            id: 'daily-dozen-trivia',
            name: 'Daily Dozen Trivia',
            url: 'https://dailydozentrivia.com',
            tracking: {
                detect: ['The Dozen: Daily Trivia', 'DailyDozenTrivia.com'],
                stats: [
                    { name: 'Correct', is: { if: { has: ['PERFECT'] }, then: 9, else: { find: ['{number} Correct'] } }, better: 'higher', max: 9 },
                    { name: 'Score', is: { find: ['Score: {number}'] }, better: 'higher', unit: 'pts' },
                    { name: 'Time', is: { find: ['Time {time}'] }, show: 'time', better: 'lower' },
                ],
                headline: 'Correct',
            },
            example: 'The Dozen: Daily Trivia\nGame 930\n\nScore: 14\n🟩🟩🟩\n🟩🟥🟥\n🟩🟩🟩\n7 Correct, Time 05:22\n\nDailyDozenTrivia.com',
        },
        {
            id: 'globle',
            name: 'Globle',
            url: 'https://globle-game.com',
            tracking: {
                // globle-capitals.com shares the same template, so match this site's link.
                detect: ['globle-game.com'],
                stats: [solved('= {number}'), { name: 'Guesses', is: { find: ['= {number}'] }, better: 'lower' }],
                headline: 'Guesses',
            },
            example: '🌎 Sep 28, 2026 🌍\n🔥 2 | Avg. Guesses: 13.5\n🟨⬜⬜⬜⬜🟨🟧🟨\n🟥🟥🟨🟧🟧🟧🟥🟥\n🟥🟥🟥🟧🟥🟩 = 22\n\nhttps://globle-game.com\n#globle',
        },
        {
            id: 'box-office-game',
            name: 'Box Office Game',
            url: 'https://boxofficega.me',
            tracking: {
                detect: ['boxofficega.me'],
                stats: [
                    { name: 'Score', is: { find: ['🏆 {number}'] }, better: 'higher', unit: 'pts' },
                    { name: 'Correct', is: { count: ['✅'] }, better: 'higher', max: 5 },
                ],
                headline: 'Score',
            },
            example: 'boxofficega.me\nFebruary 7, 1992\n✅ 120\n✅ 45\n❌ 0\n✅ 120\n❌ 0\n🏆 285',
        },
        {
            id: 'tradle',
            name: 'Tradle',
            url: 'https://games.oec.world/en/tradle/',
            tracking: { detect: ['#Tradle #{number}'], stats: outOfSix('#Tradle #{number}'), headline: 'Guesses' },
            example: '#Tradle #1672 5/6\n🟩🟨⬜⬜⬜\n🟩🟩🟩🟩🟨\n🟩🟩🟩🟩🟨\n🟩🟩🟩🟩🟨\n🟩🟩🟩🟩🟩\nhttps://oec.world/en/games/tradle',
        },
        {
            id: 'movie-to-movie',
            name: 'Movie to Movie',
            url: 'https://movietomovie.com',
            tracking: {
                detect: ['Movie to Movie Challenge', 'movietomovie.com/play'],
                // The path alternates movie and person; each person is one hop. The
                // "clip chain" share lists names instead: movie ➡ person ➡ movie …
                stats: [{ name: 'Hops', is: { if: { has: ['🧑'] }, then: { count: ['🧑'] }, else: { math: [{ count: [' ➡ '] }, '/', 2] } }, better: 'lower' }],
                headline: 'Hops',
            },
            example: 'Movie to Movie Challenge\nBoyz n the Hood ➡ Hit Man\n🎬🧑🎬🧑🎬🧑🎬\nhttps://movietomovie.com/play/650/974635',
        },
        {
            id: 'queens',
            name: 'Queens',
            url: 'https://www.linkedin.com/games/queens',
            tracking: {
                detect: ['lnkd.in/queens', 'Queens #{number} | {time}'],
                stats: [{ name: 'Time', is: { find: ['Queens {skip}{time}'] }, show: 'time', better: 'lower' }],
                headline: 'Time',
            },
            example: 'Queens #885 | 1:46 with no mistakes & no hints\nFirst 👑s: 🟧 🟦 🟫\nlnkd.in/queens.',
        },
        {
            id: 'geogrid',
            name: 'GeoGrid',
            url: 'https://www.geogridgame.com/',
            tracking: {
                detect: ['geogridgame.com', 'Board #{number} | ♾️'],
                stats: [
                    { name: 'Score', is: { find: ['Score: {number}'] }, better: 'lower' },
                    { name: 'Correct', is: { math: [9, '-', { count: ['❌'] }] }, better: 'higher', max: 9 },
                ],
                headline: 'Score',
            },
            example: '💎🌈🔷\n💎❌⚡️\n🦄⚡️🔷\nScore: 146.3 | Rank: 10,595/13,703\nBoard #823 | ♾️ Mode: Off\nhttps://geogridgame.com/s/iYoki0UA4E',
        },
        {
            id: 'emovi',
            name: 'Emovi',
            url: 'https://emovi.teuteuf.fr/',
            tracking: {
                detect: ['#Emovi 🎬', 'emovi.teuteuf.fr'],
                // Line 2 is the puzzle's emoji clue, so match the whole result row.
                stats: [
                    solved('🟩⬜⬜', '🟥🟩⬜', '🟥🟥🟩'),
                    { name: 'Guesses', is: { if: { has: ['🟩⬜⬜'] }, then: 1, else: { if: { has: ['🟥🟩⬜'] }, then: 2, else: { if: { has: ['🟥🟥🟩'] }, then: 3 } } }, better: 'lower', max: 3 },
                ],
                headline: 'Guesses',
            },
            example: '#Emovi 🎬 #1514\n🤖🕶️🔫\n🟥🟩⬜\nhttps://emovi.teuteuf.fr',
        },
        {
            id: 'guessthe-game',
            name: 'GuessThe.Game',
            url: 'https://guessthe.game',
            tracking: {
                detect: ['#GuessTheGame #{number}'],
                stats: [solved('🟩'), guessesIfSolved(['🟥', '🟨', '🟩'], 6)],
                headline: 'Guesses',
            },
            example: '#GuessTheGame #1593\n\n🎮 🟥 🟩 ⬜ ⬜ ⬜ ⬜\n\n#ProGamer\nhttps://GuessThe.Game/p/1593',
        },
        {
            id: 'gamedle',
            name: 'Gamedle (Guess)',
            url: 'https://www.gamedle.wtf/guess',
            tracking: gamedleMode('🔍', 10),
            example: '🔍 Gamedle (Guess): #1438 🟥🟥🟥🟩⬜⬜⬜⬜⬜⬜\nhttps://gamedle.wtf/guess',
        },
        {
            id: 'gamedle-classic',
            name: 'Gamedle (Classic)',
            url: 'https://www.gamedle.wtf/classic',
            tracking: {
                ...gamedleMode('🕹️', 6),
                // The oldest format had no mode name: "🕹️ Gamedle: 26/07/2024 🟥🟩…".
                detect: ['🕹️ Gamedle (', '🕹️ Gamedle:', 'Gamedle{skip}🕹️ ('],
            },
            example: 'Gamedle\n🕹️ (Cover art) #1625:\n🟥🟩⬜⬜⬜⬜\n🎨 (Artwork) #1384:\n🟥🟥🟥🟥🟥🟥\n🔑 (Keywords) #1185:\n🟥🟥🟥🟩⬜⬜\n🔍 (Guess) #1438:\n🟥🟥🟥🟥🟥🟥🟩⬜⬜⬜\nhttps://gamedle.wtf',
        },
        {
            id: 'gamedle-artwork',
            name: 'Gamedle (Artwork)',
            url: 'https://www.gamedle.wtf/artwork',
            tracking: gamedleMode('🎨', 6),
            example: '🎨 Gamedle (Artwork): #1384 🟥🟥🟥🟩⬜⬜\nhttps://gamedle.wtf/artwork',
        },
        {
            id: 'gamedle-keywords',
            name: 'Gamedle (Keywords)',
            url: 'https://www.gamedle.wtf/keywords',
            tracking: gamedleMode('🔑', 6),
            example: '🔑 Gamedle (Keywords): #1185 🟥🟩⬜⬜⬜⬜\nhttps://gamedle.wtf/keywords',
        },
        {
            id: 'puckdoku',
            name: 'Puckdoku',
            url: 'https://puckdoku.com',
            tracking: {
                detect: ['Puckdoku Game {number}'],
                stats: [
                    { name: 'Correct', is: { find: ['Puckdoku Game {number} - {number}/'], take: 2 }, better: 'higher', max: 9 },
                    { name: 'Solved', is: { math: [{ stat: 'Correct' }, '=', 9] }, show: 'yesno' },
                    { name: 'Uniqueness', is: { find: ['{number} Uniqueness'] }, better: 'lower' },
                ],
                headline: 'Correct',
            },
            example: 'Puckdoku Game 1111 - 8/9:\n\n195 Uniqueness\n🟩🟩⬜\n🟩🟩🟩\n🟩🟩🟩\n\nhttps://www.puckdoku.com',
        },
        {
            id: 'moviegrid',
            name: 'MovieGrid.io',
            url: 'https://moviegrid.io',
            tracking: {
                detect: ['Movie Grid - '],
                stats: [
                    { name: 'Correct', is: { find: ['{number}/9 Correct'] }, better: 'higher', max: 9 },
                    { name: 'Score', is: { find: ['Score: {number}'] }, better: 'higher', unit: 'pts' },
                ],
                headline: 'Correct',
            },
            example: 'Movie Grid - 12/16/2025:\n\n6/9 Correct\n\nScore: 1760\n\n🟩🟩🟩\n🟩🟩🟩\n⬜⬜⬜\n\nhttps://www.moviegrid.io',
        },
        {
            id: 'spellcheck-game',
            name: 'Spellcheck Game',
            url: 'https://spellcheckgame.com/',
            tracking: {
                detect: ['Spellcheck #{number}'],
                stats: [{ name: 'Correct', is: { count: ['🟩'] }, better: 'higher', max: 15 }],
                headline: 'Correct',
            },
            example: 'Spellcheck #773\n🟩🟩🟩🟩🟩\n🟩🟩🟥🟥🟩\n🟥🟩🟥🟩🟩\n\nhttps://spellcheckgame.com/',
        },
        {
            id: 'foodguessr',
            name: 'FoodGuessr',
            url: 'https://foodguessr.com',
            tracking: {
                detect: ['on the FoodGuessr Daily', 'FoodGuessr - {skip}Total score'],
                stats: [{ name: 'Score', is: { find: ['I got {number} on the FoodGuessr', 'Total score: {number}'] }, better: 'higher', max: 15000 }],
                headline: 'Score',
            },
            example: 'I got 11,341 on the FoodGuessr Daily!\n\n🌕🌕🌕🌕🌖 4,600 (Round 1)\n🌕🌕🌕🌕🌕 5,000 (Round 2) 💯\n🌕🌖🌑🌑🌑 1,741 (Round 3)\n\nSaturday, Sep 26, 2026\nPlay here: https://www.foodguessr.com/',
        },
        {
            id: 'thrice',
            name: 'Thrice',
            url: 'https://thrice.geekswhodrink.com',
            tracking: {
                detect: ['Thrice Game #{number}', 'thricegame.com'],
                stats: [{ name: 'Points', is: { if: { has: ['perfect score'] }, then: 15, else: { find: ['→ {number} point'] } }, better: 'higher', max: 15 }],
                headline: 'Points',
            },
            example: 'Thrice Game #1192 → 6 points.\n🎲: 1️⃣❌❌2️⃣3️⃣\nhttps://thricegame.com',
        },
        {
            id: 'relatle',
            name: 'Relatle.io',
            url: 'https://relatle.io/',
            tracking: {
                detect: ['relatle #{number}', 'relatle (custom)', 'relatle.io'],
                stats: [
                    solved('Solved 🥳', 'Shortest Path!'),
                    { name: 'Guesses', is: { find: ['{number} guess'] }, better: 'lower' },
                ],
                headline: 'Guesses',
            },
            example: 'relatle #419\nRed Hot Chili Peppers → Ludacris\n⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜🟩\nSolved 🥳\n13 guesses, 0 resets\nhttps://relatle.io',
        },
        {
            id: 'harmonies',
            name: 'Harmonies',
            url: 'https://harmonies.io',
            tracking: {
                // "{number}🎧" with no space skips "Reverse Harmonies #920 🎧".
                detect: ['harmonies #{number}🎧'],
                stats: groupsGame(['🟩', '🟪', '🟦', '🟧']),
                headline: 'Mistakes',
            },
            example: 'harmonies #920🎧\n\n🟪🟩🟩🟪\n🟪🟪🟪🟪\n🟧🟧🟧🟧\n🟦🟦🟦🟦\n🟩🟩🟩🟩\n\nhttps://harmonies.io/s/daily',
        },
        {
            id: 'bandle',
            name: 'Bandle',
            url: 'https://bandle.app',
            tracking: {
                // The guess limit is the song's instrument count (/4, /5 or /6).
                detect: ['Bandle #{number} {number}/', 'Bandle #{number} x/'],
                stats: [
                    solved('Bandle #{number} {number}/'),
                    { name: 'Guesses', is: { find: ['Bandle #{number} {number}/'], take: 2 }, better: 'lower' },
                ],
                headline: 'Guesses',
            },
            example: 'Bandle #1509 5/6\n🟥🟥🟥🟨🟩⬜\nFound: 407/409 (99.5%)\nCurrent Streak: 382 (max 382)\n#Bandle \nhttps://bandle.app',
        },
        {
            id: 'juxtastat',
            name: 'Juxtastat',
            url: 'https://urbanstats.org/quiz.html',
            tracking: {
                detect: ['Juxtastat {number} {number}/5'],
                stats: [{ name: 'Correct', is: { find: ['Juxtastat {number} {number}/5'], take: 2 }, better: 'higher', max: 5 }],
                headline: 'Correct',
            },
            example: 'Juxtastat 1128 4/5\n\n🟩🟩🟥🟩🟩\n\n https://juxtastat.org/',
        },
        {
            id: 'scrandle',
            name: 'Scrandle',
            url: 'https://scrandle.com/',
            tracking: {
                // Daily results carry a date; practice rounds say "Practice" instead.
                detect: ['{number}/10 | {number}-{number}-{number}'],
                stats: [{ name: 'Score', is: { find: ['{number}/10 |'] }, better: 'higher', max: 10 }],
                headline: 'Score',
            },
            example: '🟩🟥🟥🟩🟩🟩🟩🟩🟩🟩 8/10 | 2026-10-03 | https://scrandle.com',
        },
        {
            id: 'bonkle',
            name: 'Bonkle',
            url: 'https://bonkle.maskofdestiny.com',
            tracking: {
                // The guess limit is the word length plus one, so it varies by day.
                detect: ['Bonkle {number}/{number}/{number}:', 'bonkle.maskofdestiny.com'],
                stats: [
                    solved('Bonkle {skip}: {number}/'),
                    { name: 'Guesses', is: { find: ['Bonkle {skip}: {number}/'] }, better: 'lower' },
                ],
                headline: 'Guesses',
            },
            example: 'Bonkle 2026/03/27: 4/7\n\n⬛⬛⬛🟨⬛⬛\n⬛🟩⬛⬛⬛🟨\n⬛🟩🟨⬛🟩⬛\n🟩🟩🟩🟩🟩🟩\n\nhttps://bonkle.maskofdestiny.com',
        },
        {
            id: 'starwars-guessr-guess',
            name: 'Star Wars Guessr (Guess)',
            url: 'https://starwarsguessr.com/#daily_guess',
            tracking: {
                detect: ['STAR WARS GUESSR {skip}🎮 : Guess', 'STAR WARS GUESSR {skip}🎮 : Devinette'],
                // "Copy all" includes the other modes; only read the Guess section.
                within: ['🎮 : Guess{skip}🔗', '🎮 : Devinette{skip}🔗', '🎮 : Guess{skip}📋 : {line}', '🎮 : Devinette{skip}📋 : {line}'],
                stats: [
                    { name: 'Solved', is: { has: ['Game Over'], mode: 'none' }, show: 'yesno' },
                    { name: 'Tries', is: { find: ['📋 : {number} tr', '📋 : {number} tentative'] }, better: 'lower' },
                ],
                headline: 'Tries',
            },
            example: 'STAR WARS GUESSR - May 22nd 2025\r\n🎮 : Guess\r\n📋 : 4 tries\r\n🟩🟩🟩🟩🟩🟩🟩\r\n🟩🟥🟩🟩🟥🟨🟨\r\n🟩🟥🟩🟩🟨🟨🟨\r\n🟩🟥🟥🟩🟥🟥🟥\r\n🔗 : https://starwarsguessr.com',
        },
        {
            id: 'waffle',
            name: 'Waffle',
            url: 'https://wafflegame.net/daily',
            tracking: {
                detect: ['#waffle{number} {number}/5', '#waffle{number} X/5'],
                stats: [
                    solved('#waffle{number} {number}/5'),
                    { name: 'Stars', is: { find: ['#waffle{number} {number}/5'], take: 2 }, better: 'higher', max: 5 },
                ],
                headline: 'Stars',
            },
            example: '#waffle1717 5/5\n\n🟩🟩🟩🟩🟩\n🟩⭐🟩⭐🟩\n🟩🟩⭐🟩🟩\n🟩⭐🟩⭐🟩\n🟩🟩🟩🟩🟩\n\n🔥 streak: 368\n🧙 #wafflewizard\nwafflegame.net',
        },
        {
            id: 'timeguessr',
            name: 'TimeGuessr',
            url: 'https://timeguessr.com',
            tracking: {
                detect: ['TimeGuessr #{number}'],
                stats: [{ name: 'Score', is: { find: ['{number}/50'] }, better: 'higher', max: 50000 }],
                headline: 'Score',
            },
            example: 'TimeGuessr #1222 — 41,561/50,000\n\n1️⃣ 🏆9,258 · 📅 4y · 🌍 1.4km\n2️⃣ 🏆6,781 · 📅 0y · 🌍 2155.6km\n3️⃣ 🏆8,359 · 📅 7y · 🌍 1.3km\n4️⃣ 🏆8,683 · 📅 4y · 🌍 117.2km\n5️⃣ 🏆8,480 · 📅 3y · 🌍 620.0km\n\nhttps://timeguessr.com',
        },
        {
            id: 'marveldle-comics',
            name: 'MarvelDle Comics',
            url: 'https://marveldle.com/character/comics/guess',
            tracking: {
                // The share is only a grid; players often add the link or hashtags.
                detect: ['marveldle.com/character/comics', '#Marveldle #MarvelComics'],
                // Six cells per guess.
                stats: [{ name: 'Guesses', is: { math: [{ count: ['🟩', '🟨', '🟥', '⬆', '⬇'] }, '/', 6] }, better: 'lower' }],
                headline: 'Guesses',
            },
            example: '#Marveldle #MarvelComics \nPretty good on this one\n\n🟩🟩🟩🟩🟩🟩\n🟩🟩🟩🟥🟩⬇️\n🟩🟩🟩🟥🟩⬇️\n🟥🟥🟨🟥🟩⬇️\n\nhttps://marveldle.com/character/comics/guess',
        },
        {
            id: 'marveldle-mcu',
            name: 'MarvelDle MCU',
            url: 'https://marveldle.com/character/audiovisual/guess',
            tracking: {
                detect: ['marveldle.com/character/audiovisual', '#Marveldle #MCU'],
                // Seven cells per guess.
                stats: [{ name: 'Guesses', is: { math: [{ count: ['🟩', '🟨', '🟥'] }, '/', 7] }, better: 'lower' }],
                headline: 'Guesses',
            },
            example: '#Marveldle #MCU\n\n🟩🟩🟩🟩🟩🟩🟩\n🟥🟩🟨🟥🟩🟥🟨\n🟥🟩🟥🟨🟥🟥🟨\n\nhttps://marveldle.com/character/audiovisual/guess',
        },
        {
            // No share button (it's a Unity game), so results are saved as typed notes.
            id: 'tolkiendle',
            name: 'Tolkiendle',
            url: 'https://tolkiendle.com',
        },
        {
            id: 'faces',
            name: 'Faces',
            url: 'https://faces.wtf',
            tracking: {
                detect: ['Faces #{number}'],
                // Two faces, up to five guesses each.
                stats: [
                    { name: 'Solved', is: { math: [{ count: ['🟩'] }, '=', 2] }, show: 'yesno' },
                    { name: 'Guesses', is: { count: ['🟥', '🟩'] }, better: 'lower', max: 10 },
                ],
                headline: 'Guesses',
            },
            example: '#Faces #846\n👤 🟥 🟥 🟩 ⬛ ⬛\n👤 🟥 🟩 ⬛ ⬛ ⬛\nhttps://faces.wtf',
        },
        {
            // No share button and not a daily puzzle; results are saved as typed notes.
            id: 'moreorless-imdb',
            name: 'MoreOrLess IMDB Ratings',
            url: 'https://moreorless.io/game/imdb-ratings',
        },
        {
            id: 'catfishing',
            name: 'Catfishing',
            url: 'https://catfishing.net/',
            tracking: {
                detect: ['catfishing.net', 'catfishing dot net'],
                stats: [{ name: 'Score', is: { find: ['{number} - {number}/'], take: 2 }, better: 'higher', max: 10 }],
                headline: 'Score',
            },
            example: 'catfishing.net\n#831 - 8.5/10 🎉\n🐈🐈🐈🥚🐟\n🐈🐈🐈🐈🐈',
        },
    ];

    // Picked for new players; everyone can add more from Manage games.
    const starter = ['wordle', 'nyt-connections', 'worldle', 'framed', 'globle', 'timeguessr'];

    // Adds display/safety fields to a game definition. Invalid tracking is kept as a
    // draft for the builder but never run.
    function prepare(game) {
        const g = { ...game };
        g.safeUrl = PT.rules.isSafeUrl(g.url) ? g.url : null;
        g.legacy = Boolean(g.result_parsing_rules) && !g.tracking;
        if (g.tracking) {
            const problems = PT.rules.trackingErrors(g.tracking);
            if (problems.length) {
                g.draft = g.tracking;
                g.problems = problems;
                delete g.tracking;
            }
        }
        return g;
    }

    PT.games = { defaults, starter, prepare };

    if (typeof module !== 'undefined' && module.exports) module.exports = PT.games;
})(typeof window !== 'undefined' ? window : globalThis);
