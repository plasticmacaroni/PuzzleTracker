# Daily GuessrTracker

A lightweight, browser-based tracker for your daily puzzle and trivia games. Keep track of your progress across multiple games, visualize your stats, and easily transfer your history between devices.

## Features

- 📊 Track multiple daily games in one place
- 📈 Visualize your progress over time with interactive charts
- 🎮 Quick access to game websites
- 📱 Mobile-friendly interface
- 💾 Local storage with import/export functionality
- 🎯 Custom parsing rules for different game outputs
- ✅ Mark games as completed for the day
- 📱 Responsive design that works on all devices

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Storage**: Browser's LocalStorage API
- **Charts**: Chart.js for data visualization
- **Styling**: Modern CSS with CSS Grid and Flexbox
- **No build tools required** - just open the HTML file in your browser!

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser
3. Start tracking your daily games!

## Usage

### Adding Game Results

1. Click the "Enter Stats" button for any game
2. Paste the game output (e.g., Wordle grid, score, etc.)
3. The app will automatically parse and store your results

### Viewing Stats

1. Click the "View Stats" button for any game
2. See your progress over time with interactive charts
3. Compare different metrics across days

### Transferring Data

1. Click "Export Data" to download your game history
2. On another device, click "Import Data" and select your exported file
3. Your game history will be restored

## Game Support

The app currently supports parsing results for:

- Wordle
- OEC Pick-5
- (More games can be added by extending the parsing rules)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your own daily game tracking needs!

## Schema

The app uses a JSON schema to define games and how to extract statistics from their outputs. Here's how it works:

### Basic Game Structure

```json
{
  "id": "wordle",
  "name": "Wordle",
  "url": "https://www.nytimes.com/games/wordle/index.html"
}
```

Every game must include:

- `id`: A unique identifier (no spaces)
- `name`: Display name shown in the UI
- `url`: Link to play the game

### Result Parsing Rules

To track stats, add a `result_parsing_rules` object with `extractors`:

```json
"result_parsing_rules": {
  "extractors": [
    {
      "name": "completion_state",
      "regex": "\\d/6",
      "capture_groups_mapping": [
        {
          "target_field_name": "CompletionState",
          "group_index": 0,
          "type": "boolean"
        }
      ]
    },
    {
      "name": "attempts",
      "regex": "(\\d)/6",
      "capture_groups_mapping": [
        {
          "target_field_name": "Attempts",
          "group_index": 1,
          "type": "number"
        }
      ]
    }
  ]
}
```

#### Parser Types

The app supports these data types for `capture_groups_mapping` entries:

1.  **`number`**: Extracts numeric values from text. The extracted value (from `group_index` or the full match of the extractor's `regex` if `group_index` is omitted) is parsed into a floating-point number. Commas are removed before parsing.

    ```json
    {
      "name": "attempts_parser", // Extractor name
      "regex": "Attempts: (\\\\d+)", // Main regex for the extractor
      "capture_groups_mapping": [
        {
          "target_field_name": "Attempts", // Field to store the result
          "group_index": 1, // Use the first captured group from "regex"
          "type": "number"
        }
      ]
    }
    ```

2.  **`boolean`**: Determines a true/false value. Its behavior depends on whether it's used for the special `CompletionState` field or a regular field.

    - **For `CompletionState` field:**

      - The mapping **must** include an explicit `value: true` or `value: false` property.
      - The `parser.js` will look for all `CompletionState` boolean extractors.
      - If an extractor's `regex` matches and its mapping has `value: true`, it's a "success pattern."
      - If an extractor's `regex` matches and its mapping has `value: false`, it's a "failure pattern."
      - `CompletionState` is then determined as follows:
        - If both success and failure patterns are defined: `true` if a success pattern matches, `false` if a failure pattern matches. If neither matches, `CompletionState` is `undefined`.
        - If only success patterns are defined: `true` if a success pattern matches, otherwise `false`.
        - If only failure patterns are defined: `false` if a failure pattern matches, otherwise `true`.
        - If no `CompletionState` boolean extractors are defined, `CompletionState` remains `undefined` from parsing.
      - The `group_index` property is typically not needed for `CompletionState` boolean mappings, as the match of the extractor's `regex` itself is the condition.

      ```json
      // Example: Wordle-like success
      {
        "name": "wordle_success_state",
        "regex": "\\\\b[1-6]/6\\\\b", // e.g., "3/6"
        "capture_groups_mapping": [
          {
            "target_field_name": "CompletionState",
            "type": "boolean",
            "value": true // Explicitly true on match
          }
        ]
      },
      // Example: Wordle-like failure
      {
        "name": "wordle_failure_state",
        "regex": "\\\\bX/6\\\\b", // e.g., "X/6"
        "capture_groups_mapping": [
          {
            "target_field_name": "CompletionState",
            "type": "boolean",
            "value": false // Explicitly false on match
          }
        ]
      }
      ```

    - **For other boolean fields (not `CompletionState`):**

      - If the main extractor's `regex` matches:
        - If the mapping includes an explicit `value: true` or `value: false`, that value is used.
        - If the mapping does _not_ include an explicit `value` property, the result defaults to `true`.
      - If the main extractor's `regex` does not match, the field is not set (remains undefined).

      ```json
      {
        "name": "feature_active_parser",
        "regex": "Feature: ENABLED", // Main regex for the extractor
        "capture_groups_mapping": [
          {
            "target_field_name": "IsFeatureActive",
            // "group_index" could be used if checking a part of the match
            "type": "boolean"
            // Defaults to true if "Feature: ENABLED" is found
            // Or, add "value: true" for clarity, or "value: some_condition" if needed
          }
        ]
      }
      ```

3.  **`count`**: Counts occurrences of patterns.

    - If `count_emojis` (an array of strings/emojis) is provided in the mapping:
      - It counts all occurrences of each specified emoji/string globally within the entire raw output.
      - The extractor's main `regex` is _not_ used for counting in this case.
    - If `count_emojis` is _not_ provided:
      - It counts all global occurrences of the extractor's main `regex` pattern within the entire raw output (using a global flag `g` and Unicode flag `u`).
    - The `group_index` property is not used for `count` type.

    ```json
    // Example: Counting specific emojis
    {
      "name": "reaction_counter",
      "regex": "Reactions:", // This regex is informational if count_emojis is used
      "capture_groups_mapping": [
        {
          "target_field_name": "ThumbsUpCount",
          "type": "count",
          "count_emojis": ["👍", "👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿"]
        }
      ]
    }
    ```

    ```json
    // Example: Counting regex pattern matches
    {
      "name": "mistake_counter",
      "regex": "Mistake Found", // This regex IS used for counting
      "capture_groups_mapping": [
        {
          "target_field_name": "TotalMistakes",
          "type": "count"
          // Counts occurrences of "Mistake Found"
        }
      ]
    }
    ```

**Important Notes on Extractor Logic:**

- For all mapping types **except `count`**, the main `regex` of the extractor **must match** somewhere in the raw output for its `capture_groups_mapping` to be processed. If the extractor's `regex` doesn't match, the fields defined in its mapping will not be set.
- For `count` type, the counting happens globally on the raw output, either based on `count_emojis` or the extractor's `regex`.

### Display Configuration

The `average_display` property controls how averages are shown on game cards:

```json
"average_display": {
  "field": "Attempts",
  "template": "30-day avg: {avg}/6",
  "days": 30
}
```

- `field`: The statistic to average
- `template`: Format string with `{avg}` placeholder
- `days`: Number of days to include in the average

### Complete Game Example

Here's a full example for Wordle, reflecting the detailed `CompletionState` logic:

```json
{
  "id": "wordle",
  "name": "Wordle",
  "url": "https://www.nytimes.com/games/wordle/index.html",
  "result_parsing_rules": {
    "extractors": [
      {
        "name": "completion_state_success",
        "regex": "\\\\b[1-6]/6\\\\b", // Matches "X/6" where X is 1-6
        "capture_groups_mapping": [
          {
            "target_field_name": "CompletionState",
            "type": "boolean",
            "value": true
          }
        ]
      },
      {
        "name": "completion_state_failure",
        "regex": "\\\\bX/6\\\\b", // Matches "X/6" (loss)
        "capture_groups_mapping": [
          {
            "target_field_name": "CompletionState",
            "type": "boolean",
            "value": false
          }
        ]
      },
      {
        "name": "attempts_parser",
        "regex": "\\\\b(\\\\d)/6\\\\b", // Captures the number of attempts if not X/6
        "capture_groups_mapping": [
          {
            "target_field_name": "Attempts",
            "group_index": 1,
            "type": "number"
          }
        ]
      }
    ]
  },
  "average_display": {
    "field": "Attempts",
    "template": "30-day avg: {avg}/6",
    "days": 30
  }
}
```

And for a game with emoji counting (like Framed):

```json
{
  "id": "framed",
  "name": "Framed",
  "url": "https://framed.wtf",
  "result_parsing_rules": {
    "extractors": [
      {
        "name": "completion_state_success_green_square",
        "regex": "🟩", // Green square indicates a successful guess/completion
        "capture_groups_mapping": [
          {
            "target_field_name": "CompletionState",
            // "group_index": 0, // Not strictly needed if just checking regex match
            "type": "boolean",
            "value": true
          }
        ]
      },
      {
        "name": "tries_counter_emojis",
        // This regex is mainly for context if count_emojis is used,
        // but it could also be a broader pattern that contains the emojis.
        "regex": "Framed #\\\\d+",
        "capture_groups_mapping": [
          {
            "target_field_name": "Tries",
            "type": "count",
            "count_emojis": ["🟥", "🟩"] // Counts red and green squares
          }
        ]
      }
    ]
  },
  "average_display": {
    "field": "Tries",
    "template": "30-day avg: {avg} tries",
    "days": 30
  }
}
```

### Adding New Games

To add a new game:

1. Understand the game's output format
2. Create the basic structure with id, name, and url
3. Define extractors that match patterns in the game output
4. Add an average_display configuration if needed

Games without parsing rules will still appear but won't track statistics.
