const mongoose = require('mongoose');

let connection = null;

async function connectToDatabase(uri) {
  if (!uri) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI in your environment.');
  }

  if (connection) {
    return connection;
  }

  mongoose.set('strictQuery', false);

  try {
    connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected successfully');

    return connection;
  } catch (error) {
    connection = null;
    throw error;
  }
}

async function disconnectFromDatabase() {
  if (!connection) {
    return;
  }

  await mongoose.disconnect();
  connection = null;
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};

