const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const passwords = {
    'admin123': await bcrypt.hash('admin123', 12),
    'customer123': await bcrypt.hash('customer123', 12),
    'employee123': await bcrypt.hash('employee123', 12),
    'retailer123': await bcrypt.hash('retailer123', 12)
  };

  console.log('Password Hashes:');
  console.log('================');
  Object.entries(passwords).forEach(([password, hash]) => {
    console.log(`${password}: ${hash}`);
  });

  // Test verification
  console.log('\nVerification Tests:');
  console.log('==================');
  for (const [password, hash] of Object.entries(passwords)) {
    const isValid = await bcrypt.compare(password, hash);
    console.log(`${password} -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  }
}

generatePasswordHash().catch(console.error);
