const API_URL = 'http://localhost:5000/api';

async function testVideoFlow() {
  try {
    // 1. Register/Login Video Creator
    const email = `video_creator_${Date.now()}@test.com`;
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Video Creator',
        email: email,
        password: 'password123',
        role: 'founder'
      })
    });
    const userData = await registerRes.json();
    const token = userData.token;

    console.log('User created:', userData.name);

    // 2. Create Video Post
    console.log('Creating video post...');
    const videoUrl = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    const postRes = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        content: 'Check out our new product demo video! #startup #demo',
        type: 'video',
        contentType: 'video',
        mediaUrl: videoUrl
      })
    });
    
    const postData = await postRes.json();
    
    if (postData.success) {
      console.log('Video Post created: SUCCESS');
      console.log('Post ID:', postData.data._id);
      console.log('Video URL:', postData.data.mediaUrl);
    } else {
      console.error('Video Post creation failed:', postData);
    }

    // 3. Fetch Video Feed
    console.log('Fetching video feed...');
    const feedRes = await fetch(`${API_URL}/posts?type=video`);
    const feedData = await feedRes.json();
    
    if (feedData.success && feedData.data.length > 0) {
       console.log('Fetch video feed: SUCCESS');
       console.log('Found', feedData.data.length, 'video posts');
       const foundPost = feedData.data.find(p => p._id === postData.data._id);
       if (foundPost) {
         console.log('Verified created post is in feed.');
       } else {
         console.error('Created post not found in feed.');
       }
    } else {
       console.error('Fetch video feed: FAILED or EMPTY', feedData);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVideoFlow();
