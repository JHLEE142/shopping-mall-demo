const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../src/models/order');
const Category = require('../src/models/category');

async function deleteOrdersAndCategories() {
  try {
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-mall';
    await mongoose.connect(mongoUri);
    console.log('MongoDB 연결 성공');

    // 주문 데이터 삭제
    const orderResult = await Order.deleteMany({});
    console.log(`주문 데이터 삭제 완료: ${orderResult.deletedCount}개`);

    // 카테고리 데이터 삭제
    const categoryResult = await Category.deleteMany({});
    console.log(`카테고리 데이터 삭제 완료: ${categoryResult.deletedCount}개`);

    console.log('모든 작업 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

deleteOrdersAndCategories();

