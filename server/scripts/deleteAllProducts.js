/**
 * 모든 상품 삭제 스크립트
 * 
 * 사용법:
 * node server/scripts/deleteAllProducts.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/product');

async function deleteAllProducts() {
  try {
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/shopping-mall-demo';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공');

    // 모든 상품 조회
    const allProducts = await Product.find({});
    console.log(`📊 총 ${allProducts.length}개의 상품이 발견되었습니다.`);

    if (allProducts.length === 0) {
      console.log('⚠️ 삭제할 상품이 없습니다.');
      await mongoose.disconnect();
      return;
    }

    // 삭제 확인
    console.log('\n⚠️  경고: 모든 상품을 삭제합니다.');
    console.log(`삭제될 상품 수: ${allProducts.length}개`);

    // 모든 상품 삭제
    const result = await Product.deleteMany({});
    console.log(`\n✅ ${result.deletedCount}개의 상품이 삭제되었습니다.`);

    // 인덱스 확인
    const remainingProducts = await Product.countDocuments({});
    console.log(`📊 남은 상품 수: ${remainingProducts}개`);

    await mongoose.disconnect();
    console.log('✅ MongoDB 연결 종료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// 스크립트 실행
deleteAllProducts();

