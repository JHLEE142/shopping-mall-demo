require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/category');
const { connectDB } = require('../src/config/database');

// 환경 변수 확인
console.log('환경 변수 확인:');
console.log('- MONGODB_ATLAS_URL:', process.env.MONGODB_ATLAS_URL ? '설정됨' : '설정 안 됨');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '설정됨' : '설정 안 됨');
console.log('');

// 새로운 카테고리 목록
const CATEGORIES = [
  {
    name: '주방용품',
    slug: 'kitchen-supplies',
    code: 'kitchen',
    description: '주방에서 필요한 모든 용품',
    order: 1,
    color: '#FF6B6B',
  },
  {
    name: '욕실용품',
    slug: 'bathroom-supplies',
    code: 'bathroom',
    description: '욕실에서 사용하는 용품',
    order: 2,
    color: '#4ECDC4',
  },
  {
    name: '침구/홈데코',
    slug: 'bedding-home-deco',
    code: 'bedding-deco',
    description: '침구류 및 홈 인테리어 소품',
    order: 3,
    color: '#95E1D3',
  },
  {
    name: '인테리어소품',
    slug: 'interior-accessories',
    code: 'interior',
    description: '인테리어를 완성하는 소품',
    order: 4,
    color: '#F38181',
  },
  {
    name: '청소용품',
    slug: 'cleaning-supplies',
    code: 'cleaning',
    description: '청소에 필요한 모든 용품',
    order: 5,
    color: '#AA96DA',
  },
  {
    name: '수납/정리',
    slug: 'storage-organization',
    code: 'storage',
    description: '수납 및 정리 용품',
    order: 6,
    color: '#FCBAD3',
  },
  {
    name: '생활잡화',
    slug: 'daily-necessities',
    code: 'daily',
    description: '일상 생활에 필요한 잡화',
    order: 7,
    color: '#FFD93D',
  },
  {
    name: '전자제품',
    slug: 'electronics',
    code: 'electronics',
    description: '생활 전자제품',
    order: 8,
    color: '#6BCB77',
  },
  {
    name: '반려동물용품',
    slug: 'pet-supplies',
    code: 'pet',
    description: '반려동물을 위한 용품',
    order: 9,
    color: '#FFB84D',
  },
  {
    name: '육아용품',
    slug: 'baby-supplies',
    code: 'baby',
    description: '육아에 필요한 모든 용품',
    order: 10,
    color: '#FF6B9D',
  },
  {
    name: '야외/캠핑',
    slug: 'outdoor-camping',
    code: 'outdoor',
    description: '야외 활동 및 캠핑 용품',
    order: 11,
    color: '#C7CEEA',
  },
  {
    name: '사무용품',
    slug: 'office-supplies',
    code: 'office',
    description: '사무실에서 사용하는 용품',
    order: 12,
    color: '#B8E6B8',
  },
  {
    name: '건강용품',
    slug: 'health-supplies',
    code: 'health',
    description: '건강 관리 용품',
    order: 13,
    color: '#FFB6C1',
  },
  {
    name: '뷰티/미용',
    slug: 'beauty-cosmetics',
    code: 'beauty',
    description: '뷰티 및 미용 용품',
    order: 14,
    color: '#FFD700',
  },
  {
    name: '식품/음료',
    slug: 'food-beverage',
    code: 'food',
    description: '식품 및 음료',
    order: 15,
    color: '#FF8C42',
  },
  {
    name: '의류',
    slug: 'clothing',
    code: 'clothing',
    description: '의류',
    order: 16,
    color: '#9B59B6',
  },
];

async function initCategories() {
  try {
    console.log('데이터베이스 연결 시도 중...');
    await connectDB();
    console.log('✓ 데이터베이스 연결 성공\n');

    // 기존 카테고리 확인
    const existingCategories = await Category.find({});
    console.log(`현재 데이터베이스에 ${existingCategories.length}개의 카테고리가 있습니다.\n`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const categoryData of CATEGORIES) {
      try {
        const existingCategory = await Category.findOne({ 
          $or: [
            { code: categoryData.code },
            { slug: categoryData.slug }
          ]
        });

        if (existingCategory) {
          // 기존 카테고리 업데이트
          const hasChanges = 
            existingCategory.name !== categoryData.name ||
            existingCategory.slug !== categoryData.slug ||
            existingCategory.description !== categoryData.description ||
            existingCategory.order !== categoryData.order ||
            existingCategory.color !== categoryData.color;

          if (hasChanges) {
            existingCategory.name = categoryData.name;
            existingCategory.slug = categoryData.slug;
            existingCategory.description = categoryData.description;
            existingCategory.order = categoryData.order;
            existingCategory.color = categoryData.color;
            existingCategory.isActive = true;
            await existingCategory.save();
            updatedCount++;
            console.log(`✓ 카테고리 업데이트: ${categoryData.name} (code: ${categoryData.code})`);
          } else {
            skippedCount++;
            console.log(`- 카테고리 유지: ${categoryData.name} (변경사항 없음)`);
          }
        } else {
          // 새 카테고리 생성
          await Category.create(categoryData);
          createdCount++;
          console.log(`✓ 카테고리 생성: ${categoryData.name} (code: ${categoryData.code})`);
        }
      } catch (error) {
        console.error(`✗ 카테고리 처리 실패: ${categoryData.name}`, error.message);
      }
    }

    console.log('\n=== 카테고리 초기화 완료 ===');
    console.log(`생성: ${createdCount}개`);
    console.log(`업데이트: ${updatedCount}개`);
    console.log(`유지: ${skippedCount}개`);
    console.log(`총: ${CATEGORIES.length}개`);

    // 최종 확인
    const finalCount = await Category.countDocuments({ isActive: true });
    console.log(`\n활성 카테고리 총 개수: ${finalCount}개`);

    // 연결 종료
    await mongoose.connection.close();
    console.log('\n데이터베이스 연결 종료');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 카테고리 초기화 중 오류 발생:');
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    
    // 연결 종료 시도
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // 무시
    }
    
    process.exit(1);
  }
}

initCategories();

