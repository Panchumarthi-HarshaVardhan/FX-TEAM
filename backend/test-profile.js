
const axios = require('axios');

const testProfile = async () => {
  console.log('=== Testing User Profile ===');
  try {
    const registerRes = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Profile Test User',
      email: `profiletest${Date.now()}@example.com`,
      password: 'password123',
      role: 'founder'
    });
    console.log('✅ Test user registered:', registerRes.data);
    const username = registerRes.data.username;
    
    console.log('\n=== Fetching User by Username ===');
    const profileRes = await axios.get(`http://localhost:3000/api/users/handle/${username}`);
    console.log('✅ Profile fetched successfully:', profileRes.data);
    
    console.log('\n=== All Tests Passed ===');
  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

testProfile();
