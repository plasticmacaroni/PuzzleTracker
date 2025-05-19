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

The app uses a JSON format to define games and how to extract stats from their outputs. Here's how it works:

### Basic Game Setup

```json
{
  "id": "wordle",
  "name": "Wordle",
  "url": "https://www.nytimes.com/games/wordle/index.html"
}
```

Every game needs these three properties:

- `id`: A unique identifier (no spaces)
- `name`: Display name shown in the UI
- `url`: Link to play the game

### Tracking Game Results

To track stats, add `result_parsing_rules`. The app can track different types of data:

#### Parser Types

The parser supports several data types:

1. **number**: Extract a numeric value from text (e.g., "3/6" → 3)
2. **count**: Count occurrences of emojis or patterns
3. **boolean**: Check if a pattern exists (true/false)

#### Completion State

Games can have a success/failure state, which affects:

- Which results are included in averages
- Whether success rate is shown in charts

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

This example marks Wordle as successful if it contains a pattern like "3/6".

#### Parsing Numbers

To extract numeric values:

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

This extracts the number from patterns like "3/6" into an "Attempts" field.

#### Counting Emojis

To count occurrences:

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

This counts the red and green squares in game results.

### Game-Specific Examples

#### 1. Wordle (Success/Failure + Attempts)

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

- **Success**: Has a number followed by "/6"
- **Failure**: Contains "X/6"
- **Display**: Average attempts of successful games

#### 2. Framed (Visual Game With Attempts)

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

- **Success**: Contains at least one green square (🟩)
- **Failure**: No green squares
- **Tracking**: Counts red and green squares as attempts
- **Note**: Ignores unused attempts (grey/white squares)

#### 3. Scrandle (Score-Only Game)

```json
{
  "id": "scrandle",
  "name": "Scrandle",
  "url": "https://scrandle.com/",
  "result_parsing_rules": {
    "extractors": [
      {
        "name": "score",
        "regex": "(\\d+)/10",
        "capture_groups_mapping": [
          {
            "target_field_name": "Score",
            "group_index": 1,
            "type": "number"
          }
        ]
      }
    ]
  },
  "average_display": {
    "field": "Score",
    "template": "30-day avg: {avg}/10",
    "days": 30
  }
}
```

- **No Success/Failure**: Game doesn't have winning/losing concept
- **Score**: Tracks correct answers out of 10
- **Chart**: No success rate shown, only score trends

### Display Configuration

The `average_display` section controls how averages appear on game cards:

```json
"average_display": {
  "field": "Attempts",    // Field to average
  "template": "30-day avg: {avg}/6",  // Display format
  "days": 30              // Time period
}
```

### How Charts Work

- Games with `CompletionState` show success rate (percentage of games won)
- Statistics only include successful attempts in averages if there's a completion state
- Games without completion state show all metrics without success rate

### Adding New Games

To add a new game:

1. Copy an existing game's structure
2. Change the `id`, `name`, and `url`
3. Define `result_parsing_rules` appropriate for the game:
   - Include `completion_state` if the game has success/failure
   - Add extractors for any numeric values you want to track
   - Choose appropriate display template

This schema design ensures flexibility across different game types while maintaining consistent tracking.
