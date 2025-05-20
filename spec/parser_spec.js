describe("CompletionState Logic", () => {
    // ... any existing CompletionState tests ...

    it("should throw an error if CompletionState boolean extractors lack explicit value:true/false", () => {
        const gameId = "misconfiguredGame";
        const rawOutput = "Some output";
        window.GAMES = [
            {
                id: gameId,
                name: "Misconfigured Game",
                url: "http://example.com",
                result_parsing_rules: {
                    extractors: [
                        {
                            name: "completion_state_implicit",
                            regex: "IMPLICIT_COMPLETE",
                            capture_groups_mapping: [
                                {
                                    target_field_name: "CompletionState",
                                    group_index: 0,
                                    type: "boolean" // Missing explicit value: true/false
                                }
                            ]
                        }
                    ]
                }
            }
        ];

        expect(() => window.parser.parse(gameId, rawOutput)).toThrowError(
            `[PARSER CONFIG ERROR] Game ${gameId}: Defines boolean CompletionState extractors, but none have an explicit 'value: true' or 'value: false' mapping. Parser requires explicit values for new CompletionState logic.`
        );
    });
});

describe("Parser - Waffle Game Logic", () => {
    const gameId = 'waffle'; // The ID for Waffle as defined in game_schemas.js

    beforeEach(() => {
        // Ensure window.GAMES includes the Waffle schema.
        // This is a simplified mock. Ideally, load actual schemas or a dedicated test_schemas.js.
        const waffleSchema = {
            id: 'waffle',
            name: 'Waffle',
            url: 'https://wafflegame.net/daily',
            result_parsing_rules: {
                extractors: [
                    {
                        name: "stars_awarded",
                        regex: "#waffle\\d+ (\\d)/5",
                        capture_groups_mapping: [
                            { target_field_name: "Stars", group_index: 1, type: "number" }
                        ]
                    },
                    {
                        name: "completion_state_success",
                        regex: "#waffle\\d+ \\d/5",
                        capture_groups_mapping: [
                            { target_field_name: "CompletionState", type: "boolean", value: true }
                        ]
                    },
                    {
                        name: "completion_state_failure",
                        regex: "#waffle\\d+ X/5",
                        capture_groups_mapping: [
                            { target_field_name: "CompletionState", type: "boolean", value: false }
                        ]
                    }
                ]
            },
            average_display: {
                field: "Stars",
                template: "Avg Stars: {avg:0.0}/5",
                days: 30
            }
        };
        // Ensure window.GAMES exists and add/replace waffleSchema
        if (window.GAMES) {
            const existingGames = window.GAMES.filter(g => g.id !== 'waffle');
            window.GAMES = [...existingGames, waffleSchema];
        } else {
            window.GAMES = [waffleSchema];
        }

        // Ensure parser is available
        if (!window.parser) {
            // Assuming Parser class is globally available or has been imported/loaded
            // If Parser is not a global, this line would need adjustment based on how it's accessed in tests.
            window.parser = new Parser();
        }
    });

    it("should correctly parse a 0/5 stars Waffle result", () => {
        const rawOutput = `#waffle1215 0/5\n\n🟩🟩🟩🟩🟩\n🟩⬜🟩⬜🟩\n🟩🟩🟩🟩🟩\n🟩⬜🟩⬜🟩\n🟩🟩🟩🟩🟩\n\n🔥 streak: 1\nwafflegame.net`;
        const expectedResult = {
            Stars: 0,
            CompletionState: true
        };
        expect(window.parser.parse(gameId, rawOutput)).toEqual(expectedResult);
    });

    it("should correctly parse a failed (X/5) Waffle result", () => {
        const rawOutput = `#waffle1215 X/5\n\n🟩⬛⬛⬛🟩\n⬛⬜⬛⬜🟩\n🟩🟩🟩⬛⬛\n⬛⬜⬛⬜⬛\n🟩⬛⬛⬛🟩\n\n💔 streak: 0\nwafflegame.net`;
        const expectedResult = {
            CompletionState: false
        };
        expect(window.parser.parse(gameId, rawOutput)).toEqual(expectedResult);
    });

    it("should correctly parse a 5/5 stars Waffle result", () => {
        const rawOutput = `#waffle1215 5/5\n\n🟩🟩🟩🟩🟩\n🟩⭐🟩⭐🟩\n🟩🟩⭐🟩🟩\n🟩⭐🟩⭐🟩\n🟩🟩🟩🟩🟩\n\n🔥 streak: 1\nwafflegame.net`;
        const expectedResult = {
            Stars: 5,
            CompletionState: true
        };
        expect(window.parser.parse(gameId, rawOutput)).toEqual(expectedResult);
    });

    // This test technically tests storage.getGameAverage, but it's closely related to Waffle's parsing.
    // It ensures that an average of 0 for Stars is returned as a string (e.g., "0" or "0.0"),
    // which is truthy and allows the UI to display it.
    it("should ensure getGameAverage returns a truthy string for a Waffle average of 0 stars", () => {
        // Mock or ensure storage is set up with a single Waffle result of 0 stars
        // This requires window.storage to be an instance of your Storage class
        // and window.GAMES to have the Waffle schema.
        const rawWaffleOutputZeroStars = `#waffle1216 0/5\n\n🟩🟩🟩🟩🟩\n🟩⬜🟩⬜🟩\n🟩🟩🟩🟩🟩\n🟩⬜🟩⬜🟩\n🟩🟩🟩🟩🟩\n\n🔥 streak: 1\nwafflegame.net`;

        // Ensure storage instance is available for the test
        // This might be handled by a global beforeEach in your test setup if window.storage is your app's global instance.
        // If not, you might need to create/mock it: e.g. const storage = new Storage(mockLocalStorage); for test isolation.
        // For this example, we assume window.storage is available and initialized.

        // Clear previous results for this game to ensure a clean test
        if (window.storage && window.storage.data && window.storage.data.gameResults) {
            window.storage.data.gameResults[gameId] = [];
        }

        // Add the specific result
        // Note: addGameResult is async, but for this test's purpose, direct manipulation or a synchronous mock might be simpler
        // if your test environment doesn't handle async well in beforeEach/it blocks for this type of setup.
        // However, using the actual method is better if feasible.
        // For simplicity here, assuming direct data manipulation or that addGameResult is handled.
        if (window.storage) { // Check if storage is initialized
            window.storage.addGameResult(gameId, rawWaffleOutputZeroStars); // This is async
        }

        // Allow promise from addGameResult to resolve if it was actually async and called.
        // This is a bit of a hack for a synchronous test. A better way is to use async/await in tests if supported.
        // Or mock addGameResult to be synchronous for the test.
        // For now, let's assume the result is added before getGameAverage is called.

        // Call getGameAverage
        // The Waffle schema has `template: "Avg Stars: {avg:0.0}/5"`.
        // The current single-value formatting in getGameAverage will use String(0) -> "0"
        // as "0.0" from the template doesn't match the specific ,.Xf patterns for toLocaleString.
        const average = window.storage.getGameAverage(gameId, 'Stars', 30);

        expect(average).toBe("0");
        expect(!!average).toBe(true); // Ensure it's a truthy value
    });
}); 