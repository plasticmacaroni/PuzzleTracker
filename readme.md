# PuzzleTracker

A calm, private tracker for daily puzzle and trivia games. Copy the share text from any game, paste it anywhere on the page, and PuzzleTracker figures out which game it came from and keeps your streaks, solve rate, averages and history.

Everything stays in your browser. There are no accounts and no server.

## Using it

- **Today**: your games, split into *Up next* and *Done today*, with a progress bar. **Play** opens the game in a new tab; when you come back, the page offers to log your result.
- **Paste anywhere**: press Ctrl+V (⌘V on Mac) anywhere on the page, or tap **Paste a result** on a phone. You confirm the detected game and day before it's saved.
- **Game details**: tap a game for its stats (played, solved %, streaks, average), a distribution or trend chart, a paste box, and editable history.
- **Manage games**: choose and order your games, or create your own.
- **Profiles**: each profile has its own results and game list (custom games and the theme are shared). Switch or add profiles from the badge in the top bar.
- **Backups**: *Back up* downloads one JSON file with the profiles you pick. *Restore* first shows each profile in the file, its dates, and how many results you don't have yet, then merges the ones you choose into a profile here or adds them as new profiles. It never overwrites a result you have locally.

## Tracking rules

Each game has tracking rules made of plain data (no code), edited with the visual builder (*Edit tracking rules* on any game, or *Create a game*). The builder shows every block's value against an example result as you build.

**Patterns** are plain text with four placeholders. Capital letters, extra spaces, emoji variation selectors and zero-width characters don't matter.

| Placeholder | Matches |
|---|---|
| `{number}` | a number in any common format: `4`, `1,569`, `7.564`, `92.5` (captured) |
| `{time}` | a time like `0:58` or `1:02:03` (captured as seconds) |
| `{skip}` | any text, as little as possible |
| `{line}` | the rest of the current line |

**Five blocks** cover everything:

| Block | Does | Example |
|---|---|---|
| Find | the first matching pattern's captured value | `{ "find": ["Wordle {number} {number}/6"], "take": 2 }` |
| Count | how many times patterns appear | `{ "count": ["🟥", "🟩"] }` |
| Has | yes/no: does the text contain any, all, or none of them | `{ "has": ["Game Over"], "mode": "none" }` |
| Math | `+ - * /` or a comparison `= != < <= > >=` | `{ "math": [7, "-", { "stat": "Guesses" }] }` |
| If | picks a value | `{ "if": { "has": ["X/5"] }, "then": 0, "else": { "find": ["{number}/5"] } }` |

Any slot can also hold a number or `{ "stat": "Name" }` (a stat defined above it). A game can also set `within` (*Only look at* in the builder): patterns for the part of a paste it reads, for shares that hold several games or modes. Gamedle's "all dailies" share, for example, logs all four Gamedle modes from one paste. A yes/no stat named **Solved** powers the solve rate and marks misses. The *main stat* is shown on the home screen and charted.

A complete game:

```json
{
  "id": "wordle",
  "name": "Wordle",
  "url": "https://www.nytimes.com/games/wordle/index.html",
  "tracking": {
    "detect": ["Wordle {number}"],
    "stats": [
      { "name": "Solved", "is": { "has": ["{number}/6"] }, "show": "yesno" },
      { "name": "Guesses", "is": { "find": ["{number}/6"] }, "better": "lower", "max": 6 }
    ],
    "headline": "Guesses"
  }
}
```

Rules are validated when loaded (unknown keys, blocks, placeholders and non-http links are refused) and evaluated by a small interpreter in `js/rules.js`. Patterns are escaped literal text, never raw regular expressions, and results are stored as the original share text, so fixing a rule fixes your whole history.

## Development

No build step. Serve the folder and open it:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

Run the tests (Node 20+):

```sh
node --test
```

`tests/games.test.js` checks every built-in game against real share texts; add an example there whenever a game's format changes.

| File | Purpose |
|---|---|
| `js/rules.js` | pattern matching, the five blocks, validation |
| `js/games.js` | built-in games and their rules |
| `js/stats.js` | streaks, averages, distributions |
| `js/store.js` | localStorage, profiles, migration from older versions, backup merge |
| `js/app.js` | home, paste-anywhere, game details, manage games |
| `js/builder.js` | the visual rule builder |
| `js/profiles.js` | profile switcher, backup and restore screens |

## License

MIT
