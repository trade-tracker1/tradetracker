// Global variables - make sure these are properly declared
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let editingTradeId = null;
let selectedDay = null;
let selectedTradeIds = new Set();
let selectedMobileTradeIds = new Set();
let tradeResult = 'open';
let currentScreenshot = null;
let longPressTimer = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing TradeTracker Pro...');
    
    try {
        // Initialize all managers first
        if (typeof ToastManager !== 'undefined') ToastManager.init();
        if (typeof SettingsManager !== 'undefined') SettingsManager.init();
        if (typeof TradeManager !== 'undefined') TradeManager.init();
        
        // Load settings
        const savedSettings = localStorage.getItem('tradeTrackerSettings');
        if (savedSettings) {
            try {
                const loadedSettings = JSON.parse(savedSettings);
                if (typeof SettingsManager !== 'undefined') {
                    SettingsManager.settings = { ...SettingsManager.settings, ...loadedSettings };
                    
                    // Update UI elements with loaded settings
                    const darkModeToggle = document.getElementById('dark-mode-toggle');
                    const initialBalance = document.getElementById('initial-balance');
                    
                    if (darkModeToggle) darkModeToggle.checked = SettingsManager.settings.darkMode;
                    if (initialBalance) initialBalance.value = SettingsManager.settings.initialBalance;
                    
                    if (SettingsManager.settings.darkMode) {
                        document.body.classList.add('dark-mode');
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                if (typeof ToastManager !== 'undefined') ToastManager.show('Error loading settings', 'error');
            }
        }
        
        // Initialize UI components with safety checks
        setTimeout(() => {
            try {
                // Check if required managers are available
                if (typeof TradeManager === 'undefined') {
                    throw new Error('TradeManager is not defined');
                }
                
                if (typeof Calendar !== 'undefined') Calendar.renderCalendar();
                if (typeof Stats !== 'undefined') {
                    Stats.updateStats();
                    Stats.updateMonthlySummary();
                }
                if (typeof TradesList !== 'undefined') TradesList.renderRecentTrades();
                if (typeof ChartManager !== 'undefined') {
                    ChartManager.init();
                    ChartManager.updateChart();
                }
                
                if (typeof EventListeners !== 'undefined') {
                    EventListeners.setupEventListeners();
                }
                
                if (typeof Forms !== 'undefined') {
                    Forms.initTradeResultToggle();
                }
                
                // Show welcome message
                setTimeout(() => {
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.show('TradeTracker Pro loaded successfully!', 'info', 4000);
                    }
                }, 500);
                
                console.log('TradeTracker Pro initialized successfully');
                
            } catch (error) {
                console.error('Error during UI initialization:', error);
                if (typeof ToastManager !== 'undefined') ToastManager.show('Error initializing UI components: ' + error.message, 'error');
            }
        }, 100);
        
    } catch (error) {
        console.error('Error during initialization:', error);
        if (typeof ToastManager !== 'undefined') ToastManager.show('Error initializing application', 'error');
    }
});

// Make global variables available to other modules
window.currentDate = currentDate;
window.currentMonth = currentMonth;
window.currentYear = currentYear;
window.editingTradeId = editingTradeId;
window.selectedDay = selectedDay;
window.selectedTradeIds = selectedTradeIds;
window.selectedMobileTradeIds = selectedMobileTradeIds;
window.tradeResult = tradeResult;
window.currentScreenshot = currentScreenshot;
window.longPressTimer = longPressTimer;

// Safe settings access
Object.defineProperty(window, 'settings', {
    get: function() {
        return typeof SettingsManager !== 'undefined' ? SettingsManager.settings : { initialBalance: 5000, darkMode: false };
    }
});

// Make functions available globally - with safety checks
if (typeof TradesList !== 'undefined') window.TradesList = TradesList;
if (typeof Calendar !== 'undefined') window.Calendar = Calendar;
if (typeof Modals !== 'undefined') window.Modals = Modals;
if (typeof Handlers !== 'undefined') window.Handlers = Handlers;
if (typeof Forms !== 'undefined') window.Forms = Forms;
if (typeof Stats !== 'undefined') window.Stats = Stats;
if (typeof ChartManager !== 'undefined') window.ChartManager = ChartManager;
if (typeof TradeManager !== 'undefined') window.TradeManager = TradeManager;
if (typeof SettingsManager !== 'undefined') window.SettingsManager = SettingsManager;
if (typeof ToastManager !== 'undefined') window.ToastManager = ToastManager;
if (typeof EventListeners !== 'undefined') window.EventListeners = EventListeners;
if (typeof Helpers !== 'undefined') window.Helpers = Helpers;
if (typeof Validation !== 'undefined') window.Validation = Validation;
if (typeof Performance !== 'undefined') window.Performance = Performance;