const API_URL = 'http://localhost:5000/api';

async function runTests() {
  try {
    console.log('--- Starting FounderX Startup Role Request Workflows Verification ---');

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
      name: `Founder R_${uniqueId}`,
      email: `founder_r_${uniqueId}@test.com`,
      password: 'password123',
      role: 'founder',
      username: `founder_r_${uniqueId}`
    };
    const jobSeekerObj = {
      name: `Job Seeker R_${uniqueId}`,
      email: `seeker_r_${uniqueId}@test.com`,
      password: 'password123',
      role: 'job_seeker',
      username: `seeker_r_${uniqueId}`
    };

    let res = await request(`${API_URL}/auth/register`, 'POST', founderObj);
    if (!res.data.token) throw new Error('Founder registration failed: ' + JSON.stringify(res.data));
    const founderToken = res.data.token;
    const founderId = res.data._id;

    res = await request(`${API_URL}/auth/register`, 'POST', jobSeekerObj);
    if (!res.data.token) throw new Error('Job Seeker registration failed: ' + JSON.stringify(res.data));
    const jobSeekerToken = res.data.token;
    const jobSeekerId = res.data._id;

    console.log(`   Registered Founder (${founderId}) and Job Seeker (${jobSeekerId})`);

    // 2. CREATE STARTUP
    console.log('2. Founder creating startup...');
    res = await request(`${API_URL}/startups`, 'POST', {
      name: `Role Startup ${uniqueId}`,
      oneLinePitch: 'Decentralized role platform',
      description: 'Startup description for custom role request workflows.',
      industry: 'Technology',
      stage: 'idea',
      contactEmail: `contact_r_${uniqueId}@startup.com`
    }, founderToken);
    if (res.status !== 201) throw new Error('Startup creation failed: ' + JSON.stringify(res.data));
    const startupId = res.data.data._id;
    console.log(`   Startup created: ${startupId}`);

    // 3. SEND ROLE REQUEST FROM JOB SEEKER
    console.log('3. Job Seeker sending Startup Role Request...');
    const roleRequestPayload = {
      requestType: 'Co-founder',
      roleTitle: 'Chief Technology Officer (CTO)',
      skills: 'Node.js, React, Architecture, Leadership',
      resume: 'https://example.com/cto_resume.pdf',
      portfolioLink: 'https://cto-portfolio.example.com',
      github: 'https://github.com/cto-test',
      linkedin: 'https://linkedin.com/in/cto-test',
      message: 'I want to build this vision with you.',
      expectedSalary: '$120k/year',
      availabilityDate: new Date().toISOString(),
      reasonToJoin: 'I am highly aligned with your HR Tech mission.'
    };

    res = await request(`${API_URL}/startups/${startupId}/role-request`, 'POST', roleRequestPayload, jobSeekerToken);
    if (res.status !== 201) throw new Error('Startup Role Request creation failed: ' + JSON.stringify(res.data));
    const requestId = res.data.data._id;
    console.log(`   Startup Role Request created successfully. Request ID: ${requestId}`);

    // 4. VERIFY MESSAGE BLOCKED BEFORE CONNECTION
    console.log('4. Verifying message block before connection/accept...');
    res = await request(`${API_URL}/messages`, 'POST', {
      recipientId: founderId,
      content: 'Hey founder, please read my custom request!'
    }, jobSeekerToken);
    if (res.status !== 400) throw new Error('Expected message send to fail before connection/accept, got status: ' + res.status);
    console.log('   Success! Chat is blocked as expected.');

    // 5. FOUNDER VIEWS RECEIVED ROLE REQUESTS
    console.log('5. Founder fetching received role requests...');
    res = await request(`${API_URL}/founder/role-requests`, 'GET', null, founderToken);
    if (res.status !== 200) throw new Error('Failed to fetch founder role requests: ' + JSON.stringify(res.data));
    const foundRequest = res.data.data.find(req => req._id === requestId);
    if (!foundRequest) throw new Error('Sent request not found in founder role-requests list');
    console.log(`   Found request in list with status: ${foundRequest.status}`);

    // Mark as reviewed
    console.log('   Founder marking request status to reviewed...');
    res = await request(`${API_URL}/founder/role-requests/${requestId}/status`, 'PATCH', { status: 'reviewed' }, founderToken);
    if (res.status !== 200) throw new Error('Failed to mark reviewed: ' + JSON.stringify(res.data));
    if (res.data.data.status !== 'reviewed') throw new Error('Status was not updated to reviewed');
    console.log('   Status successfully updated to reviewed.');

    // 6. FOUNDER CONNECTS WITH JOB SEEKER
    console.log('6. Founder connecting with Job Seeker...');
    res = await request(`${API_URL}/founder/role-requests/${requestId}/connect`, 'POST', {}, founderToken);
    if (res.status !== 200) throw new Error('Failed to connect role request: ' + JSON.stringify(res.data));
    if (res.data.data.status !== 'connected') throw new Error('Request status did not become connected');
    console.log('   Connected successfully.');

    // Verify chat permissions are unlocked
    console.log('   Verifying message check API returns canChat: true...');
    res = await request(`${API_URL}/messages/can-chat/${founderId}`, 'GET', null, jobSeekerToken);
    if (!res.data.canChat) throw new Error('can-chat check returned false after connecting');

    console.log('   Sending message to founder after connection...');
    res = await request(`${API_URL}/messages`, 'POST', {
      recipientId: founderId,
      content: 'Glad to connect! When is a good time to discuss the Co-founder role?'
    }, jobSeekerToken);
    if (res.status !== 201) throw new Error('Failed to send message after connection: ' + JSON.stringify(res.data));
    console.log('   Success! Messaging is unlocked.');

    // 7. FOUNDER ACCEPTS REQUEST
    console.log('7. Founder accepting the role request...');
    res = await request(`${API_URL}/founder/role-requests/${requestId}/status`, 'PATCH', { status: 'accepted' }, founderToken);
    if (res.status !== 200) throw new Error('Failed to accept role request: ' + JSON.stringify(res.data));
    if (res.data.data.status !== 'accepted') throw new Error('Request status did not update to accepted');
    console.log('   Accepted by founder successfully.');

    // 8. HIRE AND ADD TO TEAM
    console.log('8. Founder hiring and adding applicant to startup team...');
    res = await request(`${API_URL}/founder/role-requests/${requestId}/hire`, 'POST', {
      teamRole: 'Co-founder / CTO',
      startDate: new Date().toISOString(),
      workMode: 'Hybrid',
      notes: 'Hired through custom role request flow.'
    }, founderToken);
    if (res.status !== 200) throw new Error('Hiring failed: ' + JSON.stringify(res.data));
    if (res.data.data.status !== 'hired') throw new Error('Request status did not update to hired');
    console.log('   Hiring processed successfully.');

    // 9. VERIFY MY TEAMS LIST AND STARTUP TEAM LIST
    console.log('9. Verifying Job Seeker My Teams list and Startup team list...');
    // Check if Job Seeker is added to startup team
    res = await request(`${API_URL}/startups/${startupId}`, 'GET', null, jobSeekerToken);
    const teamMembers = res.data.data.teamMembers || [];
    const isTeamMember = teamMembers.some(member => member.userId === jobSeekerId);
    if (!isTeamMember) throw new Error('Job seeker was not added to startup team members list');
    console.log('   Verified Job Seeker in Startup teamMembers array.');

    // Check Job Seeker dashboard teams endpoint
    res = await request(`${API_URL}/job-seeker/teams`, 'GET', null, jobSeekerToken);
    if (res.status !== 200) throw new Error('Failed to fetch job seeker teams: ' + JSON.stringify(res.data));
    const isStartupInSeekerTeams = res.data.data.some(membership => membership.startupId?._id === startupId);
    if (!isStartupInSeekerTeams) throw new Error('Startup did not appear in Job Seeker My Teams dashboard list');
    console.log('   Verified Startup in Job Seeker My Teams list.');

    // Check Job Seeker role requests list
    res = await request(`${API_URL}/job-seeker/role-requests`, 'GET', null, jobSeekerToken);
    if (res.status !== 200) throw new Error('Failed to fetch seeker role requests: ' + JSON.stringify(res.data));
    const foundRequestInSeekerList = res.data.data.find(req => req._id === requestId);
    if (!foundRequestInSeekerList) throw new Error('Request not found in job seeker role-requests list');
    if (foundRequestInSeekerList.status !== 'hired') throw new Error('Job seeker request status is not hired in tracker');
    console.log('   Verified custom role requests tracking on Seeker Dashboard.');

    console.log('--- ALL ROLE REQUEST WORKFLOW TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('ROLE REQUEST WORKFLOW TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
