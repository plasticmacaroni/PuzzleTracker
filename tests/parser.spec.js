// tests/parser.spec.js

describe("Parser", function () {
    let testParser;

    beforeEach(function () {
        testParser = window.parser; // Assumes global parser instance

        // CRITICAL: Ensure GAMES_DEFAULT is loaded from live game_schemas.js
        if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
            throw new Error("[parser.spec.js] CRITICAL: window.GAMES_DEFAULT is not available or empty. Live schemas from js/game_schemas.js did not load. Aborting tests.");
        }
        // Reset window.GAMES to a fresh copy of all live schemas.
        // Specific test suites (describe blocks) are responsible for further filtering window.GAMES 
        // to contain ONLY the exact schema(s) they need for their tests, or defining schemas inline.
        window.GAMES = JSON.parse(JSON.stringify(window.GAMES_DEFAULT));
    });

    describe("NYT Connections Parsing (nyt-connections-test)", function () {
        const gameId = 'nyt-connections-test'; // Test-specific ID
        const liveSchemaId = 'nyt-connections'; // ID in game_schemas.js

        beforeEach(function () {
            if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
                throw new Error(`[parser.spec.js] CRITICAL: window.GAMES_DEFAULT is not available. Cannot run tests for ${gameId}.`);
            }
            const liveSchema = window.GAMES_DEFAULT.find(g => g.id === liveSchemaId);
            if (!liveSchema) {
                throw new Error(`[parser.spec.js] CRITICAL: Live schema for '${liveSchemaId}' not found in GAMES_DEFAULT. Cannot run tests for ${gameId}.`);
            }

            window.GAMES = []; // Start with a clean slate for window.GAMES for this suite
            const testSchema = JSON.parse(JSON.stringify(liveSchema));
            testSchema.id = gameId; // Use the test-specific ID
            window.GAMES.push(testSchema);
        });

        // Test for the original behavior - ensure CompletionState: true requires explicit value in schema
        // This test assumes 'nyt-connections-test' in G_TEST_CONFIG now has value:true
        it("should correctly parse a successful Connections result with 5 attempts (live schema rules)", function () {
            // This test will use the LIVE schema definition from js/app.js for 'nyt-connections'
            // if G_TEST_CONFIG doesn't override it or if 'nyt-connections-test' isn't detailed enough.
            const rawOutput = `Connections
Puzzle #708
🟨🟪🟪🟪
🟪🟪🟪🟪
🟨🟨🟨🟨
🟩🟩🟩🟩
🟦🟦🟦🟦`; // Ensure this string is clean and uses correct blue squares.

            const result = window.parser.parse(gameId, rawOutput); // Corrected to use global parser
            expect(result.Attempts).toBe(5, 'Should count 5 rows of emojis as 5 attempts using live schema rules');
            expect(result.CompletionState).toBe(true, 'Should be marked as completed');
        });

        // ... other NYT Connections tests from the original file ...
        // Ensure their schemas (in G_TEST_CONFIG) are updated for CompletionState: value:true

        it("should correctly parse a failed Connections result (not all colors solved)", function () {
            const rawOutput = `Connections
Puzzle #709
🟨🟪🟪🟪
🟪🟪🟪🟪
🟨🟨🟨🟨`; // Missing green and blue for success
            const result = testParser.parse(gameId, rawOutput);
            // With only success pattern defined, no match means CompletionState will be false
            expect(result.CompletionState).toBe(false, "CompletionState should be false if not all colors are solved");
            expect(result.Attempts).toBe(3, "Should count 3 rows of emojis as 3 attempts");
        });

        it("should handle Connections with exactly 4 attempts (perfect game)", function () {
            const rawOutput = `Connections
Puzzle #710
🟨🟨🟨🟨
🟩🟩🟩🟩
🟦🟦🟦🟦
🟪🟪🟪🟪`;
            const result = testParser.parse(gameId, rawOutput);
            expect(result.CompletionState).toBe(true, "CompletionState should be true for a perfect game");
            expect(result.Attempts).toBe(4, "Should count 4 rows for a perfect game");
        });

        it("should handle Connections with varying whitespace and newlines between rows", function () {
            const rawOutput = `Connections
Puzzle #711

🟨🟨🟨🟨  

🟩🟩🟩🟩
🟦🟦🟦🟦
🟪🟪🟪🟪`;
            const result = testParser.parse(gameId, rawOutput);
            expect(result.CompletionState).toBe(true);
            expect(result.Attempts).toBe(4, "Should correctly count rows despite varied spacing");
        });

    });

    describe("Wordle Parsing (wordle-test)", function () {
        const gameId = 'wordle-test'; // Test-specific ID
        const liveSchemaId = 'wordle'; // ID in game_schemas.js

        beforeEach(function () {
            if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
                throw new Error(`[parser.spec.js] CRITICAL: window.GAMES_DEFAULT is not available. Cannot run tests for ${gameId}.`);
            }
            const liveSchema = window.GAMES_DEFAULT.find(g => g.id === liveSchemaId);
            if (!liveSchema) {
                throw new Error(`[parser.spec.js] CRITICAL: Live schema for '${liveSchemaId}' not found in GAMES_DEFAULT. Cannot run tests for ${gameId}.`);
            }

            window.GAMES = []; // Start with a clean slate
            const testSchema = JSON.parse(JSON.stringify(liveSchema));
            testSchema.id = gameId;
            window.GAMES.push(testSchema);
        });

        // These tests also rely on G_TEST_CONFIG being updated for Wordle's
        // CompletionState: value:true for success (d/6) and value:false for failure (X/6)

        it("should parse attempts and completion state for a successful Wordle (e.g., 3/6)", function () {
            const rawOutput = "Wordle 1,234 3/6\\n⬜🟨⬜⬜🟩\\n🟩🟩⬜⬜🟩\\n🟩🟩🟩🟩🟩";
            const result = testParser.parse(gameId, rawOutput);
            expect(result.Attempts).toBe(3, "Attempts should be 3");
            expect(result.CompletionState).toBe(true, "CompletionState should be true");
        });

        it("should parse attempts and completion state for a failed Wordle (X/6)", function () {
            const rawOutput = "Wordle 1,235 X/6\\n⬜🟨⬜⬜🟩\\n🟩🟩⬜⬜🟩\\n⬜⬜⬜⬜⬜\\n🟨🟨🟨🟨🟨\\n🟩🟩🟩🟩⬜\\n⬜⬜🟨🟨🟨";
            const result = testParser.parse(gameId, rawOutput);
            expect(result.Attempts).toBeUndefined("Attempts should be undefined for X/6 with current schema");
            expect(result.CompletionState).toBe(false, "CompletionState should be false for X/6");
        });

        it("should return an empty object if no parsing rules match (Wordle schema)", function () {
            const rawOutput = "Some completely unrelated text";
            const result = testParser.parse(gameId, rawOutput);
            expect(Object.keys(result).length).toBe(0, "Result should be an empty object for non-matching text");
        });
    });

    describe("CompletionState Logic", () => {
        it("should throw an error if CompletionState boolean extractors lack explicit value:true/false", () => {
            const localGameId = "misconfigured-completion-game";
            const rawOutput = "Some output";
            // Define game locally for this test to ensure it's misconfigured as intended
            window.GAMES = [
                {
                    id: localGameId,
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

            expect(() => testParser.parse(localGameId, rawOutput)).toThrowError(
                `[PARSER CONFIG ERROR] Game ${localGameId}: Defines boolean CompletionState extractors, but none have an explicit 'value: true' or 'value: false' mapping. Parser requires explicit values for new CompletionState logic.`
            );
        });
    });

    describe("Generic 'type: \"count\"' (no count_emojis)", function () {
        it("should correctly count all matches of the extractor's regex", function () {
            const gameId = "countTestGame";
            window.GAMES = [
                {
                    id: gameId,
                    name: "Count Test Game",
                    url: "http://example.com/counttest",
                    result_parsing_rules: {
                        extractors: [
                            {
                                name: "item_counter",
                                regex: "item", // Simple regex to count occurrences of "item"
                                capture_groups_mapping: [
                                    {
                                        target_field_name: "ItemCount",
                                        type: "count"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ];
            const rawOutput = "item one, item two, another item, and a final item.";
            const result = testParser.parse(gameId, rawOutput);
            expect(result.ItemCount).toBe(4, "Should count 4 occurrences of 'item'");
        });

        it("should return 0 if the counting regex does not match", function () {
            const gameId = "countTestGameNoMatch";
            window.GAMES = [ // Define locally to avoid conflicts
                {
                    id: gameId,
                    name: "Count Test Game No Match",
                    url: "http://example.com/counttestnomatch",
                    result_parsing_rules: {
                        extractors: [
                            {
                                name: "item_counter",
                                regex: "specific_item",
                                capture_groups_mapping: [
                                    {
                                        target_field_name: "ItemCount",
                                        type: "count"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ];
            const rawOutput = "general stuff, other things, but not the specific thing.";
            const result = testParser.parse(gameId, rawOutput);
            expect(result.ItemCount).toBe(0, "Should count 0 occurrences if regex doesn't match");
        });
    });

    describe("Costcodle Parsing (costcodle-test)", function () {
        const gameId = 'costcodle-test'; // Test-specific ID
        const liveSchemaId = 'costcodle'; // ID in game_schemas.js

        beforeEach(function () {
            if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
                throw new Error(`[parser.spec.js] CRITICAL: window.GAMES_DEFAULT is not available. Cannot run tests for ${gameId}.`);
            }
            const liveSchema = window.GAMES_DEFAULT.find(g => g.id === liveSchemaId);
            if (!liveSchema) {
                throw new Error(`[parser.spec.js] CRITICAL: Live schema for '${liveSchemaId}' not found in GAMES_DEFAULT. Cannot run tests for ${gameId}.`);
            }

            window.GAMES = []; // Start with a clean slate
            const testSchema = JSON.parse(JSON.stringify(liveSchema));
            testSchema.id = gameId;
            window.GAMES.push(testSchema);
        });

        it("should correctly parse a successful Costcodle result (e.g., 1/6) including Attempts and CompletionState", function () {
            const rawOutput = "Costcodle #607 1/6\n✅\nhttps://costcodle.com";
            const result = testParser.parse(gameId, rawOutput);

            expect(result.Attempts).toBe(1, "Attempts should be 1 for '1/6' input.");
            expect(result.CompletionState).toBe(true, "CompletionState should be true for '1/6' input.");
        });

        it("should correctly parse a failed Costcodle result (X/6) setting CompletionState to false and no Attempts", function () {
            const rawOutput = "Costcodle #608 X/6\n❌❌❌❌❌❌\nhttps://costcodle.com";
            const result = testParser.parse(gameId, rawOutput);

            expect(result.Attempts).toBeUndefined("Attempts should be undefined for 'X/6' input with current schema.");
            expect(result.CompletionState).toBe(false, "CompletionState should be false for 'X/6' input.");
        });

        it("should return an empty object if no Costcodle parsing rules match", function () {
            const rawOutput = "This is not a Costcodle output.";
            const result = testParser.parse(gameId, rawOutput);
            // Depending on the parser's behavior for no match with a defined schema,
            // it might return {} or {CompletionState: undefined} if CS patterns were sought.
            // Given the new CS logic, if patterns are defined but none match, CS is usually explicitly set.
            // However, for Costcodle, "1/6" -> CS:true, "X/6" -> CS:false.
            // If neither matches, and ONLY success was defined, CS would be false.
            // If BOTH success & failure defined (like costcodle), CS is undefined & warning logged.
            // The parser was modified not to add CompletionState if its value is undefined.
            expect(Object.keys(result).length).toBe(0, "Result should be an empty object for non-matching text.");
        });
    });

    describe("Star Wars Guessr Parsing (starwars-guessr-guess)", function () {
        const gameId = 'starwars-guessr-guess';

        beforeEach(function () {
            if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
                throw new Error(`[parser.spec.js] CRITICAL: window.GAMES_DEFAULT is not available. Cannot run tests for ${gameId}.`);
            }
            const liveSchema = window.GAMES_DEFAULT.find(g => g.id === gameId);
            if (!liveSchema) {
                throw new Error(`[parser.spec.js] CRITICAL: Live schema for '${gameId}' not found in GAMES_DEFAULT.`);
            }

            window.GAMES = []; // Start with a clean slate
            const testSchema = JSON.parse(JSON.stringify(liveSchema));
            window.GAMES.push(testSchema);
        });

        it("should parse tries from the example outputs", function () {
            const examples = [
                {
                    input: `STAR WARS GUESSR - May 26th 2025
🎮 : Guess
📋 : 7 tries
🟩🟩🟩🟩🟩🟩🟩
🟩🟩🟩🟩🟥🟥🟥
🟩🟩🟥🟩🟥🟥🟩
🟩🟥🟥🟩🟥🟥🟥
🟩🟥🟥🟩🟥🟥🟥
+ 2 rows
🔗 : https://starwarsguessr.com`,
                    expectedTries: 7
                },
                {
                    input: `STAR WARS GUESSR - May 25th 2025
🎮 : Guess
📋 : 10 tries
🟩🟩🟩🟩🟩🟩🟩
🟩🟩🟩🟩🟨🟥🟩
🟩🟩🟥🟥🟨🟨🟥
🟩🟨🟥🟩🟨🟨🟨
🟩🟩🟥🟩🟨🟥🟨
+ 5 rows
🔗 : https://starwarsguessr.com`,
                    expectedTries: 10
                },
                {
                    input: `STAR WARS GUESSR - May 23rd 2025
🎮 : Guess
📋 : 7 tries
🟩🟩🟩🟩🟩🟩🟩
🟩🟩🟩🟩🟥🟥🟥
🟩🟩🟥🟩🟥🟥🟥
🟩🟩🟩🟥🟨🟥🟥
🟩🟩🟩🟩🟨🟥🟥
+ 2 rows
🔗 : https://starwarsguessr.com`,
                    expectedTries: 7
                },
                {
                    input: `STAR WARS GUESSR - May 22nd 2025
🎮 : Guess
📋 : 4 tries
🟩🟩🟩🟩🟩🟩🟩
🟩🟥🟩🟩🟥🟨🟨
🟩🟥🟩🟩🟨🟨🟨
🟩🟥🟥🟩🟥🟥🟥
🔗 : https://starwarsguessr.com`,
                    expectedTries: 4
                },
                {
                    input: `STAR WARS GUESSR - May 20th 2025
🎮 : Guess
📋 : 9 tries
🟩🟩🟩🟩🟩🟩🟩
🟩🟨🟩🟩🟥🟥🟩
🟥🟨🟩🟩🟥🟨🟩
🟩🟨🟥🟩🟥🟥🟥
🟩🟨🟥🟩🟥🟥🟨
+ 4 rows
🔗 : https://starwarsguessr.com`,
                    expectedTries: 9
                }
            ];

            examples.forEach((example, index) => {
                const result = testParser.parse(gameId, example.input);
                expect(result.Tries).toBe(example.expectedTries,
                    `Example ${index + 1} should parse ${example.expectedTries} tries`);
            });
        });

        it("should handle variations in whitespace around the tries count", function () {
            const variations = [
                "📋 : 7 tries",
                "📋: 7 tries",
                "📋 :7 tries",
                "📋:7 tries"
            ];

            variations.forEach((input, index) => {
                const result = testParser.parse(gameId, input);
                expect(result.Tries).toBe(7,
                    `Variation ${index + 1} should parse 7 tries regardless of whitespace`);
            });
        });
    });

    describe("Disorderly Parsing", function () {
        const gameId = 'disorderly';

        beforeEach(function () {
            if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
                throw new Error(`[parser.spec.js] CRITICAL: window.GAMES_DEFAULT is not available. Cannot run tests for ${gameId}.`);
            }
            const liveSchema = window.GAMES_DEFAULT.find(g => g.id === gameId);
            if (!liveSchema) {
                throw new Error(`[parser.spec.js] CRITICAL: Live schema for '${gameId}' not found in GAMES_DEFAULT. Cannot run tests for ${gameId}.`);
            }

            window.GAMES = []; // Start with a clean slate
            window.GAMES.push(JSON.parse(JSON.stringify(liveSchema)));
        });

        it("should correctly count columns from Disorderly output", function () {
            const rawOutput = `1️⃣ 🟢🟢🟢
2️⃣ 🟢🟢🔴
3️⃣ 🟢🔴🔴`;
            const result = testParser.parse(gameId, rawOutput);
            expect(result.Columns).toBe(3, "Should count 3 columns of 🟢 and 🔴");
        });

        it("should handle Disorderly output with varying whitespace", function () {
            const rawOutput = `1️⃣  🟢🟢🟢  
2️⃣ 🟢🟢🔴
3️⃣  🟢🔴🔴  `;
            const result = testParser.parse(gameId, rawOutput);
            expect(result.Columns).toBe(3, "Should count 3 columns despite varying whitespace");
        });

        it("should handle Disorderly output with emoji variations", function () {
            const rawOutput = `1️⃣ 🟢🟢🟢
2️⃣ 🟢🟢🔴
3️⃣ 🟢🔴🔴`;
            const result = testParser.parse(gameId, rawOutput);
            expect(result.Columns).toBe(3, "Should count 3 columns with emoji variations");
        });
    });

});

describe("Schema Integrity Checks", function () {
    beforeEach(function () {
        // Ensure this suite always checks against the full set of schemas loaded by test_runner.html
        if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
            throw new Error("[Schema Integrity Check] CRITICAL: window.GAMES_DEFAULT is not available or empty. This is the master list of schemas to check. Aborting tests.");
        }
        window.GAMES = JSON.parse(JSON.stringify(window.GAMES_DEFAULT));
        // console.log("[Schema Integrity Check] beforeEach: Set window.GAMES to full GAMES_DEFAULT. Count:", window.GAMES.length);
    });

    it("should parse dummy input for all loaded game schemas without CompletionState configuration errors", function () {
        if (!window.GAMES || window.GAMES.length === 0) {
            // This should ideally be caught by the main beforeEach in "Parser" describe,
            // but good to have a safeguard if this describe block is run in isolation.
            throw new Error("[Schema Integrity Check] window.GAMES is not available or empty. Cannot perform check.");
        }

        const dummyRawOutput = "dummy input for integrity check";
        let misconfiguredGames = [];

        window.GAMES.forEach(gameSchema => {
            if (gameSchema && gameSchema.id) {
                try {
                    // Check 1: Validate extractor regexes first
                    if (gameSchema.result_parsing_rules && gameSchema.result_parsing_rules.extractors) {
                        gameSchema.result_parsing_rules.extractors.forEach((extractor, extractorIndex) => {
                            if (!extractor.regex) {
                                misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor #${extractorIndex + 1} ('${extractor.name || 'Unnamed'}'): Missing regex string.`);
                            } else {
                                try {
                                    new RegExp(extractor.regex); // Try to compile it (flags don't matter much for syntax check here)
                                } catch (e) {
                                    misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor #${extractorIndex + 1} ('${extractor.name || 'Unnamed'}'): Invalid regex '${extractor.regex}'. Error: ${e.message}`);
                                }
                            }

                            // Check 2: Validate target_field_name in mappings
                            if (extractor.capture_groups_mapping) {
                                extractor.capture_groups_mapping.forEach((mapping, mappingIndex) => {
                                    if (!mapping.target_field_name || typeof mapping.target_field_name !== 'string' || mapping.target_field_name.trim() === '') {
                                        misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor '${extractor.name || 'Unnamed'}', Mapping #${mappingIndex + 1}: Missing or invalid target_field_name.`);
                                    }

                                    // Check 3: Validate group_index if applicable
                                    if (mapping.type !== 'count' && mapping.value === undefined) { // `value` is for booleans with explicit values
                                        if (mapping.group_index === undefined || typeof mapping.group_index !== 'number' || mapping.group_index < 0) {
                                            misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor '${extractor.name || 'Unnamed'}', Mapping '${mapping.target_field_name}': Missing or invalid group_index.`);
                                        }
                                    }

                                    // Check 4: Validate count_emojis if applicable
                                    if (mapping.type === 'count' && mapping.count_emojis !== undefined) {
                                        if (!Array.isArray(mapping.count_emojis) || !mapping.count_emojis.every(e => typeof e === 'string' && e.length > 0)) {
                                            misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor '${extractor.name || 'Unnamed'}', Mapping '${mapping.target_field_name}': count_emojis must be an array of non-empty strings.`);
                                        }
                                    }

                                    // Check 5: Validate enum configuration if applicable
                                    if (mapping.type === 'enum') {
                                        if (!mapping.values || typeof mapping.values !== 'object' || Array.isArray(mapping.values)) {
                                            misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor '${extractor.name || 'Unnamed'}', Mapping '${mapping.target_field_name}': type 'enum' requires a 'values' object.`);
                                        } else {
                                            for (const enumRegexKey in mapping.values) {
                                                try {
                                                    new RegExp(enumRegexKey);
                                                } catch (e) {
                                                    misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor '${extractor.name || 'Unnamed'}', Mapping '${mapping.target_field_name}': Invalid regex key '${enumRegexKey}' in enum values. Error: ${e.message}`);
                                                }
                                            }
                                        }
                                    }
                                });
                            } else {
                                misconfiguredGames.push(`Game ID '${gameSchema.id}', Extractor '${extractor.name || 'Unnamed'}': Missing capture_groups_mapping array.`);
                            }
                        });
                    } else {
                        // Allow schemas without result_parsing_rules or extractors (e.g. future game types)
                    }

                    // Attempt to parse dummy input to catch other errors like the CompletionState one
                    window.parser.parse(gameSchema.id, dummyRawOutput);

                } catch (e) {
                    if (e.message && e.message.startsWith("[PARSER CONFIG ERROR]") && e.message.includes("Defines boolean CompletionState extractors, but none have an explicit 'value: true' or 'value: false'")) {
                        // Avoid duplicating messages if already caught by specific checks, but this error is from the parser itself.
                        const specificErrorMsg = `Game ID '${gameSchema.id}': ${e.message}`;
                        if (!misconfiguredGames.some(msg => msg.startsWith(`Game ID '${gameSchema.id}':`) && msg.includes("CompletionState"))) {
                            misconfiguredGames.push(specificErrorMsg);
                        }
                    } else if (e.message && e.message.includes("Invalid regex")) {
                        // This is already caught by the explicit regex check above, so do nothing here to avoid duplicates.
                    } else {
                        // For other unexpected errors during parse, add them to the list.
                        misconfiguredGames.push(`Game ID '${gameSchema.id}' (Unexpected parsing error): ${e.message}`);
                    }
                }
            } else {
                console.warn("[Schema Integrity Check] Found a schema in window.GAMES without an id:", gameSchema);
            }
        });

        if (misconfiguredGames.length > 0) {
            // This will make the Jasmine test fail and list the misconfigured games.
            const errorMessage = "Found CompletionState misconfigurations in the following game schemas loaded for testing:\n" +
                misconfiguredGames.join("\n");
            throw new Error(errorMessage);
        }
        // If no misconfiguredGames were found, the test passes implicitly.
        expect(misconfiguredGames.length).toBe(0, "Expected no CompletionState boolean misconfigurations in loaded game schemas.");
    });
});

describe("Schema Merging", function () {
    beforeEach(function () {
        // Reset GAMES_DEFAULT and GAMES_LOCAL before each test
        window.GAMES_DEFAULT = [];
        window.GAMES_LOCAL = [];
        window.GAMES = [];
    });

    it("should merge stats from standard schema into local schema", function () {
        const standardSchema = {
            id: 'test-game',
            name: 'Test Game',
            stats: [
                { name: 'Wins', value: 10 },
                { name: 'Losses', value: 5 }
            ]
        };

        const localSchema = {
            id: 'test-game',
            name: 'Test Game',
            stats: [
                { name: 'Wins', value: 15 }  // Different value, should be preserved
            ]
        };

        window.GAMES_DEFAULT = [standardSchema];
        window.GAMES_LOCAL = [localSchema];

        // Trigger the merge
        window.GAMES = window.GAMES_LOCAL.map(localSchema => {
            const standardSchema = window.GAMES_DEFAULT.find(g => g.id === localSchema.id);
            return mergeStatsFromStandardImports(localSchema, standardSchema);
        });

        const mergedSchema = window.GAMES[0];
        expect(mergedSchema.stats.length).toBe(2);
        expect(mergedSchema.stats.find(s => s.name === 'Wins').value).toBe(15);  // Local value preserved
        expect(mergedSchema.stats.find(s => s.name === 'Losses').value).toBe(5); // Standard value added
    });

    it("should handle complex nested stat objects", function () {
        const standardSchema = {
            id: 'test-game',
            name: 'Test Game',
            stats: [
                {
                    name: 'Complex Stat',
                    value: {
                        total: 100,
                        details: {
                            wins: 80,
                            losses: 20
                        }
                    }
                }
            ]
        };

        const localSchema = {
            id: 'test-game',
            name: 'Test Game',
            stats: [
                {
                    name: 'Complex Stat',
                    value: {
                        total: 150,
                        details: {
                            wins: 120,
                            losses: 30
                        }
                    }
                }
            ]
        };

        window.GAMES_DEFAULT = [standardSchema];
        window.GAMES_LOCAL = [localSchema];

        window.GAMES = window.GAMES_LOCAL.map(localSchema => {
            const standardSchema = window.GAMES_DEFAULT.find(g => g.id === localSchema.id);
            return mergeStatsFromStandardImports(localSchema, standardSchema);
        });

        const mergedSchema = window.GAMES[0];
        expect(mergedSchema.stats.length).toBe(1);
        expect(mergedSchema.stats[0].value.total).toBe(150);  // Local value preserved
    });

    it("should preserve stat order from local schema", function () {
        const standardSchema = {
            id: 'test-game',
            name: 'Test Game',
            stats: [
                { name: 'Stat A', value: 1 },
                { name: 'Stat B', value: 2 },
                { name: 'Stat C', value: 3 }
            ]
        };

        const localSchema = {
            id: 'test-game',
            name: 'Test Game',
            stats: [
                { name: 'Stat B', value: 20 },
                { name: 'Stat A', value: 10 }
            ]
        };

        window.GAMES_DEFAULT = [standardSchema];
        window.GAMES_LOCAL = [localSchema];

        window.GAMES = window.GAMES_LOCAL.map(localSchema => {
            const standardSchema = window.GAMES_DEFAULT.find(g => g.id === localSchema.id);
            return mergeStatsFromStandardImports(localSchema, standardSchema);
        });

        const mergedSchema = window.GAMES[0];
        expect(mergedSchema.stats.length).toBe(3);
        expect(mergedSchema.stats[0].name).toBe('Stat B');  // Local order preserved
        expect(mergedSchema.stats[1].name).toBe('Stat A');  // Local order preserved
        expect(mergedSchema.stats[2].name).toBe('Stat C');  // New stat added at end
    });

    it("should handle edge cases", function () {
        const testCases = [
            {
                name: "null local schema",
                localSchema: null,
                standardSchema: { id: 'test', stats: [{ name: 'Stat', value: 1 }] },
                expected: null
            },
            {
                name: "undefined local schema",
                localSchema: undefined,
                standardSchema: { id: 'test', stats: [{ name: 'Stat', value: 1 }] },
                expected: undefined
            },
            {
                name: "mismatched IDs",
                localSchema: { id: 'local', stats: [{ name: 'Stat', value: 1 }] },
                standardSchema: { id: 'standard', stats: [{ name: 'Stat', value: 2 }] },
                expected: { id: 'local', stats: [{ name: 'Stat', value: 1 }] }
            },
            {
                name: "no stats in either schema",
                localSchema: { id: 'test', name: 'Test' },
                standardSchema: { id: 'test', name: 'Test' },
                expected: { id: 'test', name: 'Test' }
            }
        ];

        testCases.forEach(testCase => {
            const result = mergeStatsFromStandardImports(testCase.localSchema, testCase.standardSchema);
            expect(result).toEqual(testCase.expected, `Failed on test case: ${testCase.name}`);
        });
    });

    it("should not modify other schema properties", function () {
        const standardSchema = {
            id: 'test-game',
            name: 'Standard Game',
            url: 'https://standard.com',
            stats: [{ name: 'Stat', value: 1 }],
            result_parsing_rules: { extractors: [] }
        };

        const localSchema = {
            id: 'test-game',
            name: 'Local Game',
            url: 'https://local.com',
            stats: [{ name: 'Stat', value: 2 }],
            result_parsing_rules: { extractors: [] }
        };

        window.GAMES_DEFAULT = [standardSchema];
        window.GAMES_LOCAL = [localSchema];

        window.GAMES = window.GAMES_LOCAL.map(localSchema => {
            const standardSchema = window.GAMES_DEFAULT.find(g => g.id === localSchema.id);
            return mergeStatsFromStandardImports(localSchema, standardSchema);
        });

        const mergedSchema = window.GAMES[0];
        expect(mergedSchema.name).toBe('Local Game');  // Local name preserved
        expect(mergedSchema.url).toBe('https://local.com');  // Local URL preserved
        expect(mergedSchema.result_parsing_rules).toEqual(localSchema.result_parsing_rules);  // Local rules preserved
    });
}); 