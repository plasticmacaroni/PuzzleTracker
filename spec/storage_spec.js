describe("getGameAverage", () => {
    let storage;
    let mockLocalStorage;

    beforeEach(async () => {
        mockLocalStorage = (() => {
            let store = {};
            return {
                getItem: key => store[key] || null,
                setItem: (key, value) => store[key] = value.toString(),
                clear: () => store = {},
                removeItem: key => delete store[key]
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });

        // Define a simplified parser for testing if not already globally available
        // or ensure the real parser is loaded and window.GAMES is set.
        if (!window.parser) {
            // This is a simplified mock, the actual test will rely on the real parser via Storage.
            window.parser = {
                parse: (gameId, rawOutput) => {
                    // Basic mock for Framed needed by getGameAverage
                    if (gameId === 'framed') {
                        if (rawOutput.includes('🟩')) return { CompletionState: true, Tries: rawOutput.match(/[🟥🟩]/g).length };
                        return { CompletionState: false, Tries: rawOutput.match(/[🟥🟩]/g).length };
                    }
                    return {};
                }
            };
        }

        // Ensure window.GAMES is available for the storage tests
        window.GAMES = [
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
                                    value: true // Crucial for correct parsing
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
                id: 'testGameForAvg', // Generic game for the other average test
                name: 'Test Game for Average',
                url: 'http://example.com/testgame',
                result_parsing_rules: {
                    extractors: [
                        {
                            name: "score_extractor",
                            regex: "Score: (\\d+)",
                            capture_groups_mapping: [
                                {
                                    target_field_name: "Score",
                                    group_index: 1,
                                    type: "number"
                                },
                                {
                                    target_field_name: "CompletionState", // Assume score implies completion
                                    type: "boolean",
                                    value: true
                                }
                            ]
                        },
                        {
                            name: "failure_extractor", // Optional: if testGame can also fail
                            regex: "FAILED_GAME",
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
                    field: "Score",
                    template: "Avg Score: {avg}",
                    days: 30
                }
            }
        ];

        storage = await Storage.create(mockLocalStorage);

        // Mock app for toast messages if storage methods call it
        if (!window.app) {
            window.app = { showToast: jasmine.createSpy('showToast') };
        }
    });

    // ... other getGameAverage tests ...

    it("should calculate the average for 'Framed' (Tries), excluding failures", async () => {
        const gameId = "framed";
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const results = [
            { date: formatDate(yesterday), rawOutput: "Framed #1165\n🎥 🟥 🟥 🟥 🟥 🟥 🟥\n\nhttps://framed.wtf" }, // Failure, 6 tries
            { date: formatDate(today), rawOutput: "Framed #1164\n🎥 🟥 🟥 🟩 ⬛ ⬛ ⬛\n\nhttps://framed.wtf" }  // Success, 3 tries
        ];

        storage.data.gameResults[gameId] = results;
        await storage.saveData(); // Save to mockLocalStorage

        // The beforeEach already sets up window.GAMES with the 'framed' schema
        // and window.parser (even if mocked simply for framed, the real one should be used by test runner)

        const average = storage.getGameAverage(gameId, "Tries", 30);
        expect(average).toBe("3"); // Only the 3 tries from the successful attempt should be averaged
    });

    it("should correctly calculate average for 'Framed' excluding failed attempts", async () => {
        const gameId = "framed";
        const results = [
            { date: "2023-10-01", rawOutput: "Framed #1165\n🎥 🟥 🟥 🟥 🟥 🟥 🟥\n\nhttps://framed.wtf" }, // Failure, 6 tries
            { date: "2023-10-02", rawOutput: "Framed #1164\n🎥 🟥 🟥 🟩 ⬛ ⬛ ⬛\n\nhttps://framed.wtf" }  // Success, 3 tries
        ];

        storage.data.gameResults[gameId] = results;
        await storage.saveData(); // Save to mockLocalStorage

        const average = storage.getGameAverage(gameId, "Tries", 30);
        expect(average).toBe("3"); // Only the 3 tries from the successful attempt
    });
});

// ... other describe blocks or tests ... 