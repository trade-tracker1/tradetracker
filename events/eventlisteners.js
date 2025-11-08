const EventListeners = {
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Modal controls

        this.safeAddEventListener('close-day-summary', 'click', Modals.closeDaySummaryModal);
        this.safeAddEventListener('add-trade-btn', 'click', Modals.openAddTradeModal);
        this.safeAddEventListener('close-modal', 'click', Modals.closeModal);
        this.safeAddEventListener('cancel-trade', 'click', Modals.closeModal);
        this.safeAddEventListener('close-settings', 'click', Modals.closeSettingsModal);
        this.safeAddEventListener('close-all-trades', 'click', Modals.closeAllTradesModal);
        this.safeAddEventListener('close-trade-details', 'click', Modals.closeTradeDetailsModal);
        this.safeAddEventListener('close-screenshot', 'click', Modals.closeScreenshotModal);
        this.safeAddEventListener('edit-trade-btn', 'click', Handlers.handleEditTradeFromDetails);
        this.safeAddEventListener('delete-trade-btn', 'click', Handlers.handleDeleteTradeFromDetails);
        
        // Calendar controls
        this.safeAddEventListener('prev-month', 'click', () => Calendar.goToPreviousMonth());
        this.safeAddEventListener('next-month', 'click', () => Calendar.goToNextMonth());
        this.safeAddEventListener('today-btn', 'click', () => Calendar.goToToday());
        
        // Form submissions
        this.safeAddEventListener('trade-form', 'submit', Handlers.handleTradeSubmit);
        this.safeAddEventListener('save-balance', 'click', Handlers.handleSaveBalance);
        
        // Screenshot handling
        this.safeAddEventListener('screenshot', 'change', Forms.handleScreenshotUpload);
        
        // Data management
        this.safeAddEventListener('export-excel', 'click', Handlers.handleExportExcel);
        this.safeAddEventListener('import-excel', 'change', Handlers.handleImportExcel);
        this.safeAddEventListener('view-all-trades', 'click', () => TradesList.openAllTradesModal());
        
        // Bulk actions
        this.safeAddEventListener('select-all-desktop', 'click', () => TradesList.selectAllTrades());
        this.safeAddEventListener('deselect-all-desktop', 'click', () => TradesList.deselectAllTrades());
        this.safeAddEventListener('delete-selected-desktop', 'click', () => TradesList.deleteSelectedTrades());
        this.safeAddEventListener('delete-all-desktop', 'click', () => TradesList.deleteAllTrades());
        
        this.safeAddEventListener('select-all-mobile', 'click', () => TradesList.selectAllTrades());
        this.safeAddEventListener('deselect-all-mobile', 'click', () => TradesList.deselectAllTrades());
        this.safeAddEventListener('delete-selected-mobile', 'click', () => TradesList.deleteSelectedTrades());
        this.safeAddEventListener('delete-all-mobile', 'click', () => TradesList.deleteAllTrades());
// Add this to your existing event listeners
	this.safeAddEventListener('close-day-summary', 'click', Modals.closeDaySummaryModal);
        
        // Search and filter
        this.safeAddEventListener('trade-search', 'input', () => TradesList.renderAllTradesList());
        this.safeAddEventListener('trade-filter', 'change', () => TradesList.renderAllTradesList());
        
        // Theme toggle
        this.safeAddEventListener('dark-mode-toggle', 'change', function() {
            Handlers.toggleDarkMode();
            setTimeout(() => {
                ChartManager.updateChart();
            }, 100);
        });
        
        // Trade result toggle
        Forms.initTradeResultToggle();
        
        // Real-time validation
        this.safeAddEventListener('amount', 'input', Forms.updateRiskMetrics);
        this.safeAddEventListener('profit-loss', 'input', Forms.updateRiskMetrics);
        
        // ===== DROPDOWN FUNCTIONALITY =====
        this.setupDropdownEventListeners();
        
        // Handle window resize
        window.addEventListener('resize', Performance.throttle(function() {
            TradesList.renderAllTradesList();
        }, 250));
        
        console.log('Event listeners setup completed');
    },
    
 setupDropdownEventListeners() {
    // Dropdown functionality
    this.safeAddEventListener('user-menu-toggle', 'click', (e) => {
        e.stopPropagation();
        this.toggleUserDropdown();
    });
    
    this.safeAddEventListener('dropdown-settings', 'click', () => {
        Modals.openSettingsModal();
        this.closeUserDropdown();
    });
    
    this.safeAddEventListener('dropdown-login', 'click', () => {
        if (typeof SupabaseManager !== 'undefined') {
            // FIX: Close dropdown first, then open login modal
            this.closeUserDropdown();
            setTimeout(() => {
                SupabaseManager.signIn();
            }, 100);
        }
        this.closeUserDropdown();
    });
    
    this.safeAddEventListener('dropdown-logout', 'click', () => {
        if (typeof SupabaseManager !== 'undefined') {
            SupabaseManager.signOut();
        }
        this.closeUserDropdown();
    });
    
    // Close dropdown when clicking outside - FIXED
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('user-dropdown');
        const toggle = document.getElementById('user-menu-toggle');
        
        if (dropdown && toggle && !toggle.contains(e.target) && !dropdown.contains(e.target)) {
            this.closeUserDropdown();
        }
    });
    
    // Close dropdown with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.closeUserDropdown();
        }
    });
},

toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        // FIX: Toggle the show class properly
        dropdown.classList.toggle('show');
    }
},

closeUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
},
    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with id '${elementId}' not found for event listener`);
        }
    }
};