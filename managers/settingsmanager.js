const SettingsManager = {
    settings: {
        initialBalance: 5000,
        darkMode: false
    },
    
    init() {
        this.loadSettings();
    },
    
    loadSettings() {
        const savedSettings = localStorage.getItem('tradeTrackerSettings');
        if (savedSettings) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            } catch (error) {
                ToastManager.show('Error loading settings', 'error');
            }
        }
    },
    
    saveSettings() {
        try {
            localStorage.setItem('tradeTrackerSettings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            ToastManager.show('Error saving settings', 'error');
            return false;
        }
    },
    
    updateSetting(key, value) {
        this.settings[key] = value;
        return this.saveSettings();
    }
};