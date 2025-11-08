const TradesList = {
    showRecentTrades() {
        document.getElementById('right-panel-title').textContent = 'Recent Trades';
        this.renderRecentTrades();
    },

    renderRecentTrades() {
        const rightPanelContent = document.getElementById('right-panel-content');
        if (!rightPanelContent) {
            console.error('Right panel content element not found');
            return;
        }
        
        rightPanelContent.innerHTML = '';
        
        if (TradeManager.trades.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'trade-item';
            emptyState.innerHTML = `
                <div class="trade-info">
                    <div class="trade-pair">No trades yet</div>
                </div>
            `;
            rightPanelContent.appendChild(emptyState);
            return;
        }
        
        const sortedTrades = [...TradeManager.trades].sort((a, b) => {
            const dateA = a.status === 'closed' && a.closeTime ? new Date(a.closeTime) : new Date(a.entryTime);
            const dateB = b.status === 'closed' && b.closeTime ? new Date(b.closeTime) : new Date(b.entryTime);
            return dateB - dateA;
        }).slice(0, 5);
        
        sortedTrades.forEach(trade => {
            const tradeEl = document.createElement('div');
            tradeEl.className = 'trade-item';
            tradeEl.setAttribute('data-trade-id', trade.id);
            
            const profitLossDisplay = trade.status === 'open' ? 
                'Open' : 
                `${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}`;
            
            const formattedDate = Helpers.formatDate(trade.entryTime);
            
            tradeEl.innerHTML = `
                <div class="trade-info">
                    <div class="trade-pair">${trade.pair}</div>
                    <div class="trade-type ${trade.type.toLowerCase()}">${trade.type}</div>
                    <div class="trade-date">${formattedDate}</div>
                </div>
                <div class="trade-profit ${trade.status === 'closed' ? (trade.profitLoss >= 0 ? 'positive' : 'negative') : ''}">
                    ${profitLossDisplay}
                </div>
            `;
            
            rightPanelContent.appendChild(tradeEl);
        });
        
        document.querySelectorAll('.trade-item[data-trade-id]').forEach(item => {
            item.addEventListener('click', function() {
                const tradeId = parseInt(this.getAttribute('data-trade-id'));
                Modals.showTradeDetails(tradeId);
            });
        });
    },

    openAllTradesModal() {
    console.log('Opening all trades modal');
    this.renderAllTradesList();
    const modal = document.getElementById('all-trades-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Trigger animation
        setTimeout(() => modal.classList.add('show'), 10);
    } else {
        console.error('All trades modal element not found');
    }
},

    renderAllTradesList() {
        const allTradesListMobile = document.getElementById('all-trades-list-mobile');
        const allTradesListDesktop = document.getElementById('all-trades-list-desktop');
        
        if (!allTradesListMobile || !allTradesListDesktop) {
            console.error('Trade list elements not found');
            return;
        }
        
        allTradesListMobile.innerHTML = '';
        allTradesListDesktop.innerHTML = '';
        
        const searchTerm = document.getElementById('trade-search')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('trade-filter')?.value || 'all';
        
        let filteredTrades = TradeManager.trades;
        
        if (searchTerm) {
            filteredTrades = filteredTrades.filter(trade => 
                trade.pair.toLowerCase().includes(searchTerm) ||
                (trade.notes && trade.notes.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filterValue !== 'all') {
            if (filterValue === 'win') {
                filteredTrades = filteredTrades.filter(trade => 
                    trade.status === 'closed' && trade.profitLoss > 0
                );
            } else if (filterValue === 'loss') {
                filteredTrades = filteredTrades.filter(trade => 
                    trade.status === 'closed' && trade.profitLoss < 0
                );
            } else if (filterValue === 'open') {
                filteredTrades = filteredTrades.filter(trade => trade.status === 'open');
            }
        }
        
        const sortedTrades = filteredTrades.sort((a, b) => {
            const dateA = a.status === 'closed' && a.closeTime ? new Date(a.closeTime) : new Date(a.entryTime);
            const dateB = b.status === 'closed' && b.closeTime ? new Date(b.closeTime) : new Date(b.entryTime);
            return dateB - dateA;
        });
        
        // Mobile version
        sortedTrades.forEach(trade => {
            const tradeEl = document.createElement('div');
            tradeEl.className = 'mobile-trade-item';
            tradeEl.setAttribute('data-trade-id', trade.id);
            
            if (window.selectedMobileTradeIds.has(trade.id)) {
                tradeEl.classList.add('selected');
            }
            
            const formattedOpenDate = Helpers.formatDate(trade.entryTime);
            
            let formattedCloseDate = 'Open';
            if (trade.status === 'closed' && trade.closeTime) {
                formattedCloseDate = Helpers.formatDate(trade.closeTime);
            }
            
            tradeEl.innerHTML = `
                <div class="mobile-trade-row-1">
                    <div class="mobile-trade-pair">${trade.pair}</div>
                    <div class="mobile-trade-type ${trade.type.toLowerCase()}">${trade.type}</div>
                </div>
                <div class="mobile-trade-row-2">
                    <div class="mobile-trade-date">${formattedOpenDate}</div>
                    <div class="mobile-trade-date">${formattedCloseDate}</div>
                    <div class="mobile-trade-pnl ${trade.status === 'closed' ? (trade.profitLoss >= 0 ? 'positive' : 'negative') : ''}">
                        ${trade.status === 'open' ? 'Open' : (trade.profitLoss >= 0 ? '+' : '') + '$' + trade.profitLoss.toFixed(2)}
                    </div>
                </div>
            `;
            
            allTradesListMobile.appendChild(tradeEl);
        });
        
        // Add event listeners for mobile trades
        allTradesListMobile.querySelectorAll('.mobile-trade-item').forEach(item => {
            const tradeId = parseInt(item.getAttribute('data-trade-id'));
            
            item.addEventListener('click', (e) => {
                if (window.selectedMobileTradeIds.size === 0) {
                    Modals.showTradeDetails(tradeId);
                } else {
                    TradesList.toggleMobileTradeSelection(tradeId, item);
                }
            });
            
            item.addEventListener('touchstart', (e) => {
                window.longPressTimer = setTimeout(() => {
                    TradesList.toggleMobileTradeSelection(tradeId, item);
                    e.preventDefault();
                }, 500);
            });
            
            item.addEventListener('touchend', () => {
                clearTimeout(window.longPressTimer);
            });
            
            item.addEventListener('touchmove', () => {
                clearTimeout(window.longPressTimer);
            });
        });
        
        // Desktop version
        sortedTrades.forEach(trade => {
            const tradeEl = document.createElement('div');
            tradeEl.className = 'trade-management-item';
            
            const formattedDate = Helpers.formatDate(trade.entryTime);
            
            const categoryClass = trade.category ? `category-${trade.category}` : '';
            const categoryName = trade.category ? trade.category.charAt(0).toUpperCase() + trade.category.slice(1) : '';
            
            const isChecked = window.selectedTradeIds.has(trade.id);
            
            tradeEl.innerHTML = `
                <div class="trade-management-info">
                    <input type="checkbox" class="trade-checkbox" value="${trade.id}" ${isChecked ? 'checked' : ''}>
                    <div class="trade-management-pair">${trade.pair} ${trade.category ? `<span class="category-badge ${categoryClass}">${categoryName}</span>` : ''}</div>
                    <div class="trade-management-type ${trade.type.toLowerCase()}">${trade.type}</div>
                    <div class="trade-profit ${trade.status === 'closed' ? (trade.profitLoss >= 0 ? 'positive' : 'negative') : ''}">
                        ${trade.status === 'open' ? 'Open' : (trade.profitLoss >= 0 ? '+' : '') + '$' + trade.profitLoss.toFixed(2)}
                    </div>
                    <div class="trade-management-date">${formattedDate}</div>
                    <div class="trade-management-amount">$${trade.amount.toFixed(2)}</div>
                </div>
                <div class="trade-management-actions">
                    ${trade.status === 'open' ? `
                        <button class="action-btn edit-btn" data-id="${trade.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    ` : ''}
                    <button class="action-btn delete-btn" data-id="${trade.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;        
            allTradesListDesktop.appendChild(tradeEl);
        });
        
        // Add event listeners to desktop checkboxes
        allTradesListDesktop.querySelectorAll('.trade-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const tradeId = parseInt(this.value);
                if (this.checked) {
                    window.selectedTradeIds.add(tradeId);
                } else {
                    window.selectedTradeIds.delete(tradeId);
                }
                TradesList.updateSelectedCount();
            });
        });
        
        // Add event listeners to desktop edit and delete buttons
        allTradesListDesktop.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tradeId = parseInt(this.getAttribute('data-id'));
                Modals.closeAllTradesModal();
                Modals.openEditTradeModal(tradeId);
            });
        });
        
        allTradesListDesktop.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tradeId = parseInt(this.getAttribute('data-id'));
                Handlers.deleteTrade(tradeId);
            });
        });
        
        if (window.innerWidth <= 768) {
            allTradesListDesktop.style.display = 'none';
            allTradesListMobile.style.display = 'block';
            const desktopBulk = document.getElementById('desktop-bulk-actions');
            const mobileBulk = document.getElementById('mobile-bulk-actions');
            if (desktopBulk) desktopBulk.style.display = 'none';
            if (mobileBulk) mobileBulk.style.display = 'grid';
        } else {
            allTradesListDesktop.style.display = 'block';
            allTradesListMobile.style.display = 'none';
            const desktopBulk = document.getElementById('desktop-bulk-actions');
            const mobileBulk = document.getElementById('mobile-bulk-actions');
            if (desktopBulk) desktopBulk.style.display = 'grid';
            if (mobileBulk) mobileBulk.style.display = 'none';
        }
        
        this.updateSelectedCount();
    },

    toggleMobileTradeSelection(tradeId, element) {
        if (window.selectedMobileTradeIds.has(tradeId)) {
            window.selectedMobileTradeIds.delete(tradeId);
            element.classList.remove('selected');
        } else {
            window.selectedMobileTradeIds.add(tradeId);
            element.classList.add('selected');
        }
        this.updateSelectedCount();
    },

    selectAllTrades() {
        const searchTerm = document.getElementById('trade-search')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('trade-filter')?.value || 'all';
        
        let filteredTrades = TradeManager.trades;
        
        if (searchTerm) {
            filteredTrades = filteredTrades.filter(trade => 
                trade.pair.toLowerCase().includes(searchTerm) ||
                (trade.notes && trade.notes.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filterValue !== 'all') {
            if (filterValue === 'win') {
                filteredTrades = filteredTrades.filter(trade => 
                    trade.status === 'closed' && trade.profitLoss > 0
                );
            } else if (filterValue === 'loss') {
                filteredTrades = filteredTrades.filter(trade => 
                    trade.status === 'closed' && trade.profitLoss < 0
                );
            } else if (filterValue === 'open') {
                filteredTrades = filteredTrades.filter(trade => trade.status === 'open');
            }
        }
        
        filteredTrades.forEach(trade => {
            window.selectedTradeIds.add(trade.id);
            window.selectedMobileTradeIds.add(trade.id);
        });
        
        this.renderAllTradesList();
    },

    deselectAllTrades() {
        window.selectedTradeIds.clear();
        window.selectedMobileTradeIds.clear();
        this.renderAllTradesList();
    },

    deleteSelectedTrades() {
        const selectedIds = window.innerWidth <= 768 ? 
            Array.from(window.selectedMobileTradeIds) : 
            Array.from(window.selectedTradeIds);
        
        if (selectedIds.length === 0) {
            ToastManager.show('No trades selected', 'warning');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${selectedIds.length} trade(s)?`)) {
            TradeManager.deleteMultipleTrades(selectedIds);
            ToastManager.show(`${selectedIds.length} trade(s) deleted successfully`, 'success');
            
            window.selectedTradeIds.clear();
            window.selectedMobileTradeIds.clear();
            
            Calendar.renderCalendar();
            Stats.updateStats();
            this.renderRecentTrades();
            ChartManager.updateChart();
            Stats.updateMonthlySummary();
            this.renderAllTradesList();
            
            if (window.selectedDay) {
                const day = new Date(window.selectedDay).getDate();
                Calendar.showDaySummary(window.selectedDay, day);
            }
        }
    },

    deleteAllTrades() {
        if (TradeManager.trades.length === 0) {
            ToastManager.show('No trades to delete', 'warning');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ALL ${TradeManager.trades.length} trades? This action cannot be undone.`)) {
            TradeManager.trades = [];
            TradeManager.saveTrades();
            ToastManager.show('All trades deleted successfully', 'success');
            
            window.selectedTradeIds.clear();
            window.selectedMobileTradeIds.clear();
            
            Calendar.renderCalendar();
            Stats.updateStats();
            this.renderRecentTrades();
            ChartManager.updateChart();
            Stats.updateMonthlySummary();
            this.renderAllTradesList();
            
            if (window.selectedDay) {
                const day = new Date(window.selectedDay).getDate();
                Calendar.showDaySummary(window.selectedDay, day);
            }
        }
    },

    updateSelectedCount() {
        const selectedCount = window.innerWidth <= 768 ? 
            window.selectedMobileTradeIds.size : 
            window.selectedTradeIds.size;
        
        const selectedCountElement = document.getElementById('selected-count');
        if (selectedCountElement) {
            selectedCountElement.textContent = `${selectedCount} trade(s) selected`;
        }
    }
};