const axios = require('axios');

const API_URL = 'http://localhost:3000/api/users';

async function test() {
  try {
    console.log('Fetching all users...');
    const res = await axios.get(API_URL);
    const users = res.data.data;
    console.log(`Found ${users.length} users.`);
    
    // Find a user with a username to test
    const user = users.find(u => u.username) || users[0];
    
    if (users.length === 0) {
      console.log('No users found. Creating one...');
      // Register a user
      const registerRes = await axios.post('http://localhost:3000/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'founder'
      });
      console.log('User created:', registerRes.data);
      users.push(registerRes.data);
    }

    const id = user._id;
    const username = user.username;

    console.log(`Testing with User ID: ${id}`);
    try {
      const idRes = await axios.get(`${API_URL}/${id}`);
      console.log('✅ Fetch by ID success:', idRes.data.success);
    } catch (e) {
      console.error('❌ Fetch by ID failed:', e.response?.data || e.message);
    }

    if (username) {
      console.log(`Testing with Username: ${username}`);
      try {
        const userRes = await axios.get(`${API_URL}/${username}`);
        console.log('✅ Fetch by Username success:', userRes.data.success);
        
        // Deep inspection of profile data
        const userData = userRes.data.data;
        console.log('--- Profile Data Inspection ---');
        console.log('User Role:', userData.role);
        
        if (userData.roleProfile) {
            console.log('Role Profile Found');
            if (userData.role === 'investor') {
                console.log('Investor Type:', userData.roleProfile.investorType, typeof userData.roleProfile.investorType);
                console.log('Preferred Stages:', userData.roleProfile.preferredStages);
                console.log('Preferred Industries:', userData.roleProfile.preferredIndustries);
                console.log('Portfolio:', userData.roleProfile.portfolio);
            }
        } else {
            console.log('⚠️ No Role Profile found');
        }
        
        if (userData.skills) console.log('Skills:', userData.skills);
        if (userData.lookingFor) console.log('Looking For:', userData.lookingFor);
        console.log('-------------------------------');

      } catch (e) {
        console.error('❌ Fetch by Username failed:', e.response?.data || e.message);
      }
    } else {
      console.log('⚠️ User has no username, skipping username test.');
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

test();
