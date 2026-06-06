const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    default: null
  },
  contentType: {
    type: String,
    enum: ['tweet', 'post', 'vtweet', 'video'],
    required: true,
    default: 'tweet',
    index: true // Optimized for Feed/Watch queries
  },
  category: {
    type: String,
    enum: ['general', 'update', 'hiring', 'milestone'],
    default: 'general',
    index: true
  },
  mediaType: {
    type: String,
    enum: ['none', 'image', 'video'],
    default: 'none'
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'poll'],
    default: 'text' // Deprecated
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  videoLength: {
    type: Number, // In seconds
    default: 0
  },
  isLongForm: {
    type: Boolean,
    default: false,
    index: true
  },
  // Monetization & Visibility
  isSponsored: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'investor_only', 'premium'],
    default: 'public'
  },
  pollOptions: [{
    text: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: {
    type: Number,
    default: 0
  },
  saves: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isBoosted: {
    type: Boolean,
    default: false
  },
  boostEndDate: {
    type: Date
  },
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  parentPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  isRepost: {
    type: Boolean,
    default: false
  },
  repostOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  repostCount: {
    type: Number,
    default: 0
  },
  replyCount: {
    type: Number,
    default: 0
  },
  quoteBody: {
    type: String,
    maxlength: 500
  },
  investorReactions: [{
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['interested', 'want_to_invest', 'request_deck']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  investorInterest: [{
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    message: String
  }]
}, {
  timestamps: true
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for save count
postSchema.virtual('saveCount').get(function() {
  return this.saves.length;
});

// Method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => 
    like.userId.toString() === userId.toString()
  );
};

// Method to check if user saved the post
postSchema.methods.isSavedBy = function(userId) {
  return this.saves.some(save => 
    save.userId.toString() === userId.toString()
  );
};

// Method to add like
postSchema.methods.addLike = function(userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push({ userId });
    this.calculateEngagement();
  }
  return this.save();
};

// Method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => 
    like.userId.toString() !== userId.toString()
  );
  this.calculateEngagement();
  return this.save();
};

// Method to add save
postSchema.methods.addSave = function(userId) {
  if (!this.isSavedBy(userId)) {
    this.saves.push({ userId });
  }
  return this.save();
};

// Method to remove save
postSchema.methods.removeSave = function(userId) {
  this.saves = this.saves.filter(save => 
    save.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = function(commentId) {
  this.comments.push(commentId);
  this.calculateEngagement();
  return this.save();
};

// Method to increment shares
postSchema.methods.incrementShares = function() {
  this.shares += 1;
  this.calculateEngagement();
  return this.save();
};

// Method to increment views
postSchema.methods.incrementViews = function() {
  this.metrics.views += 1;
  return this.save();
};

// Method to calculate engagement rate
postSchema.methods.calculateEngagement = function() {
  const totalInteractions = this.likeCount + this.commentCount + this.shares + this.saveCount;
  this.metrics.engagement = totalInteractions;
  return this.save();
};

// Method to vote on poll
postSchema.methods.voteOnPoll = function(optionIndex, userId) {
  if (this.type !== 'poll' || !this.pollOptions[optionIndex]) {
    throw new Error('Invalid poll option');
  }
  
  // Remove previous vote if exists
  this.pollOptions.forEach(option => {
    option.votes = option.votes.filter(voter => 
      voter.toString() !== userId.toString()
    );
  });
  
  // Add new vote
  this.pollOptions[optionIndex].votes.push(userId);
  return this.save();
};

// Get public post data
postSchema.methods.toPublicJSON = function(userId = null) {
  return {
    _id: this._id,
    authorId: this.authorId,
    startupId: this.startupId,
    contentType: this.contentType,
    category: this.category,
    type: this.type,
    content: this.content,
    mediaUrl: this.mediaUrl,
    thumbnailUrl: this.thumbnailUrl,
    videoLength: this.videoLength,
    isLongForm: this.isLongForm,
    pollOptions: this.pollOptions,
    likeCount: this.likeCount,
    commentCount: this.commentCount,
    saveCount: this.saveCount,
    shares: this.shares,
    tags: this.tags,
    isBoosted: this.isBoosted,
    metrics: this.metrics,
    isLikedBy: userId ? this.isLikedBy(userId) : false,
    isSavedBy: userId ? this.isSavedBy(userId) : false,
    investorInterestCount: this.investorReactions ? this.investorReactions.length : 0,
    createdAt: this.createdAt
  };
};

// Indexes for performance
postSchema.index({ authorId: 1 });
postSchema.index({ startupId: 1 });
postSchema.index({ type: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isBoosted: 1 });
postSchema.index({ 'metrics.views': -1 });
postSchema.index({ 'metrics.engagement': -1 });
postSchema.index({ tags: 1 });

module.exports = require('../utils/firebaseModel').models.Post;
