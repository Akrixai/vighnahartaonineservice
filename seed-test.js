const fetch = require('node-fetch');

async function seedServices() {
  try {
    const response = await fetch('http://localhost:3000/api/debug/seed-services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

seedServices();
