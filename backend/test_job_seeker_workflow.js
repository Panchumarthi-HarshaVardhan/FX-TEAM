const API_URL = 'http://localhost:3000/api';

async function runTests() {
  try {
    console.log('--- Starting FounderX Job Seeker Workflows Verification ---');

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
    const jobSeekerObj = {
      name: `Job Seeker ${uniqueId}`,
      email: `seeker_${uniqueId}@test.com`,
      password: 'password123',
      role: 'user',
      username: `seeker_${uniqueId}`
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
      name: `Test Startup ${uniqueId}`,
      oneLinePitch: 'The ultimate sandbox startup',
      description: 'Startup description for testing workflows.',
      industry: 'Technology',
      stage: 'idea',
      contactEmail: `contact_${uniqueId}@startup.com`
    }, founderToken);
    if (res.status !== 201) throw new Error('Startup creation failed: ' + JSON.stringify(res.data));
    const startupId = res.data.data._id;
    console.log(`   Startup created: ${startupId}`);

    // 3. POST A JOB OPENING
    console.log('3. Founder posting a job opening...');
    res = await request(`${API_URL}/startups/${startupId}`, 'PUT', {
      jobs: [{
        title: 'Software Engineer Intern',
        type: 'Internship',
        location: 'Remote',
        salary: '$3000/month',
        description: 'Design and build integration tests.',
        skills: ['JavaScript', 'Node.js', 'MongoDB']
      }]
    }, founderToken);
    if (res.status !== 200) throw new Error('Failed to post job opening: ' + JSON.stringify(res.data));
    const postedJobs = res.data.data.jobs;
    if (!postedJobs || postedJobs.length === 0) throw new Error('No jobs returned after update');
    const jobId = postedJobs[0]._id;
    console.log(`   Job opening posted: ${jobId}`);

    // 4. FETCH STARTUPS & CHECK ROLE PERMISSIONS
    console.log('4. Fetching startups list as Job Seeker and checking permissions...');
    res = await request(`${API_URL}/startups`, 'GET', null, jobSeekerToken);
    if (res.status !== 200) throw new Error('Failed to fetch startups: ' + JSON.stringify(res.data));
    
    // Find our specific startup
    const fetchedStartupObj = res.data.data.find(item => item._id === startupId);
    if (!fetchedStartupObj) throw new Error('Created startup not found in discovery list');
    
    const permissions = fetchedStartupObj.permissions;
    console.log('   Retrieved Job Seeker permissions:', permissions);
    if (!permissions.canFollow || !permissions.canSave || !permissions.canViewJobs || !permissions.canApply) {
      throw new Error('Incorrect permission flags for Job Seeker');
    }
    if (permissions.canInvest || permissions.canManage || permissions.canEdit || permissions.canMessageFounder) {
      throw new Error('Job Seeker has prohibited permissions active');
    }
    console.log('   Permissions verified successfully.');

    // 5. FOLLOW STARTUP
    console.log('5. Job Seeker following startup...');
    res = await request(`${API_URL}/startups/${startupId}/follow`, 'POST', {}, jobSeekerToken);
    if (res.status !== 200) throw new Error('Failed to follow startup: ' + JSON.stringify(res.data));
    
    // Check follow status in details
    res = await request(`${API_URL}/startups/${startupId}`, 'GET', null, jobSeekerToken);
    if (!res.data.data.permissions.canFollowed) throw new Error('Follow status not updated to true');
    console.log('   Follow state successfully verified.');

    // 6. SAVE STARTUP
    console.log('6. Job Seeker saving startup...');
    res = await request(`${API_URL}/startups/${startupId}/save`, 'POST', {}, jobSeekerToken);
    if (res.status !== 200) throw new Error('Failed to save startup: ' + JSON.stringify(res.data));

    // Check save status in details
    res = await request(`${API_URL}/startups/${startupId}`, 'GET', null, jobSeekerToken);
    if (!res.data.data.permissions.canSaved) throw new Error('Saved status not updated to true');

    // Check job seeker saved startups endpoint
    res = await request(`${API_URL}/user/saved-startups`, 'GET', null, jobSeekerToken);
    const hasSavedStartup = res.data.data.some(s => s._id === startupId);
    if (!hasSavedStartup) throw new Error('Saved startup not returned by job seeker saved endpoint');
    console.log('   Save state successfully verified.');

    // 7. APPLY FOR THE JOB
    console.log('7. Job Seeker applying for the job...');
    res = await request(`${API_URL}/jobs/${jobId}/apply`, 'POST', {
      message: 'I am highly interested in this role!',
      resumeUrl: 'https://example.com/resume.pdf',
      portfolioUrl: 'https://example.com/portfolio'
    }, jobSeekerToken);
    if (res.status !== 201) throw new Error('Failed to apply for job: ' + JSON.stringify(res.data));
    const applicationId = res.data.data._id;
    console.log(`   Application submitted: ${applicationId}`);

    // Check applications list
    res = await request(`${API_URL}/user/applications`, 'GET', null, jobSeekerToken);
    const application = res.data.data.find(app => app._id === applicationId);
    if (!application) throw new Error('Submitted application not found in list');
    if (application.status !== 'pending') throw new Error('Initial application status is not pending');
    console.log('   Application tracker verified.');

    // Try sending message before application is accepted (should fail)
    console.log('   Verifying message block before application acceptance...');
    res = await request(`${API_URL}/messages`, 'POST', {
      recipientId: founderId,
      content: 'Hello, please review my application!'
    }, jobSeekerToken);
    if (res.status !== 400) throw new Error('Expected message send to fail before acceptance, got status: ' + res.status);
    console.log('   Success! Chat is blocked as expected.');

    // 8. FOUNDER ACCEPTS APPLICATION
    console.log('8. Founder accepting the job application...');
    res = await request(`${API_URL}/startups/applications/${applicationId}/status`, 'PUT', {
      status: 'accepted'
    }, founderToken);
    if (res.status !== 200) throw new Error('Failed to update application status: ' + JSON.stringify(res.data));
    console.log('   Application accepted by founder.');

    // Check if Job Seeker is added to startup team
    res = await request(`${API_URL}/startups/${startupId}`, 'GET', null, jobSeekerToken);
    const teamMembers = res.data.data.teamMembers || [];
    const isTeamMember = teamMembers.some(member => member.userId === jobSeekerId);
    if (!isTeamMember) throw new Error('Job seeker was not added to the startup team members list');
    console.log('   Verified Job Seeker is now a Startup team member.');

    // Verify chat permissions are unlocked
    console.log('   Verifying message check API returns canChat: true...');
    res = await request(`${API_URL}/messages/can-chat/${founderId}`, 'GET', null, jobSeekerToken);
    if (!res.data.canChat) throw new Error('can-chat check returned false after application acceptance');

    console.log('   Sending message to founder after application acceptance...');
    res = await request(`${API_URL}/messages`, 'POST', {
      recipientId: founderId,
      content: 'Thank you for accepting my application! Looking forward to working together.'
    }, jobSeekerToken);
    if (res.status !== 201) throw new Error('Failed to send message after application acceptance: ' + JSON.stringify(res.data));
    console.log('   Success! Messaging is unlocked.');

    console.log('--- ALL JOB SEEKER WORKFLOW TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (error) {
    console.error('JOB SEEKER TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
