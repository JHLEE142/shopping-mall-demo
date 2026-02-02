const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../src/models/order');

async function deleteOrdersExceptFeb2026() {
  try {
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-mall';
    await mongoose.connect(mongoUri);
    console.log('MongoDB 연결 성공');

    // 2026년 2월 1일 범위 설정 (한국 시간 기준)
    const startDate = new Date('2026-02-01T00:00:00.000+09:00');
    const endDate = new Date('2026-02-01T23:59:59.999+09:00');

    // 2026년 2월 1일이 아닌 주문 삭제
    const result = await Order.deleteMany({
      $or: [
        { createdAt: { $lt: startDate } },
        { createdAt: { $gt: endDate } }
      ]
    });

    console.log(`주문 데이터 삭제 완료: ${result.deletedCount}개 (2026년 2월 1일 제외)`);
    
    // 남은 주문 확인
    const remainingOrders = await Order.countDocuments();
    console.log(`남은 주문 수: ${remainingOrders}개`);

    console.log('모든 작업 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

deleteOrdersExceptFeb2026();

