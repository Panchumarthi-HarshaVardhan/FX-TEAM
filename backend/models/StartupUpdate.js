const mongoose = require('mongoose');

const startupUpdateSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  updateType: {
    type: String,
    enum: ['Product', 'Revenue', 'Team', 'Funding', 'Milestone', 'General'],
    default: 'General'
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  visibleToConnectedInvestors: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = require('../utils/firebaseModel').models.StartupUpdate;
