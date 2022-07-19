const express = require('express');
const { verify, restriction } = require('../controllers/authenticationController');
const {
  getMe,
  updateMe,
  updateMyInfo,
  deleteInfo,
  getUser,
  searchUser,
  getMuntualFriends,
  addFriend,
  cancelRequest,
  deleteRequest,
  confirmFriend,
  getRequest,
  deleteFriend,
  getTimelinePosts,
  getFriends,
  uploadProfileImage,
  uploadCoverImage,
  uploadFile,
} = require('../controllers/userController');

const router = express.Router();

router.route('/getMe').get(verify, restriction('user'), getMe);

router.route('/timeline').get(verify, restriction('user'), getTimelinePosts);

router.route('/updateMe').patch(verify, restriction('user'), updateMe);

router.route('/friendRequests').get(verify, restriction('user'), getRequest);

router
  .route('/updateMe/info')
  .patch(verify, restriction('user'), updateMyInfo)
  .delete(verify, restriction('user'), deleteInfo);

router
  .route('/updateMe/profileImg')
  .post(verify, restriction('user'), uploadFile('image'), uploadProfileImage);

router
  .route('/updateMe/coverImg')
  .post(verify, restriction('user'), uploadFile('image'), uploadCoverImage);

router.route('/:id/friends').get(verify, restriction('user'), getFriends);

router.route('/:id/muntualFriends').get(verify, restriction('user'), getMuntualFriends);

router.route('/:id/addToFriends').post(verify, restriction('user'), addFriend);

router.route('/:id/cancelRequest').patch(verify, restriction('user'), cancelRequest);

router.route('/:id/deleteRequest').delete(verify, restriction('user'), deleteRequest);

router.route('/:id/confirmFriend').post(verify, restriction('user'), confirmFriend);

router.route('/:id/deleteFriend').post(verify, restriction('user'), deleteFriend);

router.route('/:id').get(verify, restriction('user', 'admin'), getUser);

router.route('/').get(verify, restriction('user', 'admin'), searchUser);

module.exports = router;
