const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let token = '';
let userId = '';

// Helper to login/register
async function setup() {
    try {
        // Login or Register a test user
        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: 'test@example.com',
                password: 'password123'
            });
            token = res.data.token;
            userId = res.data._id;
            console.log('Logged in.');
        } catch (e) {
            const res = await axios.post(`${API_URL}/auth/register`, {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'founder',
                username: 'testuser'
            });
            token = res.data.token;
            userId = res.data._id;
            console.log('Registered and logged in.');
        }
    } catch (e) {
        console.error('Setup failed:', e.message);
        process.exit(1);
    }
}

async function createPost(contentType, content) {
    try {
        const res = await axios.post(`${API_URL}/posts`, {
            content,
            contentType,
            type: contentType === 'tweet' ? 'text' : 'video', // legacy mapping
            mediaUrl: contentType !== 'tweet' ? 'http://example.com/video.mp4' : undefined
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Created ${contentType}: ${res.data.data._id}`);
        return res.data.data._id;
    } catch (e) {
        console.error(`Failed to create ${contentType}:`, e.response?.data || e.message);
    }
}

async function checkFeed(postId, shouldExist) {
    try {
        const res = await axios.get(`${API_URL}/posts`); // Default feed
        const posts = res.data.data;
        const found = posts.find(p => p._id === postId);
        if (shouldExist && !found) console.error(`❌ Post ${postId} NOT found in Feed (Expected to find)`);
        else if (!shouldExist && found) console.error(`❌ Post ${postId} FOUND in Feed (Expected NOT to find)`);
        else console.log(`✅ Feed check passed for ${postId} (Should exist: ${shouldExist})`);
    } catch (e) {
        console.error('Feed check failed:', e.message);
    }
}

async function checkWatch(postId, shouldExist) {
    try {
        const res = await axios.get(`${API_URL}/posts?type=video`); // Watch feed
        const posts = res.data.data;
        const found = posts.find(p => p._id === postId);
        if (shouldExist && !found) console.error(`❌ Post ${postId} NOT found in Watch (Expected to find)`);
        else if (!shouldExist && found) console.error(`❌ Post ${postId} FOUND in Watch (Expected NOT to find)`);
        else console.log(`✅ Watch check passed for ${postId} (Should exist: ${shouldExist})`);
    } catch (e) {
        console.error('Watch check failed:', e.message);
    }
}

async function run() {
    await setup();
    
    console.log('\n--- Testing Content Separation ---');
    
    // 1. Create Tweet
    const tweetId = await createPost('tweet', 'This is a test tweet');
    
    // 2. Create vTweet
    const vtweetId = await createPost('vtweet', 'This is a test vtweet');
    
    // 3. Create Long Video
    const videoId = await createPost('video', 'This is a test long video');
    
    console.log('\n--- Verifying Visibility ---');
    
    // Check Feed (Should have Tweet and vTweet, NO Video)
    await checkFeed(tweetId, true);
    await checkFeed(vtweetId, true);
    await checkFeed(videoId, false);
    
    // Check Watch (Should have ONLY Video)
    await checkWatch(tweetId, false);
    await checkWatch(vtweetId, false);
    await checkWatch(videoId, true);
}

run();
