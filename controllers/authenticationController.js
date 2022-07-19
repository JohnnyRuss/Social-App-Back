const crypto = require('crypto');
const { signToken, verifyToken } = require('../utils/jwt');
const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/nodemailer');
const User = require('../models/userModel');
const UserInfo = require('../models/userInfoModel');
const Refresher = require('../models/refresher');

exports.registerUser = asyncWrapper(async function (req, res, next) {
  const { body } = req;

  const user = {
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    password: body.password,
  };

  const newUser = new User(user);

  const userInfo = await UserInfo.create({ user: newUser._id });

  newUser.userInfo = userInfo._id;

  await newUser.save();

  const refreshToken = await signToken(res, { id: newUser._id, role: newUser.role });

  res.status(201).json({ status: 'success', data: newUser, refreshToken });
});

exports.logInUser = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const { authorization: refresher } = req.headers;

  if (!email || !password) return next(new AppError(400, `please enter your email and password`));

  // let alreadyAuthorized;

  // console.log(refresher);
  // if (refresher !== null) alreadyAuthorized = await Refresher.findOne({ refresher: refresher });

  // if (alreadyAuthorized) return next(new AppError(4010, `you are already authorized`));

  let user;

  user = await User.findOne({ email }).select(
    '+password userName firstName lastName profileImg role'
  );

  console.log(user);

  if (!user) user = await checkDeactivatedUser(email, next);

  if (!user) return next(new AppError(401, 'incorect email or password'));

  const passwordChecked = await user.checkPassword(password, user.password);

  if (!passwordChecked) return next(new AppError(401, 'incorect email or password'));

  user.password = undefined;

  const refreshToken = await signToken(res, { id: user._id, role: user.role });

  res.status(200).json({ status: 'success', data: user, refreshToken });
});

exports.forgotPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  let user;

  user = await User.findOne({ email });

  if (!user) user = await checkDeactivatedUser(email, next);

  if (!user) return next(new AppError(401, 'incorect email'));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `forgot your password ? then click this url: ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Lama-Social password reset token (valid for 10m)',
      message,
    });

    res.status(200).json({ status: 'success', message: 'token send to email' });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(500, 'there was an error sending to email. please try again later'));
  }
});

exports.resetPassword = asyncWrapper(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const hashedPassword = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedPassword,
    passwordResetExpires: { $gte: Date.now() },
  })
    .populate('userInfo')
    .populate('friends');

  if (!user) return next(new AppError(400, 'password reset token is invalid or expird in'));

  user.password = newPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  user.password = undefined;

  const refreshToken = await signToken(res, { id: user._id, role: user.role });

  res.status(200).json({ status: 'success', data: user, refreshToken });
});

exports.updatePassword = asyncWrapper(async (req, res, next) => {
  const { currPassword, newPassword } = req.body;
  const currUser = req.user;

  const user = await User.findById(currUser.id).select('+password');

  const checkedPassword = user.checkPassword(currPassword, user.password);

  if (!user || !checkedPassword) return next(new AppError(400, 'incorect password'));

  user.password = newPassword;
  await user.save();

  await signToken(res, { id: user._id, role: user.role });

  res.status(200).json({ status: 'success', message: 'your password updated successfully' });
});

exports.deactivateUser = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const currUser = req.user;

  if (id !== currUser.id)
    return next(new AppError(403, 'you are not authorized for this operation'));

  const user = await User.findById(currUser.id);

  if (!user) return next(new AppError(403, 'this user does not exist'));

  user.active = false;
  await user.save();

  res.clearCookie('authorization');
  res.clearCookie('refreshToken');

  res.status(204).json({ status: 'success', message: 'your account is deactivated successfully' });
});

exports.deleteUserPermanently = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const currUser = req.user;

  if (currUser.id !== id && currUser.role !== 'admin')
    return next(new AppError(403, 'you are not authorized for this operation'));

  const deletedUser = await User.findByIdAndDelete(id);
  await UserInfo.findByIdAndDelete(deletedUser.userInfo);

  res.clearCookie('authorization');

  res.status(204).json({ status: 'success', message: 'your account deleted successfully' });
});

exports.verify = asyncWrapper(async (req, res, next) => {
  const token = req.cookies.authorization;

  if (!token) return next(new AppError(401, 'you are not authorized'));

  const userCredentials = await verifyToken(token);

  req.user = userCredentials;

  next();
});

exports.restriction = (...roles) =>
  asyncWrapper(async (req, res, next) => {
    const user = req.user;

    if (!roles.includes(user?.role))
      return next(new AppError(403, 'you are not authorized for this operation'));

    next();
  });

exports.refreshToken = asyncWrapper(async (req, res, next) => {
  const { authorization: refreshToken } = req.headers;

  if (!refreshToken) return next(new AppError(401, 'you are not authorized '));

  const { id } = await verifyToken(refreshToken, true);

  const currUser = await User.findById(id);

  if (!currUser) return next(new AppError(403, 'you are not authorized'));

  await Refresher.findOneAndDelete({ refresher: refreshToken });

  const refresher = await signToken(res, { id: currUser._id, role: currUser.role });

  res.status(200).json({ status: 'success', refresher });
});

async function checkDeactivatedUser(email, next) {
  const deactivatedUser = await User.updateOne(
    { email, active: false },
    { $set: { active: true } },
    { new: true }
  );

  if (deactivatedUser.modifiedCount === 1 && deactivatedUser.matchedCount === 1)
    return await User.findOne({ email }).select('+password _id firstName profileImg role');
}
