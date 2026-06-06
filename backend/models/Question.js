const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please add a question'],
    trim: true,
    maxlength: [500, 'Question cannot be more than 500 characters']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    required: true,
    enum: ['User', 'Startup']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means anonymous
  },
  answer: {
    type: String,
    trim: true,
    maxlength: [1000, 'Answer cannot be more than 1000 characters']
  },
  answeredAt: {
    type: Date
  },
  isPublic: {
    type: Boolean,
    default: false // Only becomes public when answered or explicitly approved
  },
  isHidden: {
    type: Boolean,
    default: false // Hidden by receiver
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for fetching questions for a specific target
questionSchema.index({ targetId: 1, targetType: 1, isPublic: 1, createdAt: -1 });

module.exports = require('../utils/firebaseModel').models.Question;
