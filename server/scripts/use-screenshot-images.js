const mongoose = require('mongoose');
const Product = require('../src/models/product');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 스크린샷 이미지를 상품 이미지로 사용하는 방법
// 사용자가 스크린샷 이미지 파일을 제공하면 그대로 사용

// 상품명과 이미지 파일명 매핑
// 사용자가 이미지 파일을 특정 폴더에 저장하고 파일명을 매핑
const productImageFileMap = {
  'DAUB 여성 멜빵 팬츠 BLACK': 'screenshot-1.jpg',
  '라스텔지아 보쉬 BOSH Black': 'screenshot-2.jpg',
  '공용 보아 리버시블 점퍼': 'screenshot-3.jpg',
  'HIDE BALL CAP (CHARCOAL)': 'screenshot-4.jpg',
  '발로 그로시 숏패딩 2color': 'screenshot-5.jpg',
  '꼼데가르송 하트 패치 울 가디건': 'screenshot-6.jpg',
  '맥포스 코브라 벨트': 'screenshot-7.jpg',
  '옐로우삭스 ALPHABET 알파벳': 'screenshot-8.jpg',
  '어그 K타즈 체스트넛 1143776K-CHE': 'screenshot-9.jpg',
  '어그 W 타즈 2슬리퍼 블랙 1174471-BLK': 'screenshot-10.jpg',
  '쉐입오브디오션 MS Pearl gloss ring': 'screenshot-11.jpg',
  '레츠고 나일론 캠프캡 스위밍': 'screenshot-12.jpg',
  '1st. ECWCS Parka Smoky Brown': 'screenshot-13.jpg',
  '뉴베리니팅 사슴가죽 글로밋장갑 - 차콜': 'screenshot-14.jpg',
  'N-SNOW/COCOA': 'screenshot-15.jpg',
  'TIC TACC-307 (p)/BLACK': 'screenshot-16.jpg',
  'Grandma Fairisle Sweater Navy': 'screenshot-17.jpg',
  '와이드 데님팬츠 light blue': 'screenshot-18.jpg',
  '안느백 (Anne Bag)': 'screenshot-19.jpg',
  '아미 남여공용 스몰 하트 로고 패치 후드티셔츠': 'screenshot-20.jpg'
};

// 이미지 파일을 base64로 변환하거나
// 이미지 호스팅 서비스에 업로드한 URL 사용
// 또는 로컬 파일 경로를 사용 (개발 환경에서만)

async function updateProductImages() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    console.log('📝 스크린샷 이미지를 상품 이미지로 사용하는 방법:\n');
    console.log('1. 스크린샷 이미지 파일을 server/images/ 폴더에 저장하세요');
    console.log('2. 파일명을 screenshot-1.jpg, screenshot-2.jpg ... 형식으로 저장하세요');
    console.log('3. 또는 이미지 호스팅 서비스(Cloudinary, Imgur 등)에 업로드한 URL을 사용하세요\n');
    
    console.log('현재 등록된 상품 목록:');
    const products = await Product.find().lean();
    products.forEach((p, i) => {
      const fileName = productImageFileMap[p.name] || 'N/A';
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   예상 파일명: ${fileName}`);
      console.log(`   현재 이미지: ${p.image}\n`);
    });
    
    // 이미지 파일이 있는 경우 업데이트 시도
    const imagesDir = path.join(__dirname, '..', 'images');
    if (fs.existsSync(imagesDir)) {
      console.log(`\n📁 이미지 폴더 발견: ${imagesDir}`);
      console.log('이미지 파일을 확인 중...\n');
      
      let updatedCount = 0;
      for (const product of products) {
        const fileName = productImageFileMap[product.name];
        if (fileName) {
          const filePath = path.join(imagesDir, fileName);
          if (fs.existsSync(filePath)) {
            // 로컬 파일 경로를 사용 (실제 배포 시에는 이미지 호스팅 서비스 사용 권장)
            const imageUrl = `/images/${fileName}`;
            await Product.findByIdAndUpdate(product._id, { image: imageUrl });
            console.log(`✅ Updated: ${product.name} -> ${imageUrl}`);
            updatedCount++;
          }
        }
      }
      
      if (updatedCount > 0) {
        console.log(`\n✅ ${updatedCount}개 상품 이미지가 업데이트되었습니다.`);
      } else {
        console.log('\n⚠️  이미지 파일을 찾을 수 없습니다.');
      }
    } else {
      console.log(`\n⚠️  이미지 폴더가 없습니다: ${imagesDir}`);
      console.log('폴더를 생성하고 이미지 파일을 저장하세요.');
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateProductImages();

