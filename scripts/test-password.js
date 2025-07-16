const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'Admin@123';
  
  // Test different hashes that might be in the database
  const hashes = [
    '$2b$12$LQv3c1yqBwlVHpPjrU3HuOHrXkIzDXRvFqNKykuLGg8XKWLlaA3DS', // Old hash
    '$2b$12$pvj1HbLX957dFUxFPRhqeecrKMoQIAp7k46HVvBur6o8xx.9UZi4q', // New hash
  ];
  
  console.log('🔐 Testing password:', password);
  console.log('');
  
  for (let i = 0; i < hashes.length; i++) {
    const hash = hashes[i];
    console.log(`🧪 Testing hash ${i + 1}:`, hash);
    
    try {
      const isValid = await bcrypt.compare(password, hash);
      console.log(`✅ Result ${i + 1}:`, isValid ? 'VALID' : 'INVALID');
    } catch (error) {
      console.log(`❌ Error ${i + 1}:`, error.message);
    }
    console.log('');
  }
  
  // Generate a fresh hash
  console.log('🔄 Generating fresh hash...');
  const freshHash = await bcrypt.hash(password, 12);
  console.log('🆕 Fresh hash:', freshHash);
  
  const freshTest = await bcrypt.compare(password, freshHash);
  console.log('✅ Fresh hash test:', freshTest ? 'VALID' : 'INVALID');
  
  console.log('\n📋 Use this SQL to update the admin user:');
  console.log(`UPDATE users SET password_hash = '${freshHash}' WHERE email = 'admin@vignahartajanseva.gov.in';`);
}

testPassword().catch(console.error);
