require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { updateById } = require('./utils/firebaseHelpers');

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

app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentUserId = null;

  socket.on('join_room', async (userId) => {
    if (userId) {
      socket.join(userId);
      currentUserId = userId;
      console.log(`User ${userId} joined room ${userId}`);
      try {
        await updateById('users', userId, { isOnline: true });
        io.emit('user_online', { userId });
      } catch (err) {
        console.error('Error updating online status:', err);
      }
    }
  });

  socket.on('typing', (data) => {
    io.to(data.recipientId).emit('typing', data);
  });

  socket.on('stop_typing', (data) => {
    io.to(data.recipientId).emit('stop_typing', data);
  });

  socket.on('mark-delivered', async ({ messageIds, senderId, conversationId }) => {
    try {
      if (messageIds && messageIds.length > 0) {
        await Promise.all(
          messageIds.map((id) => updateById('messages', id, { status: 'delivered', deliveredAt: Date.now() }))
        );
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

  socket.on('mark-seen', async ({ messageIds, senderId, conversationId }) => {
    try {
      if (messageIds && messageIds.length > 0) {
        await Promise.all(
          messageIds.map((id) => updateById('messages', id, { status: 'seen', seenAt: Date.now(), deliveredAt: Date.now() }))
        );
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
        await updateById('users', currentUserId, {
          isOnline: false,
          lastSeen: Date.now()
        });
        io.emit('user_offline', { userId: currentUserId, lastSeen: Date.now() });
      } catch (err) {
        console.error('Error updating offline status:', err);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

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
  console.log('✅ Firebase Realtime Database connected');
});
