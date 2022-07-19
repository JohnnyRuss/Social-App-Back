const User = require('../models/userModel');
const Conversation = require('../models/conversation');
const Messages = require('../models/message');
const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/AppError');

exports.createConversation = asyncWrapper(async (req, res, next) => {
  const { id } = req.user;
  const { adressatId } = req.params;

  if (!adressatId)
    return next(
      new AppError(400, 'please insert adressat id if you want to create new conversation')
    );

  const adressat = await User.findById(adressatId);

  if (!adressat) return next(new AppError(400, 'there are no found such a user'));

  const existingConversation = await Conversation.find({ members: [id, adressatId] });

  if (existingConversation[0])
    return next(new AppError(400, 'conversation within these users already exists'));

  const users = await User.find({
    _id: { $in: [id, adressatId] },
  }).select('profileImg userName');

  const conversation = {
    members: [id, adressatId],
    users,
  };

  const newConversation = await Conversation.create(conversation);

  res.status(200).json({ status: 'success', message: newConversation });
});

exports.deleteConversation = asyncWrapper(async (req, res, next) => {
  const { conversationId } = req.params;

  const deletedConversation = await Conversation.findByIdAndDelete(conversationId);

  if (!deletedConversation) return next(new AppError(400, 'there are no such a conversation'));

  res.status(204).json({ status: 'success', data: null });
});

exports.sendMessage = asyncWrapper(async (req, res, next) => {
  const { id } = req.user;
  const { conversationId } = req.params;
  const body = req.body;

  if (!conversationId)
    return next(new AppError(400, 'please innsert conversation id if you want to send message'));

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) return next(new AppError(400, 'there are no found such a conversation'));

  body.conversation = conversationId;
  body.user = id;

  const newMessage = await Messages.create(body);

  res.status(200).json({ status: 'success', data: newMessage });
});

exports.getConversation = asyncWrapper(async (req, res, next) => {
  const { id } = req.user;
  const { adressatId } = req.params;
  const { conversationId } = req.query;

  if (!adressatId)
    return next(
      new AppError(
        400,
        'please innsert conversation and adressat id if you want to get conversation'
      )
    );

  let conversation;

  if (!conversationId) {
    console.log('entered in no conversation id');
    conversation = await Conversation.findOne({
      members: [id, adressatId],
    }).populate('messages');

    if (!conversation) {
      console.log('entered in no conversation');

      const users = await User.find({
        _id: { $in: [id, adressatId] },
      }).select('profileImg userName');

      const conversationConfig = {
        members: [id, adressatId],
        users,
      };

      conversation = await Conversation.create(conversationConfig);
    }
  }

  if (conversationId && adressatId) {
    conversation = await Conversation.findOne({
      id: conversationId,
      members: { $in: [id] },
    }).populate('messages');
  }

  res.status(200).json({ status: 'success', data: conversation });
});

exports.getAllConversations = asyncWrapper(async (req, res, next) => {
  const { id } = req.user;

  const conversations = await Conversation.find({ members: { $in: [id] } }).populate('messages');

  if (!conversations) return next(new AppError(400, 'there are no found any conversation'));

  res.status(200).json({ status: 'success', data: conversations });
});
