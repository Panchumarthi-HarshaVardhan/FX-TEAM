const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      fullName: 'Test User API',
      email: 'testapi' + Date.now() + '@example.com',
      password: 'password123',
      role: 'founder'
    });
    console.log('Success:', res.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

test();
