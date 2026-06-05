const axios = require('axios');

async function testSignup() {
  const emailFounder = `founder_${Date.now()}@test.com`;
  const emailInvestor = `investor_${Date.now()}@test.com`;

  console.log('Testing Founder signup with email:', emailFounder);
  try {
    const res = await axios.post('http://localhost:3000/api/auth/register', {
      fullName: 'Test Founder',
      email: emailFounder,
      password: 'password123',
      role: 'founder'
    });
    console.log('✅ Founder signup succeeded:', res.data);
  } catch (error) {
    console.error('❌ Founder signup failed:', error.response?.data || error.message);
  }

  console.log('Testing Investor signup with email:', emailInvestor);
  try {
    const res = await axios.post('http://localhost:3000/api/auth/register', {
      fullName: 'Test Investor',
      email: emailInvestor,
      password: 'password123',
      role: 'investor'
    });
    console.log('✅ Investor signup succeeded:', res.data);
  } catch (error) {
    console.error('❌ Investor signup failed:', error.response?.data || error.message);
  }
}

testSignup();
