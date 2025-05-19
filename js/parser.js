class Parser {
    parse(gameId, rawOutput) {
        const game = GAMES.find(g => g.id === gameId);
        if (!game || !game.result_parsing_rules) {
            return {};
        }

        const result = {};

        // Check if there's a completion state extractor
        const hasCompletionState = game.result_parsing_rules.extractors.some(
            e => e.capture_groups_mapping.some(m => m.target_field_name === "CompletionState")
        );

        // Only add default CompletionState if there's a completion state extractor defined
        // Games without completion state concept won't have this field at all

        game.result_parsing_rules.extractors.forEach(extractor => {
            const regex = new RegExp(extractor.regex);
            const match = rawOutput.match(regex);

            extractor.capture_groups_mapping.forEach(mapping => {
                let value;

                if (match) {
                    value = match[mapping.group_index];

                    switch (mapping.type) {
                        case 'number':
                            value = parseFloat(value);
                            break;
                        case 'count':
                            if (mapping.count_emojis) {
                                value = mapping.count_emojis.reduce((count, emoji) => {
                                    return count + (rawOutput.match(new RegExp(emoji, 'g')) || []).length;
                                }, 0);
                            } else {
                                value = (rawOutput.match(new RegExp(value, 'g')) || []).length;
                            }
                            break;
                        case 'enum':
                            for (const [pattern, enumValue] of Object.entries(mapping.values)) {
                                if (new RegExp(pattern).test(value)) {
                                    value = enumValue;
                                    break;
                                }
                            }
                            break;
                        case 'boolean':
                            value = true;
                            break;
                    }
                } else if (mapping.type === 'boolean') {
                    value = false;
                }

                if (value !== undefined) {
                    result[mapping.target_field_name] = value;
                }
            });
        });

        return result;
    }
}

// Create a global instance
const parser = new Parser(); 