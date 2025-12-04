const mongoose = require('mongoose');
const Product = require('../src/models/product');
require('dotenv').config();

// 카테고리 매핑 함수
function mapCategory(breadcrumbs, productName) {
  const lower = breadcrumbs.toLowerCase();
  const nameLower = productName.toLowerCase();
  
  if (lower.includes('신발') || lower.includes('부츠') || lower.includes('스니커즈') || lower.includes('슬리퍼')) {
    return '신발';
  }
  if (lower.includes('아우터') || lower.includes('점퍼') || lower.includes('패딩') || lower.includes('자켓')) {
    return '아우터';
  }
  if (lower.includes('하의') || lower.includes('바지') || lower.includes('팬츠') || lower.includes('데님')) {
    return '하의';
  }
  if (lower.includes('상의') || lower.includes('니트') || lower.includes('가디건') || lower.includes('후드') || lower.includes('스웨터')) {
    return '상의';
  }
  if (lower.includes('악세사리') || lower.includes('모자') || lower.includes('선글라스') || lower.includes('벨트') || lower.includes('양말') || lower.includes('장갑') || lower.includes('반지') || lower.includes('쥬얼리') || lower.includes('가방')) {
    return '악세사리';
  }
  return '기타';
}

// SKU 생성 함수
function generateSKU(productName, index) {
  const prefix = productName
    .replace(/[^a-zA-Z0-9가-힣]/g, '')
    .substring(0, 3)
    .toUpperCase();
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

// 상품 데이터
const products = [
  {
    name: 'DAUB 여성 멜빵 팬츠 BLACK',
    price: 29900,
    category: '하의',
    description: 'DAUB 여성 멜빵 팬츠 BLACK. 와이드 핏의 멜빵 팬츠입니다.',
    image: 'https://via.placeholder.com/600x600?text=DAUB+멜빵팬츠',
    sku: 'DAU-001'
  },
  {
    name: '라스텔지아 보쉬 BOSH Black',
    price: 150000,
    category: '악세사리',
    description: '라스텔지아(Last Nostalgia) 보쉬 BOSH Black 선글라스. Polarized UV-400 PROTECTION 기능이 있는 선글라스입니다.',
    image: 'https://via.placeholder.com/600x600?text=라스텔지아+선글라스',
    sku: 'LAS-002'
  },
  {
    name: '공용 보아 리버시블 점퍼',
    price: 31800,
    category: '아우터',
    description: '잠뱅이 공용 보아 리버시블 점퍼. 리버시블 디자인으로 양면 착용이 가능한 점퍼입니다.',
    image: 'https://via.placeholder.com/600x600?text=보아+리버시블+점퍼',
    sku: 'JAM-003'
  },
  {
    name: 'HIDE BALL CAP (CHARCOAL)',
    price: 38700,
    category: '악세사리',
    description: '히든비하인드 HIDE BALL CAP CHARCOAL. 차콜 컬러의 볼캡입니다.',
    image: 'https://via.placeholder.com/600x600?text=HIDE+BALL+CAP',
    sku: 'HID-004'
  },
  {
    name: '발로 그로시 숏패딩 2color',
    price: 79200,
    category: '아우터',
    description: '발로 그로시 숏패딩 2color. 그로시 소재의 숏 패딩으로 2가지 컬러로 제공됩니다.',
    image: 'https://via.placeholder.com/600x600?text=발로+그로시+숏패딩',
    sku: 'BAL-005'
  },
  {
    name: '꼼데가르송 하트 패치 울 가디건',
    price: 149000,
    category: '상의',
    description: '꼼데가르송 하트 패치 울 가디건. 울 소재의 가디건으로 하트 패치가 특징입니다.',
    image: 'https://via.placeholder.com/600x600?text=꼼데가르송+가디건',
    sku: 'CDG-006'
  },
  {
    name: '맥포스 코브라 벨트',
    price: 37400,
    category: '악세사리',
    description: '맥포스 코브라 벨트. 전술용 코브라 버클이 특징인 벨트입니다.',
    image: 'https://via.placeholder.com/600x600?text=맥포스+코브라+벨트',
    sku: 'MAG-007'
  },
  {
    name: '옐로우삭스 ALPHABET 알파벳',
    price: 5200,
    category: '악세사리',
    description: '옐로우삭스 ALPHABET 알파벳 양말. 알파벳 패턴이 프린트된 롱넥 양말입니다.',
    image: 'https://via.placeholder.com/600x600?text=옐로우삭스+양말',
    sku: 'YEL-008'
  },
  {
    name: '어그 K타즈 체스트넛 1143776K-CHE',
    price: 195900,
    category: '신발',
    description: '어그 K타즈 체스트넛 1143776K-CHE. 체스트넛 컬러의 UGG 슬리퍼입니다.',
    image: 'https://via.placeholder.com/600x600?text=UGG+K타즈',
    sku: 'UGG-009'
  },
  {
    name: '어그 W 타즈 2슬리퍼 블랙 1174471-BLK',
    price: 186900,
    category: '신발',
    description: '어그 W 타즈 2슬리퍼 블랙 1174471-BLK. 블랙 컬러의 플랫폼 슬리퍼입니다.',
    image: 'https://via.placeholder.com/600x600?text=UGG+W타즈',
    sku: 'UGG-010'
  },
  {
    name: '쉐입오브디오션 MS Pearl gloss ring',
    price: 40000,
    category: '악세사리',
    description: '쉐입오브디오션 MS Pearl gloss ring. 펄 글로스 마감의 실버 링입니다.',
    image: 'https://via.placeholder.com/600x600?text=MS+Pearl+ring',
    sku: 'SHO-011'
  },
  {
    name: '레츠고 나일론 캠프캡 스위밍',
    price: 32900,
    category: '악세사리',
    description: '하이산 레츠고 나일론 캠프캡 스위밍. 수영 테마의 나일론 캠프캡입니다.',
    image: 'https://via.placeholder.com/600x600?text=레츠고+캠프캡',
    sku: 'LET-012'
  },
  {
    name: '1st. ECWCS Parka Smoky Brown',
    price: 202300,
    category: '아우터',
    description: '듀테로 1st. ECWCS Parka Smoky Brown. 스모키 브라운 컬러의 파카입니다.',
    image: 'https://via.placeholder.com/600x600?text=ECWCS+Parka',
    sku: 'ECW-013'
  },
  {
    name: '뉴베리니팅 사슴가죽 글로밋장갑 - 차콜',
    price: 63990,
    category: '악세사리',
    description: '뉴베리니팅 사슴가죽 글로밋장갑 차콜. 사슴가죽 소재의 리버시블 장갑입니다.',
    image: 'https://via.placeholder.com/600x600?text=뉴베리니팅+장갑',
    sku: 'NEW-014'
  },
  {
    name: 'N-SNOW/COCOA',
    price: 89250,
    category: '신발',
    description: 'N-SNOW/COCOA 부츠. 코코아 컬러의 퍼 라이닝 부츠입니다.',
    image: 'https://via.placeholder.com/600x600?text=N-SNOW+부츠',
    sku: 'NSN-015'
  },
  {
    name: 'TIC TACC-307 (p)/BLACK',
    price: 169000,
    category: '신발',
    description: '킨치 TIC TACC-307 (p)/BLACK 스니커즈. 블랙 컬러의 로우탑 스니커즈입니다.',
    image: 'https://via.placeholder.com/600x600?text=TIC+TACC+스니커즈',
    sku: 'TIC-016'
  },
  {
    name: 'Grandma Fairisle Sweater Navy',
    price: 58800,
    category: '상의',
    description: '암피스트 Grandma Fairisle Sweater Navy. 네이비 컬러의 페어아일 패턴 스웨터입니다.',
    image: 'https://via.placeholder.com/600x600?text=Grandma+Fairisle',
    sku: 'GRA-017'
  },
  {
    name: '와이드 데님팬츠 light blue',
    price: 26900,
    category: '하의',
    description: '페퍼시즈닝 와이드 데님팬츠 light blue. 라이트 블루 컬러의 와이드 핏 데님 팬츠입니다.',
    image: 'https://via.placeholder.com/600x600?text=와이드+데님팬츠',
    sku: 'WID-018'
  },
  {
    name: '안느백 (Anne Bag)',
    price: 269000,
    category: '악세사리',
    description: '벨류엣 안느백 (Anne Bag). 퀼팅 디자인의 숄더/토트백으로 2가지 컬러로 제공됩니다.',
    image: 'https://via.placeholder.com/600x600?text=안느백',
    sku: 'ANN-019'
  },
  {
    name: '아미 남여공용 스몰 하트 로고 패치 후드티셔츠',
    price: 68900,
    category: '상의',
    description: 'AMI paris 아미 남여공용 스몰 하트 로고 패치 후드티셔츠. 작은 하트 로고가 특징인 후드티입니다.',
    image: 'https://via.placeholder.com/600x600?text=아미+후드티',
    sku: 'AMI-020'
  }
];

async function addProducts() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let successCount = 0;
    let errorCount = 0;

    for (const productData of products) {
      try {
        // SKU가 이미 존재하는지 확인
        const existing = await Product.findOne({ sku: productData.sku });
        if (existing) {
          console.log(`⏭️  SKU ${productData.sku} already exists, skipping: ${productData.name}`);
          continue;
        }

        const product = await Product.create(productData);
        console.log(`✅ Added: ${product.name} (${product.sku}) - ${product.price.toLocaleString()}원`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding ${productData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary: ${successCount} products added, ${errorCount} errors`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

addProducts();

