// Supabase Helper Functions
// Using Supabase JavaScript library

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.currentUser = null;
    }

    // Initialize Supabase
    async init() {
        // Load Supabase client
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/umd/supabase.js';
        document.head.appendChild(script);
        
        await new Promise(resolve => {
            script.onload = resolve;
        });

        // Create client
        window.supabase = window.supabase || {};
        this.client = window.supabase.createClient(this.url, this.key);
        
        // Get current user
        const { data: { user } } = await this.client.auth.getUser();
        this.currentUser = user;
        
        return user;
    }

    // Login user
    async login(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        this.currentUser = data.user;
        return data;
    }

    // Login by username (looks up email first)
    async loginByUsername(username, password) {
        // First find the email associated with this username
        const { data, error } = await this.client
            .from('employees')
            .select('email')
            .eq('username', username)
            .single();
        
        if (error || !data) {
            throw new Error('Username not found');
        }

        // Then login with the email and password
        return this.login(data.email, password);
    }

    // Signup (only for demo, you won't use this)
    async signup(email, password) {
        const { data, error } = await this.client.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    }

    // Logout
    async logout() {
        try {
            const { error } = await this.client.auth.signOut();
            // Even if there's an error, clear the user
            this.currentUser = null;
            if (error && !error.message.includes('does not exist')) {
                throw error;
            }
        } catch (err) {
            // Logout gracefully even if session errors occur
            this.currentUser = null;
        }
    }

    // Get employee data
    async getEmployeeData(userId) {
        const { data, error } = await this.client
            .from('employees')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error) throw error;
        return data;
    }

    // Get all employees (admin only)
    async getAllEmployees() {
        const { data, error } = await this.client
            .from('employees')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data;
    }

    // Update employee (admin only)
    async updateEmployee(employeeId, updates) {
        // Add the admin username to notes_set_by if notes are being updated
        if (updates.notes !== undefined && this.currentUser) {
            const adminData = await this.getCurrentUserInfo();
            const adminUsername = adminData?.username || adminData?.name || 'Admin';
            updates.notes_set_by = adminUsername;
        }

        // Track last earned if robux is being updated
        if (updates.robux !== undefined) {
            const { data: current } = await this.client
                .from('employees')
                .select('robux')
                .eq('id', employeeId)
                .single();
            
            if (current && current.robux !== undefined) {
                updates.last_earned = updates.robux - current.robux;
            }
        }
        
        const { data, error } = await this.client
            .from('employees')
            .update(updates)
            .eq('id', employeeId);
        
        if (error) throw error;
        return data;
    }

    // Create new employee (admin only)
    async createEmployeeAccount(email, password, username, rank = 'Employee', notes = '') {
        // Check if employee already exists by email
        const { data: existingEmployee } = await this.client
            .from('employees')
            .select('id')
            .eq('email', email)
            .single();

        if (existingEmployee) {
            throw new Error('Employee with this email already exists');
        }

        // Try to create auth user using signUp
        const { data: authData, error: authError } = await this.client.auth.signUp({
            email,
            password
        });
        
        if (authError) {
            // If user already registered, try to get their info and insert employee record
            if (authError.message.includes('already registered')) {
                // Login with the credentials to get the user
                try {
                    const { data: loginData } = await this.client.auth.signInWithPassword({
                        email,
                        password
                    });
                    
                    if (loginData && loginData.user) {
                        const { data, error: insertError } = await this.client
                            .from('employees')
                            .insert([{
                                user_id: loginData.user.id,
                                name: username,
                                email,
                                username,
                                rank,
                                robux: 0,
                                notes
                            }]);
                        
                        if (insertError) throw insertError;
                        return data;
                    }
                } catch (e) {
                    throw new Error('User already registered but could not insert employee record');
                }
            }
            throw authError;
        }

        // Then create employee record
        const { data, error } = await this.client
            .from('employees')
            .insert([{
                user_id: authData.user.id,
                name: username,
                email,
                username,
                rank,
                robux: 0,
                notes
            }]);
        
        if (error) throw error;
        return data;
    }

    // Delete employee (admin only)
    async deleteEmployee(userId) {
        // Delete employee record
        const { error: delError } = await this.client
            .from('employees')
            .delete()
            .eq('user_id', userId);
        
        if (delError) throw delError;
    }

    // Check if user is admin
    async isAdmin() {
        if (!this.currentUser) return false;
        
        const { data, error } = await this.client
            .from('employees')
            .select('is_admin')
            .eq('user_id', this.currentUser.id)
            .single();
        
        if (error) return false;
        return data?.is_admin || false;
    }

    // Get current user info
    async getCurrentUserInfo() {
        if (!this.currentUser) return null;
        return this.getEmployeeData(this.currentUser.id);
    }

    // Add activity log entry
    async addActivityLog(action, details) {
        if (!this.currentUser) throw new Error('Not authenticated');
        
        const userData = await this.getCurrentUserInfo();
        const adminUsername = userData?.username || userData?.name || 'Unknown Admin';
        
        const { data, error } = await this.client
            .from('activity_logs')
            .insert([{
                admin_id: this.currentUser.id,
                admin_username: adminUsername,
                action,
                details
            }]);
        
        if (error) throw error;
        return data;
    }

    // Get all activity logs
    async getActivityLogs() {
        const { data, error } = await this.client
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        return data || [];
    }

    // Get leaderboard (sorted by robux, descending)
    async getLeaderboard() {
        const { data, error } = await this.client
            .from('employees')
            .select('username, rank, robux')
            .order('robux', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        return data || [];
    }

    // Get user position on leaderboard
    async getUserPosition(username) {
        const { data, error } = await this.client
            .from('employees')
            .select('robux, username')
            .order('robux', { ascending: false });
        
        if (error) throw error;
        
        const position = data?.findIndex(emp => emp.username === username) + 1;
        return position || 0;
    }
}

// Initialize global supabase instance
let supabaseAuth;

async function initSupabase() {
    supabaseAuth = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseAuth.init();
}
