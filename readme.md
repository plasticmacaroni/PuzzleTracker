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

The app supports these data types:

1. **boolean**: Checks if a pattern exists (returns true/false)

   ```json
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
   }
   ```

2. **number**: Extracts numeric values from text (e.g., "3/6" → 3)

   ```json
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
   ```

3. **count**: Counts occurrences of specific patterns or emojis
   ```json
   {
     "name": "tries",
     "regex": "🎮",
     "capture_groups_mapping": [
       {
         "target_field_name": "Tries",
         "group_index": 0,
         "type": "count",
         "count_emojis": ["🟥", "🟩"]
       }
     ]
   }
   ```

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

Here's a full example for Wordle:

```json
{
  "id": "wordle",
  "name": "Wordle",
  "url": "https://www.nytimes.com/games/wordle/index.html",
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
        "name": "completion_state",
        "regex": "🟩",
        "capture_groups_mapping": [
          {
            "target_field_name": "CompletionState",
            "group_index": 0,
            "type": "boolean"
          }
        ]
      },
      {
        "name": "tries",
        "regex": "🎥",
        "capture_groups_mapping": [
          {
            "target_field_name": "Tries",
            "group_index": 0,
            "type": "count",
            "count_emojis": ["🟥", "🟩"]
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
