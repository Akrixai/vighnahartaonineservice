# Supabase PostgreSQL Setup Guide for Vignaharta Janseva

## Step 1: Create Supabase Project

1. **Go to Supabase**: Visit [https://supabase.com](https://supabase.com)
2. **Sign Up/Login**: Create account or login with existing credentials
3. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Project Name: `vignaharta-janseva`
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your location
   - Click "Create new project"

## Step 2: Database Setup

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**

### 2.2 Run the Schema Script
1. Copy the entire content from `updated_schema.sql`
2. Paste it in the SQL Editor
3. Click **"Run"** to execute the script
4. Verify all tables are created in the **Table Editor**

### 2.3 Verify Data
Check that the following tables exist with sample data:
- `users` (with admin and employee accounts)
- `schemes` (with government services)
- `products` (with sample products)
- `training_videos` (with sample videos)
- `advertisements` (with sample ads)

## Step 3: Environment Variables Setup

### 3.1 Get Supabase Credentials
In your Supabase project dashboard:

1. **Go to Settings > API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Keep this secret!)

### 3.2 Update .env.local
Create or update your `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Database URL (for Prisma if needed)
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-id.supabase.co:5432/postgres
```

## Step 4: Admin Login Instructions

### 4.1 Fresh Admin Credentials
After running the schema script, use these credentials:

**Admin Login:**
- **Email**: `admin@vignahartajanseva.gov.in`
- **Password**: `Admin@123`
- **Role**: ADMIN

**Employee Login (Sample):**
- **Email**: `employee@vignahartajanseva.gov.in`
- **Password**: `Employee@123`
- **Role**: EMPLOYEE

### 4.2 First Login Steps
1. **Start the application**: `npm run dev`
2. **Go to**: `http://localhost:3000`
3. **Click**: Admin Login
4. **Enter credentials** above
5. **Access admin features**:
   - Product Management: `/dashboard/admin/products`
   - Training Videos: `/dashboard/admin/training`
   - User Management: `/dashboard/admin/users`
   - Advertisement Management: `/dashboard/admin/ads`

## Step 5: Security Configuration (Optional)

### 5.1 Row Level Security (RLS)
If you want additional security, enable RLS:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can do everything" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

### 5.2 API Security
The application includes role-based access control:
- **Admin**: Full access to all features
- **Employee**: Can view/update applications, limited admin features
- **Retailer**: Can submit applications, manage own data

## Step 6: Testing the Setup

### 6.1 Database Connection Test
1. Start the application: `npm run dev`
2. Check browser console for any database errors
3. Try logging in with admin credentials
4. Verify dashboard loads correctly

### 6.2 Admin Features Test
1. **Product Management**: Add/edit/delete products
2. **Training Videos**: Add/edit/delete videos
3. **User Management**: View users, add employees
4. **Applications**: View and manage applications

### 6.3 Real-time Features Test
1. **Wallet Updates**: Test wallet balance updates
2. **Application Status**: Test status changes
3. **Live Data**: Verify real-time data flow

## Step 7: Production Deployment

### 7.1 Environment Variables
Update production environment variables:
- Use production Supabase URL
- Use production domain for NEXTAUTH_URL
- Generate new NEXTAUTH_SECRET for production

### 7.2 Database Backup
Set up automated backups in Supabase:
1. Go to **Settings > Database**
2. Configure **Point-in-time Recovery**
3. Set up **Automated Backups**

## Troubleshooting

### Common Issues:

1. **Connection Error**: Check environment variables
2. **Auth Error**: Verify NEXTAUTH_SECRET is set
3. **Permission Error**: Check user roles in database
4. **Schema Error**: Re-run the schema script

### Database Reset:
If you need to reset the database:
```sql
-- Drop all tables and recreate
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run the updated_schema.sql again
```

## Admin Capabilities Summary

Once setup is complete, admin can:

✅ **Product Management**: Add, edit, delete, activate/deactivate products
✅ **Training Videos**: Manage video library for retailer training
✅ **User Management**: Add employees, manage retailers
✅ **Advertisement Management**: Control website advertisements
✅ **Service Management**: Add/modify government services
✅ **Application Management**: View, approve, reject applications
✅ **Transaction Monitoring**: View all financial transactions
✅ **System Analytics**: Monitor system usage and performance

## Support

For issues with setup:
1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Verify all environment variables are correct
4. Ensure database schema is properly applied
