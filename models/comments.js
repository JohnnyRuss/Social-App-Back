const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'Post',
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    text: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CommentSchema.virtual('reactions', {
  ref: 'CommentReaction',
  foreignField: 'comment',
  localField: '_id',
});

CommentSchema.virtual('replies', {
  ref: 'CommentReplie',
  foreignField: 'comment',
  localField: '_id',
});

CommentSchema.pre(/^find/, function (next) {
  this.populate({ path: 'author', select: 'profileImg userName' })
    .populate('replies')
    .populate('reactions');

  next();
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;
