/**
 * Category 스키마 마이그레이션 스크립트
 * 
 * 기존 Category 데이터에 다음 필드를 추가/업데이트합니다:
 * - pathIds: [ObjectId] - 경로 ID 배열
 * - pathNames: [String] - 경로 이름 배열
 * - isLeaf: Boolean - 리프 노드 여부
 * 
 * 사용법:
 * node server/scripts/migrate-category-schema.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/category');

const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';

/**
 * Category 경로 정보를 재귀적으로 계산
 */
async function buildCategoryPath(categoryId, pathIds = [], pathNames = []) {
  const category = await Category.findById(categoryId);
  if (!category) {
    return { pathIds: pathIds.reverse(), pathNames: pathNames.reverse() };
  }

  pathIds.push(category._id);
  pathNames.push(category.name);

  if (category.parentId) {
    return await buildCategoryPath(category.parentId, pathIds, pathNames);
  }

  return { pathIds: pathIds.reverse(), pathNames: pathNames.reverse() };
}

/**
 * 단일 카테고리 업데이트
 */
async function updateCategory(category) {
  try {
    // 경로 정보 계산
    const { pathIds, pathNames } = await buildCategoryPath(category._id);
    
    // isLeaf 계산: 소분류(level=3)이면서 자식이 없는 경우
    const childCount = await Category.countDocuments({ parentId: category._id, isActive: true });
    const isLeaf = category.level === 3 || childCount === 0;

    // 업데이트
    await Category.findByIdAndUpdate(category._id, {
      $set: {
        pathIds,
        pathNames,
        isLeaf
      }
    });

    return true;
  } catch (error) {
    console.error(`Error updating category ${category._id}:`, error.message);
    return false;
  }
}

/**
 * 모든 카테고리 마이그레이션
 */
async function migrateCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    // 인덱스 생성 (확실하게 하기 위해)
    console.log('Creating indexes...');
    await Category.ensureIndexes();
    console.log('Indexes created');

    // 모든 카테고리 조회
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories to migrate`);

    let successCount = 0;
    let errorCount = 0;

    // 레벨 순서대로 처리 (대분류 -> 중분류 -> 소분류)
    const categoriesByLevel = {
      1: categories.filter(c => c.level === 1),
      2: categories.filter(c => c.level === 2),
      3: categories.filter(c => c.level === 3)
    };

    // 대분류부터 처리
    for (const level of [1, 2, 3]) {
      console.log(`\nProcessing level ${level} categories (${categoriesByLevel[level].length} items)...`);
      
      for (const category of categoriesByLevel[level]) {
        const success = await updateCategory(category);
        if (success) {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`  Updated ${successCount} categories...`);
          }
        } else {
          errorCount++;
        }
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    // 샘플 데이터 확인
    console.log('\n📋 Sample migrated categories:');
    const samples = await Category.find({}).limit(5).sort({ level: 1 });
    for (const sample of samples) {
      console.log(`   - ${sample.name} (level ${sample.level})`);
      console.log(`     pathIds: ${sample.pathIds.length} items`);
      console.log(`     pathNames: ${sample.pathNames.join(' > ')}`);
      console.log(`     isLeaf: ${sample.isLeaf}`);
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateCategories();
}

module.exports = { migrateCategories };

