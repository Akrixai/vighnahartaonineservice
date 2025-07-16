# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Vercel account
2. Supabase project
3. GitHub repository

### Step 1: Environment Variables
Set up the following environment variables in your Vercel dashboard:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# WhatsApp API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# App Configuration
NEXT_PUBLIC_APP_NAME=Vignaharta Jan Seva
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
ADMIN_EMAIL=admin@example.com
NODE_ENV=production
```

### Step 2: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Import the project
3. Configure environment variables
4. Deploy

### Step 3: Post-Deployment
1. Set up custom domain (optional)
2. Configure Supabase RLS policies
3. Test all functionality
4. Set up monitoring

## Database Setup (Supabase)

### Required Tables
- users
- applications
- services
- documents
- certificates
- products
- advertisements
- chat_sessions
- chat_messages

### RLS Policies
Ensure Row Level Security is enabled for all tables with appropriate policies.

## Domain Configuration
1. Add custom domain in Vercel dashboard
2. Update NEXTAUTH_URL environment variable
3. Update NEXT_PUBLIC_APP_URL environment variable
4. Configure DNS records

## Monitoring
- Set up Vercel Analytics
- Configure error tracking
- Monitor performance metrics
