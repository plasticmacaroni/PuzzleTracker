// Game configuration - define as global variable by attaching to window
// window.GAMES = [...] // This large array is now in js/game_schemas.js

// Ensure window.GAMES_DEFAULT is initialized with a deep copy of the initial GAMES array
// This should be done early, after js/game_schemas.js has loaded and before any potential modification to window.GAMES (e.g., by loading from storage).
if (window.GAMES && (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0)) {
    window.GAMES_DEFAULT = JSON.parse(JSON.stringify(window.GAMES));
    console.log('app.js: Initialized window.GAMES_DEFAULT from js/game_schemas.js. Default games count:', window.GAMES_DEFAULT.length);
} else if (!window.GAMES) {
    console.warn('app.js: window.GAMES was not defined when attempting to initialize window.GAMES_DEFAULT. This usually means js/game_schemas.js did not load correctly.');
    window.GAMES_DEFAULT = []; // Initialize to empty array to prevent errors, though this indicates a problem.
} else if (window.GAMES_DEFAULT && window.GAMES_DEFAULT.length > 0) {
    console.log('app.js: window.GAMES_DEFAULT was already populated. Count:', window.GAMES_DEFAULT.length);
}

class App {
    constructor() {
        this.currentGameId = null;
        this.toastContainer = null;
        this.schemaEditor = null;
        this.initializeDarkMode();
        this.initializeToastContainer();
        this.initializeEventListeners();
        this.showDailyReminderBanner();
        this.updateCardPositions();
        this.startCardPolling();
    }

    // Helper function to get today's date in local timezone
    getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        // console.log('Using local date:', dateStr, '(Browser time)'); // Commented out for polling
        return dateStr;
    }

    initializeDarkMode() {
        // Check if user has already set a preference
        const darkModePreference = localStorage.getItem('darkModePreference');

        // If there's a preference, apply it
        if (darkModePreference === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (darkModePreference === 'light') {
            document.body.classList.remove('dark-mode');
        } else {
            // If no preference, check system preference
            const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDarkMode) {
                document.body.classList.add('dark-mode');
            }
        }

        // Create dark mode toggle button
        const darkModeToggle = document.createElement('button');
        darkModeToggle.id = 'darkModeToggle';
        darkModeToggle.className = 'btn dark-mode-toggle';
        darkModeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
        darkModeToggle.title = document.body.classList.contains('dark-mode') ? 'Switch to Light Mode' : 'Switch to Dark Mode';

        // Add event listener to toggle button
        darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Add to header
        const headerActions = document.querySelector('.header-actions');
        headerActions.prepend(darkModeToggle);
    }

    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');

        // Update button
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.innerHTML = isDarkMode ? '☀️' : '🌙';
        darkModeToggle.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';

        // Save preference
        localStorage.setItem('darkModePreference', isDarkMode ? 'dark' : 'light');

        // Update card colors for all games
        document.querySelectorAll('.game-card').forEach(card => {
            this.applyCardColors(card);
        });
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
        // We previously had hardcoded fallback icons here, but they've been removed
        // to reduce code size and unnecessary data embedding
        const gameTypeIcons = {};

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
        const cardTitle = card.querySelector('.card-title');
        const averageDisplay = card.querySelector('.average-display');
        const cardDivider = card.querySelector('.card-divider');

        if (cardTitle) cardTitle.style.color = textColor;

        // Style divider if present
        if (cardDivider) {
            cardDivider.style.backgroundColor = isCompleted ?
                (isDarkMode ? '#444' : '#eee') :
                chroma(primary).alpha(0.3).css();
        }

        // Adjust average display color and alignment
        if (averageDisplay) {
            const avgColor = isDarkMode
                ? chroma(textColor).brighten(0.5).hex()
                : chroma(textColor).darken(0.5).hex();
            averageDisplay.style.color = avgColor;
            averageDisplay.style.textAlign = 'center';
        }
    }

    initializeEventListeners() {
        // Export/Import buttons
        document.getElementById('exportData').addEventListener('click', () => storage.exportData());
        document.getElementById('importData').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));

        // Schema import/export buttons
        document.getElementById('exportSchemaOnly').addEventListener('click', () => storage.exportGameSchema());
        document.getElementById('importSchemaOnly').addEventListener('click', () => document.getElementById('importSchemaFile').click());
        document.getElementById('importSchemaFile').addEventListener('change', (e) => this.handleSchemaImport(e));

        // Reminder banner buttons
        document.getElementById('exportDataBanner').addEventListener('click', () => {
            storage.exportData();
            this.hideBanner();
        });
        document.getElementById('dismissBanner').addEventListener('click', () => this.hideBanner());
        document.getElementById('closeBanner').addEventListener('click', () => this.hideBanner());

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

        // Game management modal
        document.getElementById('editSchema').addEventListener('click', () => this.showSchemaModal('manage'));
        document.getElementById('editSchemaManually').addEventListener('click', () => this.showSchemaEditor());
        document.getElementById('saveSchema').addEventListener('click', () => this.saveSchema());
        document.getElementById('cancelSchema').addEventListener('click', () => this.hideSchemaEditor());
        document.getElementById('quickAddGame').addEventListener('click', () => this.handleQuickAddGame());

        // Tab buttons
        document.getElementById('quickAddTab').addEventListener('click', () => this.switchTab('quickAdd'));
        document.getElementById('manageTab').addEventListener('click', () => this.switchTab('manage'));
        document.getElementById('advancedTab').addEventListener('click', () => this.switchTab('advanced'));

        // Result submit button
        document.getElementById('submitResult').addEventListener('click', () => this.handleResultSubmit());
    }

    // New method to switch between tabs
    switchTab(tabName) {
        // Hide all tab content
        document.querySelectorAll('.modal-tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content and mark tab as active
        if (tabName === 'quickAdd') {
            document.getElementById('quickAddSection').style.display = 'block';
            document.getElementById('quickAddTab').classList.add('active');
        } else if (tabName === 'manage') {
            document.getElementById('manageSection').style.display = 'block';
            document.getElementById('manageTab').classList.add('active');
            this.loadManageGamesContent();
        } else if (tabName === 'advanced') {
            document.getElementById('advancedSection').style.display = 'block';
            document.getElementById('advancedTab').classList.add('active');
        }
    }

    // Method to load game management content
    loadManageGamesContent() {
        const activeGamesList = document.getElementById('activeGamesList');
        const hiddenGamesList = document.getElementById('hiddenGamesList');

        // Clear previous entries
        activeGamesList.innerHTML = '';
        hiddenGamesList.innerHTML = '';

        // Process all games
        window.GAMES.forEach(game => {
            const isHidden = storage.isGameHidden(game.id);
            const gameItem = this.createGameListItem(game, isHidden);

            if (isHidden) {
                hiddenGamesList.appendChild(gameItem);
            } else {
                activeGamesList.appendChild(gameItem);
            }
        });
    }

    showSchemaModal(activeTab = 'manage') {
        const modal = document.getElementById('schemaModal');
        modal.style.display = 'block';

        // Switch to the specified tab
        this.switchTab(activeTab);
    }

    closeModals() {
        let schemaModalWasOpen = false;
        const schemaModalElement = document.getElementById('schemaModal');

        document.querySelectorAll('.modal').forEach(modal => {
            if (modal === schemaModalElement && modal.style.display === 'block') {
                schemaModalWasOpen = true;
            }
            modal.style.display = 'none';
        });

        if (schemaModalWasOpen) {
            this.updateCardPositions();
        }
    }

    hideGame(gameId) {
        const game = window.GAMES.find(g => g.id === gameId);
        if (!game) return;

        if (confirm(`Are you sure you want to hide ${game.name}? It can be restored later.`)) {
            if (storage.hideGame(gameId)) {
                // Remove from active list and add to hidden list in the modal
                const activeItem = document.querySelector(`#activeGamesList [data-game-id="${gameId}"]`);
                if (activeItem) {
                    activeItem.remove();

                    // Create item for hidden list
                    const hiddenList = document.getElementById('hiddenGamesList');
                    const gameItem = this.createGameListItem(game, true);
                    hiddenList.appendChild(gameItem);
                }

                this.showToast('Game Hidden', `${game.name} has been hidden`, 'info');
            }
        }
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

    startCardPolling() {
        // Initial render
        this.updateCardPositions();

        // Poll every second
        setInterval(() => this.updateCardPositions(), 1000);
    }

    updateCardPositions() {
        const activeList = document.getElementById('gameList');
        const completedList = document.getElementById('completedGameList');
        const today = this.getLocalDateString();
        let cardsToReRender = new Set(); // Game IDs that need full re-render
        let requiresFullListReRender = false;

        // Presumed IDs for the elements to be hidden/shown
        const completedGamesHeader = document.getElementById('completed-puzzles-header');
        const addGameButton = document.getElementById('add-game-btn');

        // Check if any game's hidden status has changed compared to what's displayed
        const currentlyDisplayedGameIds = new Set([...activeList.children, ...completedList.children].map(card => card.dataset.gameId));
        const allGameSchemas = window.GAMES || []; // Correct: Use the global GAMES array

        allGameSchemas.forEach(game => {
            const isCurrentlyDisplayed = currentlyDisplayedGameIds.has(game.id);
            const shouldBeDisplayed = !window.storage.isGameHidden(game.id);

            if (isCurrentlyDisplayed !== shouldBeDisplayed) {
                requiresFullListReRender = true;
            }
        });

        // If a full re-render is needed (e.g. game unhidden), clear lists and rebuild
        if (requiresFullListReRender) {
            activeList.innerHTML = '';
            completedList.innerHTML = '';
            const gamesToDisplay = allGameSchemas.filter(game => !window.storage.isGameHidden(game.id));
            gamesToDisplay.forEach(game => {
                const card = this.createGameCard(game);
                // Initial placement logic (will be refined below)
                const lastResult = window.storage.getLatestGameResult(game.id, today);
                if (lastResult && lastResult.CompletionState === true) {
                    completedList.appendChild(card);
                } else {
                    activeList.appendChild(card);
                }
            });
        }

        // Iterate over all cards in both lists (active and completed)
        [...activeList.children, ...completedList.children].forEach(card => {
            const gameId = card.getAttribute('data-game-id');
            if (!currentlyDisplayedGameIds.has(gameId)) return; // Card is already gone or shouldn't be there

            const gameSchema = allGameSchemas.find(g => g.id === gameId);

            // ---- Start: Update average display text and structure ----
            if (gameSchema && gameSchema.average_display) {
                const avgValue = storage.getGameAverage(
                    gameSchema.id,
                    gameSchema.average_display.field,
                    gameSchema.average_display.days
                );

                let displayText = '';
                if (avgValue !== null) { // Check against null explicitly to allow "0" or "0.0"
                    const template = gameSchema.average_display.template;
                    if (template.includes('{avg:')) {
                        displayText = template.replace(/{avg:[^}]+}/, avgValue);
                    } else {
                        displayText = template.replace('{avg}', avgValue);
                    }
                }

                let averageDisplayElement = card.querySelector('.average-display');
                let cardDividerElement = card.querySelector('.card-divider');
                const cardTopRow = card.querySelector('.card-top-row');

                if (displayText) { // If there's an average to display
                    if (!averageDisplayElement && cardTopRow) { // If section doesn't exist, create it
                        // Create divider if it doesn't exist
                        if (!cardDividerElement) {
                            cardDividerElement = document.createElement('div');
                            cardDividerElement.className = 'card-divider';
                            cardTopRow.after(cardDividerElement); // Insert divider after top row
                        }

                        // Create average display div (should be after divider)
                        averageDisplayElement = document.createElement('div');
                        averageDisplayElement.className = 'average-display';
                        if (cardDividerElement) {
                            cardDividerElement.after(averageDisplayElement);
                        } else { // Should not happen if divider is created, but as fallback
                            cardTopRow.after(averageDisplayElement);
                        }
                    }
                    // Update text content if the element exists (it should by now)
                    if (averageDisplayElement) {
                        averageDisplayElement.textContent = displayText;
                    }
                } else { // No average to display, remove the section
                    if (averageDisplayElement) averageDisplayElement.remove();
                    // Also remove divider if it's tied to the average display's existence
                    if (cardDividerElement) cardDividerElement.remove();
                }
            }
            // ---- End: Update average display ----

            const isInCompletedList = card.parentElement === completedList;
            let gameShouldBeInCompleted = false;

            if (gameSchema && !window.storage.isGameHidden(gameId)) {
                const latestResultToday = window.storage.getLatestGameResult(gameId, today);
                if (latestResultToday) {
                    gameShouldBeInCompleted = true;
                }
            }

            if (isInCompletedList !== gameShouldBeInCompleted) {
                if (gameShouldBeInCompleted) {
                    completedList.appendChild(card);
                    card.classList.add('completed');
                } else {
                    activeList.appendChild(card);
                    card.classList.remove('completed');
                }
            }
            // Always call applyCardColors to update styles based on completion, dark mode, and new average text/colors
            this.applyCardColors(card);
        });

        // After all cards are processed and potentially moved:

        // 1. Visibility for "Completed Games" header
        if (completedGamesHeader) {
            if (completedList.children.length === 0) {
                completedGamesHeader.style.display = 'none'; // Hide if empty
            } else {
                completedGamesHeader.style.display = ''; // Show if not empty (restore default)
            }
        }

        // 2. Visibility for "New Game" button - Ensure it's always visible
        if (addGameButton) {
            addGameButton.style.display = ''; // Restore default display (always visible)
        }

        // If any cards were marked for re-render, do it now (simplified)
        // cardsToReRender.forEach(gameId => {  // This loop is no longer needed as cards are moved directly
        //     this.updateCardPositions();
        // });
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-game-id', game.id);
        const isCompleted = storage.isGameCompletedToday(game.id);
        if (isCompleted) {
            card.classList.add('completed');
        }

        // Add randomized puzzle decoration position
        this.addRandomPuzzleDecoration(card);

        // Get average if configured
        let averageDisplayHtml = ''; // Initialize to empty string
        if (game.average_display) {
            const avg = storage.getGameAverage(
                game.id,
                game.average_display.field,
                game.average_display.days
            );

            if (avg) { // Only if avg is not null or empty (or a non-empty string)
                const template = game.average_display.template;
                let displayText = '';
                if (template.includes('{avg:')) {
                    // The getGameAverage method already returns formatted value for format specifiers
                    displayText = template.replace(/{avg:[^}]+}/, avg);
                } else {
                    // Simple {avg} replacement
                    displayText = template.replace('{avg}', avg);
                }
                averageDisplayHtml = `
                    <div class="card-divider"></div>
                    <div class="average-display">${displayText}</div>
                `;
            }
            // If avg is null/undefined/empty, averageDisplayHtml remains '', so "New Game!" and its div won't be rendered.
        }

        card.innerHTML = `
            <div class="card-top-row">
                <div class="card-icon-wrapper">
                    <img class="game-favicon" alt="${game.name} icon" src="">
                </div>
                <h3 class="card-title">${game.name}</h3>
            </div>
            ${averageDisplayHtml}
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

    // New method to add randomized puzzle decoration position
    addRandomPuzzleDecoration(card) {
        // Create and add the first puzzle piece element
        const puzzlePiece1 = document.createElement('div');
        puzzlePiece1.className = 'puzzle-decoration piece1';

        // Make sure pieces are more visible by positioning them more inside the card
        const positions1 = ['top-center', 'middle-right', 'bottom-center', 'middle-left'];
        const randomPos1 = positions1[Math.floor(Math.random() * positions1.length)];
        puzzlePiece1.classList.add(randomPos1);

        // Larger size for better visibility
        const size1 = 80 + Math.floor(Math.random() * 60); // Random size between 80px and 140px
        puzzlePiece1.style.width = `${size1}px`;
        puzzlePiece1.style.height = `${size1}px`;

        // More defined puzzle piece shape with stronger border-radius
        const radius1 = [
            `${40 + Math.random() * 30}% ${70 + Math.random() * 30}% ${70 + Math.random() * 30}% ${40 + Math.random() * 30}%`,
            `${40 + Math.random() * 30}% ${40 + Math.random() * 30}% ${70 + Math.random() * 30}% ${70 + Math.random() * 30}%`
        ].join(' / ');
        puzzlePiece1.style.borderRadius = radius1;

        // Much higher opacity and more visible styling
        if (document.body.classList.contains('dark-mode')) {
            puzzlePiece1.style.backgroundColor = `rgba(255, 255, 255, ${(0.12 + Math.random() * 0.08).toFixed(2)})`;
        } else {
            const color = this.stringToColor(card.querySelector('.card-title').textContent);
            const colorRgb = this.hexToRgb(color);
            puzzlePiece1.style.backgroundColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${(0.15 + Math.random() * 0.1).toFixed(2)})`;
        }

        // Add border to make it more defined
        puzzlePiece1.style.border = `1px solid rgba(255, 255, 255, ${document.body.classList.contains('dark-mode') ? 0.1 : 0.03})`;

        // Create and add the second puzzle piece element
        const puzzlePiece2 = document.createElement('div');
        puzzlePiece2.className = 'puzzle-decoration piece2';

        // Ensure second piece position is different from first
        let positions2 = [...positions1];
        positions2 = positions2.filter(pos => pos !== randomPos1);
        const randomPos2 = positions2[Math.floor(Math.random() * positions2.length)];
        puzzlePiece2.classList.add(randomPos2);

        // Randomize the size for second piece
        const size2 = 70 + Math.floor(Math.random() * 40); // Random size between 70px and 110px
        puzzlePiece2.style.width = `${size2}px`;
        puzzlePiece2.style.height = `${size2}px`;

        // More defined puzzle piece shape
        const radius2 = [
            `${40 + Math.random() * 30}% ${70 + Math.random() * 30}% ${70 + Math.random() * 30}% ${40 + Math.random() * 30}%`,
            `${40 + Math.random() * 30}% ${40 + Math.random() * 30}% ${70 + Math.random() * 30}% ${70 + Math.random() * 30}%`
        ].join(' / ');
        puzzlePiece2.style.borderRadius = radius2;

        // Much higher opacity for visibility
        if (document.body.classList.contains('dark-mode')) {
            puzzlePiece2.style.backgroundColor = `rgba(255, 255, 255, ${(0.12 + Math.random() * 0.08).toFixed(2)})`;
        } else {
            // Use a different color variant for the second piece
            const color = this.stringToColor(card.querySelector('.card-title').textContent + '1');
            const colorRgb = this.hexToRgb(color);
            puzzlePiece2.style.backgroundColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${(0.15 + Math.random() * 0.1).toFixed(2)})`;
        }

        // Add border to make it more defined
        puzzlePiece2.style.border = `1px solid rgba(255, 255, 255, ${document.body.classList.contains('dark-mode') ? 0.1 : 0.03})`;

        // Add the pieces to the card
        card.appendChild(puzzlePiece1);
        card.appendChild(puzzlePiece2);
    }

    // Helper method to convert hex color to RGB components
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return { r, g, b };
    }

    showStats(gameId) {
        const results = storage.getGameResults(gameId);

        if (results.length === 0) {
            this.showToast('No Data', 'Enter your first result to start tracking stats', 'info');
            return;
        }

        const modal = document.getElementById('statsModal');
        const chartContainer = document.querySelector('.chart-container');
        const game = window.GAMES.find(g => g.id === gameId);

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

        // Check if there are any tracked variables
        const hasTrackedVariables = parsedResults.length > 0 && parsedResults.some(result => {
            // Check if there are any properties besides date
            return Object.keys(result).length > 1;
        });

        // Update chart container based on tracked variables
        if (hasTrackedVariables) {
            // Show chart and create it with parsed data
            chartContainer.style.display = 'block';
            chartContainer.innerHTML = '<canvas id="statsChart"></canvas>';
            gameCharts.createChart('statsChart', gameId, parsedResults);
        } else {
            // Hide chart and show message
            chartContainer.style.display = 'block';
            chartContainer.innerHTML = `
                <div class="no-stats-message">
                    <h3>No Statistics Available</h3>
                    <p>This game doesn't have statistics tracking configured in the schema.</p>
                    <p>You can still track your history, but graphs and averages aren't available.</p>
                    <p class="hint">To enable statistics, edit the game schema to add result parsing rules.</p>
                </div>
            `;
        }

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

        const game = window.GAMES.find(g => g.id === this.currentGameId);
        storage.addGameResult(this.currentGameId, input);
        this.closeModals();
        this.updateCardPositions();
        this.showToast('Nice job!', `Completed today's ${game.name}`, 'success');
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
        this.schemaEditor.setValue(JSON.stringify(window.GAMES, null, 2));
    }

    hideSchemaEditor() {
        document.getElementById('schemaEditor').style.display = 'none';
    }

    handleQuickAddGame() {
        const nameInput = document.getElementById('quickAddName');
        const urlInput = document.getElementById('quickAddUrl');

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        // Validate inputs
        if (!name) {
            this.showToast('Error', 'Game name is required', 'error');
            nameInput.focus();
            return;
        }

        if (!url) {
            this.showToast('Error', 'Game URL is required', 'error');
            urlInput.focus();
            return;
        }

        try {
            // Create a unique ID from the name
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

            // Check if game with this ID already exists
            if (window.GAMES.some(game => game.id === id)) {
                this.showToast('Error', 'A game with a similar name already exists', 'error');
                return;
            }

            // Create simple game object
            const newGame = {
                id,
                name,
                url
            };

            // Add to games array
            window.GAMES.push(newGame);

            // Save to localStorage for persistence
            storage.saveGamesSchema(window.GAMES);

            // Clear form inputs
            nameInput.value = '';
            urlInput.value = '';

            // Refresh display
            this.updateCardPositions();

            this.showToast('Success', `${name} added successfully. Note: Statistics tracking will require manual schema editing.`, 'success');
        } catch (error) {
            this.showToast('Error', 'Failed to add game: ' + error.message, 'error');
        }
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
            window.GAMES.length = 0;
            window.GAMES.push(...newSchema);

            // Save to localStorage for persistence
            storage.saveGamesSchema(window.GAMES);

            // Refresh the display
            this.updateCardPositions();
            this.hideSchemaEditor();
            document.getElementById('schemaModal').style.display = 'none';
            this.showToast('Success', 'Schema updated successfully!', 'success');
        } catch (error) {
            this.showToast('Error', 'Invalid schema format: ' + error.message, 'error');
        }
    }

    // Helper method to create a game list item for the manage games modal
    createGameListItem(game, isHidden) {
        const item = document.createElement('div');
        item.className = 'game-list-item';
        item.setAttribute('data-game-id', game.id);

        // Create icon (reuse favicon code)
        const iconContainer = document.createElement('div');
        iconContainer.className = 'game-icon';

        // Create a fallback icon by default
        const fallbackIcon = document.createElement('div');
        fallbackIcon.className = 'fallback-icon-small';
        fallbackIcon.textContent = game.name.charAt(0).toUpperCase();
        fallbackIcon.style.width = '24px';
        fallbackIcon.style.height = '24px';
        fallbackIcon.style.borderRadius = '50%';
        fallbackIcon.style.backgroundColor = this.stringToColor(game.name);
        fallbackIcon.style.display = 'flex';
        fallbackIcon.style.justifyContent = 'center';
        fallbackIcon.style.alignItems = 'center';
        fallbackIcon.style.fontWeight = 'bold';
        fallbackIcon.style.fontSize = '12px';
        fallbackIcon.style.color = '#ffffff';

        iconContainer.appendChild(fallbackIcon);

        // Create name
        const nameEl = document.createElement('div');
        nameEl.className = 'game-name';
        nameEl.textContent = game.name;

        // Create actions container
        const actions = document.createElement('div');
        actions.className = 'game-actions-small';

        // Get default game IDs (original games)
        const defaultGameIds = new Set(window.GAMES_DEFAULT ? window.GAMES_DEFAULT.map(g => g.id) : []);

        // Create appropriate button based on state and type
        if (isHidden) {
            // Create restore button for hidden games
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn restore-btn';
            restoreBtn.textContent = 'Restore';
            restoreBtn.addEventListener('click', () => this.restoreGame(game.id));
            actions.appendChild(restoreBtn);
        } else {
            // For visible games, show hide or remove based on if it's a default game
            const isDefault = defaultGameIds.has(game.id);

            const actionBtn = document.createElement('button');
            if (isDefault) {
                actionBtn.className = 'btn hide-btn';
                actionBtn.textContent = 'Hide';
                actionBtn.addEventListener('click', () => this.hideGame(game.id));
            } else {
                actionBtn.className = 'btn remove-btn warning-btn';
                actionBtn.textContent = 'Remove';
                actionBtn.addEventListener('click', () => this.removeGame(game.id));
            }
            actions.appendChild(actionBtn);
        }

        // Assemble the item
        item.appendChild(iconContainer);
        item.appendChild(nameEl);
        item.appendChild(actions);

        // Try to load the favicon
        if (game.url) {
            try {
                const url = new URL(game.url);
                const domain = url.hostname;

                // First check local storage for cached favicon
                const cachedFavicon = localStorage.getItem(`favicon_data_${domain}`);
                if (cachedFavicon) {
                    // Create and add the favicon if cached
                    const faviconImg = document.createElement('img');
                    faviconImg.className = 'game-favicon-small';
                    faviconImg.alt = `${game.name} icon`;
                    faviconImg.src = cachedFavicon;

                    // Replace the fallback icon
                    iconContainer.innerHTML = '';
                    iconContainer.appendChild(faviconImg);
                } else {
                    // If not cached, use Google favicon API directly for the small icons
                    const faviconImg = document.createElement('img');
                    faviconImg.className = 'game-favicon-small';
                    faviconImg.alt = `${game.name} icon`;
                    faviconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

                    // Replace the fallback icon
                    iconContainer.innerHTML = '';
                    iconContainer.appendChild(faviconImg);
                }
            } catch (e) {
                console.warn(`Error loading favicon for ${game.name} in management interface:`, e);
                // Fallback icon is already created, so no need to do anything
            }
        }

        return item;
    }

    // Helper method to create a consistent color from a string
    stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    restoreGame(gameId) {
        const game = window.GAMES.find(g => g.id === gameId);
        if (!game) return;

        if (storage.unhideGame(gameId)) {
            // Remove from hidden list and add to active list
            const hiddenItem = document.querySelector(`#hiddenGamesList [data-game-id="${gameId}"]`);
            if (hiddenItem) {
                hiddenItem.remove();

                // Create item for active list
                const activeList = document.getElementById('activeGamesList');
                const gameItem = this.createGameListItem(game, false);
                activeList.appendChild(gameItem);
            }

            this.showToast('Game Restored', `${game.name} has been restored`, 'success');
        }
    }

    removeGame(gameId) {
        const game = window.GAMES.find(g => g.id === gameId);
        if (!game) return;

        // Double confirmation for removing a game since it's destructive
        if (confirm(`Are you sure you want to REMOVE ${game.name}? This cannot be undone and will delete the game definition.`)) {
            if (confirm(`⚠️ FINAL WARNING: Remove ${game.name} permanently?`)) {
                // Find the game index
                const index = window.GAMES.findIndex(g => g.id === gameId);
                if (index !== -1) {
                    // Remove the game
                    window.GAMES.splice(index, 1);

                    // Save the updated games schema
                    storage.saveGamesSchema(window.GAMES);

                    // Remove item from the active list
                    const activeItem = document.querySelector(`#activeGamesList [data-game-id="${gameId}"]`);
                    if (activeItem) {
                        activeItem.remove();
                    }

                    this.showToast('Game Removed', `${game.name} has been permanently removed`, 'success');
                }
            }
        }
    }

    // Handler for schema import
    async handleSchemaImport(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                await storage.importGameSchema(file);
                this.updateCardPositions();
                // Reset the file input
                event.target.value = '';
            } catch (error) {
                this.showToast('Error', 'Error importing schema: ' + error.message, 'error');
                // Reset the file input
                event.target.value = '';
            }
        }
    }

    // Reminder banner methods
    showDailyReminderBanner() {
        // Check if we've shown the banner today
        const today = this.getLocalDateString();
        const lastShown = localStorage.getItem('reminderBannerLastShown');

        if (lastShown === today) {
            // Already shown today, don't show again
            return;
        }

        // Only show banner if there are tracked stats (games with results)
        const hasTrackedStats = this.hasAnyTrackedStatistics();
        if (!hasTrackedStats) {
            return;
        }

        // Show banner after a short delay
        setTimeout(() => {
            const banner = document.getElementById('reminderBanner');
            if (banner) { // Check if the banner element exists
                banner.classList.remove('hidden');
                // Mark as shown today
                localStorage.setItem('reminderBannerLastShown', today);
            } else {
                console.warn("Reminder banner element with ID 'reminderBanner' not found.");
            }
        }, 1000);
    }

    // Check if there are any games with tracked statistics
    hasAnyTrackedStatistics() {
        // Check all games that have average_display configuration
        const gamesWithStats = window.GAMES.filter(game => game.average_display);

        // For each game, check if there's at least one result
        for (const game of gamesWithStats) {
            const results = storage.getGameResults(game.id);
            // If the game has any results, return true
            if (results && results.length > 0) {
                return true;
            }
        }

        // No games found with statistics
        return false;
    }

    hideBanner() {
        const banner = document.getElementById('reminderBanner');
        if (banner) { // Check if the banner element exists
            banner.classList.add('hidden');
        }
    }
}

// Initialize and run the application
(async () => {
    try {
        // Create and initialize the storage instance first, making it globally available
        window.storage = await Storage.create();

        // Now that window.storage is initialized, create the App instance
        window.app = new App();

        // If there was other setup code that ran after `new App()` that might also
        // rely on `window.app` or `window.storage`, ensure it's here or called from here.
        // For example, if event listeners were attached outside the App class based on these globals.
        // Based on the provided code, the App constructor handles its own event listeners.

        console.log("Application initialized successfully.");

    } catch (error) {
        console.error("Failed to initialize application:", error);
        // Optionally, display a user-friendly error message on the page
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: sans-serif;"><h1>Application Error</h1><p>Could not initialize the application. Please try again later or check the console for details.</p></div>';
        }
    }
})(); 