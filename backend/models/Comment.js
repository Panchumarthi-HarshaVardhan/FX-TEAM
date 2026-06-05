const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
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
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to check if user liked the comment
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => 
    like.userId.toString() === userId.toString()
  );
};

// Method to add like
commentSchema.methods.addLike = function(userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push({ userId });
  }
  return this.save();
};

// Method to remove like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => 
    like.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add reply
commentSchema.methods.addReply = function(commentId) {
  this.replies.push(commentId);
  return this.save();
};

// Method to edit comment
commentSchema.methods.editComment = function(newText) {
  this.text = newText;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Get public comment data
commentSchema.methods.toPublicJSON = function(userId = null) {
  return {
    _id: this._id,
    postId: this.postId,
    userId: this.userId,
    text: this.text,
    likeCount: this.likeCount,
    replyCount: this.replyCount,
    parentComment: this.parentComment,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    isLikedBy: userId ? this.isLikedBy(userId) : false,
    createdAt: this.createdAt
  };
};

// Indexes for performance
commentSchema.index({ postId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = require('../utils/firebaseModel').models.Comment;
