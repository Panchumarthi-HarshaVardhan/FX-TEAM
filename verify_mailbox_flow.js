// Use global native fetch

const API_URL = 'http://localhost:3000';

async function verifyMailbox() {
  try {
    console.log('🚀 Starting FounderX Mailbox System E2E Validation...');

    // 1. REGISTER USERS
    console.log('\n--- 1. Registering Test Users ---');
    
    const timestamp = Date.now();
    const founderEmail = `founder_${timestamp}@example.com`;
    const investorEmail = `investor_${timestamp}@example.com`;
    const seekerEmail = `seeker_${timestamp}@example.com`;

    const users = {
      founder: { name: 'Alice Founder', email: founderEmail, password: 'password123', role: 'founder' },
      investor: { name: 'Bob Investor', email: investorEmail, password: 'password123', role: 'investor' },
      seeker: { name: 'Charlie Seeker', email: seekerEmail, password: 'password123', role: 'user' }
    };

    const tokens = {};
    const userIds = {};

    for (const [key, payload] of Object.entries(users)) {
      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const regData = await regRes.json();
      if (!regData.token) {
        throw new Error(`Failed to register ${key}: ${JSON.stringify(regData)}`);
      }
      tokens[key] = regData.token;
      userIds[key] = regData._id;
      console.log(`✅ Registered ${key} (${payload.name}) - ID: ${regData._id}`);
    }

    // 2. CREATE A STARTUP
    console.log('\n--- 2. Creating Startup ---');
    const startupRes = await fetch(`${API_URL}/api/startups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.founder}`
      },
      body: JSON.stringify({
        name: `HexaTech ${timestamp}`,
        industry: 'Software',
        description: 'Building the next generation agentic systems.',
        oneLinePitch: 'Creating the next generation agentic coding systems.',
        location: 'San Francisco, CA',
        website: 'https://hexatech.ai',
        teamSize: 5,
        startupStage: 'Seed',
        fundingGoal: 1000000,
        equityOffering: 10
      })
    });
    const startupData = await startupRes.json();
    if (!startupData.success) {
      throw new Error(`Failed to create startup: ${JSON.stringify(startupData)}`);
    }
    const startupId = startupData.data._id;
    console.log(`✅ Created startup: ${startupData.data.name} (ID: ${startupId})`);

    // 3. SEND INVESTMENT REQUEST
    console.log('\n--- 3. Sending Investment Interest Request ---');
    const invRequestRes = await fetch(`${API_URL}/api/investor/interest-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.investor}`
      },
      body: JSON.stringify({
        startupId,
        message: 'We love your startup and want to invest $250k.',
        investmentRange: '$250k - $500k',
        interestedAmount: '250000',
        investmentType: 'Equity'
      })
    });
    const invRequestData = await invRequestRes.json();
    if (!invRequestData.success) {
      throw new Error(`Failed to send investment interest request: ${JSON.stringify(invRequestData)}`);
    }
    const investmentRequestId = invRequestData.data._id;
    console.log(`✅ Investment Request created! ID: ${investmentRequestId}`);

    // 4. APPLY FOR A JOB
    console.log('\n--- 4. Applying for Job Opening ---');
    const jobCreateRes = await fetch(`${API_URL}/api/startups/${startupId}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.founder}`
      },
      body: JSON.stringify({
        title: 'Backend Engineer',
        description: 'Node.js developer needed.',
        requiredSkills: 'Node.js, MongoDB',
        roleType: 'Full-time',
        workMode: 'Remote',
        location: 'Remote',
        salaryMin: 120000,
        salaryMax: 140000
      })
    });
    const jobCreateData = await jobCreateRes.json();
    if (!jobCreateData.success) {
      throw new Error(`Failed to create job opening: ${JSON.stringify(jobCreateData)}`);
    }
    const jobId = jobCreateData.data._id;
    console.log(`✅ Job opening created! ID: ${jobId}`);

    // Now apply
    const appRes = await fetch(`${API_URL}/api/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.seeker}`
      },
      body: JSON.stringify({
        resume: 'https://example.com/resume.pdf',
        coverLetter: 'I am highly experienced with Node.js and MongoDB.',
        portfolioLink: 'https://portfolio.com',
        expectedSalary: '$130k'
      })
    });
    const appData = await appRes.json();
    if (!appData.success) {
      throw new Error(`Failed to apply for job: ${JSON.stringify(appData)}`);
    }
    const jobApplicationId = appData.data._id;
    console.log(`✅ Job Application submitted! ID: ${jobApplicationId}`);

    // 5. SEND CUSTOM ROLE REQUEST
    console.log('\n--- 5. Sending Custom Co-founder Role Request ---');
    const roleReqRes = await fetch(`${API_URL}/api/startups/${startupId}/role-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.seeker}`
      },
      body: JSON.stringify({
        requestType: 'Co-founder',
        roleTitle: 'CTO Co-founder',
        skills: 'Node.js, System Architecture, Leadership',
        message: 'Let us build this together as co-founders.',
        resume: 'https://example.com/resume.pdf'
      })
    });
    const roleReqData = await roleReqRes.json();
    if (!roleReqData.success) {
      throw new Error(`Failed to send custom role request: ${JSON.stringify(roleReqData)}`);
    }
    const customRoleRequestId = roleReqData.data._id;
    console.log(`✅ Custom Role Request submitted! ID: ${customRoleRequestId}`);

    // 6. VERIFY MAILS GENERATION IN FOUNDER'S INBOX
    console.log('\n--- 6. Verifying Founder Inbox ---');
    const inboxRes = await fetch(`${API_URL}/api/mail/inbox`, {
      headers: { 'Authorization': `Bearer ${tokens.founder}` }
    });
    const inboxData = await inboxRes.json();
    if (!inboxData.success) {
      throw new Error(`Failed to fetch founder inbox: ${JSON.stringify(inboxData)}`);
    }

    const inboxMails = inboxData.data;
    console.log(`✅ Total inbox items: ${inboxMails.length}`);

    const investmentMail = inboxMails.find(m => m.type === 'investment_request');
    const applicationMail = inboxMails.find(m => m.type === 'application_request');
    const cofounderMail = inboxMails.find(m => m.type === 'cofounder_request');

    if (!investmentMail) throw new Error('Investment interest mail missing in inbox.');
    if (!applicationMail) throw new Error('Job application mail missing in inbox.');
    if (!cofounderMail) throw new Error('Cofounder request mail missing in inbox.');

    console.log('✅ All requested mails generated successfully in founder inbox!');
    console.log(`   - Investment Request Mail ID: ${investmentMail._id}`);
    console.log(`   - Application Mail ID: ${applicationMail._id}`);
    console.log(`   - Cofounder Mail ID: ${cofounderMail._id}`);

    // 7. DUPLICATE PROTECTION TEST
    console.log('\n--- 7. Testing Duplicate Request Prevention ---');
    const dupRes = await fetch(`${API_URL}/api/investor/interest-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.investor}`
      },
      body: JSON.stringify({
        startupId,
        message: 'Second duplicate investment interest.'
      })
    });
    const dupData = await dupRes.json();
    if (dupData.success) {
      throw new Error('Duplicate prevention failed! Duplicate investment request allowed.');
    }
    console.log(`✅ Duplicate request successfully blocked: "${dupData.error}"`);

    // 8. AUTHORIZATION CHECK
    console.log('\n--- 8. Testing Authorization Checks ---');
    // Seeker (Charlie) tries to view the investment mail of Founder (Alice)
    const unauthorizedRes = await fetch(`${API_URL}/api/mail/${investmentMail._id}`, {
      headers: { 'Authorization': `Bearer ${tokens.seeker}` }
    });
    const unauthorizedData = await unauthorizedRes.json();
    if (unauthorizedData.success) {
      throw new Error('Authorization check failed! Seeker was able to view founder\'s mail.');
    }
    console.log(`✅ Authorization check passed: Access blocked with status 403/error: "${unauthorizedData.error}"`);

    // 9. ACCEPTING INVESTMENT REQUEST
    console.log('\n--- 9. Accepting Investment Request via Mail Action ---');
    const acceptInvRes = await fetch(`${API_URL}/api/mail/${investmentMail._id}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.founder}` }
    });
    const acceptInvData = await acceptInvRes.json();
    if (!acceptInvData.success) {
      throw new Error(`Failed to accept investment request: ${JSON.stringify(acceptInvData)}`);
    }
    console.log('✅ Investment request accepted via mailbox!');

    // Verify Investment connection is created
    const connectionsRes = await fetch(`${API_URL}/api/investor/portal-data`, {
      headers: { 'Authorization': `Bearer ${tokens.investor}` }
    });
    const connectionsData = await connectionsRes.json();
    const conn = connectionsData.data?.connections?.find(c => c.startupId?._id === startupId);
    if (!conn) {
      throw new Error('Investment connection was not created in database.');
    }
    console.log(`✅ Investment connection verified! Stage: ${conn.pipelineStage}, Status: ${conn.status}`);

    // Verify confirmation mail sent back to Investor
    const investorInboxRes = await fetch(`${API_URL}/api/mail/inbox`, {
      headers: { 'Authorization': `Bearer ${tokens.investor}` }
    });
    const investorInboxData = await investorInboxRes.json();
    const confirmMail = investorInboxData.data?.find(m => m.type === 'status_update');
    if (!confirmMail) {
      throw new Error('Confirmation status update mail was not sent to investor.');
    }
    console.log(`✅ Received confirmation status update mail in investor mailbox! Subject: "${confirmMail.subject}"`);

    // 10. CONNECT APPLICATION REQUEST
    console.log('\n--- 10. Unlocking Chat / Connecting Job Application ---');
    const connectAppRes = await fetch(`${API_URL}/api/mail/${applicationMail._id}/connect`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.founder}` }
    });
    const connectAppData = await connectAppRes.json();
    if (!connectAppData.success) {
      throw new Error(`Failed to connect job application: ${JSON.stringify(connectAppData)}`);
    }
    console.log('✅ Job application connected! Direct messaging unlocked.');

    // 11. HIRE APPLICANT
    console.log('\n--- 11. Hiring Applicant to Startup Team ---');
    // Call accept endpoint on application request to hire them
    const hireRes = await fetch(`${API_URL}/api/mail/${applicationMail._id}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.founder}` }
    });
    const hireData = await hireRes.json();
    if (!hireData.success) {
      throw new Error(`Failed to hire applicant: ${JSON.stringify(hireData)}`);
    }
    console.log('✅ Hired applicant successfully via mailbox!');

    // Verify Startup Team Member is added
    const startupVerifyRes = await fetch(`${API_URL}/api/startups/${startupId}`);
    const startupVerifyData = await startupVerifyRes.json();
    const teamMembers = startupVerifyData.data?.teamMembers || [];
    const isTeamMember = teamMembers.some(m => m.userId === userIds.seeker);
    if (!isTeamMember) {
      throw new Error('Applicant was not added to the startup team list.');
    }
    console.log('✅ Applicant verified inside Startup Team list!');

    // 12. SEND STARTUP UPDATE TO INVESTOR
    console.log('\n--- 12. Posting Startup Update to Connected Investors ---');
    const updateRes = await fetch(`${API_URL}/api/founder/updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.founder}`
      },
      body: JSON.stringify({
        startupId,
        title: 'Alpha Release Complete',
        description: 'Our alpha build is live! Check the logs.',
        visibleToConnectedInvestors: true
      })
    });
    const updateData = await updateRes.json();
    if (!updateData.success) {
      throw new Error(`Failed to post startup update: ${JSON.stringify(updateData)}`);
    }
    console.log('✅ Startup update posted successfully!');

    // Check investor's inbox for the startup update mail
    const investorInbox2Res = await fetch(`${API_URL}/api/mail/inbox`, {
      headers: { 'Authorization': `Bearer ${tokens.investor}` }
    });
    const investorInbox2Data = await investorInbox2Res.json();
    const updateMail = investorInbox2Data.data?.find(m => m.type === 'founder_update');
    if (!updateMail) {
      throw new Error('Startup update mail was not received by the connected investor.');
    }
    console.log(`✅ Startup update mail received by Investor! Subject: "${updateMail.subject}"`);

    // 13. MARK DEAL AS INVESTED
    console.log('\n--- 13. Marking Deal as Invested via Mail Actions ---');
    // To mark as invested, investor uses confirm mail or related mail
    const markInvestedRes = await fetch(`${API_URL}/api/mail/${investmentMail._id}/mark-invested`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.founder}`
      },
      body: JSON.stringify({
        amount: 250000,
        equity: 3.5
      })
    });
    const markInvestedData = await markInvestedRes.json();
    if (!markInvestedData.success) {
      throw new Error(`Failed to mark investment: ${JSON.stringify(markInvestedData)}`);
    }
    console.log('✅ Deal marked as invested successfully!');

    // Re-verify Investment connection
    const connections2Res = await fetch(`${API_URL}/api/investor/portal-data`, {
      headers: { 'Authorization': `Bearer ${tokens.investor}` }
    });
    const connections2Data = await connections2Res.json();
    const conn2 = connections2Data.data?.connections?.find(c => c.startupId?._id === startupId);
    if (!conn2 || conn2.status !== 'invested' || conn2.pipelineStage !== 'Invested') {
      throw new Error(`Mark invested failed to update connection model correctly: ${JSON.stringify(conn2)}`);
    }
    console.log(`✅ Confirmed connection stage updated: Stage: ${conn2.pipelineStage}, Amount: $${conn2.investmentAmount}, Equity: ${conn2.equityPercentage}%`);

    // 14. SOFT DELETE TEST
    console.log('\n--- 14. Testing Soft Delete ---');
    const deleteRes = await fetch(`${API_URL}/api/mail/${investmentMail._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokens.founder}` }
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.success) {
      throw new Error(`Failed to delete mail: ${JSON.stringify(deleteData)}`);
    }
    console.log('✅ Mail soft deleted successfully!');

    // Fetch inbox again and verify it is not returned in inbox list, but still exists in trash
    const inbox3Res = await fetch(`${API_URL}/api/mail/inbox`, {
      headers: { 'Authorization': `Bearer ${tokens.founder}` }
    });
    const inbox3Data = await inbox3Res.json();
    const isDeletedFromInbox = !inbox3Data.data?.some(m => m._id === investmentMail._id);

    const trashRes = await fetch(`${API_URL}/api/mail/trash`, {
      headers: { 'Authorization': `Bearer ${tokens.founder}` }
    });
    const trashData = await trashRes.json();
    const isInTrash = trashData.data?.some(m => m._id === investmentMail._id);

    if (!isDeletedFromInbox || !isInTrash) {
      throw new Error(`Soft delete check failed. Deleted from Inbox: ${isDeletedFromInbox}, Exists in Trash: ${isInTrash}`);
    }
    console.log('✅ Soft delete verified: Mail removed from Inbox list but correctly retained in Trash list!');

    console.log('\n🎉 ALL FOUNDERX MAILBOX E2E TESTS PASSED SUCCESSFULLY! 🎉\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E Validation failed:', error);
    process.exit(1);
  }
}

verifyMailbox();
