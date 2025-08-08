class GameCharts {
    constructor() {
        this.charts = {};
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

        // Check if this game has CompletionState field
        const hasCompletionState = fields.has('CompletionState');

        // Create a dataset for each field
        fields.forEach(field => {
            if (field === 'CompletionState' && hasCompletionState) {
                // Calculate completion rate over time
                const completionRates = results.map((result, index) => {
                    const windowSize = 7; // 7-day rolling window
                    const startIdx = Math.max(0, index - windowSize + 1);
                    const window = results.slice(startIdx, index + 1);
                    const successful = window.filter(r => r.CompletionState === true).length;
                    return (successful / window.length) * 100;
                });

                datasets.push({
                    label: 'Success Rate (7-day)',
                    data: completionRates,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'percentage'
                });
            } else if (field !== 'CompletionState') { // Skip CompletionState for regular datasets
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

        // Only include percentage axis if we have a success rate dataset
        const hasSuccessRate = datasets.some(d => d.yAxisID === 'percentage');

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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    },
                    percentage: hasSuccessRate ? {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Success Rate (%)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    } : undefined
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (label.includes('Success Rate')) {
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