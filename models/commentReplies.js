const mongoose = require('mongoose');

const CommentRepliesSchema = new mongoose.Schema(
  {
    comment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Comment',
    },
    adressat: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    adressat: String,
    text: String,
    adressatComment: String,
    adressatName: String,
    post: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CommentRepliesSchema.virtual('reactions', {
  ref: 'CommentReaction',
  foreignField: 'comment',
  localField: '_id',
});

CommentRepliesSchema.pre(/^find/, function (next) {
  this.populate({ path: 'author', select: 'profileImg userName' }).populate('reactions');

  next();
});

const CommentReply = mongoose.model('CommentReplie', CommentRepliesSchema);

module.exports = CommentReply;
