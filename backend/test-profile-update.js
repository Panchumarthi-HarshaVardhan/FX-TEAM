const axios = require('axios');

const testProfileUpdate = async () => {
  console.log('=== Testing User Profile Update & Persistence ===');
  try {
    const email = `update_test_${Date.now()}@example.com`;
    
    // 1. Register User
    const registerRes = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Update Test User',
      email: email,
      password: 'password123',
      role: 'founder'
    });
    
    console.log('✅ User registered:', registerRes.data.email);
    const token = registerRes.data.token;
    const username = registerRes.data.username;
    
    // 2. Perform PUT /api/users/update
    console.log('\n=== Testing PUT /api/users/update ===');
    const updatePayload = {
      bio: 'Visionary founder building the next AI platform.',
      headline: 'Founder @ Nexus AI | Tech Leader',
      location: { city: 'San Francisco', country: 'USA' },
      role: 'founder',
      skills: ['React', 'Node.js', 'Machine Learning'],
      interests: ['SaaS', 'Fintech'],
      website: 'https://nexusai.io',
      linkedin: 'https://linkedin.com/in/updatetest',
      github: 'https://github.com/updatetest',
      profilePhoto: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      coverPhoto: 'https://res.cloudinary.com/demo/image/upload/cover.jpg'
    };
    
    const updateRes = await axios.put('http://localhost:3000/api/users/update', updatePayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Update API response success:', updateRes.data.success);
    const updatedUser = updateRes.data.user;
    
    if (!updatedUser) {
      throw new Error('Update API did not return user object!');
    }
    
    console.log('✅ Returned isProfileComplete:', updatedUser.isProfileComplete);
    console.log('✅ Returned bio:', updatedUser.bio);
    console.log('✅ Returned headline:', updatedUser.headline);
    console.log('✅ Returned location:', updatedUser.location);
    console.log('✅ Returned socialLinks:', updatedUser.socialLinks);
    console.log('✅ Returned skills:', updatedUser.skills);
    console.log('✅ Returned profileImage:', updatedUser.profileImage);
    console.log('✅ Returned coverImage:', updatedUser.coverImage);
    
    // Assertions
    if (updatedUser.isProfileComplete !== true) {
      throw new Error('Assertion failed: isProfileComplete should be true!');
    }
    if (updatedUser.headline !== updatePayload.headline) {
      throw new Error('Assertion failed: headline was not saved or returned!');
    }
    if (updatedUser.socialLinks.website !== updatePayload.website || 
        updatedUser.socialLinks.linkedin !== updatePayload.linkedin ||
        updatedUser.socialLinks.github !== updatePayload.github) {
      throw new Error('Assertion failed: social links were not saved or returned correctly!');
    }
    
    // 3. Fetch from GET /api/users/me
    console.log('\n=== Testing GET /api/users/me (Persistence check) ===');
    const meRes = await axios.get('http://localhost:3000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const meUser = meRes.data;
    console.log('✅ /api/users/me returned success');
    console.log('✅ /api/users/me isProfileComplete:', meUser.isProfileComplete);
    console.log('✅ /api/users/me bio:', meUser.bio);
    console.log('✅ /api/users/me headline:', meUser.headline);
    console.log('✅ /api/users/me website:', meUser.socialLinks?.website);
    
    if (meUser.isProfileComplete !== true) {
      throw new Error('Assertion failed: persisted isProfileComplete is not true in database!');
    }
    if (meUser.headline !== updatePayload.headline) {
      throw new Error('Assertion failed: persisted headline is missing or incorrect!');
    }
    
    console.log('\n=== ALL PERSISTENCE TESTS PASSED ===');
  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

testProfileUpdate();
