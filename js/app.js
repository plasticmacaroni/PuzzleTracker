// Game configuration
const GAMES = [
    {
        id: 'wordle',
        name: 'Wordle',
        url: 'https://www.nytimes.com/games/wordle/index.html',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "\\d/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "attempts",
                    regex: "(\\d)/6",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Attempts",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Attempts",
            template: "30-day avg: {avg}/6",
            days: 30
        }
    },
    {
        id: 'oec-pick-5',
        name: 'OEC Pick-5',
        url: 'https://oec.world/en/games/pick-5',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "\\d/5",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "percentage",
                    regex: "(\\d+\\.\\d+)%",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Percentage",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                },
                {
                    name: "correct_guesses",
                    regex: "(\\d)/5",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Correct Guesses",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Percentage",
            template: "30-day avg: {avg}%",
            days: 30
        }
    },
    {
        id: 'pokedoku',
        name: 'PokeDoku',
        url: 'https://pokedoku.com'
    },
    {
        id: 'framed',
        name: 'Framed',
        url: 'https://framed.wtf',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🎥",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'daily-dozen-trivia',
        name: 'Daily Dozen Trivia',
        url: 'https://dailydozentrivia.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "Score: (\\d+)",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                },
                {
                    name: "correct",
                    regex: "(\\d+) Correct",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Correct",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg} pts",
            days: 30
        }
    },
    {
        id: 'nyt-connections',
        name: 'NYT Connections',
        url: 'https://www.nytimes.com/games/connections'
    },
    {
        id: 'globle',
        name: 'Globle',
        url: 'https://globle-game.com'
    },
    {
        id: 'box-office-game',
        name: 'Box Office Game',
        url: 'https://boxofficega.me'
    },
    {
        id: 'costcodle',
        name: 'Costcodle',
        url: 'https://costcodle.com'
    },
    {
        id: 'movie-to-movie',
        name: 'Movie to Movie',
        url: 'https://movietomovie.com'
    },
    {
        id: 'guessthe-game',
        name: 'GuessThe.Game',
        url: 'https://guessthe.game',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🎮",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'gamedle',
        name: 'Gamedle',
        url: 'https://gamedle.wtf',
        result_parsing_rules: {
            extractors: [
                {
                    name: "completion_state",
                    regex: "🟩",
                    capture_groups_mapping: [
                        {
                            target_field_name: "CompletionState",
                            group_index: 0,
                            type: "boolean"
                        }
                    ]
                },
                {
                    name: "tries",
                    regex: "🕹️",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Tries",
                            group_index: 0,
                            type: "count",
                            count_emojis: ["🟥", "🟨", "🟩"]
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Tries",
            template: "30-day avg: {avg} tries",
            days: 30
        }
    },
    {
        id: 'puckdoku',
        name: 'Puckdoku',
        url: 'https://puckdoku.com'
    },
    {
        id: 'moviegrid',
        name: 'MovieGrid.io',
        url: 'https://moviegrid.io'
    },
    {
        id: 'spellcheck-game',
        name: 'Spellcheck Game',
        url: 'https://spellcheckgame.com/'
    },
    {
        id: 'foodguessr',
        name: 'FoodGuessr',
        url: 'https://foodguessr.com'
    },
    {
        id: 'thrice',
        name: 'Thrice',
        url: 'https://thrice.geekswhodrink.com',
        result_parsing_rules: {
            extractors: [
                {
                    name: "points",
                    regex: "(\\d+) points",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Points",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Points",
            template: "30-day avg: {avg}/15",
            days: 30
        }
    },
    {
        id: 'relatle',
        name: 'Relatle.io',
        url: 'https://relatle.io/'
    },
    {
        id: 'disorderly',
        name: 'Disorderly',
        url: 'https://playdisorderly.com/'
    },
    {
        id: 'harmonies',
        name: 'Harmonies',
        url: 'https://harmonies.io'
    },
    {
        id: 'bandle',
        name: 'Bandle',
        url: 'https://bandle.app'
    },
    {
        id: 'juxtastat',
        name: 'Juxtastat',
        url: 'https://urbanstats.org/quiz.html'
    },
    {
        id: 'scrandle',
        name: 'Scrandle',
        url: 'https://scrandle.com/',
        result_parsing_rules: {
            extractors: [
                {
                    name: "score",
                    regex: "(\\d+)/10",
                    capture_groups_mapping: [
                        {
                            target_field_name: "Score",
                            group_index: 1,
                            type: "number"
                        }
                    ]
                }
            ]
        },
        average_display: {
            field: "Score",
            template: "30-day avg: {avg}/10",
            days: 30
        }
    },
    {
        id: 'starwars-guessr',
        name: 'Star Wars Guessr',
        url: 'https://starwarsguessr.com/'
    }
];

class App {
    constructor() {
        this.currentGameId = null;
        this.initializeEventListeners();
        this.startCardPolling();
        this.initializeToastContainer();
    }

    initializeToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    showToast(title, message, type = 'info', duration = 5000) {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    }

    removeToast(toast) {
        if (toast.classList.contains('removing')) return;

        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }

    // Apply styling to a game card
    applyGameStyling(card, game) {
        try {
            // Extract domain for favicon
            const domain = new URL(game.url).hostname;

            // Create consistent favicon container
            const iconWrapper = card.querySelector('.card-icon-wrapper');
            iconWrapper.style.width = '48px';
            iconWrapper.style.height = '48px';
            iconWrapper.style.display = 'flex';
            iconWrapper.style.justifyContent = 'center';
            iconWrapper.style.alignItems = 'center';
            iconWrapper.style.overflow = 'hidden';

            // Generate direct colors for fallback instead of using string hash
            const initialColors = {
                primary: chroma.random().desaturate(0.5).hex(),
                background: '#f0f0f0',
                darkBackground: '#222222',
                lightModeText: '#000000',
                darkModeText: '#ffffff'
            };

            // Apply initial colors
            card.style.borderColor = initialColors.primary;
            card.style.backgroundColor = initialColors.background;

            // Set data attributes for colors
            card.dataset.primaryColor = initialColors.primary;
            card.dataset.lightBackground = initialColors.background;
            card.dataset.darkBackground = initialColors.darkBackground;
            card.dataset.lightModeText = initialColors.lightModeText;
            card.dataset.darkModeText = initialColors.darkModeText;

            // Apply initial colors
            this.applyCardColors(card);

            // Start with fallback icon
            this.createFallbackIcon(card, game);

            // Try to load the favicon 
            this.loadFavicon(card, game, domain);

        } catch (error) {
            console.error(`Error styling card for ${game.name}:`, error);
            this.createFallbackIcon(card, game);
        }
    }

    // Create a simple fallback icon when an image can't be loaded
    createFallbackIcon(card, game) {
        try {
            // Clear current content
            const iconWrapper = card.querySelector('.card-icon-wrapper');
            while (iconWrapper && iconWrapper.firstChild) {
                iconWrapper.removeChild(iconWrapper.firstChild);
            }

            // Create a simple colored circle with the first letter
            const iconDiv = document.createElement('div');
            iconDiv.className = 'fallback-icon';
            iconDiv.style.width = '48px';
            iconDiv.style.height = '48px';
            iconDiv.style.borderRadius = '50%';
            iconDiv.style.backgroundColor = card.dataset.primaryColor || '#cccccc';
            iconDiv.style.display = 'flex';
            iconDiv.style.justifyContent = 'center';
            iconDiv.style.alignItems = 'center';
            iconDiv.style.fontWeight = 'bold';
            iconDiv.style.fontSize = '24px';
            iconDiv.style.color = '#ffffff';
            iconDiv.textContent = game.name.charAt(0).toUpperCase();

            if (iconWrapper) {
                iconWrapper.appendChild(iconDiv);
            }
        } catch (e) {
            console.error(`Error creating fallback icon for ${game.name}:`, e);
        }
    }

    // Load favicon and extract colors
    loadFavicon(card, game, domain) {
        // Check if we have a cached favicon
        const cachedFavicon = localStorage.getItem(`favicon_data_${domain}`);
        if (cachedFavicon) {
            // Display cached favicon
            this.displayFavicon(card, cachedFavicon, game);

            // Extract colors from cached favicon
            this.extractColorsWithVibrant(cachedFavicon, card);
            return;
        }

        // First try direct display (always works for UI but doesn't let us cache)
        const directImg = document.createElement('img');
        directImg.style.display = 'none';
        document.body.appendChild(directImg);

        directImg.onload = () => {
            try {
                // Try to copy image to canvas to convert to data URL
                const canvas = document.createElement('canvas');
                canvas.width = 48;
                canvas.height = 48;
                const ctx = canvas.getContext('2d');

                try {
                    // This will throw a security error if CORS blocks it
                    ctx.drawImage(directImg, 0, 0, 48, 48);

                    // If we got here, we successfully cached the image!
                    const dataUrl = canvas.toDataURL('image/png');
                    localStorage.setItem(`favicon_data_${domain}`, dataUrl);

                    // Display the cached version
                    this.displayFavicon(card, dataUrl, game);

                    // Extract colors
                    this.extractColorsWithVibrant(dataUrl, card);
                } catch (canvasError) {
                    // CORS error when trying to draw to canvas
                    console.info(`Canvas security error for ${domain}, trying alternative approach`);

                    // Just display the direct image for now (it works for display)
                    this.displayFavicon(card, directImg.src, game);

                    // Try to use built-in icons
                    this.tryBuiltInIcons(domain, game, card);
                }
            } catch (e) {
                console.warn(`Error processing favicon for ${domain}:`, e);
                // Still show the image, just don't cache it
                this.displayFavicon(card, directImg.src, game);
            } finally {
                // Clean up
                document.body.removeChild(directImg);
            }
        };

        directImg.onerror = () => {
            console.warn(`Favicon load failed for ${game.name}`);
            document.body.removeChild(directImg);
            this.tryBuiltInIcons(domain, game, card);
        };

        // Set source to Google's favicon service
        directImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }

    // Extract colors using Vibrant.js
    extractColorsWithVibrant(imageUrl, card) {
        if (!window.Vibrant) return;

        try {
            // Create a new image element
            const img = new Image();
            img.crossOrigin = "Anonymous";

            // Set up onload handler before setting src
            img.onload = () => {
                try {
                    // Use Vibrant.from for node-vibrant 3.1.6
                    Vibrant.from(img).getPalette((err, palette) => {
                        if (err || !palette) return;

                        // Prefer DarkVibrant as requested
                        const swatch = palette.DarkVibrant ||
                            palette.Vibrant ||
                            palette.LightVibrant ||
                            palette.Muted;

                        if (!swatch) return;

                        // Create color scheme from the swatch
                        const baseColor = chroma(swatch.getHex());
                        const colors = {
                            primary: baseColor.hex(),
                            lightBackground: baseColor.luminance(0.93).hex(),
                            darkBackground: baseColor.luminance(0.15).hex()
                        };

                        // Determine text colors based on contrast
                        colors.lightModeText = chroma.contrast(colors.lightBackground, '#000000') >= 4.5 ? '#000000' : '#ffffff';
                        colors.darkModeText = chroma.contrast(colors.darkBackground, '#ffffff') >= 4.5 ? '#ffffff' : '#000000';

                        // Update card colors
                        card.dataset.primaryColor = colors.primary;
                        card.dataset.lightBackground = colors.lightBackground;
                        card.dataset.darkBackground = colors.darkBackground;
                        card.dataset.lightModeText = colors.lightModeText;
                        card.dataset.darkModeText = colors.darkModeText;

                        // Apply the colors
                        this.applyCardColors(card);
                    });
                } catch (e) {
                    console.warn('Error processing image with Vibrant.js:', e);
                }
            };

            img.onerror = () => {
                console.warn('Error loading image for Vibrant.js processing');
            };

            // Set the source last
            img.src = imageUrl;
        } catch (e) {
            console.warn('Error extracting colors with Vibrant.js:', e);
        }
    }

    // Try to use built-in icons
    tryBuiltInIcons(domain, game, card) {
        // Define some common icons for game types
        const gameTypeIcons = {
            'wordle': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB0klEQVR4Ae2WA6wcQRxAZ23btrVdO4lt27Zt++tvsLZt28YX1/q73WY2k9nZ6bbJnOQlu7Pz5vUyM/ubiVZZt9bAf2kgISFBVrLTQI5k0/r62h/u7g4fS5UyO7Rli9n927cTf0VExPyvBorXR0RIJwsXVmtYuPB/aWB69eqaxP+d8+dbfg8MTPwnDTjpJ1+3TpeVPHy4euDBg0nJfy8GBoofX76UgufPiydOngx0clLvvHpV+uHjo3Z7xQp1/uLF5fCrVyXpG3/xQsqdPSslJibKyVhMTHR8fFyMiorGx8eJRWL8K0gkkjfOzk561erVR6ZVqlR5YoUKhQD3nTsrvLZvr3Ht2jUwNTV9XKVK+cKBgYF0TUzsmz948NKyjo6qFStWYGRkRHx8PItLcj0AE0M3t2hxsE+f45b9+p0ZVrv2O8O6ddsUKlRIs2DBLOqbN2/av3r1ah0tLa3RnTp1BBBCMG/ePAYMGICjoyN6enrfgO6hoaG/+5ZAW+AZ4A1UKVmypPDw8ECn9R8oPLQBHoAvoA8YAHrAA6As0EhNTU3Mnj2b69ev4+rqagvMBGyAA4AApgGzgSKAbpYsWSa1a9dO7N69m2PHjnH16lVyALmBvMAk4DjQH8gD8J8a+A2XRujG7k32hwAAAABJRU5ErkJggg==',
            'nyt': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAe1BMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8GYa6oAAAAKHRSTlMA8Qbgz0Uum4Vn9MUP69iRKrVX3Cwh5U8+MeO8q52FdmNFHhQS7nVa1QAAAMxJREFUOMvVkdcOwjAMRRNGGaWMMgrde/z/FzLiBqSAeOId6/jasuME+EeDQsVoVA4kkZ0Jfz3dJLqFzVIjt4SUO41lx0wi4ydHlrUtS/1QSVZ4ZN6AZHlJZFikp5ih92TK7Bn2DwvYNhXBYfkLI8Uf5CWvTBVgXB6BvcldxgZY5lU7ogtSHuRbMFn5I2T7Y5HPJbP3MMcQyiLnp05dIKZhgM7IxUk/MjI3tcmLg3UjEfDI0XJxwt1cOcmQkVs2zcCB0bU9cvcfegJyjQ9bGlWJCQAAAABJRU5ErkJggg==',
            'world': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAA5FBMVEUAAAD///8AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswLvx0UAAAASnRSTlMAAQMEBQcKCw4REhUYGhscICEkKS0uMzs9QkdJTVFXWVpgZGdpbHR4fH+DhYiNkJeYm5yfoqWoq66ytLa4u8HFyMrN0NXY3ODj9MbJNMIAAAEkSURBVDjLfZLncoJAFIW/FVBEwV6j0STGHmss0ReN5v1fKCziwizjzO6P755y5swC8KPk4qIEYGKMfBsjQDj0ZYj8Atp4EwDl7RgWvqY+HA/wRc/AGj8zHXkGBkLh29NfYm4XQEpRwJQS1OzRrQxh8hQSKQMR34HkgRgdKGuDIZTLYhzIfgrZuSG4fcHwkYA0hJ6uIxDIE6WfoOMooKQp2V2BGEnMZEOvS7ItwRZnJ5A4u4sMnkNIGfH/LJvrI/YBkAH+FFy+gOs0wLkDTp41XdQMxN+B8XsA30J4FZ6jLNpkf0T8fDtw7sRAOx1DZO88J+aoKfge+Ie6k7tM946ejlKFmZ9/qKs0qwSWiADdWgBREfpNBKmGb8N0KzT8D/AHVr9K1tPsimkAAAAASUVORK5CYII='
        };

        // Check if we have a local icon for this type of game
        for (const [keyword, dataUrl] of Object.entries(gameTypeIcons)) {
            if (domain.toLowerCase().includes(keyword.toLowerCase())) {
                // Store in localStorage
                localStorage.setItem(`favicon_data_${domain}`, dataUrl);

                // Display the icon
                this.displayFavicon(card, dataUrl, game);

                // Extract colors
                this.extractColorsWithVibrant(dataUrl, card);
                return;
            }
        }
    }

    // Display a favicon
    displayFavicon(card, src, game) {
        try {
            // Clear current content
            const iconWrapper = card.querySelector('.card-icon-wrapper');
            while (iconWrapper && iconWrapper.firstChild) {
                iconWrapper.removeChild(iconWrapper.firstChild);
            }

            // Create favicon element
            const favicon = new Image();
            favicon.className = 'game-favicon';
            favicon.alt = `${game.name} icon`;
            favicon.src = src;
            favicon.style.width = '48px';
            favicon.style.height = '48px';
            favicon.style.objectFit = 'contain';

            // Add to DOM
            if (iconWrapper) {
                iconWrapper.appendChild(favicon);
            }
        } catch (e) {
            console.warn(`Error displaying favicon for ${game.name}:`, e);
        }
    }

    // Apply colors to a card based on current color scheme
    applyCardColors(card) {
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isCompleted = card.classList.contains('completed');

        // Get stored colors
        const primary = card.dataset.primaryColor;

        // For completed cards, use a neutral background
        let background, textColor;

        if (isCompleted) {
            // Use a neutral grey background for completed cards
            background = isDarkMode ? '#2a2a2a' : '#f0f0f0';
            textColor = isDarkMode ? '#ffffff' : '#333333';
        } else {
            // Use the extracted colors for active cards
            background = isDarkMode ? card.dataset.darkBackground : card.dataset.lightBackground;
            textColor = isDarkMode ? card.dataset.darkModeText : card.dataset.lightModeText;
        }

        // Apply colors
        if (primary) {
            card.style.borderColor = isCompleted ? 'transparent' : primary;
        }
        if (background) card.style.backgroundColor = background;

        // Apply text colors 
        const cardTitle = card.querySelector('.card-header h3');
        const averageDisplay = card.querySelector('.average-display');

        if (cardTitle) cardTitle.style.color = textColor;

        // Adjust average display color
        if (averageDisplay) {
            const avgColor = isDarkMode
                ? chroma(textColor).brighten(0.5).hex()
                : chroma(textColor).darken(0.5).hex();
            averageDisplay.style.color = avgColor;
        }
    }

    initializeEventListeners() {
        // Export/Import buttons
        document.getElementById('exportData').addEventListener('click', () => storage.exportData());
        document.getElementById('importData').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Schema editor
        document.getElementById('editSchema').addEventListener('click', () => this.showSchemaModal());
        document.getElementById('editSchemaManually').addEventListener('click', () => this.showSchemaEditor());
        document.getElementById('saveSchema').addEventListener('click', () => this.saveSchema());
        document.getElementById('cancelSchema').addEventListener('click', () => this.hideSchemaEditor());

        // Result submit button
        document.getElementById('submitResult').addEventListener('click', () => this.handleResultSubmit());
    }

    async handleImport(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                await storage.importData(file);
                this.updateCardPositions();
                this.showToast('Success', 'Data imported successfully!', 'success');
            } catch (error) {
                this.showToast('Error', 'Error importing data: ' + error.message, 'error');
            }
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    startCardPolling() {
        // Initial render
        this.updateCardPositions();

        // Poll every second
        setInterval(() => this.updateCardPositions(), 1000);
    }

    updateCardPositions() {
        const activeList = document.getElementById('gameList');
        const completedList = document.getElementById('completedGameList');
        const today = new Date().toISOString().split('T')[0];

        // Track current positions
        const currentPositions = new Map();
        GAMES.forEach(game => {
            const results = storage.getGameResults(game.id);
            const hasTodayResult = results.some(result => result.date === today);
            currentPositions.set(game.id, hasTodayResult);
        });

        // Only update if positions have changed
        let needsUpdate = false;
        GAMES.forEach(game => {
            const card = document.querySelector(`[data-game-id="${game.id}"]`);
            if (!card) {
                needsUpdate = true;
                return;
            }
            const isInCompleted = card.closest('#completedGameList') !== null;
            const shouldBeCompleted = currentPositions.get(game.id);
            if (isInCompleted !== shouldBeCompleted) {
                needsUpdate = true;
            }
        });

        if (!needsUpdate) return;

        // Clear both lists
        activeList.innerHTML = '';
        completedList.innerHTML = '';

        // Sort games into appropriate lists based only on today's date
        GAMES.forEach(game => {
            const card = this.createGameCard(game);
            const hasTodayResult = currentPositions.get(game.id);

            if (hasTodayResult) {
                completedList.appendChild(card);
            } else {
                activeList.appendChild(card);
            }
        });
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-game-id', game.id);
        const isCompleted = storage.isGameCompletedToday(game.id);
        if (isCompleted) {
            card.classList.add('completed');
        }

        // Get average if configured
        let averageDisplay = '';
        if (game.average_display) {
            const avg = storage.getGameAverage(
                game.id,
                game.average_display.field,
                game.average_display.days
            );

            if (avg) {
                averageDisplay = game.average_display.template.replace('{avg}', avg);
            } else {
                averageDisplay = 'New Game!';
            }
        }

        card.innerHTML = `
            <div class="card-icon-container">
                <div class="card-icon-wrapper">
                    <img class="game-favicon" alt="${game.name} icon" src="">
                </div>
            </div>
            <div class="card-header">
                <h3>${game.name}</h3>
                ${averageDisplay ? `<div class="average-display">${averageDisplay}</div>` : ''}
            </div>
            <div class="game-actions">
                <button class="btn play-btn" data-url="${game.url}">Play</button>
                <button class="btn stats-btn" data-game="${game.id}">Stats</button>
                <button class="btn result-btn" data-game="${game.id}">Enter Result</button>
            </div>
        `;

        // Add event listeners
        card.querySelector('.play-btn').addEventListener('click', () => window.open(game.url, '_blank'));
        card.querySelector('.stats-btn').addEventListener('click', () => this.showStats(game.id));
        card.querySelector('.result-btn').addEventListener('click', () => this.showResultInput(game.id));

        // Apply brand styling to the card
        this.applyGameStyling(card, game);

        return card;
    }

    showStats(gameId) {
        const results = storage.getGameResults(gameId);

        if (results.length === 0) {
            this.showToast('No Data', 'Enter your first result to start tracking stats', 'info');
            return;
        }

        const modal = document.getElementById('statsModal');

        // Parse all results for visualization
        const parsedResults = results.map(result => {
            try {
                const parsed = parser.parse(gameId, result.rawOutput);
                return {
                    date: result.date,
                    ...parsed
                };
            } catch (error) {
                console.error(`Error parsing result for ${result.date}:`, error);
                return null;
            }
        }).filter(Boolean);

        // Create chart with parsed data
        gameCharts.createChart('statsChart', gameId, parsedResults);

        // Display raw history
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        results.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(result => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';

            const header = document.createElement('div');
            header.className = 'history-header';

            const dateContainer = document.createElement('div');
            dateContainer.className = 'date-container';

            const date = document.createElement('input');
            date.type = 'date';
            date.className = 'date-input';
            date.value = result.date;
            date.title = 'Click to edit date';

            // Add date change handler
            date.addEventListener('change', () => {
                const newDate = date.value;
                if (!newDate) return;

                // Check if the new date already exists
                const existingResult = results.find(r => r.date === newDate);
                if (existingResult && existingResult !== result) {
                    this.showToast('Error', 'A result already exists for this date', 'error');
                    date.value = result.date;
                    return;
                }

                try {
                    // Update the result with the new date
                    storage.updateGameResult(gameId, result.date, result.rawOutput, newDate);
                    // Refresh the stats view
                    this.showStats(gameId);
                } catch (error) {
                    this.showToast('Error', 'Error updating date: ' + error.message, 'error');
                    date.value = result.date;
                }
            });

            dateContainer.appendChild(date);

            const actions = document.createElement('div');
            actions.className = 'history-actions';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn delete-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete this entry';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this entry?')) {
                    storage.deleteGameResult(gameId, result.date);
                    this.showStats(gameId);
                }
            });

            const editBtn = document.createElement('button');
            editBtn.className = 'btn edit-btn';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit this entry';
            editBtn.addEventListener('click', () => {
                content.contentEditable = true;
                content.focus();
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            header.appendChild(dateContainer);
            header.appendChild(actions);

            const content = document.createElement('pre');
            content.textContent = result.rawOutput;
            content.contentEditable = false;

            // Add edit handlers
            content.addEventListener('focus', () => {
                entry.classList.add('editing');
            });

            content.addEventListener('blur', () => {
                entry.classList.remove('editing');
                content.contentEditable = false;

                if (content.textContent.trim() === '') {
                    if (confirm('Empty content will delete this entry. Continue?')) {
                        storage.deleteGameResult(gameId, result.date);
                        this.showStats(gameId);
                    } else {
                        content.textContent = result.rawOutput;
                    }
                    return;
                }

                // Store the raw output without validation
                storage.updateGameResult(gameId, result.date, content.textContent);
                // Refresh the stats view
                this.showStats(gameId);
            });

            entry.appendChild(header);
            entry.appendChild(content);
            historyList.appendChild(entry);
        });

        modal.style.display = 'block';
    }

    showResultInput(gameId) {
        this.currentGameId = gameId;
        const modal = document.getElementById('resultModal');
        document.getElementById('resultInput').value = '';
        modal.style.display = 'block';
    }

    async handleResultSubmit() {
        const input = document.getElementById('resultInput').value.trim();
        if (!input) return;

        const game = GAMES.find(g => g.id === this.currentGameId);
        storage.addGameResult(this.currentGameId, input);
        this.closeModals();
        this.updateCardPositions();
        this.showToast('Nice job!', `Completed today's ${game.name}`, 'success');
    }

    showSchemaModal() {
        const modal = document.getElementById('schemaModal');
        modal.style.display = 'block';
    }

    showSchemaEditor() {
        const editor = document.getElementById('schemaEditor');
        editor.style.display = 'block';

        // Initialize CodeMirror if not already done
        if (!this.schemaEditor) {
            const textarea = document.getElementById('schemaInput');
            this.schemaEditor = CodeMirror.fromTextArea(textarea, {
                mode: 'application/json',
                theme: 'monokai',
                lineNumbers: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                gutters: ['CodeMirror-lint-markers'],
                lint: true,
                extraKeys: {
                    'Ctrl-Space': 'autocomplete'
                }
            });
        }

        // Set the content
        this.schemaEditor.setValue(JSON.stringify(GAMES, null, 2));
    }

    hideSchemaEditor() {
        document.getElementById('schemaEditor').style.display = 'none';
    }

    async saveSchema() {
        try {
            const newSchema = JSON.parse(this.schemaEditor.getValue());
            // Validate schema structure
            if (!Array.isArray(newSchema)) {
                throw new Error('Schema must be an array of games');
            }
            newSchema.forEach(game => {
                if (!game.id || !game.name || !game.url) {
                    throw new Error('Each game must have id, name, and url');
                }
            });

            // Update the games array
            GAMES.length = 0;
            GAMES.push(...newSchema);

            // Refresh the display
            this.updateCardPositions();
            this.hideSchemaEditor();
            document.getElementById('schemaModal').style.display = 'none';
            this.showToast('Success', 'Schema updated successfully!', 'success');
        } catch (error) {
            this.showToast('Error', 'Invalid schema format: ' + error.message, 'error');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 