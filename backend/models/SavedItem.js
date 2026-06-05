const mongoose = require('mongoose');

const savedItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate saves
savedItemSchema.index({ userId: 1, startupId: 1 }, { unique: true });

module.exports = require('../utils/firebaseModel').models.SavedItem;
