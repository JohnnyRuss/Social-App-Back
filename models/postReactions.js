const mongoose = require('mongoose');

const PostReactionSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  reaction: {
    type: String,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

PostReactionSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'profileImg userName' });
  next();
});

const PostReaction = mongoose.model('PostReaction', PostReactionSchema);

module.exports = PostReaction;
