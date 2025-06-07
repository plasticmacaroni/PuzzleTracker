// Store the original GAMES array as GAMES_DEFAULT immediately
window.GAMES_DEFAULT = [
    {
        id: 'wordle',
        name: 'Wordle',
        url: 'https://www.nytimes.com/games/wordle/index.html',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state_success",
                    regex: "\\d/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "completion_state_failure",
                    regex: "X/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: false
                        }
                    ]
                },
                {
                    name: "attempts",
                    regex: "(\\d)/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Attempts",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Attempts",
            template: "30-day avg: {avg}/6",
            days: 30
        }
    },
    {
        id: 'nyt-connections',
        name: 'NYT Connections',
        url: 'https://www.nytimes.com/games/connections',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state_success",
                    regex: "^(?=.*🟨🟨🟨🟨)(?=.*🟩🟩🟩🟩)(?=.*🟦🟦🟦🟦)(?=.*🟪🟪🟪🟪).*",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "attempts_extractor",
                    regex: "[🟨🟩🟦🟪]{1,4}\\s*(?:\\r?\\n|$)",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Attempts",
                            type: "count"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Attempts",
            template: "30-day avg: {avg} attempts",
            days: 30
        }
    },
    {
        id: 'costcodle',
        name: 'Costcodle',
        url: 'https://costcodle.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "attempts",
                    regex: "(\\d)/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Attempts",
                            group_index: 1,
                            type: "number"
                        },
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "failures",
                    regex: "X/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: false
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Attempts",
            template: "30-day avg: {avg}/6",
            days: 30
        }
    },
    {
        id: 'oec-pick-5',
        name: 'OEC Pick-5',
        url: 'https://oec.world/en/games/pick-5',
        result_parsing_rules: {
            extractors: [
                {
                    name: "percentage",
                    regex: "(\\d+\\.\\d+)%",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Percentage",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                },
                {
                    name: "correct_guesses",
                    regex: "(\\d)/5",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Correct Guesses",
                            group_index: 1,
                            type: "number"
                        },
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: true
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Percentage",
            template: "30-day avg: {avg}%",
            days: 30
        }
    },
    {
        id: 'pokedoku',
        name: 'PokeDoku',
        url: 'https://pokedoku.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "Score: (\\d+)/9",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                },
                {
                    name: "uniqueness",
                    regex: "Uniqueness: (\\d+)/(\\d+)",
                    capture_groups_mapping: [
                        {
                            target_field_name: "UniquenessPercent",
                            group_index: 1,
                            type: "number",
                            transform: "value / parseFloat(capture_groups[2]) * 100"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg}/9",
            days: 30
        }
    },
    {
        id: 'framed',
        name: 'Framed',
        url: 'https://framed.wtf',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🎥",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'daily-dozen-trivia',
        name: 'Daily Dozen Trivia',
        url: 'https://dailydozentrivia.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "Score: (\\d+)",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                },
                {
                    name: "correct",
                    regex: "(\\d+) Correct",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Correct",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg} pts",
            days: 30
        }
    },
    {
        id: 'globle',
        name: 'Globle',
        url: 'https://globle-game.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "guesses",
                    regex: "= (\\d+)",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Guesses",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Guesses",
            template: "30-day avg: {avg:0.1} guesses",
            days: 30
        }
    },
    {
        id: 'box-office-game',
        name: 'Box Office Game',
        url: 'https://boxofficega.me'
    },
    {
        id: 'tradle',
        name: 'Tradle',
        url: 'https://games.oec.world/en/tradle/'
    },
    {
        id: 'movie-to-movie',
        name: 'Movie to Movie',
        url: 'https://movietomovie.com'
    },
    {
        id: 'guessthe-game',
        name: 'GuessThe.Game',
        url: 'https://guessthe.game',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🎮",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'gamedle',
        name: 'Gamedle (Guess)',
        url: 'https://www.gamedle.wtf/guess',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🕹️",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟨", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'gamedle-classic',
        name: 'Gamedle (Classic)',
        url: 'https://www.gamedle.wtf/classic',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🕹️",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟨", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'gamedle-artwork',
        name: 'Gamedle (Artwork)',
        url: 'https://www.gamedle.wtf/artwork',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🕹️",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟨", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'gamedle-keywords',
        name: 'Gamedle (Keywords)',
        url: 'https://www.gamedle.wtf/keywords',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🕹️",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟨", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'puckdoku',
        name: 'Puckdoku',
        url: 'https://puckdoku.com'
    },
    {
        id: 'moviegrid',
        name: 'MovieGrid.io',
        url: 'https://moviegrid.io',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "(\\d+|X|\\?|0)/9",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number",
                            transform: "['X', '?', '0'].includes(value) ? 0 : parseInt(value)"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg}/9",
            days: 30
        }
    },
    {
        id: 'spellcheck-game',
        name: 'Spellcheck Game',
        url: 'https://spellcheckgame.com/'
    },
    {
        id: 'foodguessr',
        name: 'FoodGuessr',
        url: 'https://foodguessr.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "Total score: ([\\d,]+) / 15,000",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        },
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: true
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg:,.0f}/15,000",
            days: 30
        }
    },
    {
        id: 'thrice',
        name: 'Thrice',
        url: 'https://thrice.geekswhodrink.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "points",
                    regex: "(\\d+) points",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Points",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Points",
            template: "30-day avg: {avg}/15",
            days: 30
        }
    },
    {
        id: 'relatle',
        name: 'Relatle.io',
        url: 'https://relatle.io/',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "Solved 🥳",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "guesses",
                    regex: "(\\d+) guesses",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Guesses",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Guesses",
            template: "30-day avg: {avg:0.1} guesses",
            days: 30
        }
    },
    {
        id: 'disorderly',
        name: 'Disorderly',
        url: 'https://playdisorderly.com/',
        result_parsing_rules: {
            extractors: [
                {
                    name: "columns",
                    regex: "\\d{1,2}\\uFE0F?\\u20E3\\s*([🟢🔴]+)",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Columns",
                            group_index: 1,
                            type: "count",
                            count_chars: ["🟢", "🔴"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Columns",
            template: "Avg Columns: {avg:0.0}",
            days: 30
        }
    },
    {
        id: 'harmonies',
        name: 'Harmonies',
        url: 'https://harmonies.io'
    },
    {
        id: 'bandle',
        name: 'Bandle',
        url: 'https://bandle.app',
        result_parsing_rules: {
            extractors: [
                {
                    name: "attempts",
                    regex: "(\\d+|x)/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Attempts",
                            group_index: 1,
                            type: "number",
                            transform: "value === 'x' ? 0 : parseInt(value)"
                        },
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: true,
                            transform: "value !== 'x'"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Attempts",
            template: "30-day avg: {avg}/6",
            days: 30
        }
    },
    {
        id: 'juxtastat',
        name: 'Juxtastat',
        url: 'https://urbanstats.org/quiz.html',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "(\\d)/5",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg}/5",
            days: 30
        }
    },
    {
        id: 'scrandle',
        name: 'Scrandle',
        url: 'https://scrandle.com/',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "(\\d+)/10",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg}/10",
            days: 30
        }
    },
    {
        id: 'bonkle',
        name: 'Bonkle',
        url: 'https://bonkle.maskofdestiny.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "(\\d+|X|\\?|0)/7",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number",
                            transform: "['X', '?', '0'].includes(value) ? 0 : parseInt(value)"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg}/7",
            days: 30
        }
    },
    {
        id: 'starwars-guessr-guess',
        name: 'Star Wars Guessr (Guess)',
        url: 'https://starwarsguessr.com/',
        result_parsing_rules: {
            extractors: [
                {
                    name: "tries",
                    regex: "📋\\s*:\\s*(\\d+)\\s*tries",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg:0.1} tries",
            days: 30
        }
    },
    {
        id: 'waffle',
        name: 'Waffle',
        url: 'https://wafflegame.net/daily',
        result_parsing_rules: {
            extractors: [
                {
                    name: "stars_awarded",
                    regex: "#waffle\\d+ (\\d)/5", // Captures the digit in D/5
                    capture_groups_mapping: [
                        {
                            target_field_name: "Stars",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                },
                {
                    name: "completion_state_success",
                    regex: "#waffle\\d+ \\d/5",    // Matches if format is D/5 (success, regardless of star count)
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: true
                        }
                    ]
                },
                {
                    name: "completion_state_failure",
                    regex: "#waffle\\d+ X/5",    // Matches if format is X/5 (failure)
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            type: "boolean",
                            value: false
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Stars",
            template: "Avg Stars: {avg:0.0}/5",
            days: 30
        }
    },
    {
        id: 'timeguessr',
        name: 'TimeGuessr',
        url: 'https://timeguessr.com/finalscoredaily',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "TimeGuessr #\\d+ (\\d+)/50,000",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg:,.0f}/50,000",
            days: 30
        }
    }
];

// Initialize GAMES with GAMES_DEFAULT
window.GAMES = JSON.parse(JSON.stringify(window.GAMES_DEFAULT));

function mergeStatsFromStandardImports(localSchema, standardSchema) {
    // Handle edge cases
    if (!localSchema || !standardSchema) {
        return localSchema;
    }
    if (localSchema.id !== standardSchema.id) {
        return localSchema;
    }

    // Create a deep copy of the local schema to avoid modifying the original
    const mergedSchema = JSON.parse(JSON.stringify(localSchema));

    // If the standard schema has stats, merge them into the local schema
    if (standardSchema.stats) {
        if (!mergedSchema.stats) {
            mergedSchema.stats = [];
        }

        // Create a map of existing stats by name for quick lookup
        const existingStatsMap = new Map(mergedSchema.stats.map(stat => [stat.name, stat]));

        // Add new stats from standard schema that don't exist in local schema
        // Preserve the order by adding new stats at the end
        standardSchema.stats.forEach(standardStat => {
            if (!existingStatsMap.has(standardStat.name)) {
                mergedSchema.stats.push(JSON.parse(JSON.stringify(standardStat)));
            }
        });
    }

    return mergedSchema;
}

// If there are any local schemas (GAMES_LOCAL), merge them with GAMES_DEFAULT
if (window.GAMES_LOCAL && window.GAMES_LOCAL.length > 0) {
    // Start with a copy of GAMES_DEFAULT
    window.GAMES = JSON.parse(JSON.stringify(window.GAMES_DEFAULT));

    // For each local schema, either merge it with its default counterpart or add it as new
    window.GAMES_LOCAL.forEach(localSchema => {
        const existingIndex = window.GAMES.findIndex(g => g.id === localSchema.id);
        if (existingIndex >= 0) {
            // Merge with existing schema
            const standardSchema = window.GAMES_DEFAULT.find(g => g.id === localSchema.id);
            window.GAMES[existingIndex] = mergeStatsFromStandardImports(localSchema, standardSchema);
        } else {
            // Add as new schema
            window.GAMES.push(JSON.parse(JSON.stringify(localSchema)));
        }
    });
} 