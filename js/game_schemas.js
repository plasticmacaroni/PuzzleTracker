window.GAMES = [
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
        url: 'https://pokedoku.com'
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
        id: 'globle',
        name: 'Globle',
        url: 'https://globle-game.com'
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
        url: 'https://moviegrid.io'
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
        url: 'https://relatle.io/'
    },
    {
        id: 'disorderly',
        name: 'Disorderly',
        url: 'https://playdisorderly.com/'
    },
    {
        id: 'harmonies',
        name: 'Harmonies',
        url: 'https://harmonies.io'
    },
    {
        id: 'bandle',
        name: 'Bandle',
        url: 'https://bandle.app'
    },
    {
        id: 'juxtastat',
        name: 'Juxtastat',
        url: 'https://urbanstats.org/quiz.html'
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
        id: 'starwars-guessr',
        name: 'Star Wars Guessr',
        url: 'https://starwarsguessr.com/'
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
            template: "Avg Stars: {avg}/5",
            days: 30
        }
    }
]; 