const Stats = {
    updateStats() {
        if (typeof TradeManager === 'undefined' || !window.settings) {
            console.warn('TradeManager or settings not available');
            return;
        }
        
        const stats = TradeManager.getTradeStats();
        
        const totalProfitElement = document.getElementById('total-profit');
        const totalProfitPercentElement = document.getElementById('total-profit-percent');
        const winRateElement = document.getElementById('win-rate');
        const totalTradesElement = document.getElementById('total-trades');
        const profitFactorElement = document.getElementById('profit-factor');
        const riskRewardElement = document.getElementById('risk-reward');
        
        if (totalProfitElement) {
            totalProfitElement.textContent = `${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toFixed(2)}`;
            totalProfitElement.className = `stat-value ${stats.totalProfit >= 0 ? 'positive-stat' : 'negative-stat'}`;
        }
        
        if (totalProfitPercentElement) {
            const profitPercent = (stats.totalProfit / window.settings.initialBalance) * 100;
            totalProfitPercentElement.textContent = `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`;
            totalProfitPercentElement.className = `stat-value ${profitPercent >= 0 ? 'positive-stat' : 'negative-stat'}`;
        }
        
        if (winRateElement) winRateElement.textContent = `${stats.winRate}%`;
        if (totalTradesElement) totalTradesElement.textContent = stats.totalTrades;
        if (profitFactorElement) profitFactorElement.textContent = stats.profitFactor;
        if (riskRewardElement) riskRewardElement.textContent = stats.avgRiskReward;
    },

    updateMonthlySummary() {
        if (typeof TradeManager === 'undefined' || typeof window.currentMonth === 'undefined' || typeof window.currentYear === 'undefined') {
            console.warn('Required dependencies not available for monthly summary');
            return;
        }
        
        const monthTrades = TradeManager.trades.filter(trade => {
            const tradeDate = new Date(trade.status === 'closed' && trade.closeTime ? trade.closeTime : trade.entryTime);
            return tradeDate.getMonth() === window.currentMonth && tradeDate.getFullYear() === window.currentYear;
        });
        
        const closedMonthTrades = monthTrades.filter(trade => trade.status === 'closed');
        const monthlyProfit = closedMonthTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
        const winningMonthTrades = closedMonthTrades.filter(trade => trade.profitLoss > 0).length;
        const monthlyWinRate = closedMonthTrades.length > 0 ? Math.round((winningMonthTrades / closedMonthTrades.length) * 100) : 0;
        
        const monthlyWins = closedMonthTrades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0);
        const monthlyLosses = Math.abs(closedMonthTrades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0));
        const monthlyProfitFactor = monthlyLosses > 0 ? (monthlyWins / monthlyLosses).toFixed(2) : monthlyWins > 0 ? '∞' : '0.00';
        
        const monthlyProfitPercent = (monthlyProfit / window.settings.initialBalance) * 100;
        
        // Update both desktop and mobile monthly summary elements
        const monthlyElements = [
            'monthly-profit', 'monthly-profit-percent', 'monthly-trades', 
            'monthly-win-rate', 'monthly-profit-factor', 'monthly-closed-trades'
        ];
        
        monthlyElements.forEach(element => {
            // Update desktop version
            const desktopElement = document.getElementById(element);
            if (desktopElement) {
                this.updateMonthlyElement(desktopElement, element, monthlyProfit, monthlyProfitPercent, monthlyWinRate, monthlyProfitFactor, monthTrades.length, closedMonthTrades.length);
            }
            
            // Update mobile version
            const mobileElement = document.getElementById(`${element}-mobile`);
            if (mobileElement) {
                this.updateMonthlyElement(mobileElement, element, monthlyProfit, monthlyProfitPercent, monthlyWinRate, monthlyProfitFactor, monthTrades.length, closedMonthTrades.length);
            }
        });
        
        // Update month names if Calendar is available
        if (typeof Calendar !== 'undefined') {
            const monthYear = `${Calendar.getMonthName(window.currentMonth)} ${window.currentYear}`;
            const summaryMonthElement = document.getElementById('summary-month');
            const summaryMonthMobileElement = document.getElementById('summary-month-mobile');
            
            if (summaryMonthElement) summaryMonthElement.textContent = monthYear;
            if (summaryMonthMobileElement) summaryMonthMobileElement.textContent = monthYear;
        }
    },
    
    updateMonthlyElement(element, elementId, monthlyProfit, monthlyProfitPercent, monthlyWinRate, monthlyProfitFactor, totalTrades, closedTrades) {
        switch (elementId) {
            case 'monthly-profit':
                element.textContent = `${monthlyProfit >= 0 ? '+' : ''}$${monthlyProfit.toFixed(2)}`;
                element.className = `summary-value ${monthlyProfit >= 0 ? 'positive-stat' : 'negative-stat'}`;
                break;
            case 'monthly-profit-percent':
                element.textContent = `${monthlyProfitPercent >= 0 ? '+' : ''}${monthlyProfitPercent.toFixed(2)}%`;
                element.className = `summary-value ${monthlyProfitPercent >= 0 ? 'positive-stat' : 'negative-stat'}`;
                break;
            case 'monthly-trades':
                element.textContent = totalTrades;
                break;
            case 'monthly-win-rate':
                element.textContent = `${monthlyWinRate}%`;
                break;
            case 'monthly-profit-factor':
                element.textContent = monthlyProfitFactor;
                break;
            case 'monthly-closed-trades':
                element.textContent = closedTrades;
                break;
        }
    }
};