const JWT = require('jsonwebtoken');
const { promisify } = require('util');
const Refresher = require('../models/refresher');

exports.signToken = async (res, payload) => {
  const SECRET = process.env.JWT_SECRET;
  const REF_SECRET = process.env.REFRESHER_SECRET;

  const token = JWT.sign(payload, SECRET, { expiresIn: '1h' });
  const refresher = JWT.sign(payload, REF_SECRET);

  await Refresher.create({ refresher });

  const cookieOptions = {
    httpOnly: true,
    origin: 'http://localhost:3000',
  };

  res.cookie('authorization', token, cookieOptions);

  return refresher;
};

exports.verifyToken = async (token, refresh = false) => {
  let SECRET;

  if (!refresh) SECRET = process.env.JWT_SECRET;
  if (refresh) SECRET = process.env.REFRESHER_SECRET;

  const verification = promisify(JWT.verify);

  return await verification(token, SECRET);
};
