const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception, server is closed >', err.message, err.stack);
  process.exit(1);
});

const mongoose = require('mongoose');
const App = require('./index');

const PORT = process.env.PORT;
const DB = process.env.DB_APP_CONNECTION;
const SERVER = App.listen(PORT, () =>
  console.log(`DB Connection Established Successfully ! App listens on PORT:${PORT}`)
);

mongoose
  .connect(DB)
  .then(() => SERVER())
  .catch((err) =>
    process.on('unhandledRejection', (err) => {
      console.log('Unhandled Rejection, server is closed >', err.message);
      SERVER.close(() => process.exit(1));
    })
  );
