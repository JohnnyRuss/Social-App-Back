const express = require('express');
const { restriction, verify } = require('../controllers/authenticationController');
const {
  createConversation,
  sendMessage,
  getConversation,
  deleteConversation,
  getAllConversations,
} = require('../controllers/conversationController');

const router = express.Router();

router.route('/allConversations').get(verify, restriction('user'), getAllConversations);

router
  .route('/conversations/:adressatId')
  .post(verify, restriction('user'), createConversation)
  .get(verify, restriction('user'), getConversation);

router
  .route('/:conversationId')
  .post(verify, restriction('user'), sendMessage)
  .delete(verify, restriction('user'), deleteConversation);

module.exports = router;
