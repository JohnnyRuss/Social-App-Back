const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/AppError');
const Post = require('../models/postModel');
const PostReaction = require('../models/postReactions');
const Comment = require('../models/comments');
const CommentReply = require('../models/commentReplies');
const CommentReaction = require('../models/commentReactions');
const multer = require('multer');

const multerStorage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, 'public/images/userMedia'),
  filename: (req, file, callback) => {
    const ext = file.mimetype.split('/')[1];
    callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFillter = (req, file, callback) => {
  const ext = file.mimetype;
  if (ext.startsWith('image')) callback(null, true);
  else callback(new AppError(400, 'file is not the image'), false);
};

const multerConfig = {
  storage: multerStorage,
  fileFilter: multerFillter,
};

const upload = multer(multerConfig);

exports.uploadFile = (imageName) => upload.single(imageName);

exports.createPost = asyncWrapper(async (req, res, next) => {
  const { body } = req;
  const user = req.user;

  body.user = user.id;

  if (req.file)
    body.image = `${req.protocol}://localhost:8800/images/userMedia/${req.file.filename}`;

  const newPost = await Post.create(body);

  res.status(200).json({ status: 'success', data: newPost });
});

exports.updatePost = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  const updatedPost = await Post.findOneAndUpdate({ id, user: user.id }, req.body, {
    runValidators: true,
    new: true,
  });

  if (!updatedPost) return next(new AppError(400, 'there are no found such a post'));

  res.status(200).json({ status: 'success', data: updatedPost });
});

exports.deletePost = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const deletedPost = await Post.findByIdAndDelete(id);

  if (!deletedPost) return next(new AppError(400, 'there are no found such a post'));

  await Comment.deleteMany({ post: id });
  await CommentReply.deleteMany({ post: id });
  await CommentReaction.deleteMany({ post: id });
  await PostReaction.deleteMany({ post: id });

  res.status(204).json({ status: 'success', data: null });
});

exports.reactOnPost = asyncWrapper(async (req, res, next) => {
  const { body } = req;

  const post = await Post.findById(req.body.post);

  if (!post) return next(new AppError(400, 'there are no found such a post'));

  const newReaction = await PostReaction.create(body);

  res.status(200).json({ status: 'success', data: newReaction });
});

exports.removeReactionOnPost = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  await PostReaction.findByIdAndDelete(id);

  res.status(204).json({ status: 'success', message: 'you remove your reaction on post' });
});

exports.updateReactionOnPost = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;

  await PostReaction.findByIdAndUpdate(id, body);

  res.status(200).json({ status: 'success', message: 'you update your reaction on post' });
});

exports.addComment = asyncWrapper(async (req, res, next) => {
  const { body } = req;

  const newComment = await Comment.create(body);

  res.status(200).json({ status: 'success', data: newComment });
});

exports.updateComment = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;

  const updatedComment = await Comment.findByIdAndUpdate(id, body);

  if (!updatedComment) return next(new AppError(400, 'there are no found such a comment'));

  res.status(200).json({ status: 'success', data: updatedComment });
});

exports.deleteComment = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const deletedComment = await Comment.findByIdAndDelete(id);

  await CommentReply.deleteMany({ comment: id });

  if (!deletedComment) return next(new AppError(400, 'there are no found such a comment'));

  res.status(204).json({ status: 'success', data: null });
});

exports.addCommentReply = asyncWrapper(async (req, res, next) => {
  const { body } = req;

  const newComment = await CommentReply.create(body);

  res.status(200).json({ status: 'success', data: newComment });
});

exports.updateCommentReply = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;

  const updatedComment = await CommentReply.findByIdAndUpdate(id, body);

  if (!updatedComment) return next(new AppError(400, 'there are no found such a comment'));

  res.status(200).json({ status: 'success', data: updatedComment });
});

exports.deleteCommentReply = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const deletedComment = await CommentReply.findByIdAndDelete(id);

  if (!deletedComment) return next(new AppError(400, 'there are no found such a comment'));

  res.status(204).json({ status: 'success', data: null });
});

exports.reactOnComment = asyncWrapper(async (req, res, next) => {
  const { body } = req;

  const newReaction = await CommentReaction.create(body);

  res.status(200).json({ status: 'success', data: newReaction });
});

exports.removeReactionOnComment = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  await CommentReaction.findByIdAndDelete(id);

  res.status(204).json({ status: 'success', message: 'you remove your reaction on comment' });
});

exports.updateReactionOnComment = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;

  await CommentReaction.findByIdAndUpdate(id, body);

  res.status(200).json({ status: 'success', message: 'you update your reaction on comment' });
});

exports.getPost = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const post = await Post.findById(id).populate('reactions').populate('comments');

  if (!post) return next(new AppError(400, 'there are no found such a post'));

  res.status(200).json({ status: 'success', data: post });
});

exports.getRelatedPosts = asyncWrapper(async (req, res, next) => {
  const { type, userId } = req.params;

  const searchQuery = { user: userId, image: { $exists: true } };

  if (type !== 'all') searchQuery.type = type;

  const relatedPosts = await Post.find(searchQuery).populate({
    path: 'user',
    select: 'userName profileImg',
  });

  res.status(200).json({ status: 'success', data: relatedPosts });
});
