-- IMMEDIATE FIX FOR ADMIN LOGIN ISSUE
-- Run this SQL in your Supabase SQL Editor

-- First, check if admin user exists
SELECT 
    id,
    email,
    name,
    role,
    password_hash,
    is_active,
    employee_id,
    department,
    created_at
FROM users 
WHERE email = 'admin@vignahartajanseva.gov.in';

-- Update or create admin user with correct password hash
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    phone, 
    role, 
    employee_id, 
    department,
    is_active
) VALUES (
    'admin@vignahartajanseva.gov.in',
    '$2b$12$pvj1HbLX957dFUxFPRhqeecrKMoQIAp7k46HVvBur6o8xx.9UZi4q', -- password: Admin@123
    'System Administrator',
    '9876543210',
    'ADMIN',
    'ADM001',
    'Administration',
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    employee_id = EXCLUDED.employee_id,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active;

-- Verify the admin user was created/updated correctly
SELECT 
    id,
    email,
    name,
    role,
    password_hash,
    is_active,
    employee_id,
    department,
    created_at
FROM users 
WHERE email = 'admin@vignahartajanseva.gov.in';

-- Create wallet for admin if it doesn't exist
INSERT INTO wallets (user_id, balance)
SELECT id, 0.00
FROM users 
WHERE email = 'admin@vignahartajanseva.gov.in'
AND NOT EXISTS (
    SELECT 1 FROM wallets WHERE user_id = users.id
);

-- Verify wallet was created
SELECT 
    u.email,
    u.name,
    w.balance
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.email = 'admin@vignahartajanseva.gov.in';
