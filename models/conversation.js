const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    members: {
      type: Array,
    },
    users: {
      type: Array,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ConversationSchema.virtual('messages', {
  ref: 'Message',
  foreignField: 'conversation',
  localField: '_id',
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
