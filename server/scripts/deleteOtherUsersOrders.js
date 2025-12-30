require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Order = require('../src/models/order');

const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';

async function deleteOtherUsersOrders() {
  try {
    console.log('MongoDB 연결 중...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB 연결 성공');

    // 보존할 사용자 찾기
    const adminUser = await User.findOne({ email: 'admin@admin.com' });
    const customerUser = await User.findOne({ email: 'ljh951006@naver.com' });

    if (!adminUser) {
      console.error('admin@admin.com 사용자를 찾을 수 없습니다.');
      return;
    }

    if (!customerUser) {
      console.error('ljh951006@naver.com 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log(`관리자 ID: ${adminUser._id}`);
    console.log(`고객 ID: ${customerUser._id}`);

    // 보존할 사용자 ID 배열
    const preserveUserIds = [adminUser._id, customerUser._id];

    // 보존할 사용자들의 주문 개수 확인
    const adminOrderCount = await Order.countDocuments({ user: adminUser._id });
    const customerOrderCount = await Order.countDocuments({ user: customerUser._id });
    
    console.log(`\n보존할 주문 내역:`);
    console.log(`  admin@admin.com: ${adminOrderCount}건`);
    console.log(`  ljh951006@naver.com: ${customerOrderCount}건`);

    // 다른 계정들의 주문 삭제
    console.log('\n다른 계정들의 주문 삭제 중...');
    const result = await Order.deleteMany({
      user: { $nin: preserveUserIds }
    });

    console.log(`\n삭제 완료: ${result.deletedCount}건의 주문이 삭제되었습니다.`);

    // 삭제 후 확인
    const remainingOrderCount = await Order.countDocuments();
    const remainingAdminCount = await Order.countDocuments({ user: adminUser._id });
    const remainingCustomerCount = await Order.countDocuments({ user: customerUser._id });

    console.log(`\n삭제 후 주문 현황:`);
    console.log(`  전체 주문: ${remainingOrderCount}건`);
    console.log(`  admin@admin.com: ${remainingAdminCount}건`);
    console.log(`  ljh951006@naver.com: ${remainingCustomerCount}건`);

    console.log('\n작업이 완료되었습니다.');
  } catch (error) {
    console.error('주문 삭제 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

deleteOtherUsersOrders();

