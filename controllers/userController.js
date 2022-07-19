const User = require('../models/userModel');
const UserInfo = require('../models/userInfoModel');
const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/AppError');
const multer = require('multer');
const Post = require('../models/postModel');

const multerStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/images/userMedia');
  },
  filename: (req, file, callback) => {
    const ext = file.mimetype.split('/')[1];
    callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, callback) => {
  const ext = file.mimetype;
  if (ext.startsWith('image')) callback(null, true);
  else callback(new AppError(400, 'file is not image'), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadFile = (imageName) => upload.single(imageName);

exports.getTimelinePosts = asyncWrapper(async (req, res, next) => {
  const currUser = req.user;

  const user = await User.findById(currUser.id);

  const userFriends = await Promise.all(
    user
      .get('friends')
      .map((friend) => friend.toString())
      .map(async (id) => await User.findById(id).select('userName profileImg').populate('posts'))
  );

  const userFriendsPosts = userFriends.flatMap((friend) => {
    return friend.posts.flatMap((post) => ({
      firstName: friend.firstName,
      lastName: friend.lastName,
      profileImg: friend.profileImg,
      post,
    }));
  });

  res.status(200).json({ status: 'success', data: userFriendsPosts });
});

exports.getMe = asyncWrapper(async (req, res, next) => {
  const currUser = req.user;

  const user = await User.findById(currUser.id)
    .populate({ path: 'friends', select: 'userName profileImg' })
    .populate('posts')
    .populate('userInfo');

  if (!user) return next(new AppError(403, 'user does not exist'));

  res.status(200).json({ status: 'success', data: user });
});

exports.getUser = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const currUser = req.user;

  if (currUser.id === id)
    return next(new AppError(400, `please use /getMe route to get current user info`));

  const user = await User.findById(id)
    .populate({ path: 'friends', select: 'userName profileImg' })
    .populate('posts')
    .populate('userInfo')
    .select('-pendingRequests -sentRequests');

  if (!user) return next(new AppError(403, 'user does not exist'));

  res.status(200).json({ status: 'success', data: user });
});

exports.searchUser = asyncWrapper(async (req, res, next) => {
  const { search } = req.query;

  const users = await User.find({ userName: { $regex: search } }).select('userName profileImg');

  res.status(200).json({ status: 'success', data: users });
});

exports.uploadProfileImage = asyncWrapper(async (req, res, next) => {
  const user = req.user;
  const { body } = req;

  if (req.file)
    body.image = `${req.protocol}://localhost:8800/images/userMedia/${req.file.filename}`;

  const newPost = new Post(body);

  const updatedUser = await User.findByIdAndUpdate(
    user.id,
    { profileImg: { post: newPost._id, image: body.image } },
    { new: true }
  );

  if (!updatedUser) return next(new AppError(400, 'please try again'));

  await newPost.save();

  res.status(200).json({ status: 'success', data: newPost });
});

exports.uploadCoverImage = asyncWrapper(async (req, res, next) => {
  const user = req.user;
  const { body } = req;

  if (req.file)
    body.image = `${req.protocol}://localhost:8800/images/userMedia/${req.file.filename}`;

  const newPost = new Post(body);

  const updatedUser = await User.findByIdAndUpdate(
    user.id,
    { coverImg: { post: newPost._id, image: body.image } },
    { new: true }
  );

  if (!updatedUser) return next(new AppError(400, 'please try again'));

  await newPost.save();

  res.status(200).json({ status: 'success', data: newPost });
});

exports.updateMyInfo = asyncWrapper(async (req, res, next) => {
  const user = req.user;
  const { body } = req;

  const updatedInfo = await updateUserEmbededInfo(body, user.id);

  if (!updatedInfo)
    return next(new AppError(400, `can't update information about this user. please try again`));

  res.status(200).json({ status: 'success', data: updatedInfo });
});

exports.deleteInfo = asyncWrapper(async (req, res, next) => {
  const currUser = req.user;
  const { body } = req;

  const updatedInfo = await deleteUserEmbededInfo(body, currUser.id);

  res.status(200).json({ status: 'success', data: updatedInfo });
});

exports.updateMe = asyncWrapper(async (req, res, next) => {
  const currUser = req.user;
  const body = req.body;

  const { restriction, message } = restrictedUpdate(body);
  if (restriction) return next(new AppError(400, message));

  const updatedUser = await User.findByIdAndUpdate(
    currUser.id,
    { $set: body },
    { runValidators: true, new: true }
  );

  if (!updatedUser) return next(new AppError(403, 'user does not exist'));

  res.status(200).json({ status: 'success', data: updatedUser });
});

exports.addFriend = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  if (id === user.id) return next(400, `you can't send request to yourself`);

  const adressatUser = await User.findById(id);

  if (!adressatUser) return next(400, `there are no such an user`);

  await User.findByIdAndUpdate(user.id, { $push: { sentRequests: adressatUser._id } });

  adressatUser.pendingRequests.push(user.id);
  await adressatUser.save();

  res.status(200).json({ status: 'success', message: 'your request sent successfully' });
});

exports.confirmFriend = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  const adressatUser = await User.findById(id);
  if (!adressatUser) return next(400, `there are no such an user`);

  const currUser = await User.findById(user.id);

  if (
    !currUser.pendingRequests.some((request) => request.toString() === id) ||
    !adressatUser.sentRequests.some((request) => request.toString() === user.id)
  )
    return next(new AppError(400, `there are no such friend request`));

  currUser.friends.push(id);
  adressatUser.friends.push(user.id);

  currUser.pendingRequests = currUser.pendingRequests.filter(
    (request) => request.toString() !== id
  );

  adressatUser.sentRequests = adressatUser.sentRequests.filter(
    (request) => request.toString() !== user.id
  );

  await currUser.save();
  await adressatUser.save();

  res.status(200).json({ status: 'success', message: `now you are friends on lama social` });
});

exports.cancelRequest = asyncWrapper(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  const currUser = await User.findById(user.id);
  const adressatUser = await User.findById(id);

  if (
    !currUser.sentRequests.some((request) => request.toString() === id) ||
    !adressatUser.pendingRequests.some((request) => request.toString() === user.id)
  )
    return next(new AppError(400, `there are no such friend request`));

  currUser.sentRequests = currUser.sentRequests.filter((request) => request.toString() !== id);
  adressatUser.pendingRequests = adressatUser.pendingRequests.filter(
    (request) => request.toString() !== user.id
  );

  await currUser.save();
  await adressatUser.save();

  res.status(200).json({ status: 'success', message: `your request deleted successfully` });
});

exports.deleteRequest = asyncWrapper(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  const currUser = await User.findById(user.id);
  const adressatUser = await User.findById(id);

  if (
    !currUser.pendingRequests.some((request) => request.toString() === id) ||
    !adressatUser.sentRequests.some((request) => request.toString() === user.id)
  )
    return next(new AppError(400, `there are no such friend request`));

  currUser.pendingRequests = currUser.pendingRequests.filter(
    (request) => request.toString() !== id
  );
  adressatUser.sentRequests = adressatUser.sentRequests.filter(
    (request) => request.toString() !== user.id
  );

  await currUser.save();
  await adressatUser.save();

  res.status(200).json({ status: 'success', message: `your request deleted successfully` });
});

exports.getRequest = asyncWrapper(async (req, res, next) => {
  const currUser = req.user;
  const data = await User.findById(currUser.id)
    .select('pendingRequests sentRequests')
    .populate({ path: 'pendingRequests', select: 'userName profileImg' })
    .populate({ path: 'sentRequests', select: 'userName profileImg' });
  res.status(200).json({ status: 'success', data });
});

exports.deleteFriend = asyncWrapper(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  if (id === user.id) return next(new AppError(400, `you can't delete yourself`));

  const currUser = await User.findById(user.id);
  const adressatUser = await User.findById(id);

  if (
    !currUser.friends.some((friend) => friend.toString() === id) ||
    !adressatUser.friends.some((friend) => friend.toString() === user.id)
  )
    return next(new AppError(400, `there are no such user`));

  currUser.friends = currUser.friends.filter((friend) => friend.toString() !== id);
  adressatUser.friends = adressatUser.friends.filter((friend) => friend.toString() !== user.id);

  await currUser.save();
  await adressatUser.save();

  res.status(200).json({ status: 'success', message: `user deleted successfully` });
});

exports.getFriends = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const friends = await User.findById(id).populate('friends').select('friends');

  res.status(200).json({ data: friends });
});

exports.getMuntualFriends = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  const currUser = await User.findById(user.id);
  const currUserFriendsList = currUser.friends.map((friend) => friend.toString());
  const visitedUser = await User.findById(id);

  muntualFriends = await Promise.all(
    visitedUser.friends
      .map((friend) => friend.toString())
      .filter((id) => {
        if (currUserFriendsList.includes(id)) return id;
      })
      .map(async (id) => await User.findById(id).select('profileImg userName'))
  );

  res.status(200).json({ status: 'success', data: muntualFriends });
});

exports.blockUser = asyncWrapper(async (req, res, next) => {});

function restrictedUpdate(body) {
  const [properties] = Object.entries(body);

  let restrictionStand = {
    restriction: false,
    message: '',
  };

  const restrictedUpdateProperties = [
    'hobbies',
    'relationship',
    'description',
    'phone',
    'education',
    'birthDate',
    'city',
    'from',
  ];

  properties.forEach((property) => {
    if (restrictedUpdateProperties.includes(property))
      restrictionStand = {
        restriction: true,
        message: 'please use /deactivate route to deactivate your account',
      };
  });

  if (properties.includes('role'))
    restrictionStand = {
      restriction: true,
      message: 'you are not authorized for this operations',
    };
  if (properties.includes('email'))
    restrictionStand = {
      restriction: true,
      message: 'please use /updateEmail route to update your email',
    };
  if (properties.includes('password'))
    restrictionStand = {
      restriction: true,
      message: 'please use /updatePassword route to update your password',
    };
  if (properties.includes('active'))
    restrictionStand = {
      restriction: true,
      message: 'please use /deactivate route to deactivate your account',
    };

  return restrictionStand;
}

async function updateUserEmbededInfo(body, id) {
  const properties = Object.keys(body);

  const embededFields = ['hobbies', 'education', 'workPlace', 'familyMembers', 'language'];
  let query;

  await Promise.all(
    properties.map(async (property) => {
      if (embededFields.includes(property))
        query = await UserInfo.findOneAndUpdate(
          { user: id },
          { $push: { [property]: body[property] } },
          { runValidators: true, new: true }
        );
      else
        query = await UserInfo.findOneAndUpdate(
          { user: id },
          { $set: { [property]: body[property] } },
          { runValidators: true, new: true }
        );
    })
  );

  return query;
}

async function deleteUserEmbededInfo(body, id) {
  const properties = Object.keys(body);

  const embededFields = ['hobbies', 'education', 'workPlace', 'familyMembers', 'language'];
  let query;

  await Promise.all(
    properties.map(async (property) => {
      if (embededFields.includes(property))
        query = await UserInfo.findOneAndUpdate(
          { user: id },
          { $pull: { [property]: { _id: body[property].id } } },
          { runValidators: true, new: true }
        );
      else
        query = await UserInfo.findOneAndUpdate(
          { user: id },
          { $unset: { [property]: body[property] } },
          { runValidators: true, new: true }
        );
    })
  );

  return query;
}
