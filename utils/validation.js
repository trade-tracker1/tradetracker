const Validation = {
    errors: {},
    
    validateTradeForm(formData) {
        this.errors = {};
        
        if (!formData.pair || formData.pair.trim().length < 2) {
            this.errors.pair = 'Please enter a valid trading pair';
        }
        
        if (!formData.amount || formData.amount <= 0) {
            this.errors.amount = 'Please enter a valid amount greater than 0';
        }
        
        if (!formData.entryTime) {
            this.errors.entryTime = 'Please enter a valid entry time';
        } else if (new Date(formData.entryTime) > new Date()) {
            this.errors.entryTime = 'Entry time cannot be in the future';
        }
        
        if (formData.closeTime && formData.entryTime) {
            if (new Date(formData.closeTime) <= new Date(formData.entryTime)) {
                this.errors.closeTime = 'Close time must be after entry time';
            }
        }
        
        return Object.keys(this.errors).length === 0;
    },
    
    showErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
        });
        
        document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
            el.classList.remove('error');
        });
        
        Object.keys(this.errors).forEach(field => {
            const errorEl = document.getElementById(`${field}-error`);
            const inputEl = document.getElementById(field);
            
            if (errorEl && inputEl) {
                errorEl.textContent = this.errors[field];
                errorEl.classList.add('show');
                inputEl.classList.add('error');
            }
        });
    }
};