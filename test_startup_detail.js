  const API_URL = 'http://localhost:3000/api';

async function testStartupDetailFlow() {
  try {
    // 1. Register/Login Founder
    const founderEmail = `founder_${Date.now()}@test.com`;
    console.log('Registering founder:', founderEmail);
    
    const founderRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Founder Detail Test',
        email: founderEmail,
        password: 'password123',
        role: 'founder'
      })
    });

    if (!founderRes.ok) {
        const text = await founderRes.text();
        throw new Error(`Registration request failed: ${founderRes.status} ${founderRes.statusText} - ${text}`);
    }

    const founderData = await founderRes.json();
    
    if (!founderData.token) {
        throw new Error(`Registration failed: ${JSON.stringify(founderData)}`);
    }

    const token = founderData.token;
    console.log('Founder registered successfully');

    // 2. Create Startup
    console.log('Creating startup...');
    const startupRes = await fetch(`${API_URL}/startups`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: 'Detail Test Startup',
        oneLinePitch: 'Testing the detail page flow',
        description: 'This is a long description for the startup detail page test.',
        industry: 'Technology',
        stage: 'mvp',
        fundingRequired: 500000,
        contactEmail: 'contact@teststartup.com'
      })
    });
    const startupData = await startupRes.json();
    
    if (!startupData.success) {
        throw new Error(`Startup creation failed: ${JSON.stringify(startupData)}`);
    }

    const startupId = startupData.data._id;
    console.log('Startup created:', startupId);

    // 3. Create Post for Startup
    console.log('Creating post for startup...');
    const postRes = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        content: 'This is a test update for the startup detail page.',
        startupId: startupId
      })
    });
    const postData = await postRes.json();
    console.log('Post created status:', postData.success);

    // 4. Fetch Startup Details (Public)
    console.log('Fetching startup details...');
    const detailRes = await fetch(`${API_URL}/startups/${startupId}`);
    const detailData = await detailRes.json();
    
    if (detailData.success && detailData.data.name === 'Detail Test Startup') {
      console.log('Startup detail fetch: SUCCESS');
    } else {
      console.error('Startup detail fetch: FAILED', detailData);
    }

    // 5. Fetch Startup Posts (Public)
    console.log('Fetching startup posts...');
    const postsRes = await fetch(`${API_URL}/posts?startupId=${startupId}`);
    const postsData = await postsRes.json();
    
    if (postsData.success && postsData.data.length > 0) {
      console.log('Startup posts fetch: SUCCESS');
      console.log('Post content:', postsData.data[0].content);
    } else {
      console.error('Startup posts fetch: FAILED', postsData);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testStartupDetailFlow();
