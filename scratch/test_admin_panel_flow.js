const API_URL = 'http://localhost:5000/api';

async function runAdminTests() {
  try {
    console.log('--- Starting FounderX Admin Panel Flow Tests ---');

    const request = async (url, method = 'GET', body = null, token = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(url, options);
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn('Could not parse JSON response:', text);
      }
      return { status: res.status, data };
    };

    const uniqueId = Date.now();

    // 1. ADMIN LOGIN
    console.log('1. Logging in as System Administrator...');
    let res = await request(`${API_URL}/auth/login`, 'POST', {
      email: 'admin@founderx.com',
      password: 'adminpassword123'
    });
    
    console.log('   Admin Login response:', res.status);
    if (res.status !== 200 || !res.data.token) {
      throw new Error('Failed to log in as administrator');
    }
    const adminToken = res.data.token;
    console.log('   ✅ Admin logged in successfully.');

    // 2. QUERY OVERVIEW STATS
    console.log('2. Querying overview stats dashboard metrics...');
    res = await request(`${API_URL}/admin/stats`, 'GET', null, adminToken);
    console.log('   Admin stats query response:', res.status, res.data.success ? 'Success' : 'Failure');
    if (res.status !== 200 || !res.data.success) {
      throw new Error('Failed to query dashboard statistics');
    }
    console.log('   KPI Stats Data:', res.data.data);

    // 3. REGISTER TEST USER
    console.log('3. Registering test user account for moderation...');
    const testUserReg = {
      fullName: `Moderation Target ${uniqueId}`,
      email: `mod_target${uniqueId}@test.com`,
      password: 'password123',
      role: 'founder'
    };
    res = await request(`${API_URL}/auth/register`, 'POST', testUserReg);
    if (res.status !== 201) throw new Error('Failed to register target user');
    const targetUserId = res.data._id;
    console.log(`   ✅ Target user created (ID: ${targetUserId})`);

    // 4. BLOCK/UNBLOCK TEST USER
    console.log('4. Blocking target user account...');
    res = await request(`${API_URL}/admin/users/${targetUserId}/block`, 'PUT', null, adminToken);
    console.log('   Block response:', res.status, res.data.data?.isActive === false ? 'Blocked' : 'Failed');
    if (res.status !== 200 || res.data.data?.isActive !== false) {
      throw new Error('Failed to block test user');
    }

    console.log('   Unblocking target user account...');
    res = await request(`${API_URL}/admin/users/${targetUserId}/block`, 'PUT', null, adminToken);
    console.log('   Unblock response:', res.status, res.data.data?.isActive === true ? 'Unblocked' : 'Failed');
    if (res.status !== 200 || res.data.data?.isActive !== true) {
      throw new Error('Failed to unblock test user');
    }
    console.log('   ✅ Block/Unblock toggle functions validated.');

    // 5. VERIFY TEST USER
    console.log('5. Granting verification badge...');
    res = await request(`${API_URL}/admin/users/${targetUserId}/verify`, 'PUT', { isVerified: true, badge: 'founder' }, adminToken);
    console.log('   Verification response:', res.status, res.data.data?.isVerified === true ? 'Verified' : 'Failed');
    if (res.status !== 200 || res.data.data?.isVerified !== true || res.data.data?.verificationBadge !== 'founder') {
      throw new Error('Failed to verify test user');
    }
    console.log('   ✅ Verification badge assigned successfully.');

    // 6. GET USERS LIST
    console.log('6. Querying users directory list...');
    res = await request(`${API_URL}/admin/users?search=Target`, 'GET', null, adminToken);
    console.log('   Query user lists response:', res.status, `Count: ${res.data.data?.length || 0}`);
    if (res.status !== 200 || !res.data.success) {
      throw new Error('Failed to query users list');
    }

    // 7. GET STARTUPS LIST
    console.log('7. Querying startups list...');
    res = await request(`${API_URL}/admin/startups`, 'GET', null, adminToken);
    console.log('   Query startups response:', res.status, `Total: ${res.data.total || 0}`);
    if (res.status !== 200 || !res.data.success) {
      throw new Error('Failed to query startups directory');
    }

    // 8. GET APPLICATIONS LIST
    console.log('8. Querying sourcing applications list...');
    res = await request(`${API_URL}/admin/applications`, 'GET', null, adminToken);
    console.log('   Query applications response:', res.status, `Count: ${res.data.data?.length || 0}`);
    if (res.status !== 200 || !res.data.success) {
      throw new Error('Failed to query applications list');
    }

    // 9. RE-QUERY ANALYTICS
    console.log('9. Fetching network analytics compilation...');
    res = await request(`${API_URL}/admin/analytics`, 'GET', null, adminToken);
    console.log('   Query analytics response:', res.status, res.data.success ? 'Success' : 'Failure');
    if (res.status !== 200 || !res.data.success) {
      throw new Error('Failed to query analytics');
    }
    console.log('   Analytics distribution:', res.data.data.roleDistribution);

    // 10. CLEAN UP USER
    console.log('10. Safely deleting test user record...');
    res = await request(`${API_URL}/admin/users/${targetUserId}`, 'DELETE', null, adminToken);
    console.log('   Delete response:', res.status);
    if (res.status !== 200) {
      throw new Error('Failed to delete target user record');
    }
    console.log('   ✅ Test user successfully deleted.');

    console.log('--- ALL ADMIN ENDPOINT TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('❌ ADMIN TEST FLOW FAILED:', error.message);
    process.exit(1);
  }
}

runAdminTests();
