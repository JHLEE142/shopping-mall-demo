require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/category');

async function checkCategories() {
  try {
    const uri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB\n');

    const categories = await Category.find({}).lean().sort({ createdAt: 1 });
    console.log(`=== 카테고리 데이터 (총 ${categories.length}개) ===\n`);

    if (categories.length === 0) {
      console.log('카테고리가 없습니다.');
    } else {
      // 대분류 (level 1 또는 parentId가 null)
      const mainCategories = categories.filter(cat => 
        cat.level === 1 || (!cat.level && !cat.parentId)
      );
      
      // 중분류 (level 2 또는 parentId가 있고 부모가 대분류)
      const midCategories = categories.filter(cat => {
        if (cat.level === 2) return true;
        if (!cat.level && cat.parentId) {
          const parent = categories.find(c => c._id.toString() === cat.parentId.toString());
          return parent && (parent.level === 1 || (!parent.level && !parent.parentId));
        }
        return false;
      });
      
      // 소분류 (level 3)
      const subCategories = categories.filter(cat => cat.level === 3);

      console.log(`대분류: ${mainCategories.length}개`);
      console.log(`중분류: ${midCategories.length}개`);
      console.log(`소분류: ${subCategories.length}개\n`);

      console.log('=== 상세 정보 ===\n');
      
      categories.forEach((cat, idx) => {
        const level = cat.level || (!cat.parentId ? 1 : 2);
        const levelName = level === 1 ? '대분류' : level === 2 ? '중분류' : '소분류';
        console.log(`[${idx + 1}] ${cat.name} (${levelName})`);
        console.log(`    _id: ${cat._id}`);
        console.log(`    code: ${cat.code || 'N/A'}`);
        console.log(`    level: ${cat.level || '없음 (자동: ' + level + ')'}`);
        console.log(`    parentId: ${cat.parentId || 'null'}`);
        console.log(`    isActive: ${cat.isActive !== false ? 'true' : 'false'}`);
        console.log('');
      });

      // 계층 구조 출력
      console.log('\n=== 계층 구조 ===\n');
      mainCategories.forEach(mainCat => {
        console.log(`📁 ${mainCat.name}`);
        const mids = midCategories.filter(mid => 
          mid.parentId && mid.parentId.toString() === mainCat._id.toString()
        );
        mids.forEach(midCat => {
          console.log(`  📂 ${midCat.name}`);
          const subs = subCategories.filter(sub => 
            sub.parentId && sub.parentId.toString() === midCat._id.toString()
          );
          subs.forEach(subCat => {
            console.log(`    📄 ${subCat.name}`);
          });
          if (subs.length === 0) {
            console.log(`    (소분류 없음)`);
          }
        });
        if (mids.length === 0) {
          console.log(`  (중분류 없음)`);
        }
        console.log('');
      });
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

checkCategories();

