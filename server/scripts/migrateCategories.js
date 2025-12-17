/**
 * Categories 컬렉션 마이그레이션 스크립트
 * 
 * CATEGORY_PATHS 배열을 기반으로 대분류(level=1) → 중분류(level=2) → 소분류(level=3) 트리 구조로 마이그레이션합니다.
 * 
 * 조건:
 * - upsert 기반 (중복 생성 금지)
 * - level, parentId, isLeaf, pathIds, pathNames 반드시 채움
 * - 소분류만 isLeaf=true
 * - "대", "대>중", "대>중>소" 경로가 모두 생성되도록 함
 * 
 * 사용법:
 * node server/scripts/migrateCategories.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/category');

const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';

// TODO: 아래 CATEGORY_PATHS 배열을 실제 데이터로 채워주세요
// 형식: ["대분류>중분류>소분류", "대분류>중분류", "대분류", ...]
const CATEGORY_PATHS = [
  "주방용품 > 조리도구 > 건지기/망",
  "뷰티/케어 > 메이크업/헤어 > 헤어스타일링", 
  "주방용품 > 주방잡화/소품 > 망/커버/뚜껑",
  "철물/전기 > 공구 > 일반공구",
  "생활잡화 > 일회용품 > 비닐봉투/비닐장갑/지퍼백",
  "주방용품 > 식기/생활자기 > 스푼/티스푼",
  "철물/전기 > 공구 > 기타공구",
  "주방용품 > 주방잡화/소품 > 고무장갑/주방장갑",
  "철물/전기 > 보수/안전 > 접착제",
  "생활잡화 > 시즌용품 > 계절용품",
  "생활잡화 > 일회용품 > 물티슈/티슈",
  "욕실/세탁/청소 > 청소용품 > 행주/걸레",
  "수납/정리 > 소품걸이/옷걸이/커버 > 커버",
  "뷰티/케어 > 케어용품 > 바디케어",
  "수납/정리 > 소품걸이/옷걸이/커버 > 소품걸이/후크",
  "뷰티/케어 > 뷰티/케어소품 > 케어소품",
  "생활잡화 > 생활용품 > 수예부자재",
  "여가/건강 > 건강용품 > 기타용품",
  "욕실/세탁/청소 > 청소용품 > 휴지통/분리수거",
  "생활잡화 > 패션용품 > 깔창/구둣주걱/구두약",
  "생활잡화 > 일회용품 > 일회용컵",
  "여가/건강 > 건강용품 > 의약품",
  "여가/건강 > 스포츠/레저 > 헬스",
  "철물/전기 > 수도/수전 > 수전세트",
  "욕실/세탁/청소 > 청소용품 > 수세미/솔",
  "생활잡화 > 기타생활용품 > 사무용품",
  "생활잡화 > 일회용품 > 기타용품",
  "생활잡화 > 패션용품 > 거실화/실내화",
  "욕실/세탁/청소 > 욕실용품 > 욕실정리소품",
  "주방용품 > 주방잡화/소품 > 커피/티",
  "인테리어 > 인테리어소품 > 베개/방석/담요",
  "주방용품 > 조리도구 > 채칼/강판",
  "생활잡화 > 생활용품 > 우산/우비",
  "인테리어 > 매트/카페트 > 매트/발판",
  "주방용품 > 보관/밀폐용기 > 물통/물병",
  "여가/건강 > 원예용품 > 원예도구",
  "수납/정리 > 서랍장/수납함 > 기타정리소품",
  "여가/건강 > 스포츠/레저 > 캠핑/등산용품",
    "수납/정리 > 소품걸이/옷걸이/커버 > 옷걸이/바지걸이",
  "욕실/세탁/청소 > 욕실용품 > 수건/타올",
  "뷰티/케어 > 액세서리 > 화장소품케이스",
  "뷰티/케어 > 액세서리 > 손거울",
  "뷰티/케어 > 뷰티/케어소품 > 메이크업소품",
  "생활잡화 > 시즌용품 > 계절소품",
  "수납/정리 > 서랍장/수납함 > 대형서랍장",
  "수납/정리 > 리빙박스/바구니 > 바구니",
  "욕실/세탁/청소 > 욕실용품 > 욕실의자/바구니",
  "주방용품 > 조리도구 > 믹싱볼/양푼",
  "욕실/세탁/청소 > 청소용품 > 기타용품",
  "욕실/세탁/청소 > 세제/섬유유연제 > 다용도세제",
  "뷰티/케어 > 액세서리 > 머리끈/핀",
  "인테리어 > 스티커/시트지/벽지",
  "인테리어 > 스티커/시트지/벽지 > 데코스티커",
  "욕실/세탁/청소 > 세탁용품 > 빨래집게/빨랫줄",
  "주방용품 > 보관/밀폐용기 > 도자기/유리용기",
  "인테리어 > 인테리어소품 > 기타소품",
  "뷰티/케어 > 케어용품 > 구강용품",
  "디지털/가전 > PC/스마트폰 > 음향기기",
  "생활잡화 > 일회용품 > 랩/호일",
  "디지털/가전 > 생활미용가전 > 이미용",
  "생활잡화 > 생활용품 > 분무기",
  "생활잡화 > 기타생활용품 > 기타용품",
  "철물/전기 > 공구 > 못/나사/볼트",
  "철물/전기 > 수도/수전 > 호스/줄/헤드",
  "철물/전기 > 보수/안전 > 작업장갑",
  "주방용품 > 조리도구 > 채반/바구니",
  "여가/건강 > 원예용품 > 화분/화분받침대",
  "주방용품 > 보관/밀폐용기 > 양념통/소스통",
  "여가/건강 > 건강용품 > 찜질/안마",
  "뷰티/케어 > 케어용품 > 헤어케어",
  "주방용품 > 조리기구 > 냄비",
  "디지털/가전 > 기타용품 > 케이블/랜선",
  "수납/정리 > 서랍장/수납함 > 데스크정리소품",
  "주방용품 > 식기/생활자기 > 유아식기",
  "주방용품 > 보관/밀폐용기 > 아이스트레이",
  "욕실/세탁/청소 > 욕실용품 > 변기커버",
  "인테리어 > 커튼/블라인드 > 커튼",
  "여가/건강 > 차량용품 > 차량용액세서리",
  "욕실/세탁/청소 > 청소용품 > 빗자루/쓰레받이",
  "인테리어 > 커튼/블라인드 > 커튼봉/레일/기타부품",
  "디지털/가전 > PC/스마트폰 > 스마트폰용품",
  "철물/전기 > 공구 > 전동/공구세트",
  "욕실/세탁/청소 > 욕실용품 > 때밀이/샤워타올",
  "디지털/가전 > 생활미용가전 > 생활가전",
  "주방용품 > 조리기구 > 내열냄비/뚝배기",
  "디지털/가전 > PC/스마트폰 > PC용품",
  "인테리어 > 스티커/시트지/벽지 > 벽지/시트지",
  "생활잡화 > 일회용품 > 이쑤시게/면봉/꼬치",
  "여가/건강 > 애완용품 > 애견기타용품",
  "생활잡화 > 패션용품 > 양말/스타킹/레깅스",
  "주방용품 > 조리도구 > 절구/다지기",
  "디지털/가전 > 주방가전 > 홈메이드",
  "인테리어 > 거울/시계/액자 > 탁상용거울",
  "수납/정리 > 선반/진열대 > 다용도선반",
  "주방용품 > 보관/밀폐용기 > 도시락/찬합",
  "욕실/세탁/청소",
  "뷰티/케어 > 뷰티/케어소품",
  "생활잡화 > 생활용품 > 의자",
  "욕실/세탁/청소 > 세탁용품 > 건조대/바구니/다림판",
  "디지털/가전 > PC/스마트폰 > 다용도/기타거치대",
  "주방용품 > 보관/밀폐용기 > 스텐용기",
  "주방용품 > 보관/밀폐용기 > 기타보관/밀폐용기",
  "수납/정리 > 선반/진열대 > 주방선반",
  "욕실/세탁/청소 > 세탁용품 > 기타세탁용품",
  "욕실/세탁/청소 > 세제/섬유유연제 > 주방용세제",
  "뷰티/케어 > 메이크업/헤어 > 메이크업",
  "여가/건강 > 애완용품 > 애견간식/사료",
  "생활잡화 > 패션용품 > 앞치마",
  "욕실/세탁/청소 > 세제/섬유유연제 > 세탁용세제",
  "욕실/세탁/청소 > 욕실용품 > 욕실화",
  "주방용품 > 조리기구 > 기타용품",
  "생활잡화 > 패션용품 > 기타패션잡화",
  "인테리어 > 스티커/시트지/벽지 > 다용도시트지",
  "철물/전기",
  "철물/전기 > 수도/수전 > 수도꼭지",
  "수납/정리 > 선반/진열대 > 욕실선반",
  "인테리어 > 인테리어소품 > 마블",
  "주방용품",
  "수납/정리 > 서랍장/수납함 > 데스크서랍장",
  "철물/전기 > 전기/조명 > 건전지",
  "철물/전기 > 전기/조명 > 멀티탭/스위치/콘센트",
  "여가/건강 > 애완용품 > 애견위생용품",
  "인테리어 > 매트/카페트 > 카페트",
  "주방용품 > 조리기구 > 찜기/곰솥/들통",
  "주방용품 > 조리도구 > 거품기/집게",
  "주방용품 > 조리기구 > 주전자",
  "생활잡화 > 기타생활용품 > 열쇠고리",
  "디지털/가전 > 주방가전 > 쿠커/그릴/팬",
  "수납/정리 > 서랍장/수납함",
  "인테리어 > 커튼/블라인드 > 블라인드/롤스크린",
  "수납/정리 > 리빙박스/바구니 > 패브릭정리함",
  "생활잡화 > 기타생활용품 > 저금통",
  "철물/전기 > 전기/조명 > 기타용품",
  "인테리어 > 거울/시계/액자 > 벽걸이/전신거울",
  "주방용품 > 조리도구",
  "주방용품 > 보관/밀폐용기",
  "욕실/세탁/청소 > 제습/방향/탈취",
  "수납/정리",
  "여가/건강 > 스포츠/레저 > 바비큐/버너",
  "주방용품 > 보관/밀폐용기 > 김치통",
  "욕실/세탁/청소 > 청소용품",
  "주방용품 > 식기/생활자기",
  "수납/정리 > 선반/진열대 > 메탈랙",
  "디지털/가전",
  "욕실/세탁/청소 > 욕실용품",
];

/**
 * 문자열을 slug로 변환
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * 문자열을 code로 변환
 */
function generateCode(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * 카테고리 경로 파싱 및 구조화
 */
function parseCategoryPaths(paths) {
  const categoryMap = new Map(); // "대>중>소" 형태의 키로 카테고리 정보 저장
  
  // 모든 경로를 파싱하여 카테고리 정보 수집
  for (const path of paths) {
    const parts = path.split('>').map(p => p.trim()).filter(p => p);
    
    if (parts.length === 0) continue;
    
    // 각 레벨별로 카테고리 생성
    for (let i = 0; i < parts.length; i++) {
      const level = i + 1;
      const name = parts[i];
      const pathKey = parts.slice(0, i + 1).join('>');
      
      // 이미 존재하는 경우 건너뛰기
      if (categoryMap.has(pathKey)) continue;
      
      // 부모 경로 키
      const parentPathKey = i > 0 ? parts.slice(0, i).join('>') : null;
      
      categoryMap.set(pathKey, {
        name,
        level,
        parentPathKey,
        pathKey,
        slug: generateSlug(name),
        code: generateCode(name),
        order: 0,
        isLeaf: level === 3, // 소분류만 isLeaf=true
      });
    }
  }
  
  return categoryMap;
}

/**
 * 카테고리 생성 또는 업데이트 (upsert)
 */
async function upsertCategory(categoryData, parentCategory) {
  const filter = { code: categoryData.code };
  
  // 업데이트할 데이터 준비
  const updateData = {
    name: categoryData.name,
    slug: categoryData.slug,
    code: categoryData.code,
    level: categoryData.level,
    parentId: parentCategory ? parentCategory._id : null,
    isLeaf: categoryData.isLeaf,
    isActive: true,
  };
  
  // pathIds와 pathNames 계산
  const pathIds = [];
  const pathNames = [];
  
  if (parentCategory) {
    // 부모의 pathIds와 pathNames에 부모 자신을 추가
    pathIds.push(...(parentCategory.pathIds || []));
    pathIds.push(parentCategory._id);
    pathNames.push(...(parentCategory.pathNames || []));
    pathNames.push(parentCategory.name);
  }
  
  updateData.pathIds = pathIds;
  updateData.pathNames = pathNames;
  
  const options = { 
    upsert: true, 
    new: true, 
    setDefaultsOnInsert: true,
    runValidators: true 
  };
  
  const category = await Category.findOneAndUpdate(
    filter,
    { $set: updateData },
    options
  );
  
  return category;
}

/**
 * 마이그레이션 실행
 */
async function migrateCategories() {
  try {
    console.log('데이터베이스 연결 시도 중...');
    await mongoose.connect(mongoUri);
    console.log('✓ 데이터베이스 연결 성공\n');
    
    // 인덱스 생성 보장
    await Category.ensureIndexes();
    console.log('✓ 인덱스 확인 완료\n');
    
    // CATEGORY_PATHS 검증
    if (!CATEGORY_PATHS || CATEGORY_PATHS.length === 0) {
      console.error('✗ CATEGORY_PATHS 배열이 비어있습니다. 스크립트 상단의 CATEGORY_PATHS 배열을 채워주세요.');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`총 ${CATEGORY_PATHS.length}개의 카테고리 경로를 처리합니다.\n`);
    
    // 카테고리 경로 파싱
    const categoryMap = parseCategoryPaths(CATEGORY_PATHS);
    console.log(`파싱된 카테고리 개수: ${categoryMap.size}개\n`);
    
    // 레벨별로 정렬하여 처리 (대분류 → 중분류 → 소분류)
    const categoriesByLevel = {
      1: [],
      2: [],
      3: [],
    };
    
    for (const [pathKey, categoryData] of categoryMap) {
      categoriesByLevel[categoryData.level].push({ pathKey, ...categoryData });
    }
    
    // 레벨별 카테고리 개수 출력
    console.log(`대분류(level=1): ${categoriesByLevel[1].length}개`);
    console.log(`중분류(level=2): ${categoriesByLevel[2].length}개`);
    console.log(`소분류(level=3): ${categoriesByLevel[3].length}개\n`);
    
    const createdCategories = new Map(); // pathKey → Category 객체 매핑
    let createdCount = 0;
    let updatedCount = 0;
    
    // 레벨별로 순차 처리
    for (const level of [1, 2, 3]) {
      const categories = categoriesByLevel[level];
      console.log(`\n=== Level ${level} 처리 시작 ===`);
      
      for (const categoryData of categories) {
        try {
          // 부모 카테고리 찾기
          const parentCategory = categoryData.parentPathKey 
            ? createdCategories.get(categoryData.parentPathKey) 
            : null;
          
          if (categoryData.parentPathKey && !parentCategory) {
            console.error(`✗ 부모 카테고리를 찾을 수 없습니다: ${categoryData.parentPathKey} (${categoryData.name})`);
            continue;
          }
          
          // 카테고리 존재 여부 확인
          const existing = await Category.findOne({ code: categoryData.code });
          const isNew = !existing;
          
          // 카테고리 생성 또는 업데이트
          const category = await upsertCategory(categoryData, parentCategory);
          createdCategories.set(categoryData.pathKey, category);
          
          if (isNew) {
            createdCount++;
            console.log(`✓ 생성 [Level ${level}]: ${category.name} (code: ${category.code})`);
          } else {
            updatedCount++;
            console.log(`✓ 업데이트 [Level ${level}]: ${category.name} (code: ${category.code})`);
          }
          
          // 검증: pathIds와 pathNames 확인
          if (level === 3 && category.pathIds.length !== 2) {
            console.warn(`  ⚠️  소분류의 pathIds 길이가 예상과 다릅니다: ${category.pathIds.length} (예상: 2)`);
          }
          if (level === 2 && category.pathIds.length !== 1) {
            console.warn(`  ⚠️  중분류의 pathIds 길이가 예상과 다릅니다: ${category.pathIds.length} (예상: 1)`);
          }
          if (level === 1 && category.pathIds.length !== 0) {
            console.warn(`  ⚠️  대분류의 pathIds 길이가 예상과 다릅니다: ${category.pathIds.length} (예상: 0)`);
          }
          
        } catch (error) {
          console.error(`✗ 카테고리 처리 실패 [Level ${level}]: ${categoryData.name}`, error.message);
          if (error.code === 11000) {
            console.error(`  중복된 code 또는 slug: ${categoryData.code}`);
          }
        }
      }
    }
    
    // isLeaf 재확인 및 업데이트
    console.log('\n=== isLeaf 필드 검증 및 업데이트 ===');
    let leafUpdatedCount = 0;
    
    for (const level of [1, 2, 3]) {
      const categories = categoriesByLevel[level];
      for (const categoryData of categories) {
        const category = createdCategories.get(categoryData.pathKey);
        if (!category) continue;
        
        // level 3인 경우는 무조건 isLeaf=true
        // level 1, 2인 경우는 자식이 있는지 확인
        if (level === 3) {
          if (!category.isLeaf) {
            await Category.findByIdAndUpdate(category._id, { $set: { isLeaf: true } });
            leafUpdatedCount++;
            console.log(`✓ isLeaf 업데이트: ${category.name} (true로 설정)`);
          }
        } else {
          // 자식 카테고리 확인
          const childCount = await Category.countDocuments({ 
            parentId: category._id, 
            isActive: true 
          });
          const shouldBeLeaf = childCount === 0;
          
          if (category.isLeaf !== shouldBeLeaf) {
            await Category.findByIdAndUpdate(category._id, { $set: { isLeaf: shouldBeLeaf } });
            leafUpdatedCount++;
            console.log(`✓ isLeaf 업데이트: ${category.name} (${shouldBeLeaf})`);
          }
        }
      }
    }
    
    // 최종 통계
    console.log('\n=== 마이그레이션 완료 ===');
    console.log(`생성: ${createdCount}개`);
    console.log(`업데이트: ${updatedCount}개`);
    console.log(`isLeaf 업데이트: ${leafUpdatedCount}개`);
    console.log(`총 처리: ${categoryMap.size}개`);
    
    // 레벨별 최종 개수
    const level1Count = await Category.countDocuments({ level: 1, isActive: true });
    const level2Count = await Category.countDocuments({ level: 2, isActive: true });
    const level3Count = await Category.countDocuments({ level: 3, isActive: true });
    const leafCount = await Category.countDocuments({ isLeaf: true, isActive: true });
    
    console.log('\n=== 최종 통계 ===');
    console.log(`대분류(level=1): ${level1Count}개`);
    console.log(`중분류(level=2): ${level2Count}개`);
    console.log(`소분류(level=3): ${level3Count}개`);
    console.log(`리프 노드(isLeaf=true): ${leafCount}개`);
    
    // 연결 종료
    await mongoose.disconnect();
    console.log('\n✓ 데이터베이스 연결 종료');
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ 마이그레이션 중 오류 발생:');
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    
    // 연결 종료 시도
    try {
      await mongoose.disconnect();
    } catch (closeError) {
      // 무시
    }
    
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateCategories();
}

module.exports = { migrateCategories };

