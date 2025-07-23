const bcrypt = require('bcryptjs');

async function generateAdminHash() {
  const password = 'Admin@123';
  const saltRounds = 12;
  
  try {
    console.log('🔐 Generating password hash for:', password);
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Generated hash:', hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('🧪 Hash validation test:', isValid);
    
    console.log('\n📋 SQL to update admin user:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@vignahartajanseva.gov.in';`);
    
    console.log('\n📋 SQL to create admin user if not exists:');
    console.log(`INSERT INTO users (
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
  '${hash}',
  'System Administrator',
  '9876543210',
  'ADMIN',
  'ADM001',
  'Administration',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;`);
    
  } catch (error) {
    console.error('❌ Error generating hash:', error);
  }
}

generateAdminHash();
