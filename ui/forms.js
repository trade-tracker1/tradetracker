const Forms = {
    initTradeResultToggle() {
        const toggleOptions = document.querySelectorAll('.toggle-option');
        toggleOptions.forEach(option => {
            option.addEventListener('click', function() {
                toggleOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                window.tradeResult = this.getAttribute('data-value');
                
                const profitLossInput = document.getElementById('profit-loss');
                if (window.tradeResult === 'open') {
                    profitLossInput.disabled = true;
                    profitLossInput.value = '';
                    // Clear close time for open trades
                    document.getElementById('close-time').value = '';
                } else {
                    profitLossInput.disabled = false;
                    if (!document.getElementById('close-time').value) {
                        const now = new Date();
                        document.getElementById('close-time').value = now.toISOString().slice(0, 16);
                    }
                }
                
                // FIX: Call the function correctly
                Forms.updateRiskMetrics();
            });
        });
    },
    
    updateRiskMetrics() {
        const amount = parseFloat(document.getElementById('amount').value) || 0;
        const profitLoss = parseFloat(document.getElementById('profit-loss').value) || 0;
        const riskMetrics = document.getElementById('risk-metrics-preview');
        
        if (amount > 0 && window.tradeResult !== 'open') {
            const riskPercent = (amount / window.settings.initialBalance * 100).toFixed(2);
            const riskReward = (profitLoss / amount).toFixed(2);
            
            document.getElementById('risk-reward-preview').textContent = riskReward;
            document.getElementById('risk-percent-preview').textContent = riskPercent + '%';
            riskMetrics.style.display = 'block';
        } else {
            riskMetrics.style.display = 'none';
        }
    },

    handleScreenshotUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            window.currentScreenshot = e.target.result;
            document.getElementById('screenshot-preview').src = window.currentScreenshot;
            document.getElementById('screenshot-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
};