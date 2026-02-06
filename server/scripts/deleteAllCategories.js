/**
 * 모든 카테고리 삭제 스크립트
 * 
 * 사용법:
 * node server/scripts/deleteAllCategories.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/category');

async function deleteAllCategories() {
  try {
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-mall-demo';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공');

    // 모든 카테고리 조회
    const allCategories = await Category.find({});
    console.log(`📊 총 ${allCategories.length}개의 카테고리가 발견되었습니다.`);

    if (allCategories.length === 0) {
      console.log('⚠️ 삭제할 카테고리가 없습니다.');
      await mongoose.disconnect();
      return;
    }

    // 삭제 확인
    console.log('\n⚠️  경고: 모든 카테고리를 삭제합니다.');
    console.log('삭제될 카테고리 목록:');
    allCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (${cat.code})`);
    });

    // 모든 카테고리 삭제
    const result = await Category.deleteMany({});
    console.log(`\n✅ ${result.deletedCount}개의 카테고리가 삭제되었습니다.`);

    // 인덱스 확인
    const remainingCategories = await Category.countDocuments({});
    console.log(`📊 남은 카테고리 수: ${remainingCategories}개`);

    await mongoose.disconnect();
    console.log('✅ MongoDB 연결 종료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// 스크립트 실행
deleteAllCategories();



