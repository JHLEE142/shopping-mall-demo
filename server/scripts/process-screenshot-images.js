const mongoose = require('mongoose');
const Product = require('../src/models/product');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 상품명과 이미지 파일명 매핑
// 사용자가 server/images/ 폴더에 저장한 이미지 파일명
const productImageFileMap = {
  'DAUB 여성 멜빵 팬츠 BLACK': ['screenshot-1', '1', 'dau', '멜빵'],
  '라스텔지아 보쉬 BOSH Black': ['screenshot-2', '2', 'las', '보쉬', '선글라스'],
  '공용 보아 리버시블 점퍼': ['screenshot-3', '3', '보아', '리버시블', '점퍼'],
  'HIDE BALL CAP (CHARCOAL)': ['screenshot-4', '4', 'hide', 'ball', 'cap'],
  '발로 그로시 숏패딩 2color': ['screenshot-5', '5', '발로', '그로시', '숏패딩'],
  '꼼데가르송 하트 패치 울 가디건': ['screenshot-6', '6', '꼼데', '가디건'],
  '맥포스 코브라 벨트': ['screenshot-7', '7', '맥포스', '코브라', '벨트'],
  '옐로우삭스 ALPHABET 알파벳': ['screenshot-8', '8', '옐로우', '삭스', '양말'],
  '어그 K타즈 체스트넛 1143776K-CHE': ['screenshot-9', '9', '어그', 'k타즈'],
  '어그 W 타즈 2슬리퍼 블랙 1174471-BLK': ['screenshot-10', '10', '어그', 'w타즈'],
  '쉐입오브디오션 MS Pearl gloss ring': ['screenshot-11', '11', '쉐입', 'ring', '반지'],
  '레츠고 나일론 캠프캡 스위밍': ['screenshot-12', '12', '레츠고', '캠프캡'],
  '1st. ECWCS Parka Smoky Brown': ['screenshot-13', '13', 'ecwcs', 'parka'],
  '뉴베리니팅 사슴가죽 글로밋장갑 - 차콜': ['screenshot-14', '14', '뉴베리', '장갑'],
  'N-SNOW/COCOA': ['screenshot-15', '15', 'n-snow', 'cocoa'],
  'TIC TACC-307 (p)/BLACK': ['screenshot-16', '16', 'tic', 'tacc'],
  'Grandma Fairisle Sweater Navy': ['screenshot-17', '17', 'grandma', 'fairisle'],
  '와이드 데님팬츠 light blue': ['screenshot-18', '18', '와이드', '데님'],
  '안느백 (Anne Bag)': ['screenshot-19', '19', '안느', '백', '가방'],
  '아미 남여공용 스몰 하트 로고 패치 후드티셔츠': ['screenshot-20', '20', '아미', '후드']
};

// 이미지 파일 확장자
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 파일명에서 상품 찾기
function findProductForFile(fileName) {
  const lowerFileName = fileName.toLowerCase();
  
  for (const [productName, keywords] of Object.entries(productImageFileMap)) {
    for (const keyword of keywords) {
      if (lowerFileName.includes(keyword.toLowerCase())) {
        return productName;
      }
    }
  }
  
  return null;
}

// 이미지 파일을 public 폴더로 복사하고 URL 반환
async function processImageFile(filePath, fileName) {
  try {
    // client/public/images/ 폴더에 복사 (프론트엔드에서 접근 가능)
    const publicImagesDir = path.join(__dirname, '..', '..', 'client', 'public', 'images');
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    
    const destPath = path.join(publicImagesDir, fileName);
    fs.copyFileSync(filePath, destPath);
    
    // URL 반환 (프론트엔드에서 접근 가능한 경로)
    return `/images/${fileName}`;
  } catch (error) {
    console.error(`Error processing image ${fileName}:`, error.message);
    return null;
  }
}

// 상품 이미지 업데이트
async function processScreenshotImages() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const imagesDir = path.join(__dirname, '..', 'images');
    
    if (!fs.existsSync(imagesDir)) {
      console.log(`⚠️  이미지 폴더가 없습니다: ${imagesDir}`);
      console.log('폴더를 생성합니다...\n');
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    console.log(`📁 이미지 폴더: ${imagesDir}`);
    console.log('이미지 파일을 확인 중...\n');

    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('⚠️  이미지 파일을 찾을 수 없습니다.');
      console.log(`\n💡 사용 방법:`);
      console.log(`   1. 스크린샷 이미지 파일을 ${imagesDir} 폴더에 저장하세요`);
      console.log(`   2. 파일명에 상품 키워드를 포함하세요 (예: screenshot-1.jpg, 멜빵.jpg, dau.jpg 등)`);
      console.log(`   3. 이 스크립트를 다시 실행하세요\n`);
      
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`📸 발견된 이미지 파일: ${imageFiles.length}개\n`);

    const products = await Product.find().lean();
    let updatedCount = 0;
    let skippedCount = 0;
    const processedFiles = new Set();

    // 각 이미지 파일 처리
    for (const imageFile of imageFiles) {
      const filePath = path.join(imagesDir, imageFile);
      const productName = findProductForFile(imageFile);
      
      if (!productName) {
        console.log(`⏭️  매칭되는 상품을 찾을 수 없음: ${imageFile}`);
        continue;
      }

      const product = products.find(p => p.name === productName);
      if (!product) {
        console.log(`⚠️  상품을 찾을 수 없음: ${productName}`);
        continue;
      }

      // 이미지 파일 처리 및 URL 생성
      const imageUrl = await processImageFile(filePath, imageFile);
      
      if (imageUrl) {
        try {
          await Product.findByIdAndUpdate(product._id, { image: imageUrl });
          console.log(`✅ Updated: ${productName}`);
          console.log(`   파일: ${imageFile}`);
          console.log(`   URL: ${imageUrl}\n`);
          updatedCount++;
          processedFiles.add(imageFile);
        } catch (error) {
          console.error(`❌ Error updating ${productName}:`, error.message);
        }
      }
    }

    // 업데이트되지 않은 상품 확인
    console.log('\n📋 업데이트되지 않은 상품:');
    for (const product of products) {
      const productName = productImageFileMap[product.name];
      if (productName && !processedFiles.has(product.name)) {
        const keywords = productImageFileMap[product.name].slice(0, 3).join(', ');
        console.log(`   - ${product.name} (키워드: ${keywords})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${imageFiles.length - updatedCount}`);
    
    if (updatedCount > 0) {
      console.log(`\n✅ ${updatedCount}개 상품 이미지가 업데이트되었습니다!`);
      console.log(`   이미지 URL 형식: /images/filename.jpg`);
      console.log(`   프론트엔드에서 접근 가능합니다.`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

processScreenshotImages();

