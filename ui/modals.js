const Modals = {
openAddTradeModal() {
    window.editingTradeId = null;
    document.getElementById('trade-modal-title').textContent = 'Add New Trade';
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
        // Reset the form properly
        document.getElementById('trade-form').reset();
        
        // Clear any error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
        });
        document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
            el.classList.remove('error');
        });
        
        // Ensure trade type is set to default
        document.getElementById('type').value = 'BUY';
        
        window.tradeResult = 'open';
        const toggleOptions = document.querySelectorAll('.toggle-option');
        toggleOptions.forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.toggle-option.open').classList.add('selected');
        
        document.getElementById('profit-loss').disabled = true;
        document.getElementById('profit-loss').value = '';
        document.getElementById('risk-metrics-preview').style.display = 'none';
        document.getElementById('screenshot-preview').style.display = 'none';
        window.currentScreenshot = null;
        
        // Set default entry time to current time
        const today = new Date();
        const formatForInput = (date) => {
            return date.toISOString().slice(0, 16);
        };
        
        document.getElementById('entry-time').value = formatForInput(today);
        document.getElementById('close-time').value = '';
    }, 10);
    
    const modal = document.getElementById('trade-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Trigger animation
        setTimeout(() => modal.classList.add('show'), 10);
    }
},

  openEditTradeModal(tradeId) {
    console.log('=== EDIT TRADE MODAL START ===');
    
    window.editingTradeId = tradeId;
    const trade = TradeManager.trades.find(t => t.id === tradeId);
    
    if (!trade) return;
    
    document.getElementById('trade-modal-title').textContent = 'Edit Trade';
    
    // Clear errors without resetting form
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => el.classList.remove('show'));
    
    const formElements = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    formElements.forEach(el => el.classList.remove('error'));
    
    // Set form values DIRECTLY
    document.getElementById('pair').value = trade.pair;
    
    // FIXED: Trade type setting
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.value = trade.type;
        console.log('🔧 Trade type set to:', typeSelect.value, 'from trade:', trade.type);
    }
    
    document.getElementById('amount').value = trade.amount;
    
    // FIXED: Date formatting - ensure proper datetime-local format
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        // Handle both full ISO string and datetime-local format
        let date = new Date(dateString);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return '';
        }
        
        // Convert to datetime-local format: YYYY-MM-DDTHH:MM
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    // Set entry time with proper formatting
    const entryTimeFormatted = formatDateForInput(trade.entryTime);
    document.getElementById('entry-time').value = entryTimeFormatted;
    console.log('📅 Entry time set to:', entryTimeFormatted, 'from:', trade.entryTime);
    
    // Set close time with proper formatting (if exists)
    if (trade.closeTime) {
        const closeTimeFormatted = formatDateForInput(trade.closeTime);
        document.getElementById('close-time').value = closeTimeFormatted;
        console.log('📅 Close time set to:', closeTimeFormatted, 'from:', trade.closeTime);
    } else {
        document.getElementById('close-time').value = '';
    }
    
    document.getElementById('category').value = trade.category || 'day';
    document.getElementById('notes').value = trade.notes || '';
    
    // Set toggle state
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(opt => opt.classList.remove('selected'));
    
    if (trade.status === 'open') {
        document.querySelector('.toggle-option.open').classList.add('selected');
        window.tradeResult = 'open';
        document.getElementById('profit-loss').disabled = true;
        document.getElementById('profit-loss').value = '';
    } else {
        if (trade.profitLoss > 0) {
            document.querySelector('.toggle-option.win').classList.add('selected');
            window.tradeResult = 'win';
        } else {
            document.querySelector('.toggle-option.loss').classList.add('selected');
            window.tradeResult = 'loss';
        }
        document.getElementById('profit-loss').disabled = false;
        document.getElementById('profit-loss').value = Math.abs(trade.profitLoss);
    }
    
    // Set screenshot
    if (trade.screenshots && trade.screenshots.length > 0) {
        window.currentScreenshot = trade.screenshots[0];
        document.getElementById('screenshot-preview').src = window.currentScreenshot;
        document.getElementById('screenshot-preview').style.display = 'block';
    } else {
        document.getElementById('screenshot-preview').style.display = 'none';
        window.currentScreenshot = null;
    }
    
    // Final verification
    setTimeout(() => {
        const verifiedType = document.getElementById('type').value;
        const verifiedEntryTime = document.getElementById('entry-time').value;
        const verifiedCloseTime = document.getElementById('close-time').value;
        
        console.log('✅ Final verification:');
        console.log('   - Trade type:', verifiedType);
        console.log('   - Entry time:', verifiedEntryTime);
        console.log('   - Close time:', verifiedCloseTime);
        console.log('=== EDIT TRADE MODAL END ===');
        
        // Safety fallbacks
        if (!verifiedType && trade.type) {
            console.log('🔄 Safety fallback - forcing trade type:', trade.type);
            document.getElementById('type').value = trade.type;
        }
        
        if (!verifiedEntryTime && trade.entryTime) {
            console.log('🔄 Safety fallback - re-formatting entry time');
            document.getElementById('entry-time').value = formatDateForInput(trade.entryTime);
        }
    }, 50);
    
    Forms.updateRiskMetrics();
    
    const modal = document.getElementById('trade-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => modal.classList.add('show'), 10);
    }
},
    closeModal() {
        const modal = document.getElementById('trade-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    },

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Trigger animation
            setTimeout(() => modal.classList.add('show'), 10);
        }
    },

    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    },

    openAllTradesModal() {
        const modal = document.getElementById('all-trades-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Trigger animation
            setTimeout(() => modal.classList.add('show'), 10);
        }
    },

    closeAllTradesModal() {
        const modal = document.getElementById('all-trades-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
        window.selectedTradeIds.clear();
        window.selectedMobileTradeIds.clear();
        if (typeof TradesList !== 'undefined') {
            TradesList.updateSelectedCount();
        }
    },

showTradeDetails(tradeId) {
    const trade = TradeManager.trades.find(t => t.id === tradeId);
    if (!trade) return;
    
    document.getElementById('trade-details-title').textContent = `Trade Details: ${trade.pair}`;
    document.getElementById('edit-trade-btn').setAttribute('data-trade-id', tradeId);
    document.getElementById('delete-trade-btn').setAttribute('data-trade-id', tradeId);
    
    // Calculate risk metrics
    const riskMetrics = TradeManager.calculateRiskMetrics(trade, SettingsManager.settings.initialBalance);
    
    let screenshotsHtml = '';
    if (trade.screenshots && trade.screenshots.length > 0) {
        screenshotsHtml = `
            <div class="trade-detail-item">
                <div class="trade-detail-label">Screenshots:</div>
                <div class="trade-detail-value">
                    ${trade.screenshots.map((screenshot, index) => `
                        <img src="${screenshot}" class="screenshot-thumbnail" alt="Screenshot ${index + 1}" data-screenshot="${screenshot}">
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // FIX: Improved trade details with proper single-row layout
    document.getElementById('trade-details-content').innerHTML = `
        <div class="trade-details">
            <div class="trade-detail-item">
                <div class="trade-detail-label">Trading Pair:</div>
                <div class="trade-detail-value">${trade.pair}</div>
            </div>
            <div class="trade-detail-item">
                <div class="trade-detail-label">Type:</div>
                <div class="trade-detail-value">
                    <span class="trade-type ${trade.type.toLowerCase()}">${trade.type}</span>
                </div>
            </div>
            <div class="trade-detail-item">
                <div class="trade-detail-label">Amount Risked:</div>
                <div class="trade-detail-value">$${trade.amount.toFixed(2)}</div>
            </div>
            <div class="trade-detail-item">
                <div class="trade-detail-label">Entry Time:</div>
                <div class="trade-detail-value">${Helpers.formatDateTime(trade.entryTime)}</div>
            </div>
            ${trade.closeTime ? `
            <div class="trade-detail-item">
                <div class="trade-detail-label">Close Time:</div>
                <div class="trade-detail-value">${Helpers.formatDateTime(trade.closeTime)}</div>
            </div>
            ` : ''}
            <div class="trade-detail-item">
                <div class="trade-detail-label">Trade Duration:</div>
                <div class="trade-detail-value">${Helpers.calculateTradeDuration(trade.entryTime, trade.closeTime)}</div>
            </div>
            <div class="trade-detail-item">
                <div class="trade-detail-label">Status:</div>
                <div class="trade-detail-value">
                    <span class="${trade.status === 'closed' ? (trade.profitLoss >= 0 ? 'positive-stat' : 'negative-stat') : ''}">
                        ${trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                    </span>
                </div>
            </div>
            ${trade.profitLoss !== null ? `
            <div class="trade-detail-item">
                <div class="trade-detail-label">Profit/Loss:</div>
                <div class="trade-detail-value ${trade.profitLoss >= 0 ? 'positive-stat' : 'negative-stat'}">
                    ${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}
                </div>
            </div>
            ` : ''}
            ${riskMetrics ? `
            <div class="trade-detail-item">
                <div class="trade-detail-label">Risk/Reward Ratio:</div>
                <div class="trade-detail-value">${riskMetrics.riskReward}</div>
            </div>
            <div class="trade-detail-item">
                <div class="trade-detail-label">Risk %:</div>
                <div class="trade-detail-value">${riskMetrics.riskPercent}%</div>
            </div>
            ` : ''}
            ${trade.category ? `
            <div class="trade-detail-item">
                <div class="trade-detail-label">Category:</div>
                <div class="trade-detail-value">
                    <span class="category-badge category-${trade.category}">
                        ${trade.category.charAt(0).toUpperCase() + trade.category.slice(1)}
                    </span>
                </div>
            </div>
            ` : ''}
            ${screenshotsHtml}
            ${trade.notes ? `
            <div class="trade-detail-item">
                <div class="trade-detail-label">Notes:</div>
                <div class="trade-detail-value" style="white-space: pre-wrap; text-align: left;">${trade.notes}</div>
            </div>
            ` : ''}
            <div class="trade-detail-item">
                <div class="trade-detail-label">Created:</div>
                <div class="trade-detail-value">${Helpers.formatDateTime(trade.createdAt)}</div>
            </div>
            ${trade.updatedAt ? `
            <div class="trade-detail-item">
                <div class="trade-detail-label">Last Updated:</div>
                <div class="trade-detail-value">${Helpers.formatDateTime(trade.updatedAt)}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Add click event listeners to screenshot thumbnails
    document.querySelectorAll('.screenshot-thumbnail').forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const screenshotData = this.getAttribute('data-screenshot');
            Modals.showScreenshotFull(screenshotData);
        });
    });
    
    const modal = document.getElementById('trade-details-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Trigger animation
        setTimeout(() => modal.classList.add('show'), 10);
    }
},
  
    showScreenshotFull(screenshotData) {
        document.getElementById('screenshot-full-container').innerHTML = `
            <img src="${screenshotData}" class="screenshot-full" alt="Trade screenshot">
        `;
        const modal = document.getElementById('screenshot-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Trigger animation
            setTimeout(() => modal.classList.add('show'), 10);
        }
    },

    closeScreenshotModal() {
        const modal = document.getElementById('screenshot-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    },

    closeTradeDetailsModal() {
        const modal = document.getElementById('trade-details-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    },

    closeDaySummaryModal() {
        const modal = document.getElementById('day-summary-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    },

    // New function to handle click outside modal for closing
    // New function to handle modal opening without reset
setupModalHandlers() {
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            setTimeout(() => {
                e.target.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }, 300);
                });
            }
        }
    });
    
    // Prevent any default form reset behavior on modal open
    const originalShow = modal.style.display;
    // Override any reset behavior that might be attached to modal display
},
};

// Initialize modal close handlers when the script loads
Modals.setupModalCloseHandlers();