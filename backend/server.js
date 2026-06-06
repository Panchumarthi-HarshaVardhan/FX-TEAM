require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const startupRoutes = require('./routes/startups');
const productRoutes = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const orderRoutes = require('./routes/orders');
const questionRoutes = require('./routes/questionRoutes');
const searchRoutes = require('./routes/search');
const verificationRoutes = require('./routes/verification');
const investorRoutes = require('./routes/investor');
const watchlistRoutes = require('./routes/watchlist');
const uploadRoutes = require('./routes/upload');
const assistantRoutes = require('./routes/assistant');
const teamInvitationRoutes = require('./routes/teamInvitations');
const adminRoutes = require('./routes/admin');
const mailRoutes = require('./routes/mail');
const settingsRoutes = require('./routes/settings');
const meetingRoutes = require('./routes/meetings');


// Import Models for Socket Logic
const User = require('./models/User');
const Message = require('./models/Message');
const Meeting = require('./models/Meeting');

const app = express();
const server = http.createServer(app);

const isLocalOrigin = (origin) => {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.lan') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    );
  } catch (err) {
    return false;
  }
};

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || isLocalOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || isLocalOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible in routes
app.set('io', io);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentUserId = null;

  // User joins their own room for private notifications
  socket.on('join_room', async (userId) => {
    if (userId) {
      socket.join(userId);
      currentUserId = userId;
      console.log(`User ${userId} joined room ${userId}`);
      
      // Mark user as online
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('user_online', { userId }); // Broadcast to everyone (or improve to just friends)
      } catch (err) {
        console.error('Error updating online status:', err);
      }
    }
  });

  // Handle Typing
  socket.on('typing', (data) => {
    // data: { conversationId, recipientId }
    io.to(data.recipientId).emit('typing', data);
  });

  socket.on('stop_typing', (data) => {
    io.to(data.recipientId).emit('stop_typing', data);
  });

  // Handle Message Delivery
  socket.on('mark-delivered', async ({ messageIds, senderId, conversationId }) => {
    try {
      if (messageIds && messageIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: messageIds }, status: 'sent' }, 
          { status: 'delivered', deliveredAt: new Date() }
        );
        
        // Notify sender
        io.to(senderId).emit('message-status-updated', {
          messageIds,
          status: 'delivered',
          conversationId
        });
      }
    } catch (err) {
      console.error('Error marking delivered:', err);
    }
  });

  // Handle Message Seen
  socket.on('mark-seen', async ({ messageIds, senderId, conversationId }) => {
    try {
      if (messageIds && messageIds.length > 0) {
        await Message.updateMany(
          { _id: { $in: messageIds }, status: { $ne: 'seen' } }, 
          { status: 'seen', seenAt: new Date(), deliveredAt: new Date() } // Ensure deliveredAt is set too if missed
        );
        
        // Notify sender
        io.to(senderId).emit('message-status-updated', {
          messageIds,
          status: 'seen',
          conversationId
        });
      }
    } catch (err) {
      console.error('Error marking seen:', err);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    if (currentUserId) {
        try {
            await User.findByIdAndUpdate(currentUserId, { 
                isOnline: false, 
                lastSeen: new Date() 
            });
            io.emit('user_offline', { userId: currentUserId, lastSeen: new Date() });
        } catch (err) {
            console.error('Error updating offline status:', err);
        }
    }
  });

  // --- WebRTC Meeting Logic ---
  socket.on('join-meeting', ({ roomId, userId }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
    console.log(`User ${userId} joined meeting room ${roomId}`);
  });

  socket.on('leave-meeting', ({ roomId, userId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
    console.log(`User ${userId} left meeting room ${roomId}`);
  });

  socket.on('webrtc-offer', ({ offer, to, from }) => {
    io.to(to).emit('webrtc-offer', { offer, from });
  });

  socket.on('webrtc-answer', ({ answer, to, from }) => {
    io.to(to).emit('webrtc-answer', { answer, from });
  });

  socket.on('webrtc-ice-candidate', ({ candidate, to, from }) => {
    io.to(to).emit('webrtc-ice-candidate', { candidate, from });
  });

  socket.on('toggle-mic', ({ roomId, userId, isMuted }) => {
    socket.to(roomId).emit('toggle-mic', { userId, isMuted });
  });

  socket.on('toggle-camera', ({ roomId, userId, isVideoOff }) => {
    socket.to(roomId).emit('toggle-camera', { userId, isVideoOff });
  });

  socket.on('meeting-chat-message', ({ roomId, message }) => {
    io.to(roomId).emit('meeting-chat-message', message);
  });

  socket.on('meeting-reaction', ({ roomId, userId, reaction }) => {
    io.to(roomId).emit('meeting-reaction', { userId, reaction });
  });

  socket.on('meeting-hand-raise', ({ roomId, userId, isRaised }) => {
    io.to(roomId).emit('meeting-hand-raise', { userId, isRaised });
  });

  // --- Meeting Waiting Room Logic ---
  socket.on('request-to-join-meeting', async ({ meetingId, user }) => {
    // meetingId is the Mongo _id of the Meeting
    try {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        if (!meeting.waitingUsers.includes(user._id)) {
          meeting.waitingUsers.push(user._id);
          await meeting.save();
        }
        // Emit to the host directly if they are in the meeting room
        io.to(meeting.roomId).emit('meeting-join-request', { user });
      }
    } catch (err) {
      console.error('Error in request-to-join-meeting:', err);
    }
  });

  socket.on('admit-user', async ({ meetingId, userId, socketId }) => {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        meeting.waitingUsers = meeting.waitingUsers.filter(id => id.toString() !== userId);
        if (!meeting.admittedUsers.includes(userId)) {
          meeting.admittedUsers.push(userId);
        }
        await meeting.save();
        io.to(meeting.roomId).emit('user-admitted', { userId });
      }
    } catch (err) {
      console.error('Error in admit-user:', err);
    }
  });

  socket.on('reject-user', async ({ meetingId, userId }) => {
    try {
      const meeting = await Meeting.findById(meetingId);
      if (meeting) {
        meeting.waitingUsers = meeting.waitingUsers.filter(id => id.toString() !== userId);
        if (!meeting.rejectedUsers.includes(userId)) {
          meeting.rejectedUsers.push(userId);
        }
        await meeting.save();
        io.to(meeting.roomId).emit('user-rejected', { userId });
      }
    } catch (err) {
      console.error('Error in reject-user:', err);
    }
  });

});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Database Connection
async function connectToDatabase() {
  let uri = process.env.MONGODB_URI;
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected at:', uri);
    return;
  } catch (err) {
    console.warn('⚠️ Failed to connect to local MongoDB, falling back to in-memory DB');
    console.warn('⚠️ This is perfect for hackathon demo!');
  }

  try {
    console.log('🔄 Starting in-memory MongoDB server...');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('🔄 Connecting to in-memory MongoDB at:', uri);
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ In-memory MongoDB Connected!');
    console.log('💡 Perfect for hackathon demos!');
  } catch (err) {
    console.error('❌ Fatal error: Could not connect to any database');
    console.error(err);
    process.exit(1);
  }
}

connectToDatabase();

// Routes
app.get('/', (req, res) => {
  res.send('FounderX API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/mail', mailRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/videos', require('./routes/videos'));
app.use('/api/investor', investorRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/team-invitations', teamInvitationRoutes);
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/job-seeker', require('./routes/jobSeeker'));
app.use('/api/user', require('./routes/jobSeeker'));
app.use('/api/founder', require('./routes/founder'));
app.use('/api/settings', settingsRoutes);
app.use('/api/meetings', meetingRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Server Error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
