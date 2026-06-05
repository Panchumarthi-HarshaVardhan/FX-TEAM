const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('--- STARTING STARTUPS API TESTS ---');

  try {
    // 1. Fetch startups
    console.log('\n1. Fetching all startups (GET /api/startups)...');
    const resAll = await axios.get(`${BASE_URL}/startups`);
    console.log(`Success: ${resAll.data.success}`);
    console.log(`Count: ${resAll.data.count}`);
    if (resAll.data.data && resAll.data.data.length > 0) {
      console.log('Sample Startup:', {
        name: resAll.data.data[0].name,
        industry: resAll.data.data[0].industry,
        stage: resAll.data.data[0].stage,
        location: resAll.data.data[0].location,
        verified: resAll.data.data[0].verified
      });
    } else {
      console.log('No startups in DB currently.');
    }

    // 2. Fetch startups with filters
    console.log('\n2. Fetching with filters (GET /api/startups?industry=Technology)...');
    const resFilter = await axios.get(`${BASE_URL}/startups?industry=Technology`);
    console.log(`Success: ${resFilter.data.success}, Count: ${resFilter.data.count}`);

    // 3. Test AI Filter endpoint
    console.log('\n3. Testing AI Filter endpoint (POST /api/startups/ai-filter)...');
    const resAi = await axios.post(`${BASE_URL}/startups/ai-filter`, {
      query: 'show fintech startups in idea stage'
    });
    console.log(`Success: ${resAi.data.success}`);
    console.log('AI Response data:', resAi.data.data);
    console.log('Fallback used:', !!resAi.data.fallback);

  } catch (err) {
    console.error('Test failed with error:', err.response ? err.response.data : err.message);
  }
}

runTests();
