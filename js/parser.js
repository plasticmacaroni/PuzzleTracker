class Parser {
    parse(gameId, rawOutput) {
        // Check if GAMES exists in window (global scope)
        if (typeof window.GAMES === 'undefined') {
            console.warn("GAMES variable not found, returning empty result");
            return {};
        }

        const game = window.GAMES.find(g => g.id === gameId);
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
            // Use the 's' flag to make dot match newlines 
            const regex = new RegExp(extractor.regex, 's');

            // Execute the regex - this properly captures groups
            const match = regex.exec(rawOutput);

            extractor.capture_groups_mapping.forEach(mapping => {
                let value;

                if (match) {
                    // For explicit value mappings, use the provided value
                    if (mapping.value !== undefined && mapping.type === 'boolean') {
                        value = mapping.value;
                    }
                    // Otherwise use the capture group if specified
                    else if (mapping.group_index !== undefined) {
                        value = match[mapping.group_index];

                        // Check for undefined value when using group_index but no match at that index
                        if (value === undefined) {
                            console.error(`[PARSER ERROR] Regex matched but group_index ${mapping.group_index} not found in match for ${gameId}. Match:`, match);
                        }
                    }
                    // If no group index and no explicit value, use the whole match
                    else {
                        value = match[0];
                    }

                    if (value !== undefined) {
                        switch (mapping.type) {
                            case 'number':
                                // Always remove commas before parsing any number
                                value = parseFloat(value.replace(/,/g, ''));
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
                                // Use explicit value if provided, otherwise default to true
                                if (mapping.value === undefined) {
                                    value = true;
                                }
                                break;
                        }
                    }
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
window.parser = new Parser(); 