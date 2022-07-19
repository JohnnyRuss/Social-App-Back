const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const errorController = require('./utils/errorController');
const AppError = require('./utils/AppError');

const userRoutes = require('./routes/userRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');
const postRoutes = require('./routes/postRoutes');
const conversationRoutes = require('./routes/conversationRoute');

const path = require('path');

const App = express();

App.use(express.json());
App.use(express.static(path.join(__dirname, 'public')));

App.use(
  cors({
    credentials: true,
    origin: 'http://localhost:3000',
  })
);
App.use(cookieParser());
App.use(helmet());
App.use(morgan('common'));

App.use('/api/v1/auth', authenticationRoutes);
App.use('/api/v1/users', userRoutes);
App.use('/api/v1/posts', postRoutes);
App.use('/api/v1/messages', conversationRoutes);

App.all('*', (req, res, next) => {
  next(new AppError(404, `can't find ${req.originalUrl} on this server`));
});

App.use(errorController);

module.exports = App;
