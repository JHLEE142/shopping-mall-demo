import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // 로컬 MongoDB 연결 (데이터베이스 이름: shopbuddy)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopbuddy';
    
    const conn = await mongoose.connect(mongoURI, {
      // MongoDB 6.0 이상에서는 아래 옵션들이 기본값이므로 생략 가능
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please make sure MongoDB is running on localhost:27017');
    process.exit(1);
  }
};

export default connectDB;

