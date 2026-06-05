const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function testAPI() {
  try {
    console.log('✅ Testing backend API...');
    
    // Test server is running
    console.log('1. Testing server health check...');
    const healthRes = await fetch(`${API_URL}/`);
    console.log('   Health check:', await healthRes.text());

    // Test register
    console.log('\n2. Testing register...');
    const registerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'founder'
      })
    });
    const registerData = await registerRes.json();
    console.log('   Register:', registerData);

    // Test login
    console.log('\n3. Testing login...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('   Login:', loginData);

    if (loginData.token) {
      // Test getMe
      console.log('\n4. Testing getMe...');
      const getMeRes = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      const getMeData = await getMeRes.json();
      console.log('   getMe:', getMeData);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPI();
