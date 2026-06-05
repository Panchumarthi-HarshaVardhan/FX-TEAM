const API_URL = 'http://localhost:3000/api';

async function runAuthTests() {
  try {
    console.log('--- Starting FounderX Multi-Role Auth & Setup Verification ---');

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

    // 1. REGISTER USERS FOR EACH ROLE
    console.log('1. Registering test accounts...');
    
    const jobSeekerReg = {
      fullName: `Job Seeker ${uniqueId}`,
      email: `seeker${uniqueId}@test.com`,
      password: 'password123',
      role: 'user'
    };
    const founderReg = {
      fullName: `Founder ${uniqueId}`,
      email: `founder${uniqueId}@test.com`,
      password: 'password123',
      role: 'founder'
    };
    const investorReg = {
      fullName: `Investor ${uniqueId}`,
      email: `investor${uniqueId}@test.com`,
      password: 'password123',
      role: 'investor'
    };

    // Register Job Seeker
    let res = await request(`${API_URL}/auth/register`, 'POST', jobSeekerReg);
    console.log('   Job Seeker Registration response:', res.status);
    if (res.status !== 201) throw new Error('Failed to register Job Seeker');
    const seekerToken = res.data.token;
    const seekerId = res.data._id;
    if (res.data.profileCompleted !== false) throw new Error('Expected initial profileCompleted to be false');

    // Register Founder
    res = await request(`${API_URL}/auth/register`, 'POST', founderReg);
    console.log('   Founder Registration response:', res.status);
    if (res.status !== 201) throw new Error('Failed to register Founder');
    const founderToken = res.data.token;
    const founderId = res.data._id;
    if (res.data.profileCompleted !== false) throw new Error('Expected initial profileCompleted to be false');

    // Register Investor
    res = await request(`${API_URL}/auth/register`, 'POST', investorReg);
    console.log('   Investor Registration response:', res.status);
    if (res.status !== 201) throw new Error('Failed to register Investor');
    const investorToken = res.data.token;
    const investorId = res.data._id;
    if (res.data.profileCompleted !== false) throw new Error('Expected initial profileCompleted to be false');

    console.log('   Success! All base accounts registered with profileCompleted = false.');

    // 2. COMPLETE SETUP FOR JOB SEEKER
    console.log('2. Completing profile setup for Job Seeker...');
    const seekerSetup = {
      profilePhoto: 'http://photo.com/seeker.jpg',
      bio: 'Junior engineer looking for work',
      skills: 'React, HTML, CSS',
      education: 'B.Sc. CS',
      experience: 'Internship (6 mos)',
      resume: 'http://drive.com/resume.pdf',
      portfolioLink: 'http://myport.com',
      github: 'git/seeker',
      linkedin: 'li/seeker',
      location: 'New York, USA',
      preferredJobType: 'Full-time',
      expectedSalary: '$80k'
    };

    res = await request(`${API_URL}/profile/user`, 'POST', seekerSetup, seekerToken);
    console.log('   Job Seeker Setup response:', res.status, res.data.message);
    if (res.status !== 200) throw new Error('Failed to complete Job Seeker Setup');
    if (res.data.user.profileCompleted !== true) throw new Error('Expected profileCompleted to become true after setup');

    // 3. COMPLETE SETUP FOR FOUNDER
    console.log('3. Completing profile setup for Founder & Startup...');
    const founderSetup = {
      profilePhoto: 'http://photo.com/founder.jpg',
      bio: 'Serial entrepreneur building devtools',
      skills: 'Node, System Design',
      experience: '5 years startup experience',
      linkedin: 'li/founder',
      location: 'Austin, USA',
      startupName: `Startup Inc ${uniqueId}`,
      startupLogo: 'logo.png',
      industry: 'SaaS',
      startupStage: 'mvp',
      problemStatement: 'Manual deployment is slow',
      solution: 'Automated 1-click deployments',
      website: 'http://deploy.io',
      pitchDeck: 'deck.pdf',
      fundingNeeded: 250000,
      teamSize: 3
    };

    res = await request(`${API_URL}/profile/founder`, 'POST', founderSetup, founderToken);
    console.log('   Founder Setup response:', res.status, res.data.message);
    if (res.status !== 200) throw new Error('Failed to complete Founder Setup');
    if (res.data.user.profileCompleted !== true) throw new Error('Expected profileCompleted to become true after setup');
    if (!res.data.startup || res.data.startup.name !== founderSetup.startupName) throw new Error('Startup was not created correctly');

    // 4. COMPLETE SETUP FOR INVESTOR
    console.log('4. Completing profile setup for Investor...');
    const investorSetup = {
      profilePhoto: 'http://photo.com/investor.jpg',
      bio: 'Angel investor backing SaaS startups',
      investorType: 'Angel',
      investmentMin: 15000,
      investmentMax: 75000,
      preferredIndustries: 'AI, SaaS, B2B',
      location: 'Boston, USA',
      portfolioCompanies: 'Nexus, Stripe',
      linkedin: 'li/investor',
      website: 'http://ventures.com'
    };

    res = await request(`${API_URL}/profile/investor`, 'POST', investorSetup, investorToken);
    console.log('   Investor Setup response:', res.status, res.data.message);
    if (res.status !== 200) throw new Error('Failed to complete Investor Setup');
    if (res.data.user.profileCompleted !== true) throw new Error('Expected profileCompleted to become true after setup');

    // 5. TEST GET ME PROFILE DETAILS
    console.log('5. Testing /me population for all roles...');
    // Seeker Me
    res = await request(`${API_URL}/auth/me`, 'GET', null, seekerToken);
    if (!res.data.roleProfile || res.data.roleProfile.resume !== seekerSetup.resume) {
      throw new Error('Seeker me endpoint did not populate roleProfile correctly');
    }
    // Founder Me
    res = await request(`${API_URL}/auth/me`, 'GET', null, founderToken);
    if (!res.data.roleProfile || res.data.roleProfile.linkedin !== founderSetup.linkedin) {
      throw new Error('Founder me endpoint did not populate roleProfile correctly');
    }
    // Investor Me
    res = await request(`${API_URL}/auth/me`, 'GET', null, investorToken);
    if (!res.data.roleProfile || res.data.roleProfile.investorType !== investorSetup.investorType) {
      throw new Error('Investor me endpoint did not populate roleProfile correctly');
    }

    console.log('--- ALL MULTI-ROLE SETUP TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

runAuthTests();
