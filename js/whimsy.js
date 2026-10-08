// Small delights: a tile wordmark, a daily fact, cheerful progress lines and a
// confetti burst. Purely decorative; nothing here touches data.
(function (root) {
    const PT = root.PT || (root.PT = {});
    const { h } = PT.ui;

    // "PUZZLE" as game tiles, then the rest of the name.
    function wordmark() {
        return h('span', { class: 'wordmark', 'aria-label': 'PuzzleTracker', role: 'img' },
            h('span', { class: 'wordmark-tiles', 'aria-hidden': 'true' },
                [...'PUZZLE'].map((letter, i) => h('span', { class: `wm-tile wm-${'abcab'[i % 5]}`, text: letter }))),
            h('span', { class: 'wordmark-rest', 'aria-hidden': 'true', text: 'Tracker' }));
    }

    const FACTS = [
        'Wordle was made by Josh Wardle as a gift for his partner, a word-game fan.',
        'The New York Times bought Wordle in January 2022.',
        'Wordle’s original answer list had 2,315 words.',
        'The first crossword, Arthur Wynne’s “Word-Cross”, ran in the New York World in 1913.',
        'Sudoku is short for a Japanese phrase meaning “the digits must stay single”.',
        'Sudoku began in 1979 as “Number Place” in a Dell puzzle magazine.',
        'A Rubik’s Cube has about 43 quintillion possible positions.',
        'Any scrambled Rubik’s Cube can be solved in 20 moves or fewer.',
        'Trivial Pursuit was invented in 1979 by two Canadians, Chris Haney and Scott Abbott.',
        'Jeopardy! first aired in 1964.',
        'NYT Connections launched in June 2023.',
        'Tetris was created in 1984 by Alexey Pajitnov.',
        'A pangram is a sentence that uses every letter of the alphabet.',
        '“Rhythms” is one of the longest English words with no a, e, i, o or u.',
        '“Dord” appeared in Webster’s dictionary by mistake for over a decade.',
        'The dot over a lowercase i or j is called a tittle.',
        'A googol is 1 followed by 100 zeros.',
        'Pi has been calculated to more than 100 trillion digits.',
        'In the Monty Hall problem, switching doors wins two times out of three.',
        'Octopuses have three hearts.',
        'Botanically, bananas are berries and strawberries aren’t.',
        'A group of flamingos is called a flamboyance.',
        'The Eiffel Tower can grow about 15 cm taller in summer heat.',
        'Venus spins the opposite way to most planets.',
        'A day on Venus lasts longer than its year.',
        'Scotland’s national animal is the unicorn.',
        'The Anglo-Zanzibar War of 1896 lasted less than an hour.',
        'Australia is wider than the Moon.',
        'The 15 puzzle, with its sliding numbered tiles, set off a craze in 1880.',
        'There are more possible chess games than atoms in the observable universe.',
        'Wombat poop is cube-shaped.',
        'Sharks have been around longer than trees.',
    ];

    // The same fact all day, a different one tomorrow.
    function factFor(date) {
        let n = 0;
        for (const ch of date) n = (n * 31 + ch.charCodeAt(0)) % 100003;
        return FACTS[n % FACTS.length];
    }

    function quip(done, total) {
        if (!total) return '';
        if (done === 0) return `Fresh slate: 0 of ${total}`;
        if (done === total) return `Clean sweep! ${done} of ${total}`;
        if (total - done === 1) return `One to go! ${done} of ${total}`;
        if (done * 2 === total) return `Halfway there: ${done} of ${total}`;
        return `${done} down, ${total - done} to go`;
    }

    // A short burst of confetti; bigger when the whole day is done.
    function celebrate(big = false) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
        const count = big ? 90 : 30;
        for (let i = 0; i < count; i++) {
            layer.append(h('span', {
                class: `confetti-piece c${i % 4}`,
                style: {
                    left: `${big ? Math.random() * 100 : 35 + Math.random() * 30}%`,
                    '--drift': `${(Math.random() - 0.5) * (big ? 50 : 30)}vw`,
                    '--spin': `${(Math.random() - 0.5) * 1440}deg`,
                    '--fall': `${1.1 + Math.random() * (big ? 1.4 : 0.8)}s`,
                    '--delay': `${Math.random() * (big ? 0.5 : 0.15)}s`,
                },
            }));
        }
        document.body.append(layer);
        setTimeout(() => layer.remove(), big ? 3200 : 2200);
    }

    PT.whimsy = { wordmark, factFor, quip, celebrate, FACTS };
})(typeof window !== 'undefined' ? window : globalThis);
