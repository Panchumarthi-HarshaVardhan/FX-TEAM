const API_URL = 'http://localhost:5000/api';

async function runTests() {
  try {
    console.log('--- Starting FounderX Investor Portals End-to-End Verification ---');

    const request = async (url, method = 'GET', body = null, token = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(url, options);
      const data = await res.json();
      return { status: res.status, data };
    };

    const uniqueId = Date.now();

    // 1. REGISTER USERS
    console.log('1. Registering test users...');
    const founderObj = {
      name: `Founder ${uniqueId}`,
      email: `founder_${uniqueId}@test.com`,
      password: 'password123',
      role: 'founder',
      username: `founder_${uniqueId}`
    };
    const investorObj = {
      name: `Investor ${uniqueId}`,
      email: `investor_${uniqueId}@test.com`,
      password: 'password123',
      role: 'investor',
      username: `investor_${uniqueId}`
    };

    let res = await request(`${API_URL}/auth/register`, 'POST', founderObj);
    if (!res.data.token) throw new Error('Founder registration failed: ' + JSON.stringify(res.data));
    const founderToken = res.data.token;
    const founderId = res.data._id;

    res = await request(`${API_URL}/auth/register`, 'POST', investorObj);
    if (!res.data.token) throw new Error('Investor registration failed: ' + JSON.stringify(res.data));
    const investorToken = res.data.token;
    const investorId = res.data._id;

    console.log(`   Registered Founder (${founderId}) and Investor (${investorId})`);

    // 2. CREATE STARTUP
    console.log('2. Founder creating startup...');
    res = await request(`${API_URL}/startups`, 'POST', {
      name: `Sandbox Ventures ${uniqueId}`,
      oneLinePitch: 'Next-gen investor sandbox',
      description: 'Startup description for testing investor portal workflows.',
      industry: 'FinTech',
      stage: 'mvp',
      fundingNeeded: 250000,
      contactEmail: `contact_${uniqueId}@sandbox.com`
    }, founderToken);
    if (res.status !== 201) throw new Error('Startup creation failed: ' + JSON.stringify(res.data));
    const startupId = res.data.data._id;
    console.log(`   Startup created: ${startupId}`);

    // 3. INVESTOR SENDS INTEREST REQUEST
    console.log('3. Investor sending interest request...');
    res = await request(`${API_URL}/investor/interest-request`, 'POST', {
      startupId,
      message: 'We would love to discuss a potential lead investment.',
      interestedAmount: '$150,000',
      investmentType: 'SAFE'
    }, investorToken);
    if (res.status !== 201) throw new Error('Interest request failed: ' + JSON.stringify(res.data));
    const requestId = res.data.data._id;
    console.log(`   Interest request created with ID: ${requestId}`);

    // Check duplicate interest request prevention
    console.log('   Testing duplicate interest request prevention...');
    res = await request(`${API_URL}/investor/interest-request`, 'POST', {
      startupId,
      message: 'Duplicate request test',
      interestedAmount: '$150,000',
      investmentType: 'SAFE'
    }, investorToken);
    if (res.status === 201) throw new Error('Duplicate interest request allowed, expected error');
    console.log('   Success: Duplicate interest requests are blocked.');

    // 4. FOUNDER ACCEPTS INVESTOR REQUEST
    console.log('4. Founder accepting interest request...');
    res = await request(`${API_URL}/founder/investor-requests/${requestId}/accept`, 'POST', {}, founderToken);
    if (res.status !== 200) throw new Error('Failed to accept interest request: ' + JSON.stringify(res.data));
    console.log('   Request accepted successfully.');

    // Check duplicate accept / connection prevention
    console.log('   Testing duplicate accept prevention...');
    res = await request(`${API_URL}/founder/investor-requests/${requestId}/accept`, 'POST', {}, founderToken);
    if (res.status === 200) throw new Error('Duplicate acceptance allowed, expected error');
    console.log('   Success: Duplicate acceptance blocked.');

    // 5. INVESTOR GETS PORTAL DATA
    console.log('5. Investor fetching portal-data...');
    res = await request(`${API_URL}/investor/portal-data`, 'GET', null, investorToken);
    if (res.status !== 200) throw new Error('Failed to fetch investor portal-data: ' + JSON.stringify(res.data));
    
    const connections = res.data.data.connections || [];
    const connection = connections.find(c => c.startupId?._id === startupId || c.startupId === startupId);
    if (!connection) throw new Error('Startup connection not found in investor portal data');
    const connectionId = connection._id;
    console.log(`   Connection verified in Investor Portal. ID: ${connectionId}`);

    // 6. INVESTOR UPDATES PIPELINE STAGE
    console.log('6. Investor updating pipeline stage to Meeting...');
    res = await request(`${API_URL}/investor/pipeline/${connectionId}/stage`, 'PATCH', {
      stage: 'Meeting'
    }, investorToken);
    if (res.status !== 200) throw new Error('Failed to update stage: ' + JSON.stringify(res.data));
    if (res.data.data.pipelineStage !== 'Meeting') throw new Error('Pipeline stage not updated to Meeting');
    console.log('   Pipeline stage successfully updated.');

    // 7. INVESTOR SAVES PRIVATE NOTES
    console.log('7. Investor updating private notes...');
    res = await request(`${API_URL}/investor/pipeline/${connectionId}/notes`, 'PATCH', {
      notes: 'Strong core team, check traction next week.'
    }, investorToken);
    if (res.status !== 200) throw new Error('Failed to update private notes: ' + JSON.stringify(res.data));
    if (res.data.data.privateNotes !== 'Strong core team, check traction next week.') throw new Error('Private notes not saved');
    console.log('   Private notes successfully updated.');

    // 8. VERIFY PRIVATE NOTES ARE SECURE (NOT VISIBLE TO FOUNDER)
    console.log('8. Verifying private notes are secure...');
    res = await request(`${API_URL}/founder/portal-data`, 'GET', null, founderToken);
    if (res.status !== 200) throw new Error('Failed to fetch founder portal-data');
    const founderConnections = res.data.data.connectedInvestors || [];
    const founderConn = founderConnections.find(c => c._id === connectionId);
    if (!founderConn) throw new Error('Connection not found in founder portal data');
    if (founderConn.privateNotes !== undefined && founderConn.privateNotes !== null && founderConn.privateNotes !== '') {
      throw new Error('Private notes leaked to founder: ' + founderConn.privateNotes);
    }
    console.log('   Success! Private notes are not visible to the founder.');

    // 9. INVESTOR MARKS STARTUP AS INVESTED
    console.log('9. Investor marking deal as invested...');
    res = await request(`${API_URL}/investor/pipeline/${connectionId}/invested`, 'PATCH', {
      investmentAmount: 180000,
      equityPercentage: 4.5
    }, investorToken);
    if (res.status !== 200) throw new Error('Failed to mark deal as invested: ' + JSON.stringify(res.data));
    if (res.data.data.status !== 'invested' || res.data.data.pipelineStage !== 'Invested') {
      throw new Error('Investment status not updated correctly');
    }
    console.log('   Startup marked as invested in portfolio.');

    // 10. FOUNDER POSTS STARTUP UPDATE
    console.log('10. Founder posting startup update...');
    res = await request(`${API_URL}/founder/updates`, 'POST', {
      startupId,
      title: 'Q2 Product Launch',
      description: 'We successfully launched v2 of our product with 34% active users increase.',
      visibleToConnectedInvestors: true
    }, founderToken);
    if (res.status !== 201) throw new Error('Failed to post update: ' + JSON.stringify(res.data));
    const updateId = res.data.data._id;
    console.log(`   Startup update posted. ID: ${updateId}`);

    // 11. INVESTOR RETRIEVES STARTUP UPDATES
    console.log('11. Investor fetching connected startup updates...');
    res = await request(`${API_URL}/investor/updates`, 'GET', null, investorToken);
    if (res.status !== 200) throw new Error('Failed to fetch updates: ' + JSON.stringify(res.data));
    
    const updates = res.data.data || [];
    const postedUpdate = updates.find(u => u._id === updateId);
    if (!postedUpdate) throw new Error('Founder update not found in investor updates feed');
    console.log('   Update feed successfully retrieved and verified.');

    console.log('--- ALL INVESTOR PORTAL WORKFLOW TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (error) {
    console.error('INVESTOR TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
