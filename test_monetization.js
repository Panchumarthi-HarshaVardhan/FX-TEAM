const API_URL = 'http://localhost:3000/api';

async function testMonetizationFlow() {
  try {
    // 1. Register/Login Founder
    const email = `founder_money_${Date.now()}@test.com`;
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Money Founder',
        email: email,
        password: 'password123',
        role: 'founder'
      })
    });
    const userData = await registerRes.json();
    const token = userData.token;
    const founderId = userData._id;

    // 2. Create Startup
    console.log('Creating startup...');
    const startupRes = await fetch(`${API_URL}/startups`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: 'Shop Startup',
        oneLinePitch: 'We sell things',
        description: 'E-commerce startup test',
        industry: 'E-commerce',
        stage: 'revenue',
        fundingRequired: 50000,
        contactEmail: 'shop@startup.com'
      })
    });
    const startupData = await startupRes.json();
    if (!startupData.success) {
        console.error('Startup creation failed details:', JSON.stringify(startupData, null, 2));
        throw new Error('Startup creation failed');
    }
    const startupId = startupData.data._id;
    console.log('Startup created:', startupId);

    // 3. Create Product
    console.log('Creating product...');
    const productRes = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        startupId,
        name: 'Premium Plan',
        description: 'Unlock all features',
        price: 99
      })
    });
    const productData = await productRes.json();
    
    if (productData.success) {
      console.log('Product created: SUCCESS');
      console.log('Product Name:', productData.data.name);
    } else {
      console.error('Product creation failed:', productData);
    }

    // 4. Fetch Products for Startup
    console.log('Fetching startup products...');
    const fetchRes = await fetch(`${API_URL}/products?startupId=${startupId}`);
    const fetchData = await fetchRes.json();
    
    if (fetchData.success && fetchData.data.length > 0) {
       console.log('Fetch products: SUCCESS');
       console.log('Fetched Product:', fetchData.data[0].name);
    } else {
       console.error('Fetch products: FAILED', fetchData);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testMonetizationFlow();
