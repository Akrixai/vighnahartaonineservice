-- Updated Vignaharta Janseva Database Schema
-- Removed CUSTOMER role, enhanced admin functionality
-- PostgreSQL Schema for Supabase

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS advertisements CASCADE;
DROP TABLE IF EXISTS training_videos CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS queries CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS schemes CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('ADMIN', 'EMPLOYEE', 'RETAILER');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'SCHEME_PAYMENT', 'REFUND', 'COMMISSION');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE query_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- Users table (Admin, Employee, Retailer only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Additional fields for retailers
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    date_of_birth DATE,
    gender VARCHAR(10),
    occupation VARCHAR(100),
    
    -- Admin/Employee specific fields
    employee_id VARCHAR(50),
    department VARCHAR(100),
    branch VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_phone CHECK (phone ~ '^[0-9]{10}$' OR phone IS NULL),
    CONSTRAINT valid_pincode CHECK (pincode ~ '^[0-9]{6}$' OR pincode IS NULL)
);

-- Wallets table (for retailers and admin monitoring)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type transaction_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status transaction_status DEFAULT 'PENDING',
    description TEXT,
    reference VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID REFERENCES users(id),
    
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Schemes/Services table (manageable by admin)
CREATE TABLE schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_free BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(100),
    documents TEXT[], -- Array of required document types
    processing_time_days INTEGER DEFAULT 7,
    commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Commission percentage for retailers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_commission CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

-- Applications table (submitted by retailers, managed by admin/employees)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id), -- Retailer who submitted
    scheme_id UUID NOT NULL REFERENCES schemes(id),
    form_data JSONB NOT NULL,
    documents TEXT[], -- Array of uploaded document URLs
    status application_status DEFAULT 'PENDING',
    amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    rejected_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Customer details (filled by retailer for their customers)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    customer_address TEXT,
    
    CONSTRAINT valid_customer_phone CHECK (customer_phone ~ '^[0-9]{10}$' OR customer_phone IS NULL)
);

-- Certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    certificate_url TEXT, -- URL to the generated certificate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    issued_by UUID REFERENCES users(id)
);

-- Employee Certificates table
CREATE TABLE employee_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    employee_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    department VARCHAR(100),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Vignaharta Janseva',
    digital_signature VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Retailer Certificates table
CREATE TABLE retailer_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    retailer_name VARCHAR(255) NOT NULL,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Vignaharta Janseva',
    digital_signature VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (manageable by admin)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    features TEXT[], -- Array of product features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT non_negative_stock CHECK (stock_quantity >= 0)
);

-- Training Videos table (manageable by admin)
CREATE TABLE training_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL, -- YouTube URL or direct video URL
    thumbnail_url TEXT,
    category VARCHAR(100),
    level VARCHAR(50) DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT positive_duration CHECK (duration_minutes > 0 OR duration_minutes IS NULL)
);

-- Advertisements table (manageable by admin)
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position VARCHAR(50) NOT NULL, -- 'header', 'sidebar', 'footer', 'popup'
    is_active BOOLEAN DEFAULT true,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Queries/Support tickets table
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- general, technical, billing, etc.
    status query_status DEFAULT 'OPEN',
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_by UUID REFERENCES users(id),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_scheme_id ON applications(scheme_id);
CREATE INDEX idx_schemes_is_active ON schemes(is_active);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_training_videos_is_active ON training_videos(is_active);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX idx_queries_user_id ON queries(user_id);
CREATE INDEX idx_queries_status ON queries(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schemes_updated_at BEFORE UPDATE ON schemes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_videos_updated_at BEFORE UPDATE ON training_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queries_updated_at BEFORE UPDATE ON queries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert fresh admin user
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
);

-- Insert sample employee
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    phone, 
    role, 
    employee_id, 
    department,
    is_active,
    created_by
) VALUES (
    'employee@vignahartajanseva.gov.in',
    '$2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkIzDXRvFqNKykuLGg8XKWLlaA3DS', -- password: Employee@123
    'Government Employee',
    '9876543211',
    'EMPLOYEE',
    'EMP001',
    'Document Processing',
    true,
    (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')
);

-- Insert sample schemes/services
INSERT INTO schemes (name, description, price, is_free, category, documents, processing_time_days, commission_rate, created_by) VALUES
('Aadhaar Card Application', 'Apply for new Aadhaar card or update existing details', 0.00, true, 'Identity Documents', ARRAY['photo', 'address_proof', 'identity_proof'], 15, 0.00, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('PAN Card Application', 'Apply for new PAN card for income tax purposes', 110.00, false, 'Identity Documents', ARRAY['photo', 'address_proof', 'identity_proof', 'date_of_birth_proof'], 20, 10.00, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('Income Certificate', 'Official income certificate from government', 50.00, false, 'Certificates', ARRAY['salary_slip', 'bank_statement', 'address_proof'], 7, 15.00, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('Caste Certificate', 'Official caste certificate for reservations', 30.00, false, 'Certificates', ARRAY['birth_certificate', 'address_proof', 'caste_proof'], 10, 12.00, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('Domicile Certificate', 'Certificate of residence for state benefits', 40.00, false, 'Certificates', ARRAY['birth_certificate', 'address_proof', 'school_certificate'], 12, 10.00, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in'));

-- Insert sample products
INSERT INTO products (name, description, price, category, features, stock_quantity, created_by) VALUES
('Digital Certificate Frame', 'Premium digital frame to display government certificates', 2500.00, 'Digital Products', ARRAY['HD Display', 'Multiple Certificate Support', 'Auto-Update', 'Cloud Sync'], 50, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('Document Scanner Pro', 'Professional document scanner for high-quality digitization', 15000.00, 'Hardware', ARRAY['High Resolution', 'OCR Support', 'Cloud Upload', 'Mobile App'], 25, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('Biometric Device', 'Fingerprint scanner for secure authentication', 8500.00, 'Hardware', ARRAY['Fast Recognition', 'High Accuracy', 'USB Connectivity', 'SDK Included'], 30, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in'));

-- Insert sample training videos
INSERT INTO training_videos (title, description, video_url, category, level, duration_minutes, created_by) VALUES
('How to Apply for Aadhaar Card', 'Step-by-step guide to apply for Aadhaar card', 'https://youtube.com/watch?v=example1', 'Identity Documents', 'Beginner', 12, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('PAN Card Application Process', 'Complete tutorial on PAN card application', 'https://youtube.com/watch?v=example2', 'Identity Documents', 'Beginner', 8, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('Digital Signature Setup', 'How to set up digital signature for applications', 'https://youtube.com/watch?v=example3', 'Digital Services', 'Advanced', 18, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in'));

-- Insert sample advertisements
INSERT INTO advertisements (title, description, image_url, position, link_url, created_by) VALUES
('Government Scheme Alert', 'New government schemes available for citizens', '/images/govt-scheme-ad.jpg', 'header', 'https://gov.in/schemes', (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in')),
('Digital India Initiative', 'Join the Digital India movement', '/images/digital-india-ad.jpg', 'sidebar', 'https://digitalindia.gov.in', (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in'));

-- Grant necessary permissions (if using RLS)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optional, for additional security)
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Admins can view all data" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

COMMIT;
