const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  investorId: {
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

watchlistSchema.index({ investorId: 1, startupId: 1 }, { unique: true });

module.exports = require('../utils/firebaseModel').models.Watchlist;
