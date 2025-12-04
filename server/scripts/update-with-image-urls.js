const mongoose = require('mongoose');
const Product = require('../src/models/product');
require('dotenv').config();

// 스크린샷 이미지 URL을 직접 사용
// 사용자가 제공한 스크린샷 이미지 URL을 여기에 입력하세요
// 또는 이미지 호스팅 서비스에 업로드한 URL 사용

const productImageUrls = {
  // 예시: 'DAUB 여성 멜빵 팬츠 BLACK': 'https://example.com/screenshot-1.jpg',
  // 실제 이미지 URL을 여기에 입력하세요
};

async function updateProductImages() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const products = await Product.find().lean();
    console.log(`Found ${products.length} products\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const imageUrl = productImageUrls[product.name];
      
      if (imageUrl) {
        try {
          await Product.findByIdAndUpdate(product._id, { image: imageUrl });
          console.log(`✅ Updated: ${product.name}`);
          console.log(`   Image URL: ${imageUrl}\n`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Error updating ${product.name}:`, error.message);
        }
      } else {
        console.log(`⏭️  No image URL for: ${product.name}`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    
    if (updatedCount === 0) {
      console.log('\n💡 이미지 URL을 추가하려면:');
      console.log('   productImageUrls 객체에 상품명과 이미지 URL을 추가하세요.');
      console.log('   예: "DAUB 여성 멜빵 팬츠 BLACK": "https://example.com/image.jpg"');
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

