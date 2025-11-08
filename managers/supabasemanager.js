const SupabaseManager = {
    client: null,
    isOnline: false,
    currentUser: null,
    realtimeSubscription: null,
    
    init() {
        // ⚠️ REPLACE WITH YOUR ACTUAL SUPABASE CREDENTIALS ⚠️
        const supabaseUrl = 'https://tdyxudebkksoohwyvtjz.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeXh1ZGVia2tzb29od3l2dGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzODY3OTEsImV4cCI6MjA3Nzk2Mjc5MX0.P1xzsIuA0i1qsdY3S3RybXAKtUvtEOH9aVd7g3EvQ38';
        
        this.client = supabase.createClient(supabaseUrl, supabaseKey);
        this.setupAuthListener();
        this.setupRealtimeUpdates();
        return this.client;
    },
    
   setupAuthListener() {
    this.client.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event, session);
        this.isOnline = !!session;
        this.currentUser = session?.user || null;
        
        if (typeof TradeManager !== 'undefined') {
            TradeManager.setOnlineStatus(this.isOnline);
        }
        
        this.updateAuthUI();
        
        if (event === 'SIGNED_IN') {
            ToastManager.show('Signed in successfully!', 'success');
            console.log('📥 Loading data from cloud...');
            
            // ONLY load from cloud, don't sync local data
            this.refreshTradesFromCloud();
        } else if (event === 'SIGNED_OUT') {
            ToastManager.show('Signed out', 'info');
            // Just load from local storage, don't sync anything
            TradeManager.loadFromLocalStorage();
            this.stopRealtimeUpdates();
        }
    });
},
    
    setupRealtimeUpdates() {
        if (!this.client) return;
        
        this.realtimeSubscription = this.client
            .channel('trades-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'trades'
                },
                (payload) => {
                    console.log('🔄 Real-time update received:', payload);
                    this.handleRealtimeUpdate(payload);
                }
            )
            .subscribe((status) => {
                console.log('📡 Real-time subscription status:', status);
            });
    },
    
    stopRealtimeUpdates() {
        if (this.realtimeSubscription) {
            this.client.removeChannel(this.realtimeSubscription);
            this.realtimeSubscription = null;
        }
    },
    
    handleRealtimeUpdate(payload) {
        if (this.currentUser && payload.new && payload.new.user_id === this.currentUser.id) {
            console.log('🔄 Processing real-time update for current user');
            this.refreshTradesFromCloud();
        }
    },
    
    async refreshTradesFromCloud() {
        if (!this.isOnline) return;
        
        try {
            console.log('🔄 Refreshing trades from cloud...');
            const cloudTrades = await this.loadTrades();
            
            if (typeof TradeManager !== 'undefined') {
                const currentTradeCount = TradeManager.trades.length;
                const cloudTradeCount = cloudTrades.length;
                
                if (currentTradeCount !== cloudTradeCount || 
                    JSON.stringify(TradeManager.trades) !== JSON.stringify(cloudTrades)) {
                    
                    console.log(`🔄 Syncing: ${currentTradeCount} local → ${cloudTradeCount} cloud trades`);
                    TradeManager.trades = cloudTrades;
                    
                    localStorage.setItem('tradeTrackerTrades', JSON.stringify(cloudTrades));
                    
                    this.refreshAllUI();
                    ToastManager.show('Trades updated from cloud!', 'success');
                } else {
                    console.log('✅ Trades are already in sync');
                }
            }
        } catch (error) {
            console.error('❌ Cloud refresh failed:', error);
        }
    },
    
    refreshAllUI() {
        if (typeof Calendar !== 'undefined') Calendar.renderCalendar();
        if (typeof Stats !== 'undefined') Stats.updateStats();
        if (typeof TradesList !== 'undefined') TradesList.renderRecentTrades();
        if (typeof ChartManager !== 'undefined') ChartManager.updateChart();
    },
    
  updateAuthUI() {
    const loginBtn = document.getElementById('dropdown-login');
    const logoutBtn = document.getElementById('dropdown-logout');
    const userInfo = document.getElementById('dropdown-user-info');
    const userEmail = document.getElementById('dropdown-user-email');
    
    if (!loginBtn || !logoutBtn || !userInfo || !userEmail) return;
    
    if (this.isOnline && this.currentUser) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        userInfo.style.display = 'block';
        
        // Extract name before @ for display
        let displayName = 'Trader';
        if (this.currentUser.email) {
            displayName = this.currentUser.email.split('@')[0];
        }
        userEmail.textContent = `Hello, ${displayName}`;
    } else {
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        userInfo.style.display = 'none';
    }
},  
    async signIn() {
        this.showLoginModal();
    },
    
  showLoginModal() {
    this.closeLoginModal();
    
    const modalHtml = `
        <div class="modal" id="login-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Sign In to TradeTracker</h2>
                    <button class="close-modal" id="close-login-modal">&times;</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p style="color: var(--neutral-color); font-size: 14px; text-align: center;">
                        Sign in to access your trades from any device
                    </p>
                </div>
                
                <div class="form-group">
                    <label for="login-email">Email</label>
                    <input type="email" id="login-email" placeholder="your@email.com" value="test@example.com">
                </div>
                
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" placeholder="Enter your password" value="password123">
                </div>
                
                <div class="form-group">
                    <button class="btn btn-primary" id="login-submit-btn" style="width: 100%;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                    <button class="btn btn-secondary" id="login-signup-btn" style="width: 100%; margin-top: 10px;">
                        <i class="fas fa-user-plus"></i> Create New Account
                    </button>
                    <button class="btn btn-google" id="login-google-btn" style="width: 100%; margin-top: 10px; background: #db4437; color: white;">
                        <i class="fab fa-google"></i> Sign In with Google
                    </button>
                </div>
                
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                    <small style="color: var(--neutral-color);">
                        Or <a href="#" id="quick-demo-link" style="color: var(--primary-color); text-decoration: underline;">use quick demo mode</a>
                    </small>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // FIX: Properly show the modal with animation
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Trigger animation after a small delay to allow DOM rendering
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    this.setupLoginModalEvents();
},
    
    setupLoginModalEvents() {
        // Close modal button
        document.getElementById('close-login-modal').addEventListener('click', () => {
            this.closeLoginModal();
        });
        
        // Sign In button
        document.getElementById('login-submit-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleEmailLogin();
        });
        
        // Create Account button
        document.getElementById('login-signup-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleEmailSignup();
        });
        
        // Google Sign In button
        document.getElementById('login-google-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleGoogleLogin();
        });
        
        // Quick Demo link
        document.getElementById('quick-demo-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleQuickDemo();
        });
        
        // Close modal when clicking outside
        document.getElementById('login-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeLoginModal();
            }
        });
        
        // Enter key support
        const handleEnterKey = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleEmailLogin();
            }
        };
        
        document.getElementById('login-email').addEventListener('keypress', handleEnterKey);
        document.getElementById('login-password').addEventListener('keypress', handleEnterKey);
    },
    
   closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        // Remove show class first for animation
        modal.classList.remove('show');
        
        // Wait for animation to complete before removing from DOM
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            document.body.style.overflow = 'auto';
        }, 300);
    }
},
    async handleEmailLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            ToastManager.show('Please enter both email and password', 'error');
            return;
        }
        
        const submitBtn = document.getElementById('login-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px; display: inline-block; margin-right: 8px;"></div> Signing in...';
        submitBtn.disabled = true;
        
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            this.closeLoginModal();
            ToastManager.show(`Welcome back, ${email}!`, 'success');
            
        } catch (error) {
            console.error('Email login error:', error);
            
            if (error.message.includes('Invalid login credentials')) {
                ToastManager.show('Invalid email or password. Please try again.', 'error');
            } else if (error.message.includes('Email not confirmed')) {
                ToastManager.show('Please check your email to verify your account.', 'warning');
            } else {
                ToastManager.show('Login failed: ' + error.message, 'error');
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },
    
    async handleEmailSignup() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            ToastManager.show('Please enter both email and password', 'error');
            return;
        }
        
        if (password.length < 6) {
            ToastManager.show('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            ToastManager.show('Please enter a valid email address', 'error');
            return;
        }
        
        const signupBtn = document.getElementById('login-signup-btn');
        const originalText = signupBtn.innerHTML;
        signupBtn.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px; display: inline-block; margin-right: 8px;"></div> Creating account...';
        signupBtn.disabled = true;
        
        try {
            const { data, error } = await this.client.auth.signUp({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            
            this.closeLoginModal();
            
            if (data.user && data.session) {
                ToastManager.show(`Welcome to TradeTracker, ${email}!`, 'success');
            } else {
                ToastManager.show(`Account created for ${email}! Please check your email to verify your account.`, 'info');
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            
            if (error.message.includes('User already registered')) {
                ToastManager.show('An account with this email already exists. Please sign in instead.', 'error');
            } else if (error.message.includes('Password should be at least')) {
                ToastManager.show('Password must be at least 6 characters long.', 'error');
            } else {
                ToastManager.show('Signup failed: ' + error.message, 'error');
            }
        } finally {
            signupBtn.innerHTML = originalText;
            signupBtn.disabled = false;
        }
    },
    
    async handleGoogleLogin() {
        const googleBtn = document.getElementById('login-google-btn');
        const originalText = googleBtn.innerHTML;
        googleBtn.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px; display: inline-block; margin-right: 8px;"></div> Connecting...';
        googleBtn.disabled = true;
        
        try {
            const { data, error } = await this.client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            
            if (error) throw error;
            
            ToastManager.show('Redirecting to Google...', 'info');
            
        } catch (error) {
            console.error('Google OAuth error:', error);
            
            if (error.message.includes('Provider is not enabled')) {
                ToastManager.show('Google sign-in is not enabled. Please use email/password or demo mode.', 'error');
            } else {
                ToastManager.show('Google sign-in failed: ' + error.message, 'error');
            }
            
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
        }
    },
    
    async handleQuickDemo() {
        const demoLink = document.getElementById('quick-demo-link');
        const originalHtml = demoLink.innerHTML;
        demoLink.innerHTML = '<div class="loading-spinner" style="width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></div> Starting demo...';
        
        try {
            const { data, error } = await this.client.auth.signInAnonymously();
            
            if (error) throw error;
            
            this.closeLoginModal();
            ToastManager.show('Demo mode activated! Your data will be saved locally.', 'success');
            
        } catch (error) {
            console.error('Demo mode error:', error);
            
            if (error.message.includes('Auth session missing')) {
                ToastManager.show('Demo mode not available. Please use email sign-in.', 'error');
            } else {
                ToastManager.show('Demo mode failed: ' + error.message, 'error');
            }
            
            demoLink.innerHTML = originalHtml;
        }
    },
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    async signOut() {
        console.log('Signing out...');
        try {
            await this.client.auth.signOut();
        } catch (error) {
            console.log('Sign out error (ignored):', error.message);
        }
        
        this.isOnline = false;
        this.currentUser = null;
        
        if (typeof TradeManager !== 'undefined') {
            TradeManager.setOnlineStatus(false);
            TradeManager.loadFromLocalStorage();
        }
        
        this.updateAuthUI();
        ToastManager.show('Signed out', 'info');
    },
    
    // NEW: Delete individual trade from database
    async deleteTrade(tradeId) {
        if (!this.isOnline) {
            console.log('❌ Not signed in - cannot delete from cloud');
            throw new Error('Not signed in');
        }
        
        const user = this.currentUser;
        if (!user) {
            console.log('❌ No user found - cannot delete from cloud');
            throw new Error('No user found');
        }
        
        console.log('🗑️ Deleting trade from cloud:', tradeId);
        
        try {
            const { error } = await this.client
                .from('trades')
                .delete()
                .eq('id', tradeId)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            console.log('✅ Trade deleted from cloud:', tradeId);
            return true;
        } catch (error) {
            console.error('❌ Delete trade error:', error);
            throw error;
        }
    },
    
    // NEW: Delete multiple trades from database
    async deleteMultipleTrades(tradeIds) {
        if (!this.isOnline) {
            console.log('❌ Not signed in - cannot delete from cloud');
            throw new Error('Not signed in');
        }
        
        const user = this.currentUser;
        if (!user) {
            console.log('❌ No user found - cannot delete from cloud');
            throw new Error('No user found');
        }
        
        console.log('🗑️ Deleting multiple trades from cloud:', tradeIds);
        
        try {
            const { error } = await this.client
                .from('trades')
                .delete()
                .in('id', tradeIds)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            console.log('✅ Trades deleted from cloud:', tradeIds);
            return true;
        } catch (error) {
            console.error('❌ Delete multiple trades error:', error);
            throw error;
        }
    },
    
    async saveTrades(trades) {
    if (!this.isOnline) {
        console.log('❌ Not signed in - skipping cloud save');
        throw new Error('Not signed in');
    }
    
    const user = this.currentUser;
    if (!user) {
        console.log('❌ No user found - skipping cloud save');
        throw new Error('No user found');
    }
    
    console.log('💾 Saving', trades.length, 'trades to cloud for user:', user.id);
    
    try {
        const { data: existingTrades, error: fetchError } = await this.client
            .from('trades')
            .select('id')
            .eq('user_id', user.id);
        
        if (fetchError) {
            console.error('❌ Fetch existing trades error:', fetchError);
            throw fetchError;
        }
        
        const existingIds = new Set(existingTrades.map(t => t.id));
        console.log('📊 Existing trade IDs in cloud:', Array.from(existingIds));
        
        const operations = [];
        
        for (const trade of trades) {
            const tradeData = this.prepareTradeForDB(trade, user.id);
            
            if (existingIds.has(trade.id)) {
                console.log('🔄 Updating existing trade:', trade.id);
                operations.push(
                    this.client
                        .from('trades')
                        .update(tradeData)
                        .eq('id', trade.id)
                        .eq('user_id', user.id)
                );
            } else {
                console.log('➕ Inserting new trade:', trade.id);
                operations.push(
                    this.client
                        .from('trades')
                        .insert([tradeData])
                );
            }
        }
        
        console.log('🚀 Executing', operations.length, 'database operations');
        const results = await Promise.all(operations);
        
        // Check for errors in results
        const hasErrors = results.some(result => result.error);
        if (hasErrors) {
            const errors = results.map(r => r.error).filter(e => e);
            console.error('❌ Database operation errors:', errors);
            throw new Error(`Database errors: ${errors.map(e => e.message).join(', ')}`);
        }
        
        console.log('✅ All trades saved to cloud successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Save trades error:', error);
        // Show specific error message to user
        if (error.message.includes('invalid input syntax for type uuid')) {
            throw new Error('Database ID format error. Please refresh the page and try again.');
        }
        throw error;
    }
},
    
    // NEW: Import trades with duplicate prevention
    async importTrades(trades) {
        if (!this.isOnline) {
            console.log('❌ Not signed in - cannot import to cloud');
            throw new Error('Not signed in');
        }
        
        const user = this.currentUser;
        if (!user) {
            console.log('❌ No user found - cannot import to cloud');
            throw new Error('No user found');
        }
        
        console.log('📤 Importing', trades.length, 'trades to cloud for user:', user.id);
        
        try {
            // Get existing trades to prevent duplicates
            const { data: existingTrades, error: fetchError } = await this.client
                .from('trades')
                .select('id, pair, entry_time, amount')
                .eq('user_id', user.id);
            
            if (fetchError) throw fetchError;
            
            // Create a unique key for each trade to detect duplicates
            const existingTradeKeys = new Set(
                existingTrades.map(t => `${t.pair}_${t.entry_time}_${t.amount}`)
            );
            
            console.log('📊 Existing trade keys:', existingTradeKeys);
            
            const newTrades = [];
            const duplicateTrades = [];
            
            // Filter out duplicates
            for (const trade of trades) {
                const tradeKey = `${trade.pair}_${trade.entryTime}_${trade.amount}`;
                
                if (existingTradeKeys.has(tradeKey)) {
                    console.log('🚫 Skipping duplicate trade:', tradeKey);
                    duplicateTrades.push(trade);
                } else {
                    console.log('✅ Adding new trade:', tradeKey);
                    newTrades.push(trade);
                }
            }
            
            console.log(`📊 Import stats: ${newTrades.length} new, ${duplicateTrades.length} duplicates`);
            
            if (newTrades.length === 0) {
                console.log('ℹ️ No new trades to import');
                return {
                    imported: 0,
                    duplicates: duplicateTrades.length,
                    message: 'No new trades to import - all trades already exist in database'
                };
            }
            
            // Prepare trades for database
            const tradesToInsert = newTrades.map(trade => 
                this.prepareTradeForDB(trade, user.id)
            );
            
            // Insert new trades
            const { data: insertedTrades, error: insertError } = await this.client
                .from('trades')
                .insert(tradesToInsert)
                .select();
            
            if (insertError) throw insertError;
            
            console.log('✅ Successfully imported', insertedTrades.length, 'trades to cloud');
            
            return {
                imported: insertedTrades.length,
                duplicates: duplicateTrades.length,
                message: `Imported ${insertedTrades.length} trades successfully (${duplicateTrades.length} duplicates skipped)`
            };
            
        } catch (error) {
            console.error('❌ Import trades error:', error);
            throw error;
        }
    },
    
    async loadTrades() {
        if (!this.isOnline) {
            console.log('❌ Not signed in - cannot load from cloud');
            throw new Error('Not signed in');
        }
        
        const user = this.currentUser;
        if (!user) {
            console.log('❌ No user found - cannot load from cloud');
            throw new Error('No user found');
        }
        
        console.log('📥 Loading trades from cloud for user:', user.id);
        
        try {
            const { data, error } = await this.client
                .from('trades')
                .select('*')
                .eq('user_id', user.id)
                .order('entry_time', { ascending: false });
            
            if (error) {
                console.error('❌ Load trades error:', error);
                throw error;
            }
            
            console.log('✅ Loaded', data.length, 'trades from cloud');
            return data.map(trade => this.prepareTradeFromDB(trade));
        } catch (error) {
            console.error('❌ Load trades failed:', error);
            throw error;
        }
    },
    
    prepareTradeForDB(trade, userId) {
        const tradeData = {
            id: trade.id,
            user_id: userId,
            pair: trade.pair,
            type: trade.type,
            amount: parseFloat(trade.amount),
            entry_time: trade.entryTime,
            close_time: trade.closeTime || null,
            profit_loss: trade.profitLoss !== null ? parseFloat(trade.profitLoss) : null,
            status: trade.status,
            category: trade.category || 'day',
            notes: trade.notes || '',
            screenshots: trade.screenshots || []
        };
        
        console.log('📦 Prepared trade for DB:', trade.id, tradeData.pair);
        return tradeData;
    },
    
    prepareTradeFromDB(trade) {
        const tradeData = {
            id: trade.id,
            pair: trade.pair,
            type: trade.type,
            amount: parseFloat(trade.amount),
            entryTime: trade.entry_time,
            closeTime: trade.close_time,
            profitLoss: trade.profit_loss !== null ? parseFloat(trade.profit_loss) : null,
            status: trade.status,
            category: trade.category || 'day',
            notes: trade.notes || '',
            screenshots: trade.screenshots || [],
            createdAt: trade.created_at,
            updatedAt: trade.updated_at
        };
        
        console.log('📦 Prepared trade from DB:', tradeData.id, tradeData.pair);
        return tradeData;
    },
    
    async syncLocalToCloud() {
        try {
            const localTrades = TradeManager.trades;
            console.log('🔄 Starting sync: local → cloud');
            console.log('📊 Local trades:', localTrades.length);
            
            if (localTrades.length > 0) {
                ToastManager.show('Syncing local trades to cloud...', 'info');
                await this.saveTrades(localTrades);
                
                const cloudTrades = await this.loadTrades();
                TradeManager.trades = cloudTrades;
                
                localStorage.setItem('tradeTrackerTrades', JSON.stringify(cloudTrades));
                
                ToastManager.show(`Synced ${cloudTrades.length} trades to cloud!`, 'success');
                
                this.refreshAllUI();
            } else {
                console.log('📥 No local trades, loading from cloud...');
                const cloudTrades = await this.loadTrades();
                TradeManager.trades = cloudTrades;
                
                localStorage.setItem('tradeTrackerTrades', JSON.stringify(cloudTrades));
                
                ToastManager.show(`Loaded ${cloudTrades.length} trades from cloud`, 'success');
                
                this.refreshAllUI();
            }
            
            console.log('✅ Sync completed successfully');
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            ToastManager.show('Sync failed: ' + error.message, 'error');
        }
    },
    
   async manualSync() {
    console.log('🔄 Manual sync triggered - loading from cloud');
    if (!this.isOnline) {
        ToastManager.show('Not signed in - cannot sync', 'warning');
        return;
    }
    
    try {
        ToastManager.show('Loading trades from cloud...', 'info');
        const cloudTrades = await this.loadTrades();
        
        // Update TradeManager and local storage with cloud data
        TradeManager.trades = cloudTrades;
        localStorage.setItem('tradeTrackerTrades', JSON.stringify(cloudTrades));
        
        ToastManager.show(`Synced ${cloudTrades.length} trades from cloud!`, 'success');
        
        this.refreshAllUI();
    } catch (error) {
        console.error('❌ Manual sync failed:', error);
        ToastManager.show('Sync failed: ' + error.message, 'error');
    }
},
};