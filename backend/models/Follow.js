const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  entityType: {
    type: String,
    enum: ['User', 'Startup'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique follows
followSchema.index({ followerId: 1, followedId: 1 }, { unique: true });

module.exports = require('../utils/firebaseModel').models.Follow;
