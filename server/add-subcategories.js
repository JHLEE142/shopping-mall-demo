require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/category');

// 대분류별 중분류/소분류 데이터
const categoryData = {
  '의류': {
    midCategories: {
      '상의': ['티셔츠', '셔츠', '블라우스', '후드티', '맨투맨'],
      '하의': ['청바지', '슬랙스', '반바지', '치마', '레깅스'],
      '아우터': ['자켓', '코트', '패딩', '가디건', '후드집업'],
      '신발': ['운동화', '구두', '부츠', '샌들', '슬리퍼']
    }
  },
  '주방용품': {
    midCategories: {
      '조리도구': ['건지기/망', '냄비/솥', '프라이팬', '주전자', '칼/도마'],
      '식기': ['접시', '그릇', '컵/머그', '수저', '젓가락'],
      '보관용품': ['밀폐용기', '보관병', '랩/호일', '비닐봉지', '보관박스']
    }
  },
  '가전제품': {
    midCategories: {
      '주방가전': ['전자레인지', '에어프라이어', '믹서기', '토스터', '커피머신'],
      '생활가전': ['청소기', '선풍기', '가습기', '공기청정기', '다리미'],
      '냉장/냉동': ['냉장고', '냉동고', '김치냉장고', '와인셀러']
    }
  },
  '가구': {
    midCategories: {
      '침실가구': ['침대', '매트리스', '옷장', '화장대', '협탁'],
      '거실가구': ['소파', '테이블', 'TV장', '책장', '의자'],
      '주방가구': ['식탁', '의자', '수납장', '선반', '카운터']
    }
  },
  '전자제품': {
    midCategories: {
      '스마트폰': ['아이폰', '갤럭시', '기타 스마트폰', '액세서리'],
      '태블릿': ['아이패드', '갤럭시탭', '기타 태블릿'],
      '노트북': ['맥북', '윈도우 노트북', '크롬북', '액세서리']
    }
  },
  '화장품': {
    midCategories: {
      '스킨케어': ['토너', '에센스', '크림', '세럼', '마스크팩'],
      '메이크업': ['파운데이션', '립스틱', '아이섀도', '마스카라', '파우더'],
      '향수': ['여성향수', '남성향수', '바디미스트']
    }
  },
  '식품': {
    midCategories: {
      '과일/채소': ['과일', '채소', '냉동과일', '건조과일'],
      '육류/해산물': ['소고기', '돼지고기', '닭고기', '생선', '해산물'],
      '유제품': ['우유', '요구르트', '치즈', '버터', '아이스크림']
    }
  },
  '스포츠': {
    midCategories: {
      '운동용품': ['덤벨', '요가매트', '운동복', '운동화', '물병'],
      '야구': ['야구공', '야구배트', '글러브', '야구모자'],
      '축구': ['축구공', '축구화', '유니폼', '축구양말']
    }
  },
  '도서': {
    midCategories: {
      '소설': ['한국소설', '외국소설', '추리소설', '판타지소설'],
      '에세이': ['에세이', '시집', '수필'],
      '자기계발': ['자기계발서', '경영서', '인문학']
    }
  },
  '완구': {
    midCategories: {
      '인형': ['인형', '곰인형', '캐릭터인형'],
      '블록': ['레고', '블록', '퍼즐'],
      '보드게임': ['보드게임', '카드게임', '퍼즐게임']
    }
  },
  '반려동물용품': {
    midCategories: {
      '강아지용품': ['사료', '간식', '장난감', '목줄', '하우스'],
      '고양이용품': ['사료', '간식', '장난감', '캣타워', '화장실'],
      '기타용품': ['이동장', '의류', '미용용품']
    }
  },
  '건강용품': {
    midCategories: {
      '보조제': ['비타민', '오메가3', '프로틴', '콜라겐'],
      '운동용품': ['마사지기', '저항밴드', '요가매트', '폼롤러'],
      '측정기기': ['체중계', '혈압계', '혈당계']
    }
  },
  '문구/사무용품': {
    midCategories: {
      '필기구': ['펜', '연필', '마커', '형광펜'],
      '노트/다이어리': ['노트', '다이어리', '플래너', '스케줄러'],
      '파일/바인더': ['파일', '바인더', '클리어파일', '서류함']
    }
  },
  '악세서리': {
    midCategories: {
      '시계': ['손목시계', '벽시계', '알람시계'],
      '가방': ['백팩', '토트백', '크로스백', '지갑'],
      '모자': ['볼캡', '버킷햇', '비니', '야구모자']
    }
  },
  '홈데코': {
    midCategories: {
      '조명': ['스탠드', '펜던트', '무드등', 'LED조명'],
      '커튼': ['커튼', '블라인드', '롤스크린'],
      '인테리어소품': ['액자', '화분', '디퓨저', '캔들']
    }
  },
  '자동차용품': {
    midCategories: {
      '세차용품': ['세차용품', '왁스', '스펀지', '타월'],
      '내부용품': ['시트커버', '핸들커버', '매트', '방향제'],
      '안전용품': ['비상키트', '삼각대', '경고등', '안전벨트']
    }
  }
};

async function addSubCategories() {
  try {
    const uri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB\n');

    // 모든 대분류 조회
    const mainCategories = await Category.find({ 
      $or: [
        { level: 1 },
        { level: { $exists: false }, parentId: null }
      ],
      isActive: { $ne: false }
    }).lean();

    console.log(`대분류 ${mainCategories.length}개 발견\n`);

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const mainCat of mainCategories) {
      const mainName = mainCat.name;
      const mainData = categoryData[mainName];

      if (!mainData) {
        console.log(`⚠️  "${mainName}"에 대한 중분류/소분류 데이터가 없습니다.`);
        continue;
      }

      console.log(`\n📁 ${mainName} 처리 중...`);

      for (const [midName, subNames] of Object.entries(mainData.midCategories)) {
        // 중분류 생성 또는 조회
        const midCode = `${mainCat.code || mainName.toLowerCase().replace(/\s+/g, '-')}-${midName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '')}`;
        
        let midCategory = await Category.findOne({ code: midCode });
        
        if (!midCategory) {
          try {
            midCategory = await Category.create({
              name: midName,
              slug: midCode,
              code: midCode,
              level: 2,
              parentId: mainCat._id,
              order: 0
            });
            results.created.push({ level: 2, name: midName, parent: mainName });
            console.log(`  ✅ 중분류 "${midName}" 생성`);
          } catch (error) {
            results.errors.push({ error: `중분류 "${midName}" 생성 실패: ${error.message}` });
            console.log(`  ❌ 중분류 "${midName}" 생성 실패: ${error.message}`);
            continue;
          }
        } else {
          console.log(`  ⏭️  중분류 "${midName}" 이미 존재`);
        }

        // 소분류 생성
        for (const subName of subNames) {
          const subCode = `${midCategory.code}-${subName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-가-힣]/g, '')}`;
          
          const existingSub = await Category.findOne({ code: subCode });
          
          if (!existingSub) {
            try {
              await Category.create({
                name: subName,
                slug: subCode,
                code: subCode,
                level: 3,
                parentId: midCategory._id,
                order: 0
              });
              results.created.push({ level: 3, name: subName, parent: midName });
              console.log(`    ✅ 소분류 "${subName}" 생성`);
            } catch (error) {
              results.errors.push({ error: `소분류 "${subName}" 생성 실패: ${error.message}` });
              console.log(`    ❌ 소분류 "${subName}" 생성 실패: ${error.message}`);
            }
          } else {
            console.log(`    ⏭️  소분류 "${subName}" 이미 존재`);
          }
        }
      }
    }

    console.log('\n\n=== 결과 요약 ===');
    console.log(`생성된 카테고리: ${results.created.length}개`);
    console.log(`에러: ${results.errors.length}개`);
    
    if (results.errors.length > 0) {
      console.log('\n에러 목록:');
      results.errors.forEach(err => console.log(`  - ${err.error}`));
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

addSubCategories();

