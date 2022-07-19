const express = require('express');
const {
  verify,
  restriction,
  registerUser,
  logInUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  deactivateUser,
  deleteUserPermanently,
  refreshToken,
} = require('../controllers/authenticationController');

const router = express.Router();

router.route('/refresh').post(refreshToken);

router.route('/register').post(registerUser);

router.route('/login').post(logInUser);

router.route('/forgotPassword').post(forgotPassword);

router.route('/resetPassword/:token').post(resetPassword);

router.route('/updatePassword').patch(verify, restriction('user'), updatePassword);

router.route('/deactivate/:id').post(verify, restriction('user'), deactivateUser);

router.route('/delete/:id').delete(verify, restriction('user', 'admin'), deleteUserPermanently);

module.exports = router;
