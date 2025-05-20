class GameCharts {
    constructor() {
        this.charts = {};
        // Register the time adapter
        Chart.register(ChartAdapter);
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    createChart(canvasId, gameId, results) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Clear any existing chart
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Sort results by date
        results.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Prepare data
        const dates = results.map(r => r.date);
        const datasets = [];

        // Get all possible fields from results
        const fields = new Set();
        results.forEach(result => {
            Object.keys(result).forEach(key => {
                if (key !== 'date') fields.add(key);
            });
        });

        // Create a dataset for each field
        fields.forEach(field => {
            if (field === 'CompletionState') {
                // Calculate completion rate over time
                const completionRates = results.map((result, index) => {
                    try {
                        // Always include at least the current result in calculations
                        const windowSize = Math.min(7, index + 1); // 7-day rolling window or all available results
                        const startIdx = Math.max(0, index - windowSize + 1);
                        const window = results.slice(startIdx, index + 1);

                        // Count results where CompletionState is true (explicitly check both true and undefined)
                        const successful = window.filter(r => r.CompletionState === true).length;
                        const successRate = (successful / window.length) * 100;

                        // Report low success rates for debugging
                        if (successful === 0 && windowSize > 0) {
                            console.error(`[CHART ERROR] Zero success rate for ${gameId} on ${result.date}. Window has ${window.length} results.`);
                            window.forEach((r, i) => {
                                console.log(`[CHART] Window item ${i}: Date=${r.date}, CompletionState=${r.CompletionState}`);
                            });
                        }

                        return successRate;
                    } catch (error) {
                        console.error(`[CHART ERROR] Error calculating success rate for ${gameId}:`, error);
                        return 0; // Default to 0% on error
                    }
                });

                datasets.push({
                    label: 'Completion Rate (7-day)',
                    data: completionRates,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'percentage'
                });
            } else {
                datasets.push({
                    label: field,
                    data: results.map(r => r[field]),
                    borderColor: this.getRandomColor(),
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    fill: false,
                    tension: 0.4
                });
            }
        });

        // Create the chart
        this.charts[canvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM d'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    },
                    percentage: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Completion Rate (%)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (label.includes('Completion Rate')) {
                                    return `${label}: ${value.toFixed(1)}%`;
                                }
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Create a global instance
const gameCharts = new GameCharts(); 