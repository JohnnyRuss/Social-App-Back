const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    type: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PostSchema.virtual('reactions', {
  ref: 'PostReaction',
  foreignField: 'post',
  localField: '_id',
});

PostSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'post',
  localField: '_id',
});

PostSchema.pre(/^find/, function (next) {
  this.populate('reactions').populate('comments').sort({ createdAt: 'desc' });
  next();
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
