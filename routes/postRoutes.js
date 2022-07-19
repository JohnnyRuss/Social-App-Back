const express = require('express');
const { restriction, verify } = require('../controllers/authenticationController');
const {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getRelatedPosts,
  reactOnPost,
  removeReactionOnPost,
  updateReactionOnPost,
  addComment,
  updateComment,
  deleteComment,
  addCommentReply,
  updateCommentReply,
  deleteCommentReply,
  reactOnComment,
  removeReactionOnComment,
  updateReactionOnComment,
  uploadFile,
} = require('../controllers/postController');

const router = express.Router();

router.route('/postReactions').post(verify, restriction('user'), reactOnPost);

router.route('/commentReactions').post(verify, restriction('user'), reactOnComment);

router.route('/comments').post(verify, restriction('user'), addComment);

router
  .route('/comments/:id')
  .patch(verify, restriction('user'), updateComment)
  .delete(verify, restriction('user'), deleteComment);

router.route('/commentReplies').post(verify, restriction('user'), addCommentReply);

router
  .route('/commentReplies/:id')
  .patch(verify, restriction('user'), updateCommentReply)
  .delete(verify, restriction('user'), deleteCommentReply);

router
  .route('/postReactions/:id')
  .delete(verify, restriction('user'), removeReactionOnPost)
  .patch(verify, restriction('user'), updateReactionOnPost);

router
  .route('/commentReactions/:id')
  .delete(verify, restriction('user'), removeReactionOnComment)
  .patch(verify, restriction('user'), updateReactionOnComment);

router.route('/relatedPosts/:type/:userId').get(verify, restriction('user'), getRelatedPosts);

router
  .route('/:id')
  .get(verify, restriction('user', 'admin'), getPost)
  .put(verify, restriction('user'), updatePost)
  .delete(verify, restriction('user', 'admin'), deletePost);

router.route('/').post(verify, restriction('user'), uploadFile('image'), createPost);

module.exports = router;
