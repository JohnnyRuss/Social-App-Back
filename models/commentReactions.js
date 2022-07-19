const mongoose = require('mongoose');

const CommentReactionSchema = new mongoose.Schema({
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
  },
  reaction: {
    type: String,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  post: String,
});

CommentReactionSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'profileImg userName' });
  next();
});

const CommentReaction = mongoose.model('CommentReaction', CommentReactionSchema);

module.exports = CommentReaction;
