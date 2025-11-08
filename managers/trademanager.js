// Add UUID generator function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
const TradeManager = {
    trades: [],
    isOnline: false,
    
    async init() {
    console.log('Initializing TradeManager...');
    
    if (typeof SupabaseManager !== 'undefined') {
        try {
            SupabaseManager.init();
            
            const currentUser = SupabaseManager.currentUser;
            if (currentUser) {
                console.log('User signed in:', currentUser.email);
                this.isOnline = true;
                
                // ONLY load from cloud, don't sync local data
                try {
                    console.log('📥 Loading data from cloud only...');
                    const cloudTrades = await SupabaseManager.loadTrades();
                    this.trades = cloudTrades;
                    
                    // Update local storage with cloud data
                    localStorage.setItem('tradeTrackerTrades', JSON.stringify(cloudTrades));
                    
                    console.log('✅ Loaded', this.trades.length, 'trades from cloud');
                    ToastManager.show(`Loaded ${this.trades.length} trades from cloud`, 'success');
                } catch (error) {
                    console.error('❌ Cloud load failed:', error);
                    // Fall back to local storage if cloud fails
                    this.loadFromLocalStorage();
                    ToastManager.show('Using local data - cloud load failed', 'warning');
                }
            } else {
                console.log('No user signed in, using local storage only');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Supabase initialization failed:', error);
            this.loadFromLocalStorage();
        }
    } else {
        console.log('SupabaseManager not available, using local storage');
        this.loadFromLocalStorage();
    }
    
    this.trades.forEach(trade => {
        if (!trade.screenshots) trade.screenshots = [];
    });
},
    
    loadFromLocalStorage() {
        console.log('Loading from local storage...');
        const savedTrades = localStorage.getItem('tradeTrackerTrades');
        if (savedTrades) {
            try {
                this.trades = JSON.parse(savedTrades);
                console.log('Loaded', this.trades.length, 'trades from local storage');
            } catch (error) {
                console.error('Error parsing local trades:', error);
                ToastManager.show('Error loading local trades', 'error');
                this.trades = [];
            }
        } else {
            console.log('No local trades found');
            this.trades = [];
        }
        this.isOnline = false;
    },
    
    async saveTrades() {
        console.log('💾 TradeManager: Saving trades...');
        
        try {
            localStorage.setItem('tradeTrackerTrades', JSON.stringify(this.trades));
            console.log('✅ Saved to local storage');
        } catch (error) {
            console.error('❌ Local storage save failed:', error);
        }
        
        if (this.isOnline && typeof SupabaseManager !== 'undefined') {
            try {
                console.log('☁️ Attempting cloud save...');
                await SupabaseManager.saveTrades(this.trades);
                console.log('✅ Cloud save successful');
            } catch (error) {
                console.error('❌ Cloud save failed:', error);
            }
        } else {
            console.log('📴 Offline - skipping cloud save');
        }
    },
    
    async addTrade(tradeData) {
    console.log('Adding new trade:', tradeData);
    
    // Use UUID instead of sequential ID for database compatibility
    const newId = generateUUID();
    
    const newTrade = {
        id: newId,
        ...tradeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    this.trades.push(newTrade);
    await this.saveTrades();
    
    if (this.isOnline) {
        ToastManager.show('Trade added and synced to cloud', 'success');
    } else {
        ToastManager.show('Trade added (offline mode)', 'info');
    }
    
    return newTrade;
},
    
    async updateTrade(tradeId, tradeData) {
        console.log('Updating trade:', tradeId, tradeData);
        
        const index = this.trades.findIndex(t => t.id === tradeId);
        if (index !== -1) {
            const updatedTrade = {
                ...this.trades[index],
                ...tradeData,
                id: tradeId,
                updatedAt: new Date().toISOString()
            };
            
            this.trades[index] = updatedTrade;
            await this.saveTrades();
            
            if (this.isOnline) {
                ToastManager.show('Trade updated and synced to cloud', 'success');
            } else {
                ToastManager.show('Trade updated (offline mode)', 'info');
            }
            
            return updatedTrade;
        }
        
        ToastManager.show('Trade not found', 'error');
        return null;
    },
    
    async deleteTrade(tradeId) {
        console.log('🗑️ Deleting trade:', tradeId);
        
        const tradeExists = this.trades.some(t => t.id === tradeId);
        if (!tradeExists) {
            ToastManager.show('Trade not found', 'error');
            return;
        }
        
        // Remove from local array first
        this.trades = this.trades.filter(t => t.id !== tradeId);
        
        // Delete from cloud if online
        if (this.isOnline && typeof SupabaseManager !== 'undefined') {
            try {
                console.log('🗑️ Deleting trade from cloud:', tradeId);
                await SupabaseManager.deleteTrade(tradeId);
                console.log('✅ Trade deleted from cloud');
            } catch (error) {
                console.error('❌ Cloud delete failed:', error);
                // Don't show error to user for individual deletes
            }
        }
        
        // Always save local state
        await this.saveTrades();
        
        if (this.isOnline) {
            ToastManager.show('Trade deleted and removed from cloud', 'success');
        } else {
            ToastManager.show('Trade deleted (offline mode)', 'info');
        }
    },
    
    async deleteMultipleTrades(tradeIds) {
        console.log('🗑️ Deleting multiple trades:', tradeIds);
        
        const beforeCount = this.trades.length;
        this.trades = this.trades.filter(t => !tradeIds.includes(t.id));
        const afterCount = this.trades.length;
        const deletedCount = beforeCount - afterCount;
        
        // Delete from cloud if online
        if (this.isOnline && typeof SupabaseManager !== 'undefined' && tradeIds.length > 0) {
            try {
                console.log('🗑️ Deleting multiple trades from cloud:', tradeIds);
                await SupabaseManager.deleteMultipleTrades(tradeIds);
                console.log('✅ Trades deleted from cloud');
            } catch (error) {
                console.error('❌ Cloud delete failed:', error);
                // Don't show error to user for bulk deletes
            }
        }
        
        // Always save local state
        await this.saveTrades();
        
        if (deletedCount > 0) {
            if (this.isOnline) {
                ToastManager.show(`${deletedCount} trades deleted and removed from cloud`, 'success');
            } else {
                ToastManager.show(`${deletedCount} trades deleted (offline mode)`, 'info');
            }
        } else {
            ToastManager.show('No trades were deleted', 'warning');
        }
    },
    
   async importTrades(tradesData) {
    console.log('📤 Importing trades:', tradesData.length);
    
    if (!this.isOnline) {
        // Offline import - use UUIDs
        let importedCount = 0;
        
        for (const tradeData of tradesData) {
            const newId = generateUUID();
            
            const newTrade = {
                id: newId,
                ...tradeData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.trades.push(newTrade);
            importedCount++;
        }
        
        await this.saveTrades();
        ToastManager.show(`Imported ${importedCount} trades (offline mode)`, 'success');
        return importedCount;
    } else {
        // Online import - use cloud import with duplicate detection
        try {
            const result = await SupabaseManager.importTrades(tradesData);
            
            // Reload from cloud to get the imported trades with correct IDs
            const cloudTrades = await SupabaseManager.loadTrades();
            this.trades = cloudTrades;
            await this.saveTrades();
            
            ToastManager.show(result.message, 'success');
            return result.imported;
        } catch (error) {
            console.error('Import failed:', error);
            ToastManager.show('Import failed: ' + error.message, 'error');
            return 0;
        }
    }
},
    
    async syncToCloud() {
        if (!this.isOnline) {
            ToastManager.show('Not signed in - cannot sync', 'warning');
            return;
        }
        
        try {
            ToastManager.show('Syncing local trades to cloud...', 'info');
            await SupabaseManager.saveTrades(this.trades);
            ToastManager.show('Sync completed successfully!', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            ToastManager.show('Sync failed: ' + error.message, 'error');
        }
    },
    
    async loadFromCloud() {
        if (!this.isOnline) {
            ToastManager.show('Not signed in - cannot load from cloud', 'warning');
            return;
        }
        
        try {
            ToastManager.show('Loading trades from cloud...', 'info');
            const cloudTrades = await SupabaseManager.loadTrades();
            
            this.trades = cloudTrades;
            await this.saveTrades();
            
            ToastManager.show(`Loaded ${this.trades.length} trades from cloud`, 'success');
            
            if (typeof Calendar !== 'undefined') Calendar.renderCalendar();
            if (typeof Stats !== 'undefined') Stats.updateStats();
            if (typeof TradesList !== 'undefined') TradesList.renderRecentTrades();
            if (typeof ChartManager !== 'undefined') ChartManager.updateChart();
            
        } catch (error) {
            console.error('Cloud load error:', error);
            ToastManager.show('Failed to load from cloud: ' + error.message, 'error');
        }
    },
    
    setOnlineStatus(online) {
        this.isOnline = online;
        console.log('TradeManager online status:', online);
    },
    
    calculateRiskMetrics(trade, initialBalance) {
        if (trade.status === 'open' || !trade.profitLoss) return null;
        
        const riskPercent = (trade.amount / initialBalance * 100).toFixed(2);
        const riskReward = trade.profitLoss > 0 ? 
            (trade.profitLoss / trade.amount).toFixed(2) : 
            (Math.abs(trade.profitLoss) / trade.amount).toFixed(2);
        
        return {
            riskPercent,
            riskReward
        };
    },
    
    getTradeStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
        
        const winningTradesArray = closedTrades.filter(t => t.profitLoss > 0);
        const winningTradesCount = winningTradesArray.length;
        
        const winRate = closedTrades.length > 0 ? 
            Math.round((winningTradesCount / closedTrades.length) * 100) : 0;
        
        const totalWins = winningTradesArray.reduce((sum, t) => sum + t.profitLoss, 0);
        
        const losingTradesArray = closedTrades.filter(t => t.profitLoss < 0);
        const totalLosses = Math.abs(losingTradesArray.reduce((sum, t) => sum + t.profitLoss, 0));
        
        const profitFactor = totalLosses > 0 ? 
            (totalWins / totalLosses).toFixed(2) : 
            totalWins > 0 ? '∞' : '0.00';
        
        const avgRiskReward = closedTrades.length > 0 ?
            (closedTrades.reduce((sum, t) => {
                const metrics = this.calculateRiskMetrics(t, SettingsManager.settings.initialBalance);
                return sum + (metrics ? parseFloat(metrics.riskReward) : 0);
            }, 0) / closedTrades.length).toFixed(2) : '0.00';
        
        const profitPercent = (totalProfit / SettingsManager.settings.initialBalance) * 100;
        
        return {
            totalProfit,
            profitPercent,
            totalTrades: this.trades.length,
            winRate,
            profitFactor,
            avgRiskReward,
            closedTrades: closedTrades.length,
            winningTrades: winningTradesCount
        };
    }
};