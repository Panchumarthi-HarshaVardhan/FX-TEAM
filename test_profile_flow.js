const API_URL = 'http://localhost:3000/api';

async function testProfileFlow() {
  try {
    // 1. Register/Login User (Founder)
    const email = `profile_test_${Date.now()}@test.com`;
    console.log('Registering user:', email);
    
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Profile Test User',
        email: email,
        password: 'password123',
        role: 'founder'
      })
    });
    const userData = await registerRes.json();
    
    if (!userData.token) {
        throw new Error(`Registration failed: ${JSON.stringify(userData)}`);
    }

    const token = userData.token;
    const userId = userData._id;
    console.log('User registered, ID:', userId);

    // 2. Create Startup (to test startup listing on profile)
    console.log('Creating startup for profile test...');
    const startupRes = await fetch(`${API_URL}/startups`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: 'Profile Test Startup',
        oneLinePitch: 'Testing profile page startups',
        description: 'Description for profile test startup.',
        industry: 'Technology',
        stage: 'idea',
        fundingRequired: 100000,
        contactEmail: 'profiletest@startup.com'
      })
    });
    const startupData = await startupRes.json();
    if (!startupData.success) {
         console.error('Startup creation failed:', startupData);
    } else {
        console.log('Startup created:', startupData.data._id);
    }

    // 3. Create Post (to test post listing on profile)
    console.log('Creating post for profile test...');
    const postRes = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        content: 'Hello World! This is a profile test post.'
      })
    });
    const postData = await postRes.json();
    console.log('Post created:', postData.success);

    // 4. Fetch User Profile
    console.log('Fetching user profile...');
    const profileRes = await fetch(`${API_URL}/users/${userId}`);
    const profileData = await profileRes.json();
    
    if (profileData.success && profileData.data.name === 'Profile Test User') {
      console.log('Profile fetch: SUCCESS');
    } else {
      console.error('Profile fetch: FAILED', profileData);
    }

    // 5. Fetch User Posts
    console.log('Fetching user posts...');
    const postsRes = await fetch(`${API_URL}/posts?authorId=${userId}`);
    const postsData = await postsRes.json();
    
    if (postsData.success && postsData.data.length > 0) {
      console.log('User posts fetch: SUCCESS');
      console.log('Post content:', postsData.data[0].content);
    } else {
      console.error('User posts fetch: FAILED', postsData);
    }

    // 6. Fetch User Startups (via Startup Controller filter)
    console.log('Fetching user startups...');
    const startupsRes = await fetch(`${API_URL}/startups?founderId=${userId}`);
    const startupsData = await startupsRes.json();
    
    if (startupsData.success && startupsData.data.length > 0) {
       console.log('User startups fetch: SUCCESS');
       console.log('Startup name:', startupsData.data[0].name);
    } else {
       console.error('User startups fetch: FAILED', startupsData);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testProfileFlow();
