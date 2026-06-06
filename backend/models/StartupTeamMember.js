const mongoose = require('mongoose');

const startupTeamMemberSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sourceApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication'
  },
  teamRole: {
    type: String,
    default: 'Team Member'
  },
  workMode: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    default: 'Remote'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  // Backward compatibility fields
  role: {
    type: String,
    default: 'Team Member'
  },
  name: String,
  image: String,
  linkedin: String
}, {
  timestamps: true
});

// Compound index to ensure uniqueness per startup-user pair
startupTeamMemberSchema.index({ startupId: 1, userId: 1 }, { unique: true });

module.exports = require('../utils/firebaseModel').models.StartupTeamMember;
