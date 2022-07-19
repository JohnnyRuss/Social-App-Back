const mongoose = require('mongoose');

const UserInfoSchema = new mongoose.Schema({
  user: String,
  birthDate: {
    type: Date,
  },
  birthPlace: {
    type: Object,
  },
  livingPlace: {
    type: Object,
  },
  education: [
    {
      collage: String,
      faculty: String,
      specialities: [],
      description: String,
      graduated: Boolean,
      schoolType: String,
      quality: String,
      date: {
        from: Date,
        to: Date,
      },
    },
  ],
  workPlace: [
    {
      company: String,
      position: String,
      location: String,
      description: String,
      date: {
        from: Date,
        to: Date,
      },
    },
  ],
  phoneNumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  description: {
    type: String,
    max: 50,
  },
  familyMembers: [
    {
      role: String,
      user: String,
    },
  ],
  relationship: {
    type: String,
    enum: ['married', 'single', 'complicated'],
  },
  interestedIn: {
    type: String,
    enum: ['men', 'women', 'both'],
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  hobbies: [
    {
      hobby: String,
    },
  ],
  webSite: String,
  language: [
    {
      language: String,
    },
  ],
  politicianOpinion: {
    type: Object,
  },
  religianOpinion: {
    type: Object,
  },
  joinedAt: {
    type: Date,
    default: Date.now(),
  },
});

const UserInfo = mongoose.model('UserInfo', UserInfoSchema);

module.exports = UserInfo;
