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
        let completionStateValue = undefined; // Initialize CompletionState

        // Identify success and failure patterns for CompletionState
        const completionStateExtractors = game.result_parsing_rules.extractors.filter(
            e => e.capture_groups_mapping.some(m => m.target_field_name === "CompletionState" && m.type === "boolean")
        );

        const successPatterns = [];
        const failurePatterns = [];

        completionStateExtractors.forEach(extractor => {
            extractor.capture_groups_mapping.forEach(mapping => {
                if (mapping.target_field_name === "CompletionState" && mapping.type === "boolean") {
                    if (mapping.value === true) {
                        successPatterns.push(new RegExp(extractor.regex, 'su'));
                    } else if (mapping.value === false) {
                        failurePatterns.push(new RegExp(extractor.regex, 'su'));
                    }
                }
            });
        });

        // New error check for misconfigured CompletionState schema
        if (completionStateExtractors.length > 0 && successPatterns.length === 0 && failurePatterns.length === 0) {
            throw new Error(`[PARSER CONFIG ERROR] Game ${gameId}: Defines boolean CompletionState extractors, but none have an explicit 'value: true' or 'value: false' mapping. Parser requires explicit values for new CompletionState logic.`);
        }

        // Process all other extractors (non-CompletionState or non-boolean CompletionState)
        game.result_parsing_rules.extractors.forEach(extractor => {
            const mainRegex = new RegExp(extractor.regex, 's'); // For general extraction
            const mainMatch = mainRegex.exec(rawOutput);      // Main match attempt

            extractor.capture_groups_mapping.forEach(mapping => {
                let value; // Remains undefined if no logic below assigns it

                if (mapping.type === 'count') {
                    if (mapping.count_emojis) {
                        // Emoji counting is independent of mainMatch
                        if (Array.isArray(mapping.count_emojis) && mapping.count_emojis.length > 0) {
                            value = mapping.count_emojis.reduce((count, emoji) => {
                                const escapedEmoji = String(emoji).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                return count + (rawOutput.match(new RegExp(escapedEmoji, 'gu')) || []).length;
                            }, 0);
                        } else {
                            value = 0;
                        }
                    } else {
                        // Regex-based count is also independent of mainMatch, uses extractor.regex globally
                        const countRegexStr = extractor.regex; // Get the regex string from the schema
                        const countRegex = new RegExp(countRegexStr, 'gu'); // Added 'u' flag for Unicode correctness
                        const matches = rawOutput.match(countRegex);
                        value = matches ? matches.length : 0; // Ensures 0 if no matches
                    }
                    // Optional transform for count results
                    if (mapping.transform) {
                        try {
                            const fn = new Function('value', 'rawOutput', `return (${mapping.transform});`);
                            value = fn(value, rawOutput);
                        } catch (e) {
                            console.warn(`[PARSER TRANSFORM ERROR] ${gameId} count mapping transform failed:`, e);
                        }
                    }
                } else if (mainMatch) {
                    // For all other types, we proceed only if the main extractor regex matched something
                    if (mapping.value !== undefined && mapping.type === 'boolean') {
                        value = mapping.value;
                    } else if (mapping.group_index !== undefined) {
                        value = mainMatch[mapping.group_index];
                        if (value === undefined) {
                            console.error(`[PARSER ERROR] Regex matched but group_index ${mapping.group_index} not found in match for ${gameId}. Match:`, mainMatch);
                        }
                    } else {
                        value = mainMatch[0]; // Default to full match
                    }

                    if (value !== undefined) {
                        switch (mapping.type) {
                            case 'number':
                                // Apply optional transform before numeric coercion
                                if (mapping.transform) {
                                    try {
                                        const fn = new Function('value', 'capture_groups', 'rawOutput', `return (${mapping.transform});`);
                                        value = fn(value, mainMatch, rawOutput);
                                    } catch (e) {
                                        console.warn(`[PARSER TRANSFORM ERROR] ${gameId} mapping transform failed:`, e);
                                    }
                                }
                                value = parseFloat(String(value).replace(/,/g, ''));
                                break;
                            // 'count' is handled above
                            case 'boolean': // For non-CompletionState booleans
                                if (mapping.value === undefined) { // If no explicit value, mainMatch itself means true
                                    value = true;
                                } // else mapping.value was already assigned
                                break;
                        }
                    }
                }
                // If not a 'count' type and mainMatch was null, 'value' remains undefined.

                // Set the result field if a value was determined
                if (value !== undefined) {
                    if (!(mapping.target_field_name === "CompletionState" && mapping.type === "boolean")) {
                        result[mapping.target_field_name] = value;
                    }
                }
            });
        });

        // Apply new CompletionState logic
        const hasSuccessPatterns = successPatterns.length > 0;
        const hasFailurePatterns = failurePatterns.length > 0;

        let successMatch = false;
        let failureMatch = false;

        if (hasSuccessPatterns) {
            successMatch = successPatterns.some(pattern => {
                const isMatch = pattern.test(rawOutput);
                return isMatch;
            });
        }
        if (hasFailurePatterns) {
            failureMatch = failurePatterns.some(pattern => pattern.test(rawOutput));
        }

        // if (gameId === 'wordle') {
        //     console.log(`[Parser Debug wordle] hasSuccessPatterns: ${hasSuccessPatterns}, successMatch: ${successMatch}`);
        //     console.log(`[Parser Debug wordle] successPatterns:`, successPatterns.map(p=>p.source));
        //     console.log(`[Parser Debug wordle] hasFailurePatterns: ${hasFailurePatterns}, failureMatch: ${failureMatch}`);
        //     console.log(`[Parser Debug wordle] failurePatterns:`, failurePatterns.map(p=>p.source));
        //     console.log(`[Parser Debug wordle] Raw output (first 30 chars): "${rawOutput.substring(0, 30)}"`);
        // }

        if (hasSuccessPatterns && hasFailurePatterns) { // Both success and failure patterns defined
            if (successMatch) {
                completionStateValue = true;
            } else if (failureMatch) {
                completionStateValue = false;
            } else {
                // Error case: Both defined, but neither found.
                console.warn(`[PARSER WARNING] Game ${gameId}: Both success and failure patterns for CompletionState are defined, but neither was found in the output. CompletionState will be undefined. Raw output:`, rawOutput);
                // As per user, completionState is undefined if neither found.
                completionStateValue = undefined;
            }
        } else if (hasSuccessPatterns) { // Only success patterns defined
            if (successMatch) {
                completionStateValue = true;
            } else {
                completionStateValue = false; // Single not found = opposite of defined
            }
        } else if (hasFailurePatterns) { // Only failure patterns defined
            if (failureMatch) {
                completionStateValue = false;
            } else {
                completionStateValue = true; // Single not found = opposite of defined
            }
        }
        // If neither success nor failure patterns are defined (hasSuccessPatterns and hasFailurePatterns are false),
        // completionStateValue remains undefined, which is the correct "Not Present" logic.

        if (completionStateValue !== undefined) {
            result["CompletionState"] = completionStateValue;
        }

        // Ensure that if a game schema explicitly defines a CompletionState extractor,
        // the result should have a CompletionState field, even if it's undefined due to no match.
        // This handles the "Not present = completionstate undefined" when patterns ARE defined but don't match in a "Both" scenario.
        // const gameDefinesCompletionState = game.result_parsing_rules.extractors.some(
        //     e => e.capture_groups_mapping.some(m => m.target_field_name === "CompletionState")
        // );
        // if (gameDefinesCompletionState && !result.hasOwnProperty("CompletionState")) {
        //     // If patterns were defined (success or failure or both) but didn't lead to a true/false,
        //     // and it's not already set (e.g. from the "Both" neither found case), set to undefined.
        //     // The current logic sets it to undefined in the "Both" but "neither found" case,
        //     // and for "Not Present" (no patterns) it remains undefined.
        //     // The "Single not found" sets it to opposite, so it's defined.
        //     // This explicit check might be redundant if all paths correctly set or leave `completionStateValue` as undefined.
        //     // Let's refine the logic: if any completion state pattern was defined and completionStateValue is still undefined, it should be explicitly undefined in result.
        //     if ((hasSuccessPatterns || hasFailurePatterns) && completionStateValue === undefined) {
        //         result["CompletionState"] = undefined;
        //     }
        // }


        return result;
    }
}

// Create a global instance
window.parser = new Parser(); 