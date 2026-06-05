const API_URL = 'http://localhost:3000/api';

async function testMessagingFlow() {
  try {
    // 1. Register User A
    const emailA = `userA_${Date.now()}@test.com`;
    const resA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: emailA, password: 'password123', role: 'founder' })
    });
    const userA = await resA.json();
    const tokenA = userA.token;
    const idA = userA._id; // Corrected from data._id

    // 2. Register User B
    const emailB = `userB_${Date.now()}@test.com`;
    const resB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: emailB, password: 'password123', role: 'investor' })
    });
    const userB = await resB.json();
    const tokenB = userB.token;
    const idB = userB._id;

    console.log('Users created:', userA.name, userB.name);

    // 3. User A sends message to User B
    console.log('Sending message...');
    const msgRes = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}` 
      },
      body: JSON.stringify({
        recipientId: idB,
        content: 'Hello User B, want to invest?'
      })
    });
    const msgData = await msgRes.json();
    
    if (msgData.success) {
      console.log('Message sent: SUCCESS');
    } else {
      console.error('Message send failed:', msgData);
    }

    // 4. User B fetches conversations
    console.log('User B fetching conversations...');
    const convRes = await fetch(`${API_URL}/messages/conversations`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const convData = await convRes.json();

    if (convData.success && convData.data.length > 0) {
      console.log('Conversations fetched: SUCCESS');
      const conv = convData.data[0];
      console.log('Last message:', conv.lastMessage.content);
      
      // 5. User B fetches messages
      console.log('User B fetching messages...');
      const msgsRes = await fetch(`${API_URL}/messages/${conv._id}`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
      });
      const msgsData = await msgsRes.json();
      
      if (msgsData.success && msgsData.data.length > 0) {
        console.log('Messages fetched: SUCCESS');
        console.log('Message content:', msgsData.data[0].content);
      } else {
        console.error('Messages fetch failed:', msgsData);
      }

    } else {
      console.error('Conversations fetch failed:', convData);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMessagingFlow();
