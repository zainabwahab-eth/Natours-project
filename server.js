const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTIONS, shutting down');
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connection to mongodb Successful'));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`You're listening in ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION, shutting down');
  console.log(err.name, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server Killed');
  });
});

// console.log(x);
