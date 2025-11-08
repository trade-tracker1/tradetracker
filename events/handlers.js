const Handlers = {
    handleTradeSubmit(e) {
        e.preventDefault();
        
        // Get all form values
        const pair = document.getElementById('pair').value.trim();
        const type = document.getElementById('type').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const entryTime = document.getElementById('entry-time').value;
        const closeTime = document.getElementById('close-time').value;
        const category = document.getElementById('category').value;
        const notes = document.getElementById('notes').value.trim();
        
        // Determine trade result and status
        let status, profitLoss;
        const profitLossAmount = parseFloat(document.getElementById('profit-loss').value) || 0;
        
        switch (window.tradeResult) {
            case 'win':
                status = 'closed';
                profitLoss = Math.abs(profitLossAmount);
                break;
            case 'loss':
                status = 'closed';
                profitLoss = -Math.abs(profitLossAmount);
                break;
            case 'open':
            default:
                status = 'open';
                profitLoss = null;
                break;
        }
        
        // Calculate the correct display date
        const entryDate = entryTime.split('T')[0];
        let displayDate;
        
        if (status === 'closed') {
            // For closed trades, use close date if available, otherwise use current date
            displayDate = closeTime ? closeTime.split('T')[0] : new Date().toISOString().split('T')[0];
        } else {
            // For open trades, always use entry date
            displayDate = entryDate;
        }
        
        // Build trade data object
    // Build trade data object
const tradeData = {
    pair,
    type,
    amount,
    entryTime,
    closeTime: status === 'closed' ? (closeTime || new Date().toISOString().slice(0, 16)) : '',
    profitLoss,
    date: displayDate,
    entryDate: entryDate,
    status,
    category,
    notes,
};
        
        // Add screenshot if exists
        if (window.currentScreenshot) {
            tradeData.screenshots = [window.currentScreenshot];
        }
        
        // Validate the form
        if (!Validation.validateTradeForm(tradeData)) {
            Validation.showErrors();
            return;
        }
        
        // Show loading state
        document.getElementById('trade-modal-loading').classList.add('show');
        document.getElementById('save-trade-btn').disabled = true;
        document.getElementById('save-trade-text').innerHTML = '<div class="loading-spinner"></div> Saving...';
        
        // Process the trade after a short delay for better UX
        setTimeout(() => {
            let successMessage = '';
            
            if (window.editingTradeId) {
                // UPDATE EXISTING TRADE
                const updatedTrade = TradeManager.updateTrade(window.editingTradeId, tradeData);
                if (updatedTrade) {
                    successMessage = 'Trade updated successfully';
                    console.log('Updated trade:', updatedTrade);
                }
            } else {
                // ADD NEW TRADE
                const newTrade = TradeManager.addTrade(tradeData);
                successMessage = 'Trade added successfully';
                console.log('Added new trade:', newTrade);
            }
            
            // Update UI
            Calendar.renderCalendar();
            Stats.updateStats();
            TradesList.renderRecentTrades();
            ChartManager.updateChart();
            Stats.updateMonthlySummary();
            
            // Refresh day summary if a day is selected
            if (window.selectedDay) {
                const day = new Date(window.selectedDay).getDate();
                Calendar.showDaySummary(window.selectedDay, day);
            }
            
            // Show success message and close modal
            ToastManager.show(successMessage, 'success');
            Modals.closeModal();
            
            // Reset form state
            document.getElementById('trade-modal-loading').classList.remove('show');
            document.getElementById('save-trade-btn').disabled = false;
            document.getElementById('save-trade-text').textContent = 'Save Trade';
            window.editingTradeId = null;
            window.currentScreenshot = null;
            
        }, 800);
    },

    handleSaveBalance() {
        const balance = parseFloat(document.getElementById('initial-balance').value);
        if (!isNaN(balance) && balance >= 0) {
            settings.initialBalance = balance;
            if (SettingsManager.updateSetting('initialBalance', balance)) {
                ToastManager.show('Initial balance updated successfully!', 'success');
                Stats.updateStats();
                ChartManager.updateChart();
            }
        } else {
            ToastManager.show('Please enter a valid balance amount.', 'error');
        }
    },

    handleExportExcel() {
        if (TradeManager.trades.length === 0) {
            ToastManager.show('No trades to export.', 'warning');
            return;
        }
        
        const exportData = TradeManager.trades.map(trade => ({
            'Trade ID': trade.id,
            'Pair': trade.pair,
            'Type': trade.type,
            'Amount Risked': trade.amount,
            'Entry Time': trade.entryTime,
            'Close Time': trade.closeTime || 'Open',
            'Profit/Loss': trade.profitLoss || 'Open',
            'Status': trade.status,
            'Category': trade.category || '',
            'Notes': trade.notes || '',
            'Entry Date': trade.entryDate,
            'Display Date': trade.date
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Trades');
        
        const fileName = `TradeJournal_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        ToastManager.show('Trades exported successfully!', 'success');
    },

  async handleImportExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const importStatus = document.getElementById('import-status');
    importStatus.textContent = 'Importing...';
    importStatus.style.color = 'var(--neutral-color)';
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                importStatus.textContent = 'No data found in file.';
                importStatus.style.color = 'var(--loss-color)';
                return;
            }
            
            let importedCount = 0;
            let skippedCount = 0;
            const tradesToImport = [];
            
            jsonData.forEach(row => {
                if (!row.Pair || !row.Type || row['Amount Risked'] === undefined) {
                    skippedCount++;
                    return;
                }
                
                const hasCloseTime = row['Close Time'] && row['Close Time'] !== 'Open';
                const hasProfitLoss = row['Profit/Loss'] !== undefined && row['Profit/Loss'] !== 'Open';
                const status = hasCloseTime && hasProfitLoss ? 'closed' : 'open';
                
                let displayDate;
                if (row['Display Date']) {
                    displayDate = row['Display Date'];
                } else if (hasCloseTime) {
                    displayDate = new Date(row['Close Time']).toISOString().split('T')[0];
                } else {
                    displayDate = new Date(row['Entry Time']).toISOString().split('T')[0];
                }
                
  const trade = {
    // REMOVE THIS LINE: id: parseInt(row['Trade ID']),
    pair: row.Pair,
    type: row.Type.toUpperCase(),
    amount: parseFloat(row['Amount Risked']),
    entryTime: row['Entry Time'].replace('T00:00', 'T12:00:00'),
    closeTime: hasCloseTime ? row['Close Time'].replace('T00:00', 'T12:00:00') : '',
    profitLoss: hasProfitLoss ? parseFloat(row['Profit/Loss']) : null,
    date: displayDate,
    entryDate: new Date(row['Entry Time']).toISOString().split('T')[0],
    status: status,
    category: row.Category || 'day',
    notes: row.Notes || '',
    screenshots: []
};
                
                tradesToImport.push(trade);
                importedCount++;
            });
            
            // Use the new importTrades method with cloud sync
            const actualImported = await TradeManager.importTrades(tradesToImport);
            
            // Refresh UI
            Calendar.renderCalendar();
            Stats.updateStats();
            TradesList.renderRecentTrades();
            ChartManager.updateChart();
            Stats.updateMonthlySummary();
            
            importStatus.textContent = `Successfully imported ${actualImported} trades. ${skippedCount} rows skipped.`;
            importStatus.style.color = 'var(--profit-color)';
            
            document.getElementById('import-excel').value = '';
            ToastManager.show(`Imported ${actualImported} trades successfully!`, 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            importStatus.textContent = 'Error importing file. Please check the format.';
            importStatus.style.color = 'var(--loss-color)';
            ToastManager.show('Error importing file. Please check the format.', 'error');
        }
    };
    
    reader.onerror = function() {
        importStatus.textContent = 'Error reading file.';
        importStatus.style.color = 'var(--loss-color)';
        ToastManager.show('Error reading file.', 'error');
    };
    
    reader.readAsArrayBuffer(file);
},

    toggleDarkMode() {
        settings.darkMode = document.getElementById('dark-mode-toggle').checked;
        SettingsManager.updateSetting('darkMode', settings.darkMode);
        
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        ChartManager.updateChart();
    },

    handleEditTradeFromDetails() {
        const tradeId = parseInt(document.getElementById('edit-trade-btn').getAttribute('data-trade-id'));
        Modals.closeTradeDetailsModal();
        Modals.openEditTradeModal(tradeId);
    },

    handleDeleteTradeFromDetails() {
        const tradeId = parseInt(document.getElementById('delete-trade-btn').getAttribute('data-trade-id'));
        if (confirm('Are you sure you want to delete this trade?')) {
            TradeManager.deleteTrade(tradeId);
            ToastManager.show('Trade deleted successfully', 'success');
            Modals.closeTradeDetailsModal();
            
            Calendar.renderCalendar();
            Stats.updateStats();
            TradesList.renderRecentTrades();
            ChartManager.updateChart();
            Stats.updateMonthlySummary();
            
            if (selectedDay) {
                const day = new Date(selectedDay).getDate();
                Calendar.showDaySummary(selectedDay, day);
            }
        }
    },

    deleteTrade(tradeId) {
        if (confirm('Are you sure you want to delete this trade?')) {
            TradeManager.deleteTrade(tradeId);
            ToastManager.show('Trade deleted successfully', 'success');
            
            Calendar.renderCalendar();
            Stats.updateStats();
            TradesList.renderRecentTrades();
            ChartManager.updateChart();
            Stats.updateMonthlySummary();
            TradesList.renderAllTradesList();
            
            if (selectedDay) {
                const day = new Date(selectedDay).getDate();
                Calendar.showDaySummary(selectedDay, day);
            }
        }
    }
};