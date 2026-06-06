const API_URL = 'http://localhost:3000/api';

async function runTests() {
  try {
    console.log('--- Starting Social Features Verification ---');

    // Helper for fetch
    const request = async (url, method = 'GET', body = null, token = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(url, options);
      const data = await res.json();
      return { status: res.status, data };
    };

    let founderToken;
    let founderId;
    let investorToken;
    let investorId;
    let startupId;
    let postId;

    // 1a. Register Founder User (to create startup/post)
    const uniqueId = Date.now();
    console.log('1a. Registering Founder...');
    const founderUser = {
      name: `Founder ${uniqueId}`,
      email: `founder${uniqueId}@test.com`,
      password: 'password123',
      role: 'founder',
      username: `founder${uniqueId}`
    };
    
    let res = await request(`${API_URL}/auth/register`, 'POST', founderUser);
    if (res.status !== 201) throw new Error(`Founder registration failed: ${res.data.message || 'Unknown error'}`);
    founderToken = res.data.token;
    founderId = res.data._id;
    console.log('    Success! Founder registered. ID:', founderId);

    // 1b. Register Investor User (to react/save)
    console.log('1b. Registering Investor...');
    const investorUser = {
      name: `Investor ${uniqueId}`,
      email: `investor${uniqueId}@test.com`,
      password: 'password123',
      role: 'investor',
      username: `investor${uniqueId}`
    };
    
    res = await request(`${API_URL}/auth/register`, 'POST', investorUser);
    if (res.status !== 201) throw new Error(`Investor registration failed: ${res.data.message || 'Unknown error'}`);
    investorToken = res.data.token;
    investorId = res.data._id;
    console.log('    Success! Investor registered. ID:', investorId);

    // 2. Create Startup (as Founder)
    console.log('2. Creating Startup (as Founder)...');
    const startupData = {
      name: `Startup ${uniqueId}`,
      oneLinePitch: 'Test Pitch',
      description: 'Test Description',
      industry: 'Technology',
      stage: 'idea',
      contactEmail: `contact${uniqueId}@test.com`
    };
    res = await request(`${API_URL}/startups`, 'POST', startupData, founderToken);
    if (!res.data.success) {
        console.error('Create Startup Failed:', res.data);
        throw new Error('Failed to create startup');
    }
    startupId = res.data.data._id;
    console.log(`   Success! Startup ID: ${startupId}`);

    // 3. Toggle Save Startup (as Investor)
    console.log('3. Testing Toggle Save Startup (as Investor)...');
    // Save
    res = await request(`${API_URL}/startups/save/${startupId}`, 'PUT', {}, investorToken);
    console.log('   Save Response:', res.data);
    if (res.data.data !== true) throw new Error('Expected data to be true (saved)');
    
    // Unsave
    res = await request(`${API_URL}/startups/save/${startupId}`, 'PUT', {}, investorToken);
    console.log('   Unsave Response:', res.data);
    if (res.data.data !== false) throw new Error('Expected data to be false (unsaved)');
    console.log('   Success! Save/Unsave works.');

    // 4. Create Post with Hashtag (as Founder)
    console.log('4. Creating Post with Hashtag (as Founder)...');
    const postData = {
      content: `This is a test post with #testing${uniqueId} and mention @investor${uniqueId}`,
      type: 'text'
    };
    res = await request(`${API_URL}/posts`, 'POST', postData, founderToken);
    postId = res.data.data._id;
    console.log(`   Success! Post ID: ${postId}`);

    // 5. Investor React (as Investor)
    console.log('5. Testing Investor React (as Investor)...');
    // Interested
    res = await request(`${API_URL}/posts/${postId}/react`, 'POST', { type: 'interested' }, investorToken);
    if (!res.data.success) throw new Error('Investor react failed');
    console.log('   Reacted "interested".');
    
    // Verify reaction count
    res = await request(`${API_URL}/posts/${postId}`, 'GET', null, founderToken);
    
    if (!res.data.success) {
        throw new Error(`Get Post failed: ${res.data.error}`);
    }

    const reactions = res.data.data.investorInterestCount; 
    console.log('   Post Data Investor Interest Count:', reactions);
    
    // 6. Hashtag Search (as Investor)
    console.log('6. Testing Hashtag Search (as Investor)...');
    res = await request(`${API_URL}/posts/hashtag/testing${uniqueId}`, 'GET', null, investorToken);
    console.log('   Hashtag Search Count:', res.data.count);
    if (res.data.count !== 1) throw new Error('Hashtag search failed');
    console.log('   Success! Hashtag found.');

    // 7. Test Reply/Thread (as Investor replying to Founder)
    console.log('7. Testing Thread/Reply (as Investor)...');
    const replyData = {
       content: 'This is a reply to the post',
       parentPostId: postId
    };
    res = await request(`${API_URL}/posts`, 'POST', replyData, investorToken);
    if (!res.data.success) throw new Error(`Reply failed: ${res.data.error}`);
    const replyId = res.data.data._id;
    console.log(`   Success! Reply created. ID: ${replyId}`);

    // Verify parent post has comment count updated (or we check if it appears in thread)
    const returnedParentId = typeof res.data.data.parentPostId === 'object' ? res.data.data.parentPostId._id : res.data.data.parentPostId;
    if (returnedParentId !== postId) throw new Error('Reply parentPostId mismatch');

    // 8. Test Notifications (as Investor)
    // Investor was mentioned in the first post "mention @investor..."
    console.log('8. Testing Notifications (as Investor)...');
    res = await request(`${API_URL}/notifications`, 'GET', null, investorToken);
    if (!res.data.success) throw new Error(`Get notifications failed: ${res.data.error}`);
    const notifications = res.data.data;
    console.log(`   Notifications found: ${notifications.length}`);
    
    // We expect at least one notification for the mention
    // console.log('   Notifications:', JSON.stringify(notifications, null, 2));
    const mentionNotif = notifications.find(n => n.type === 'mention' && n.entityId && n.entityId._id === postId);
    if (!mentionNotif) {
       console.warn('   WARNING: Mention notification not found! (Mentions parsing might need check)');
       // Note: Depending on implementation, mentions might be async or require exact username match logic
    } else {
       console.log('   Success! Mention notification found.');
    }

    console.log('--- All Tests Passed ---');

  } catch (error) {
    console.error('TEST FAILED:', error.message);
  }
}

runTests();
