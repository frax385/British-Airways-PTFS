# British Airways PTFS Employee Tracker - Setup Guide

## Quick Summary
You now have:
- ✅ Login page (index.html)
- ✅ Employee dashboard (employee-dashboard.html)
- ✅ Admin dashboard (admin-dashboard.html)
- ✅ Backend integration (Supabase)

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Create a Supabase Account
1. Go to https://supabase.com
2. Click "Start your project" or "Sign up"
3. Sign up with email or GitHub
4. Create a new project:
   - Project name: "British Airways PTFS"
   - Database password: Choose a strong password
   - Region: Choose closest to you
   - Click "Create new project"

### 1.2 Get Your Credentials
1. Wait for the project to initialize (2-3 minutes)
2. Go to **Settings** (bottom left) > **API**
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### 1.3 Create Database Tables
1. In Supabase, go to **SQL Editor** (left menu)
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'Employee',
  robux INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON employees
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to read all data
CREATE POLICY "Admins can read all" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to update all data
CREATE POLICY "Admins can update all" ON employees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to delete
CREATE POLICY "Admins can delete" ON employees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM employees WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );
```

4. Click **Run** button
5. You should see success message

### 1.4 Create Your Admin Account
1. In Supabase, go to **Authentication** > **Users**
2. Click **Add user**
3. Email: `admin@example.com` (or your email)
4. Password: Choose a strong password
5. Click **Save user**
6. Go to **SQL Editor** > **New Query**
7. Run this SQL to make the user admin:

```sql
UPDATE employees 
SET is_admin = TRUE 
WHERE email = 'admin@example.com';
```

WAIT! You also need to insert the admin record first!

Run this instead:
```sql
INSERT INTO employees (user_id, name, email, rank, is_admin, robux)
SELECT 
  id, 
  'Admin User', 
  email, 
  'Admin', 
  TRUE, 
  0
FROM auth.users 
WHERE email = 'admin@example.com';
```

## Step 2: Add Your Supabase Credentials (2 minutes)

1. Open `js/config.js` in the british airways PTFS website folder
2. Replace the values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Example:
```javascript
const SUPABASE_URL = 'https://abcdef123456.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

3. Save the file

## Step 3: Test Locally (5 minutes)

1. Open `index.html` in your browser
2. Try admin login:
   - Email: `admin@example.com`
   - Password: The password you set earlier
3. You should see the admin dashboard!

## Step 4: Deploy to GitHub Pages (10 minutes)

### 4.1 Create GitHub Repository
1. Go to https://github.com
2. Create a new repository:
   - Name: `british-airways-ptfs`
   - Make it **Public** (required for free GitHub Pages)
   - Click **Create repository**

### 4.2 Upload Your Files
1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/british-airways-ptfs
cd british-airways-ptfs
```

2. Copy all files from `british airways PTFS website` folder into the cloned folder:
   - index.html
   - employee-dashboard.html
   - admin-dashboard.html
   - css/ folder
   - js/ folder

3. Commit and push:
```bash
git add .
git commit -m "Initial commit: British Airways PTFS tracker"
git push origin main
```

### 4.3 Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** (top right)
3. Go to **Pages** (left menu)
4. Under "Build and deployment":
   - Source: Select **Deploy from a branch**
   - Branch: `main` / `/(root)`
5. Click **Save**
6. Wait 1-2 minutes

Your site will be live at: `https://YOUR_USERNAME.github.io/british-airways-ptfs`

## Step 5: Create Employee Accounts

1. Log in to admin dashboard with your admin account
2. Click **Create New Employee**
3. Fill in:
   - Employee Name
   - Email (must be unique)
   - Password (give to the employee)
   - Rank (Employee, Senior Employee, Manager, Director)
4. Click **Create Employee**
5. Done! Employee can now log in

## Step 6: Manage Employees

### Update Robux or Rank
1. In admin dashboard, click **Edit** next to employee
2. Change Robux and/or Rank
3. Click **Save Changes**

### Delete Employee
1. Click **Delete** button
2. Confirm deletion
3. Account is permanently deleted

## Troubleshooting

### "SUPABASE_URL is undefined"
- Make sure you filled in `js/config.js` correctly
- Check for typos in the URL and keys

### "Login failed"
- Make sure user exists in Supabase Authentication
- Make sure there's a matching record in the employees table

### "Admin login works but can't see employees"
- Go to Supabase > SQL Editor
- Run: `SELECT * FROM employees;`
- Make sure employee records exist

### Changes not showing
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache

## Features

✅ **Employee Features:**
- Secure login
- View personal robux count
- View current rank
- Logout

✅ **Admin Features:**
- Create new employee accounts
- Edit employee robux and rank
- Delete employee accounts
- View all employees
- Secure admin login

## Security Notes

- Supabase handles password hashing and authentication
- Row Level Security (RLS) prevents users from accessing others' data
- Admin-only operations are protected
- Credentials are never stored in the code (except URL which is public)

## Next Steps

1. Customize the styling if you want different colors
2. Add more ranks in the select dropdowns
3. Add employee photos/avatars (optional, advanced)
4. Set up password reset email (in Supabase settings)

## Need Help?

- Supabase Docs: https://supabase.com/docs
- GitHub Pages Docs: https://pages.github.com/
- This setup takes about 30 minutes total

---

**Good luck with your British Airways PTFS tracker! You've got this! 🎉**
