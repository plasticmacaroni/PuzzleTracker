// tests/storage.spec.js

describe("Storage", function () {
    let testStorage;
    // const testGameId = 'nyt-connections-test'; // This will be set per suite if needed
    let localDateToday;

    // Spies for localStorage methods
    let getItemSpy, setItemSpy, removeItemSpy, clearSpy;
    let mockLocalStorage;

    beforeEach(async function () {
        // console.log("[Spec BeforeEach] STARTING");

        mockLocalStorage = {
            _data: {},
            getItem: function (key) {
                const value = this._data[key] || null;
                // console.log(`------> [Mock LS VIA SPY] getItem: key='${key}', returning='${value}'`);
                return value;
            },
            setItem: function (key, value) {
                // console.log(`------> [Mock LS VIA SPY] setItem: key='${key}', value='${String(value)}'`);
                this._data[key] = String(value);
            },
            removeItem: function (key) {
                // console.log(`------> [Mock LS VIA SPY] removeItem: key='${key}'`);
                delete this._data[key];
            },
            clear: function () {
                // console.log(`------> [Mock LS VIA SPY] clear called`);
                this._data = {};
            }
        };
        // console.log("[Spec BeforeEach] mockLocalStorage object created");

        getItemSpy = spyOn(mockLocalStorage, 'getItem').and.callThrough();
        setItemSpy = spyOn(mockLocalStorage, 'setItem').and.callThrough();
        removeItemSpy = spyOn(mockLocalStorage, 'removeItem').and.callThrough();
        clearSpy = spyOn(mockLocalStorage, 'clear').and.callThrough();
        // console.log("[Spec BeforeEach] Spies created on mockLocalStorage methods");

        // console.log("[Spec BeforeEach] About to call Storage.create(mockLocalStorage)");
        testStorage = await Storage.create(mockLocalStorage);
        // console.log("[Spec BeforeEach] Storage.create(mockLocalStorage) completed, testStorage created");

        localDateToday = testStorage.getLocalDateString();
        // console.log("[Spec BeforeEach] localDateToday set:", localDateToday);

        testStorage.data.gameResults = {};
        testStorage.data.hiddenGames = [];
        // console.log("[Spec BeforeEach] testStorage.data.gameResults and hiddenGames reset for test isolation");

        // Initialize window.GAMES for the tests from window.GAMES_DEFAULT (set up in test_runner.html)
        if (!window.GAMES_DEFAULT || window.GAMES_DEFAULT.length === 0) {
            throw new Error("[storage.spec.js] CRITICAL: window.GAMES_DEFAULT is not available or empty. Schemas from test_runner.html did not load. Aborting tests.");
        }
        window.GAMES = JSON.parse(JSON.stringify(window.GAMES_DEFAULT));
        // console.log("[Spec BeforeEach] window.GAMES initialized from window.GAMES_DEFAULT. Count:", window.GAMES.length);


        if (!window.app || !window.app.showToast) {
            // Minimal mock for app if not already more fully mocked by test_runner.html
            window.app = { showToast: function () { console.log("Fallback Mock app.showToast called"); } };
        }
        // Ensure showToast is a spy, even if test_runner.html defined it.
        if (window.app && window.app.showToast && !window.app.showToast.calls) { // Check if it's not already a spy
            spyOn(window.app, 'showToast').and.callThrough();
        }
        // console.log("[Spec BeforeEach] app.showToast spied upon or confirmed as spy");
        // console.log("[Spec BeforeEach] ENDING");
    });

    afterEach(function () {
        console.log("[Spec AfterEach] STARTING");
        console.log("[Spec AfterEach] ENDING");
    });

    describe("Game Results Management", function () {
        const testGameId = 'wordle-test'; // Define testGameId for this suite

        it("should add a new game result for today's local date", async function () {
            console.log("[Test Run GRM1] STARTING TEST - localDateToday:", localDateToday);
            console.log("[Test Run GRM1] initial testStorage.data.gameResults:", JSON.stringify(testStorage.data.gameResults));

            await testStorage.addGameResult(testGameId, "Raw Data 1");
            console.log("[Test Run GRM1] addGameResult (Raw Data 1) called");

            expect(setItemSpy).toHaveBeenCalledWith('guessrTrackerData', jasmine.stringMatching(/Raw Data 1/));
            console.log("[Test Run GRM1] setItemSpy expectation checked");

            const results = testStorage.getGameResults(testGameId);
            console.log("[Test Run GRM1] getGameResults called, results:", JSON.stringify(results));

            expect(results.length).toBe(1, "Should have 1 result after adding");
            if (results.length > 0) {
                expect(results[0].date).toBe(localDateToday, "Result date should be today (local)");
                expect(results[0].rawOutput).toBe("Raw Data 1");
            }
            console.log("[Test Run GRM1] ENDING TEST");
        });

        it("should update an existing game result if one already exists for today", async function () {
            await testStorage.addGameResult(testGameId, "Initial Data"); // First add
            await testStorage.addGameResult(testGameId, "Updated Data"); // Should update
            const results = testStorage.getGameResults(testGameId);
            expect(results.length).toBe(1, "Should still have 1 result after update");
            expect(results[0].rawOutput).toBe("Updated Data");
            expect(window.app.showToast).toHaveBeenCalledWith('Updated', 'Today\'s result has been updated', 'info');
        });

        it("isGameCompletedToday should return true if a result for local today exists", async function () {
            await testStorage.addGameResult(testGameId, "Some result for today");
            expect(testStorage.isGameCompletedToday(testGameId)).toBe(true);
        });

        it("isGameCompletedToday should return false if no result for local today exists", function () {
            expect(testStorage.isGameCompletedToday(testGameId)).toBe(false);
        });

        it("deleteGameResult should remove a specific result", async function () {
            await testStorage.addGameResult(testGameId, "To Be Deleted");
            await testStorage.deleteGameResult(testGameId, localDateToday);
            const results = testStorage.getGameResults(testGameId);
            expect(results.length).toBe(0, "Result should be deleted");
        });

        it("updateGameResult should modify an existing result identified by oldDate", async function () {
            const oldDate = "2023-01-01";
            // Ensure the structure for this gameId exists if addGameResult wasn't called to create it
            if (!testStorage.data.gameResults[testGameId]) {
                testStorage.data.gameResults[testGameId] = [];
            }
            testStorage.data.gameResults[testGameId].push({ date: oldDate, rawOutput: "Old Data" });
            await testStorage.updateGameResult(testGameId, oldDate, "New Data for Old Date");
            const results = testStorage.getGameResults(testGameId);
            expect(results[0].rawOutput).toBe("New Data for Old Date");
            expect(results[0].date).toBe(oldDate);
        });

        it("updateGameResult should change the date of an existing result if newDate is provided", async function () {
            const oldDate = "2023-01-01";
            const newDate = "2023-01-02";
            if (!testStorage.data.gameResults[testGameId]) {
                testStorage.data.gameResults[testGameId] = [];
            }
            testStorage.data.gameResults[testGameId].push({ date: oldDate, rawOutput: "Data to Move" });
            await testStorage.updateGameResult(testGameId, oldDate, "Data to Move", newDate);
            const results = testStorage.getGameResults(testGameId);
            expect(results.length).toBe(1);
            expect(results[0].date).toBe(newDate);
            expect(results[0].rawOutput).toBe("Data to Move");
        });
    });

    describe("Date Handling", function () {
        it("getLocalDateString should return a YYYY-MM-DD formatted string", function () {
            const dateStr = testStorage.getLocalDateString();
            expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe("Game Average Calculation", function () {
        const gameIdForAvg = 'nyt-connections-test'; // This ID should exist in GAMES_DEFAULT

        beforeEach(async function () {
            // Ensure window.GAMES is set for this specific suite, using the correct test schema
            const testSchema = window.GAMES_DEFAULT.find(g => g.id === gameIdForAvg);
            if (!testSchema) {
                throw new Error(`[storage.spec.js Game Average] Schema for ${gameIdForAvg} not found in window.GAMES_DEFAULT.`);
            }
            window.GAMES = [JSON.parse(JSON.stringify(testSchema))]; // Isolate to only this schema
            // console.log(`[Game Avg BeforeEach] window.GAMES set for ${gameIdForAvg}`);

            const baseDate = new Date(testStorage.getLocalDateString());

            // Clear any existing results for this gameId to ensure test isolation
            if (testStorage.data.gameResults[gameIdForAvg]) {
                testStorage.data.gameResults[gameIdForAvg] = [];
            } else {
                testStorage.data.gameResults[gameIdForAvg] = [];
            }

            const date1 = new Date(baseDate); date1.setDate(baseDate.getDate() - 2);
            const date2 = new Date(baseDate); date2.setDate(baseDate.getDate() - 1);

            testStorage.data.gameResults[gameIdForAvg].push(
                { date: date1.toISOString().split('T')[0], rawOutput: "Puzzle #1\n🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟦🟦🟦🟦\n🟪🟪🟪🟪" }, // 4 attempts
                { date: date2.toISOString().split('T')[0], rawOutput: "Puzzle #2\n🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟦🟦🟦🟦\n🟪🟪🟪🟪\n🟨🟨🟨🟨" }  // 5 attempts
            );
            await testStorage.saveData();
        });

        it("getGameAverage should calculate the average for the specified field and days", function () {
            const avg = testStorage.getGameAverage(gameIdForAvg, 'Attempts', 30);
            expect(avg).toBe("4.5"); // Based on nyt-connections-test schema and data
        });

        it("getGameAverage should return null if no valid results for the field", function () {
            // For this test, we need a game that exists but might not have 'Attempts' or its 'average_display'
            // Let's use wordle-test if available, or any other game ID
            const anotherGameId = 'wordle-test';
            const wordleTestSchema = window.GAMES_DEFAULT.find(g => g.id === anotherGameId);
            if (!wordleTestSchema) {
                throw new Error(`[storage.spec.js Game Average] Schema for ${anotherGameId} not found in window.GAMES_DEFAULT for null average test.`);
            }
            window.GAMES = [JSON.parse(JSON.stringify(wordleTestSchema))]; // Isolate

            const avg = testStorage.getGameAverage(anotherGameId, 'NonExistentField', 30);
            expect(avg).toBeNull();
        });
    });

    describe("Hidden Games Management", function () {
        const testGameId = 'wordle-test'; // Define testGameId for this suite

        it("should hide a game", async function () {
            expect(testStorage.isGameHidden(testGameId)).toBe(false);
            await testStorage.hideGame(testGameId);
            expect(testStorage.isGameHidden(testGameId)).toBe(true);
            expect(testStorage.data.hiddenGames).toContain(testGameId);
        });

        it("should unhide a game", async function () {
            await testStorage.hideGame(testGameId); // first hide it
            expect(testStorage.isGameHidden(testGameId)).toBe(true);
            await testStorage.unhideGame(testGameId);
            expect(testStorage.isGameHidden(testGameId)).toBe(false);
            expect(testStorage.data.hiddenGames).not.toContain(testGameId);
        });
    });

}); 