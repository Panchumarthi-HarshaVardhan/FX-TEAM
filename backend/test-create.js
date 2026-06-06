const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/founderx')
  .then(async () => {
    try {
      const users = await User.find({}).limit(2);
      if (users.length < 2) {
        console.log('Need 2 users');
        process.exit(1);
      }
      
      const token = jwt.sign({ id: users[0]._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      console.log('Creating meeting with participant:', users[1]._id);
      
      const payload = {
        title: 'Instant Meeting',
        agenda: 'Quick Connect',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        participants: [users[1]._id.toString()]
      };
      
      const res = await axios.post(`http://localhost:3000/api/meetings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      });
      
      console.log('Create Status:', res.status);
      console.log('Create Body:', JSON.stringify(res.data, null, 2));
      
      if (res.data.success) {
        const roomId = res.data.data.meetingCode;
        console.log('Fetching room:', roomId);
        
        const getRes = await axios.get(`http://localhost:3000/api/meetings/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true
        });
        console.log('Get Status:', getRes.status);
        console.log('Get Body:', JSON.stringify(getRes.data, null, 2));
      }
      
      process.exit(0);
    } catch(err) {
      console.error(err);
      process.exit(1);
    }
  });
