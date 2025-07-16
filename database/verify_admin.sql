-- Verify admin user exists and check password hash
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

-- Check if the password hash is correct for 'Admin@123'
-- The hash should be: $2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkIzDXRvFqNKykuLGg8XKWLlaA3DS

-- If admin doesn't exist, create it:
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

-- Verify the admin user again
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
