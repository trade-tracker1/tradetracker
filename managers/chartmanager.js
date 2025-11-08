const ChartManager = {
    chart: null,
    
    init() {
        this.renderChart([], []);
    },
    
    updateChart() {
        const closedTrades = TradeManager.trades
            .filter(t => t.status === 'closed')
            .sort((a, b) => new Date(a.closeTime) - new Date(b.closeTime));
        
        let balanceData = [SettingsManager.settings.initialBalance];
        let labels = ['Initial'];
        let tooltipLabels = ['Initial'];
        let tradePairs = [''];
        let runningBalance = SettingsManager.settings.initialBalance;
        
        closedTrades.forEach(trade => {
            runningBalance += trade.profitLoss;
            balanceData.push(runningBalance);
            const date = new Date(trade.closeTime);
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const shortYear = date.getFullYear().toString().slice(-2);
            labels.push(`${day}/${month}/${shortYear}`);
            
            const fullYear = date.getFullYear();
            tooltipLabels.push(`${day}/${month}/${fullYear}`);
            tradePairs.push(trade.pair);
        });
        
        const currentBalance = closedTrades.length > 0 ? 
            balanceData[balanceData.length - 1] : 
            SettingsManager.settings.initialBalance;
        
        document.getElementById('current-balance').textContent = 
            `$${currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        if (closedTrades.length === 0) {
            balanceData = [SettingsManager.settings.initialBalance];
            labels = ['Initial'];
            tooltipLabels = ['Initial'];
            tradePairs = [''];
        }
        
        this.renderChart(labels, balanceData, tooltipLabels, tradePairs);
    },

    renderChart(labels, data, tooltipLabels = [], tradePairs = []) {
        const ctx = document.getElementById('balance-chart').getContext('2d');
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');
        const gridColor = getComputedStyle(document.body).getPropertyValue('--border-color');
        const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Account Balance',
                    data: data,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        display: false 
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: primaryColor,
                        borderWidth: 1,
                        callbacks: {
                            title: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const date = tooltipLabels[index] || labels[index];
                                const pair = tradePairs[index] || '';
                                if (index === 0) {
                                    return 'Initial Balance';
                                }
                                return `${date} ${pair ? `- ${pair}` : ''}`;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return `Balance: $${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        ticks: { 
                            color: textColor,
                            maxTicksLimit: 8,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { 
                            color: gridColor,
                            drawBorder: false
                        }
                    },
                    y: {
                        ticks: { 
                            color: textColor,
                            callback: value => '$' + value.toLocaleString()
                        },
                        grid: { 
                            color: gridColor,
                            drawBorder: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
};