const Calendar = {
    renderCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.error('Calendar element not found');
            return;
        }
        
        calendarEl.innerHTML = '';
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            calendarEl.appendChild(dayHeader);
        });
        
        const monthYear = `${this.getMonthName(window.currentMonth)} ${window.currentYear}`;
        const currentMonthElement = document.getElementById('current-month');
        if (currentMonthElement) currentMonthElement.textContent = monthYear;
        
        // Update both summary locations
        const summaryMonthElement = document.getElementById('summary-month');
        const summaryMonthMobileElement = document.getElementById('summary-month-mobile');
        if (summaryMonthElement) summaryMonthElement.textContent = monthYear;
        if (summaryMonthMobileElement) summaryMonthMobileElement.textContent = monthYear;
        
        const firstDay = new Date(window.currentYear, window.currentMonth, 1).getDay();
        const daysInMonth = new Date(window.currentYear, window.currentMonth + 1, 0).getDate();
        const prevMonthLastDay = new Date(window.currentYear, window.currentMonth, 0).getDate();
        
        const fragment = document.createDocumentFragment();
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day prev-month-day';
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = prevMonthLastDay - i;
            dayEl.appendChild(dayNumber);
            fragment.appendChild(dayEl);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            
            const today = new Date();
            if (day === today.getDate() && 
                window.currentMonth === today.getMonth() && 
                window.currentYear === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayEl.appendChild(dayNumber);
            
            const dateStr = `${window.currentYear}-${String(window.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dailyTrades = this.getTradesForDay(dateStr);
            const closedTrades = dailyTrades.filter(trade => trade.status === 'closed');
            const dailyProfitLoss = closedTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
            
            if (closedTrades.length > 0) {
                const pnlEl = document.createElement('div');
                pnlEl.className = dailyProfitLoss >= 0 ? 'profit' : 'loss';
                pnlEl.textContent = dailyProfitLoss >= 0 ? `+$${dailyProfitLoss.toFixed(2)}` : `-$${Math.abs(dailyProfitLoss).toFixed(2)}`;
                dayEl.appendChild(pnlEl);
            }
            
            if (dailyTrades.length > 0) {
                const tradeCount = document.createElement('div');
                tradeCount.className = 'trade-count';
                tradeCount.textContent = `${dailyTrades.length} trade${dailyTrades.length > 1 ? 's' : ''}`;
                dayEl.appendChild(tradeCount);
            }
            
            dayEl.addEventListener('click', () => {
                this.showDaySummary(dateStr, day);
            });
            
            fragment.appendChild(dayEl);
        }
        
        // Next month days
        const totalCells = 42;
        const cellsUsed = firstDay + daysInMonth;
        const nextMonthDays = totalCells - cellsUsed;
        
        for (let day = 1; day <= nextMonthDays; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day prev-month-day';
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayEl.appendChild(dayNumber);
            fragment.appendChild(dayEl);
        }
        
        calendarEl.appendChild(fragment);
        
        // Update monthly summary stats safely
        if (typeof Stats !== 'undefined') {
            Stats.updateMonthlySummary();
        }
    },

getTradesForDay(dateStr) {
    if (typeof TradeManager === 'undefined') return [];
    
    return TradeManager.trades.filter(trade => {
        // FIX: More robust date matching
        let tradeDate;
        
        if (trade.status === 'open') {
            // For open trades, use entry date
            tradeDate = trade.entryTime ? trade.entryTime.split('T')[0] : trade.date;
        } else {
            // For closed trades, prefer close date, fall back to trade.date
            if (trade.closeTime) {
                tradeDate = trade.closeTime.split('T')[0];
            } else {
                tradeDate = trade.date;
            }
        }
        
        return tradeDate === dateStr;
    });
},
 showDaySummary(dateStr, day) {
    window.selectedDay = dateStr;
    const dailyTrades = this.getTradesForDay(dateStr);
    const closedTrades = dailyTrades.filter(trade => trade.status === 'closed');
    const dailyProfitLoss = closedTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const winningTrades = closedTrades.filter(trade => trade.profitLoss > 0).length;
    const winRate = closedTrades.length > 0 ? Math.round((winningTrades / closedTrades.length) * 100) : 0;
    
    // Calculate additional stats for 3x3 grid
    const totalTrades = dailyTrades.length;
    const openTrades = dailyTrades.filter(trade => trade.status === 'open').length;
    const avgProfitPerTrade = closedTrades.length > 0 ? (dailyProfitLoss / closedTrades.length) : 0;
    const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.profitLoss)) : 0;
    const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.profitLoss)) : 0;
    const totalAmountRisked = dailyTrades.reduce((sum, trade) => sum + trade.amount, 0);

    const dateObj = new Date(dateStr);
    const monthName = this.getMonthName(dateObj.getMonth());
    
    if (window.innerWidth <= 768) {
        // Mobile modal view - FIXED: Proper modal display
        const modalTitle = document.getElementById('day-summary-modal-title');
        if (modalTitle) modalTitle.textContent = `Summary: ${monthName} ${day}`;
        
        let tradesHtml = '';
        if (dailyTrades.length > 0) {
            tradesHtml = dailyTrades.map(trade => {
                const duration = typeof Helpers !== 'undefined' ? Helpers.calculateTradeDuration(trade.entryTime, trade.closeTime) : '';
                const formattedDate = typeof Helpers !== 'undefined' ? Helpers.formatDate(trade.entryTime) : new Date(trade.entryTime).toLocaleDateString();
                
                return `
                <div class="day-trade-item" data-trade-id="${trade.id}">
                    <div class="day-trade-info">
                        <div class="day-trade-pair">${trade.pair}</div>
                        <div class="day-trade-type ${trade.type.toLowerCase()}">${trade.type}</div>
                        <div class="day-trade-date">${formattedDate}</div>
                    </div>
                    <div class="day-trade-profit ${trade.status === 'closed' ? (trade.profitLoss >= 0 ? 'positive' : 'negative') : ''}">
                        ${trade.status === 'open' ? 'Open' : (trade.profitLoss >= 0 ? '+' : '') + '$' + trade.profitLoss.toFixed(2)}
                    </div>
                </div>
                `;
            }).join('');
        } else {
            tradesHtml = '<p style="text-align: center; color: var(--neutral-color); padding: 20px;">No trades for this day</p>';
        }
        
        const modalContent = document.getElementById('day-summary-modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="mobile-day-summary-stats">
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value ${dailyProfitLoss >= 0 ? 'positive-stat' : 'negative-stat'}">
                            ${dailyProfitLoss >= 0 ? '+' : ''}$${dailyProfitLoss.toFixed(2)}
                        </div>
                        <div class="mobile-day-summary-label">Daily P&L</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value">${totalTrades}</div>
                        <div class="mobile-day-summary-label">Total Trades</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value">${winRate}%</div>
                        <div class="mobile-day-summary-label">Win Rate</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value">${closedTrades.length}</div>
                        <div class="mobile-day-summary-label">Closed Trades</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value">${openTrades}</div>
                        <div class="mobile-day-summary-label">Open Trades</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value ${avgProfitPerTrade >= 0 ? 'positive-stat' : 'negative-stat'}">
                            ${avgProfitPerTrade >= 0 ? '+' : ''}$${avgProfitPerTrade.toFixed(2)}
                        </div>
                        <div class="mobile-day-summary-label">Avg P&L</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value positive-stat">
                            +$${bestTrade.toFixed(2)}
                        </div>
                        <div class="mobile-day-summary-label">Best Trade</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value">$${totalAmountRisked.toFixed(2)}</div>
                        <div class="mobile-day-summary-label">Total Risked</div>
                    </div>
                    <div class="mobile-day-summary-stat">
                        <div class="mobile-day-summary-value negative-stat">
                            $${worstTrade.toFixed(2)}
                        </div>
                        <div class="mobile-day-summary-label">Worst Trade</div>
                    </div>
                </div>
                <div class="mobile-day-trades-list">
                    ${tradesHtml}
                </div>
            `;
        }
        
        // Add click event listeners to trade items
        setTimeout(() => {
            document.querySelectorAll('#day-summary-modal-content .day-trade-item[data-trade-id]').forEach(item => {
                item.addEventListener('click', function() {
                    const tradeId = parseInt(this.getAttribute('data-trade-id'));
                    if (typeof Modals !== 'undefined') {
                        Modals.closeDaySummaryModal();
                        Modals.showTradeDetails(tradeId);
                    }
                });
            });
        }, 100);
        
        // FIXED: Proper modal display with animation
        const daySummaryModal = document.getElementById('day-summary-modal');
        if (daySummaryModal) {
            daySummaryModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Trigger animation
            setTimeout(() => daySummaryModal.classList.add('show'), 10);
        }
    } else {
            // Desktop right panel view
            const rightPanelTitle = document.getElementById('right-panel-title');
            if (rightPanelTitle) rightPanelTitle.textContent = `Summary: ${monthName} ${day}`;
            
            const rightPanelContent = document.getElementById('right-panel-content');
            if (rightPanelContent) {
                let tradesHtml = '';
                if (dailyTrades.length > 0) {
                    tradesHtml = dailyTrades.map(trade => {
                        const duration = typeof Helpers !== 'undefined' ? Helpers.calculateTradeDuration(trade.entryTime, trade.closeTime) : '';
                        const formattedDate = typeof Helpers !== 'undefined' ? Helpers.formatDate(trade.entryTime) : new Date(trade.entryTime).toLocaleDateString();
                        
                        return `
                        <div class="day-trade-item" data-trade-id="${trade.id}">
                            <div class="day-trade-info">
                                <div class="day-trade-pair">${trade.pair}</div>
                                <div class="day-trade-type ${trade.type.toLowerCase()}">${trade.type}</div>
                                <div class="day-trade-date">${formattedDate}</div>
                            </div>
                            <div class="day-trade-profit ${trade.status === 'closed' ? (trade.profitLoss >= 0 ? 'positive' : 'negative') : ''}">
                                ${trade.status === 'open' ? 'Open' : (trade.profitLoss >= 0 ? '+' : '') + '$' + trade.profitLoss.toFixed(2)}
                            </div>
                        </div>
                        `;
                    }).join('');
                } else {
                    tradesHtml = '<p style="text-align: center; color: var(--neutral-color); padding: 20px;">No trades for this day</p>';
                }
                
                rightPanelContent.innerHTML = `
                    <div class="day-summary">
                        <div class="day-summary-stats">
                            <div class="day-summary-stat">
                                <div class="day-summary-value ${dailyProfitLoss >= 0 ? 'positive-stat' : 'negative-stat'}">
                                    ${dailyProfitLoss >= 0 ? '+' : ''}$${dailyProfitLoss.toFixed(2)}
                                </div>
                                <div class="day-summary-label">Daily P&L</div>
                            </div>
                            <div class="day-summary-stat">
                                <div class="day-summary-value">${dailyTrades.length}</div>
                                <div class="day-summary-label">Total Trades</div>
                            </div>
                            <div class="day-summary-stat">
                                <div class="day-summary-value">${winRate}%</div>
                                <div class="day-summary-label">Win Rate</div>
                            </div>
                            <div class="day-summary-stat">
                                <div class="day-summary-value">${closedTrades.length}</div>
                                <div class="day-summary-label">Closed Trades</div>
                            </div>
                        </div>
                        <div class="day-trades-list">
                            ${tradesHtml}
                        </div>
                    </div>
                `;
                
                // Add click event listeners to trade items
                document.querySelectorAll('.day-trade-item[data-trade-id]').forEach(item => {
                    item.addEventListener('click', function() {
                        const tradeId = parseInt(this.getAttribute('data-trade-id'));
                        if (typeof Modals !== 'undefined') {
                            Modals.showTradeDetails(tradeId);
                        }
                    });
                });
            }
        }
    },

    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    },

    goToPreviousMonth() {
        window.currentMonth--;
        if (window.currentMonth < 0) {
            window.currentMonth = 11;
            window.currentYear--;
        }
        this.renderCalendar();
        if (typeof Stats !== 'undefined') Stats.updateMonthlySummary();
        if (typeof TradesList !== 'undefined') TradesList.showRecentTrades();
    },

    goToNextMonth() {
        window.currentMonth++;
        if (window.currentMonth > 11) {
            window.currentMonth = 0;
            window.currentYear++;
        }
        this.renderCalendar();
        if (typeof Stats !== 'undefined') Stats.updateMonthlySummary();
        if (typeof TradesList !== 'undefined') TradesList.showRecentTrades();
    },

    goToToday() {
        const today = new Date();
        window.currentMonth = today.getMonth();
        window.currentYear = today.getFullYear();
        this.renderCalendar();
        if (typeof Stats !== 'undefined') Stats.updateMonthlySummary();
        if (typeof TradesList !== 'undefined') TradesList.showRecentTrades();
    }
};