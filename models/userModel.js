const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'please provide us your first name'],
      min: 3,
      max: 20,
    },
    lastName: {
      type: String,
      required: [true, 'please provide us your last name'],
      min: 3,
      max: 20,
    },
    userName: {
      type: String,
    },
    email: {
      type: String,
      required: [true, 'please provide us your email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'please provide us your password'],
      min: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: 'password confirm must to match password',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
    },
    profileImg: {
      image: {
        type: String,
        default: 'http://localhost:8800/images/avatar.jpg',
      },
      post: String,
    },
    coverImg: {
      image: {
        type: String,
        default: 'http://localhost:8800/images/cover.png',
      },
      post: String,
    },
    userInfo: {
      type: mongoose.Schema.ObjectId,
      ref: 'UserInfo',
    },
    friends: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    pendingRequests: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    sentRequests: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.pre('save', function (next) {
  if (!this.isModified('firstName') || !this.isModified('lastName')) return next();
  this.userName = `${this.firstName} ${this.lastName}`;
  next();
});

UserSchema.virtual('posts', {
  ref: 'Post',
  foreignField: 'user',
  localField: '_id',
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

UserSchema.pre(/^find/, function (next) {
  this.populate('profileImg').populate('coverImg');
  next();
});

UserSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

UserSchema.methods.checkPassword = async function (candidatePassword, password) {
  return await bcrypt.compare(candidatePassword, password);
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
