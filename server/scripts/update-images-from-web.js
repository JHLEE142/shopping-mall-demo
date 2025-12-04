const mongoose = require('mongoose');
const Product = require('../src/models/product');
const axios = require('axios');
require('dotenv').config();

// 각 상품에 맞는 이미지 검색 키워드
const productImageKeywords = {
  'DAUB 여성 멜빵 팬츠 BLACK': 'black overalls pants women fashion',
  '라스텔지아 보쉬 BOSH Black': 'black sunglasses polarized',
  '공용 보아 리버시블 점퍼': 'reversible fleece jacket',
  'HIDE BALL CAP (CHARCOAL)': 'charcoal baseball cap',
  '발로 그로시 숏패딩 2color': 'glossy short padding jacket',
  '꼼데가르송 하트 패치 울 가디건': 'wool cardigan heart patch',
  '맥포스 코브라 벨트': 'tactical cobra belt',
  '옐로우삭스 ALPHABET 알파벳': 'alphabet pattern socks',
  '어그 K타즈 체스트넛 1143776K-CHE': 'ugg slippers chestnut',
  '어그 W 타즈 2슬리퍼 블랙 1174471-BLK': 'ugg platform slippers black',
  '쉐입오브디오션 MS Pearl gloss ring': 'silver ring pearl gloss',
  '레츠고 나일론 캠프캡 스위밍': 'nylon camp cap swimming',
  '1st. ECWCS Parka Smoky Brown': 'military parka jacket brown',
  '뉴베리니팅 사슴가죽 글로밋장갑 - 차콜': 'deerskin convertible gloves charcoal',
  'N-SNOW/COCOA': 'fur lined boots brown',
  'TIC TACC-307 (p)/BLACK': 'black sneakers low top',
  'Grandma Fairisle Sweater Navy': 'fairisle sweater navy blue',
  '와이드 데님팬츠 light blue': 'wide leg denim pants light blue',
  '안느백 (Anne Bag)': 'quilted shoulder bag beige',
  '아미 남여공용 스몰 하트 로고 패치 후드티셔츠': 'hoodie small heart logo patch'
};

// 각 상품에 맞는 실제 이미지 URL
// 무료 이미지 사이트나 placeholder 이미지 사용
const productImageUrls = {
  'DAUB 여성 멜빵 팬츠 BLACK': 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=600&fit=crop',
  '라스텔지아 보쉬 BOSH Black': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
  '공용 보아 리버시블 점퍼': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
  'HIDE BALL CAP (CHARCOAL)': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=600&fit=crop',
  '발로 그로시 숏패딩 2color': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
  '꼼데가르송 하트 패치 울 가디건': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=600&fit=crop',
  '맥포스 코브라 벨트': 'https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=600&h=600&fit=crop',
  '옐로우삭스 ALPHABET 알파벳': 'https://images.unsplash.com/photo-1586350977772-b4af58d37fd7?w=600&h=600&fit=crop',
  '어그 K타즈 체스트넛 1143776K-CHE': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  '어그 W 타즈 2슬리퍼 블랙 1174471-BLK': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  '쉐입오브디오션 MS Pearl gloss ring': 'https://images.unsplash.com/photo-1603561596112-7a132f3e4757?w=600&h=600&fit=crop',
  '레츠고 나일론 캠프캡 스위밍': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=600&fit=crop',
  '1st. ECWCS Parka Smoky Brown': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
  '뉴베리니팅 사슴가죽 글로밋장갑 - 차콜': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop',
  'N-SNOW/COCOA': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=600&fit=crop',
  'TIC TACC-307 (p)/BLACK': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  'Grandma Fairisle Sweater Navy': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=600&fit=crop',
  '와이드 데님팬츠 light blue': 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=600&fit=crop',
  '안느백 (Anne Bag)': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
  '아미 남여공용 스몰 하트 로고 패치 후드티셔츠': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop'
};

// 이미지 URL 가져오기
function getImageUrl(productName) {
  return productImageUrls[productName] || null;
}

// 상품 이미지 업데이트
async function updateProductImagesFromWeb() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const products = await Product.find().lean();
    console.log(`Found ${products.length} products to update\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      console.log(`🔍 Getting image for: ${product.name}`);
      
      // 미리 준비된 이미지 URL 사용
      const finalImageUrl = getImageUrl(product.name);
      
      if (!finalImageUrl) {
        console.log(`⏭️  No image URL for: ${product.name}`);
        skippedCount++;
        continue;
      }
      
      if (finalImageUrl) {
        try {
          await Product.findByIdAndUpdate(product._id, { image: finalImageUrl });
          console.log(`✅ Updated: ${product.name}`);
          console.log(`   Image URL: ${finalImageUrl}\n`);
          updatedCount++;
          
          // 요청 간 딜레이 (서버 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Error updating ${product.name}:`, error.message);
        }
      } else {
        console.log(`⚠️  No image found for: ${product.name}\n`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    
    if (updatedCount > 0) {
      console.log(`\n✅ ${updatedCount}개 상품 이미지가 업데이트되었습니다!`);
      console.log(`   이미지는 Unsplash Source API를 통해 제공됩니다.`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateProductImagesFromWeb();

