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
            if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) { // Check should ideally be caught by main beforeEach
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
            // console.log(`[parser.spec.js] Configured to use live schema '${liveSchemaId}' as '${gameId}' for NYT Connections tests.`);
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
            // console.log(`[parser.spec.js] Configured to use live schema '${liveSchemaId}' as '${gameId}' for Wordle tests.`);
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
            // console.log(`[parser.spec.js] Configured to use live schema '${liveSchemaId}' as '${gameId}' for Costcodle tests.`);
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