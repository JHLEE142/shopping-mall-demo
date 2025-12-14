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
    console.log(`Database: ${connection.connection.name}`);
    console.log(`Host: ${connection.connection.host}`);

    return connection;
  } catch (error) {
    connection = null;
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please make sure MongoDB is running and the connection string is correct.');
    throw error;
  }
}

async function disconnectFromDatabase() {
  if (!connection) {
    return;
  }

  await mongoose.disconnect();
  connection = null;
  console.log('MongoDB disconnected');
}

// 간단한 연결 함수 (패키지와 호환성)
async function connectDB() {
  // MONGODB_ATLAS_URL을 우선 사용 (MongoDB Atlas 클러스터)
  const mongoURI = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
  return connectToDatabase(mongoURI);
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  connectDB, // 패키지와의 호환성을 위한 별칭
};

