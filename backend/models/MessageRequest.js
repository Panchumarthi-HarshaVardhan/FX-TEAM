const mongoose = require('mongoose');

const messageRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  initialMessage: {
    type: String,
    maxlength: 5000
  }
}, { timestamps: true });

// Prevent duplicate pending requests
messageRequestSchema.index({ sender: 1, receiver: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

module.exports = require('../utils/firebaseModel').models.MessageRequest;
