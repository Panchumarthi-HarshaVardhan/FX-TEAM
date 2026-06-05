const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  entityType: {
    type: String,
    enum: ['Post', 'Startup', 'User', 'Comment', 'Application', 'JobApplication', 'InvestmentRequest', 'Order', 'TeamInvitation', 'StartupRoleRequest', 'Mail', 'InvestorStartupConnection', 'StartupUpdate'],
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  message: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

// Sync fields before save for backward compatibility
notificationSchema.pre('save', function(next) {
  if (!this.recipientId) this.recipientId = this.recipient;
  if (!this.recipient) this.recipient = this.recipientId;
  if (!this.senderId) this.senderId = this.sender;
  if (!this.sender) this.sender = this.senderId;
  if (!this.message) this.message = this.content;
  if (!this.content) this.content = this.message;
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
