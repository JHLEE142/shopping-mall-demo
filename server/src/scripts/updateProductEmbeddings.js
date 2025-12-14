/**
 * 기존 상품들의 phoneme_name과 embedding을 생성하는 스크립트
 * 
 * 사용법:
 * node src/scripts/updateProductEmbeddings.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { connectToDatabase } = require('../config/database');
const Product = require('../models/product');
const { convertToPhoneme, convertEnglishToPhoneme, isKorean } = require('../utils/phonemeConverter');
const { getEmbedding } = require('../utils/embeddingService');

async function updateProductEmbeddings() {
  try {
    // DB 연결
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    await connectToDatabase(mongoUri);
    console.log('Connected to database');

    // 모든 상품 조회
    const products = await Product.find({});
    console.log(`Found ${products.length} products to process`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        console.log(`Processing ${i + 1}/${products.length}: ${product.name}`);

        // Phoneme 변환
        let phonemeName = '';
        if (isKorean(product.name)) {
          phonemeName = convertToPhoneme(product.name);
        } else {
          phonemeName = convertEnglishToPhoneme(product.name);
        }

        // Embedding 생성
        const embedding = await getEmbedding(product.name);

        // 상품 업데이트
        await Product.findByIdAndUpdate(product._id, {
          $set: {
            phoneme_name: phonemeName,
            embedding: embedding,
          },
        });

        successCount++;
        console.log(`✓ Updated: ${product.name}`);

        // API rate limit 방지를 위한 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`✗ Error processing ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('Done!');
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateProductEmbeddings();

