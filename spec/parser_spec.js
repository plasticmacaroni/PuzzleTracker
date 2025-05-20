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