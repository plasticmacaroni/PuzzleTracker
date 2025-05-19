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

The app uses a simple JSON format to define games and how to extract stats from their outputs. Here's how it works:

### Basic Game Setup

```json
{
  "id": "wordle",
  "name": "Wordle",
  "url": "https://www.nytimes.com/games/wordle/index.html"
}
```

Every game needs these three things:

- `id`: A short name for the game (no spaces)
- `name`: What players see in the app
- `url`: Where to play the game

### Adding Stats Tracking

To track stats, add `result_parsing_rules`. Here's how to track different types of stats:

#### 1. Numbers from Text

To get a number from text (like "3/6" from Wordle):

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

This looks for a pattern like "3/6" and extracts the number before the slash.

#### 2. Counting Emojis

To count how many times an emoji appears (like counting green squares in Wordle):

```json
{
  "name": "green_tiles",
  "regex": "🟩",
  "capture_groups_mapping": [
    {
      "target_field_name": "Green Tiles",
      "group_index": 0,
      "type": "count"
    }
  ]
}
```

This counts how many times 🟩 appears in the output.

### Complete Example

Here's a complete example for Wordle that tracks:

- Number of attempts (e.g., "3/6")
- Number of green squares (🟩)
- Number of yellow squares (🟨)
- Number of black squares (⬛)

```json
[
  {
    "id": "wordle",
    "name": "Wordle",
    "url": "https://www.nytimes.com/games/wordle/index.html",
    "result_parsing_rules": {
      "extractors": [
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
        },
        {
          "name": "green_tiles",
          "regex": "🟩",
          "capture_groups_mapping": [
            {
              "target_field_name": "Green Tiles",
              "group_index": 0,
              "type": "count"
            }
          ]
        },
        {
          "name": "yellow_tiles",
          "regex": "🟨",
          "capture_groups_mapping": [
            {
              "target_field_name": "Yellow Tiles",
              "group_index": 0,
              "type": "count"
            }
          ]
        },
        {
          "name": "black_tiles",
          "regex": "⬛",
          "capture_groups_mapping": [
            {
              "target_field_name": "Black Tiles",
              "group_index": 0,
              "type": "count"
            }
          ]
        }
      ]
    }
  }
]
```

### Adding a New Game

To add a new game:

1. Copy an existing game's structure
2. Change the `id`, `name`, and `url`
3. Add `result_parsing_rules` if you want to track stats
4. For each stat you want to track:
   - If it's a number in text, use `type: "number"`
   - If it's counting emojis or symbols, use `type: "count"`
