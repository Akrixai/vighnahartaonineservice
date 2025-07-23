-- Add login_advertisements table for login page advertisements
-- This table is specifically for managing advertisements shown on the login page

-- Create login_advertisements table
CREATE TABLE IF NOT EXISTS login_advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_advertisements_is_active ON login_advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_login_advertisements_display_order ON login_advertisements(display_order);

-- Create trigger for updated_at
CREATE TRIGGER update_login_advertisements_updated_at 
    BEFORE UPDATE ON login_advertisements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample login advertisements using vignaharta.jpg
INSERT INTO login_advertisements (title, description, image_url, link_url, display_order, created_by) VALUES
('Welcome to Digital Services', 'Experience seamless government services at your fingertips', '/vignaharta.jpg', '/dashboard', 1, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in' LIMIT 1)),
('Secure & Fast Processing', 'Your documents are processed securely with quick turnaround time', '/vignaharta.jpg', '/about', 2, (SELECT id FROM users WHERE email = 'admin@vignahartajanseva.gov.in' LIMIT 1))
ON CONFLICT DO NOTHING;
