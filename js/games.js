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
            about: 'Guess the 5-letter word in 6 tries',
            picture: 'word',
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
            about: 'Sort the items into the right order by a given measure',
            picture: 'order',
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
            about: 'Find four groups of four related words',
            picture: 'groups',
            tracking: { detect: ['Connections Puzzle #{number}'], stats: groupsGame(['🟨', '🟩', '🟦', '🟪']), headline: 'Mistakes' },
            example: 'Connections\nPuzzle #1206\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟨🟦🟨🟨\n🟦🟦🟨🟦\n🟦🟦🟦🟦\n🟨🟨🟨🟨\n🟪🟪🟪🟪',
        },
        {
            id: 'costcodle',
            name: 'Costcodle',
            url: 'https://costcodle.com',
            about: 'Guess the price of a Costco item in 6 tries',
            picture: 'price',
            tracking: { detect: ['Costcodle #{number}'], stats: outOfSix('Costcodle #{number}'), headline: 'Guesses' },
            example: 'Costcodle #1100 5/6\n⬇️🟨\n⬇️🟨\n⬆️🟨\n⬆️🟨\n✅\n https://costcodle.com/',
        },
        {
            id: 'worldle',
            name: 'Worldle',
            url: 'https://worldle.teuteuf.fr',
            about: 'Guess the country from its outline in 6 tries',
            picture: 'shape',
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
            about: 'Name the 5 countries that export the most of a product',
            picture: 'rank',
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
            about: 'Fill a 3×3 grid with Pokémon that fit each row and column',
            picture: 'grid9',
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
            about: 'Guess the movie from up to six frames',
            picture: 'frames',
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
            about: 'Answer 9 trivia questions, with one retry on a miss',
            picture: 'quiz',
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
            about: 'Guess the mystery country; colors show how close you are',
            picture: 'globe',
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
            about: 'Name the top 5 box office movies of a past weekend',
            picture: 'boxoffice',
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
            about: 'Guess the country from its exports treemap in 6 tries',
            picture: 'treemap',
            tracking: { detect: ['#Tradle #{number}'], stats: outOfSix('#Tradle #{number}'), headline: 'Guesses' },
            example: '#Tradle #1672 5/6\n🟩🟨⬜⬜⬜\n🟩🟩🟩🟩🟨\n🟩🟩🟩🟩🟨\n🟩🟩🟩🟩🟨\n🟩🟩🟩🟩🟩\nhttps://oec.world/en/games/tradle',
        },
        {
            id: 'movie-to-movie',
            name: 'Movie to Movie',
            url: 'https://movietomovie.com',
            about: 'Link two movies through shared actors in the fewest steps',
            picture: 'chain',
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
            about: 'Place one crown in each row, column and color region',
            picture: 'queens',
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
            about: 'Name countries that fit each row and column of a 3×3 grid',
            picture: 'grid9',
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
            about: 'Guess the movie from its emoji clues',
            picture: 'emoji',
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
            about: 'Name the video game from up to six screenshots',
            picture: 'screenshot',
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
            about: 'Guess the video game from its genre, year and platform clues',
            picture: 'character',
            tracking: gamedleMode('🔍', 10),
            example: '🔍 Gamedle (Guess): #1438 🟥🟥🟥🟩⬜⬜⬜⬜⬜⬜\nhttps://gamedle.wtf/guess',
        },
        {
            id: 'gamedle-classic',
            name: 'Gamedle (Classic)',
            url: 'https://www.gamedle.wtf/classic',
            about: 'Name the video game as more of its cover is revealed',
            picture: 'cover',
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
            about: 'Name the video game as more of its artwork is revealed',
            picture: 'artwork',
            tracking: gamedleMode('🎨', 6),
            example: '🎨 Gamedle (Artwork): #1384 🟥🟥🟥🟩⬜⬜\nhttps://gamedle.wtf/artwork',
        },
        {
            id: 'gamedle-keywords',
            name: 'Gamedle (Keywords)',
            url: 'https://www.gamedle.wtf/keywords',
            about: 'Name the video game from keyword and emoji clues',
            picture: 'tags',
            tracking: gamedleMode('🔑', 6),
            example: '🔑 Gamedle (Keywords): #1185 🟥🟩⬜⬜⬜⬜\nhttps://gamedle.wtf/keywords',
        },
        {
            id: 'puckdoku',
            name: 'Puckdoku',
            url: 'https://puckdoku.com',
            about: 'Fill a 3×3 grid with NHL players fitting each row and column',
            picture: 'grid9',
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
            about: 'Fill a 3×3 grid with movies that fit each row and column',
            picture: 'grid9',
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
            about: 'Listen to 15 spoken words and spell each one',
            picture: 'spelling',
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
            about: 'Pin where in the world each of three dishes is from',
            picture: 'plate',
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
            about: 'Name each answer from up to three clues, worth 3-2-1 points',
            picture: 'points',
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
            about: 'Link two music artists through their related artists',
            picture: 'chain',
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
            about: 'Sort 16 music clues into four groups of four',
            picture: 'groups',
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
            about: 'Guess the song as instruments are added one at a time',
            picture: 'band',
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
            about: 'Pick which of two places has the higher statistic',
            picture: 'versus',
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
            about: 'Pick which of two dishes people rated higher',
            picture: 'versus',
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
            about: 'Guess the hidden BIONICLE word from letter colors',
            picture: 'word',
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
            about: 'Guess the Star Wars character from its traits',
            picture: 'character',
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
            about: 'Swap letters to fix the word grid in 15 swaps or fewer',
            picture: 'waffle',
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
            about: 'Guess where and when each historic photo was taken',
            picture: 'photo',
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
            about: 'Guess the Marvel Comics character from trait clues',
            picture: 'character',
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
            about: 'Guess the MCU character from trait clues',
            picture: 'character',
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
            about: 'Guess the Tolkien character from trait clues',
            picture: 'character',
        },
        {
            id: 'faces',
            name: 'Faces',
            url: 'https://faces.wtf',
            about: 'Name the two movie stars blended into one face',
            picture: 'faces',
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
            about: 'Pick which of two movies has the higher IMDb rating',
            picture: 'versus',
        },
        {
            id: 'catfishing',
            name: 'Catfishing',
            url: 'https://catfishing.net/',
            about: 'Guess the Wikipedia article from its categories',
            picture: 'categories',
            tracking: {
                detect: ['catfishing.net', 'catfishing dot net'],
                stats: [{ name: 'Score', is: { find: ['{number} - {number}/'], take: 2 }, better: 'higher', max: 10 }],
                headline: 'Score',
            },
            example: 'catfishing.net\n#831 - 8.5/10 🎉\n🐈🐈🐈🥚🐟\n🐈🐈🐈🐈🐈',
        },
        {
            id: 'anthropeum',
            name: 'Anthropeum',
            url: 'https://anthropeum.com/',
            about: 'Guess where and when each museum artifact was made',
            picture: 'museum',
            tracking: {
                detect: ['Anthropeum.com ·'],
                stats: [
                    // Header, then the grid line, then the score on the next line.
                    { name: 'Score', is: { find: ['Anthropeum.com · {line} {line} {number}'] }, better: 'higher', max: 100000 },
                    { name: 'Top', is: { find: ['top {number}%'] }, show: 'percent', better: 'lower' },
                ],
                headline: 'Score',
            },
            example: 'Anthropeum.com · Oct 6 2026\n🟨🟥🟩🟥🟥🟨🟨🟩🟩🟨\n48,550 · top 92% of players today!',
        },
        {
            id: 'chartle',
            name: 'Chartle',
            url: 'https://chartle.cc/',
            about: 'Guess the country shown in red on a data chart',
            picture: 'chart',
            tracking: {
                detect: ['📈 Chartle for', 'Play at https://chartle.cc'],
                stats: [
                    solved('Guessed in {number}'),
                    { name: 'Guesses', is: { find: ['Guessed in {number} tr'] }, better: 'lower', max: 5 },
                ],
                headline: 'Guesses',
            },
            example: '📈 Chartle for 07 Oct 2026: Military spending as a share of GDP\n\nGuessed in 2 tries\n🟥✅⬜️⬜️⬜️\n\nPlay at https://chartle.cc',
        },
        {
            id: 'krillion',
            name: 'Krillion',
            url: 'https://krillion.io/',
            about: 'Give the rarest correct answer you can to 7 prompts',
            picture: 'rarity',
            tracking: {
                // The daily is "Krillion #N 🦐"; other modes put a symbol before the #.
                detect: ['Krillion #{number} 🦐'],
                stats: [{ name: 'Score', is: { find: ['Krillion #{number} 🦐 {number}'], take: 2 }, better: 'higher', max: 700 }],
                headline: 'Score',
            },
            example: 'Krillion #83 🦐\n465\n\n🦑🐟🦑🏮🏮🏮🦑\n\nhttps://krillion.io',
        },
        {
            id: 'size-it-up',
            name: 'Size It Up',
            url: 'https://magnitudle.com/size-it-up',
            about: 'Resize objects to their true scale beside a reference',
            picture: 'estimate',
            tracking: {
                // Spin-offs are titled "Size It Up: Pop Culture" and so on.
                detect: ['Size It Up Overall Score {number}'],
                stats: [{ name: 'Score', is: { find: ['Overall Score {number}'] }, better: 'higher', max: 500 }],
                headline: 'Score',
            },
            example: 'Size It Up\nOverall Score 439\n\n🟥🟥🟥🟥🟥 100\n🟥🟥🟥⬜⬜ 59\n🟥🟥🟥🟥🟥 100\n🟥🟥🟥🟥⬜ 80\n🟥🟥🟥🟥🟥 100\nhttps://magnitudle.com/size-it-up',
        },
        {
            id: 'zoomout',
            name: 'ZoomOut',
            url: 'https://zoomout.videoludid.com/',
            about: 'Name the video game as a zoomed-in screenshot pulls back',
            picture: 'screenshot',
            tracking: {
                detect: ['🔎 ZoomOut {number}-', 'zoomout.videoludid.com'],
                // A "My guesses" spoiler line can follow with more squares; read the first line only.
                within: ['🔎 ZoomOut {line}'],
                stats: [solved('🟩'), guessesIfSolved(['🟥', '🟧', '🟩'], 5)],
                headline: 'Guesses',
            },
            example: '🔎 ZoomOut 2026-10-03: 🟥🟩⬛⬛⬛ 😎\nhttps://zoomout.videoludid.com',
        },
        {
            id: 'top-five-trivia',
            name: 'Top 5',
            url: 'https://topfivetrivia.com/',
            about: 'Name the top five in a category, with five lives',
            picture: 'rank',
            tracking: {
                detect: ['topfivetrivia.com', 'top5-game.com', 'Top 5 #{number}', 'Top 5 {skip}(#{number})'],
                // One square per guess: a color for each rank found, white for a miss.
                stats: [
                    { name: 'Found', is: { count: ['🟥', '🟧', '🟨', '🟩', '🟦'] }, better: 'higher', max: 5 },
                    { name: 'Misses', is: { count: ['⬜'] }, better: 'lower', max: 5 },
                    { name: 'Solved', is: { math: [{ stat: 'Found' }, '=', 5] }, show: 'yesno' },
                ],
                headline: 'Found',
            },
            example: 'Top 5 Formula 1 teams by all-time race wins (#763)\n🟥🟧🟨🟩⬜⬜⬜🟦\nhttps://topfivetrivia.com/?utm_medium=share',
        },
        {
            id: 'originle',
            name: 'Originle',
            url: 'https://originle.io/',
            about: 'Guess a guest\'s home country from their video clues',
            picture: 'person',
            tracking: {
                // originle.com is a different game ("📜 Originle — Forenames").
                detect: ['Originle #{number} ·', 'originle.io/'],
                stats: [
                    { name: 'Score', is: { find: ['Originle #{number} · {number}'], take: 2 }, better: 'higher', max: 10000 },
                    solved('🟩'),
                    guessesIfSolved(['🟥', '🟩'], 3),
                    { name: 'Clues', is: { find: ['{number}/8 clues'] }, better: 'lower', max: 8 },
                ],
                headline: 'Score',
            },
            example: 'Originle #1 · 6,000\n🟥🟥🟩 · 4/8 clues\nhttps://originle.io/aya/?day=1',
        },
        {
            id: 'overwatchdle',
            name: 'Overwatchdle',
            url: 'https://www.overwatchdle.net/classic',
            about: 'Guess the Overwatch hero from seven trait clues',
            picture: 'character',
            tracking: {
                detect: ['#Overwatchdle hero #{number} in classic mode'],
                // The grid is cut off after five rows, so the count comes from the header.
                stats: [{ name: 'Guesses', is: { find: ['in classic mode in {number} tr'] }, better: 'lower' }],
                headline: 'Guesses',
            },
            example: 'I found #Overwatchdle hero #2 in classic mode in 3 tries\n\n🟥 🟩 🟥 🟥 🟥 ⬆️ ⬆️\n🟩 🟩 🟩 🟥 🟥 ⬆️ ⬆️\n🟩 🟩 🟩 🟩 🟩 🟩 🟩\n\nhttps://overwatchdle.net',
        },
        {
            id: 'fermi',
            name: 'Fermi',
            url: 'https://fermi.gg/',
            about: 'Estimate the answers to three hard numeric questions',
            picture: 'estimate',
            tracking: {
                detect: ['Fermi · No. {number}'],
                // How many times off the estimates were; 1.00× is perfect.
                stats: [
                    { name: 'Score', is: { find: ['{number}× score'] }, better: 'lower', unit: '×' },
                    { name: 'Top', is: { find: ['top {number}%'] }, show: 'percent', better: 'lower' },
                ],
                headline: 'Score',
            },
            example: 'Fermi · No. 72\n01  1.36×\n02  1.20×\n03  3.67×\n─────────\n1.82× score · top 16%\n<https://fermi.gg/s/daily>',
        },
        {
            id: 'rivalsdle',
            name: 'Rivalsdle',
            url: 'https://www.rivalsdle.net/',
            about: 'Guess the Marvel Rivals hero from trait clues',
            picture: 'character',
            tracking: {
                // Classic shares say "with a video"; other modes say "with a quote" and so on.
                detect: ['#Rivalsdle hero #{number} with a video', '#Rivalsdle-Helden #{number} mit einem Video'],
                stats: [{ name: 'Guesses', is: { find: ['with a video in {number} tr', 'mit einem Video in {number}'] }, better: 'lower' }],
                headline: 'Guesses',
            },
            example: 'I found #Rivalsdle hero #286 with a video in 4 tries',
        },
    ];

    // Picked for new players; everyone can add more from Manage games.
    const starter = ['wordle', 'nyt-connections', 'worldle', 'framed', 'globle', 'timeguessr'];

    // Shown first when adding games: popular picks across words, geography, music and trivia.
    const suggested = ['waffle', 'bandle', 'queens', 'tradle', 'costcodle', 'chartle', 'krillion', 'thrice', 'top-five-trivia', 'pokedoku', 'guessthe-game', 'catfishing', 'zoomout', 'fermi'];

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

    PT.games = { defaults, starter, suggested, prepare };

    if (typeof module !== 'undefined' && module.exports) module.exports = PT.games;
})(typeof window !== 'undefined' ? window : globalThis);
