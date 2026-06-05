const API_URL = 'http://localhost:5000/api';

async function testVideoFlow() {
  try {
    // 1. Register/Login User
    const email = `video_test_${Date.now()}@test.com`;
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

    // 2. Create Video Post (Simulated with MP4 URL)
    console.log('Creating video post...');
    const videoRes = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        content: 'Check out this new feature! #demo #video',
        type: 'video',
        contentType: 'video',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      })
    });
    const videoData = await videoRes.json();
    console.log('Video created:', videoData.success);

    // 3. Fetch Video Feed
    console.log('Fetching video feed...');
    const feedRes = await fetch(`${API_URL}/posts?type=video`);
    const feedData = await feedRes.json();
    
    if (feedData.success && feedData.data.length > 0) {
      console.log('Video feed fetch: SUCCESS');
      console.log('Video URL:', feedData.data[0].mediaUrl);
    } else {
      console.error('Video feed fetch: FAILED', feedData);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testVideoFlow();
