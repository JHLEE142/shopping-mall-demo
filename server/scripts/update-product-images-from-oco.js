const mongoose = require('mongoose');
const Product = require('../src/models/product');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// 상품명과 OCO 검색 키워드 매핑
const productSearchMap = {
  'DAUB 여성 멜빵 팬츠 BLACK': 'DAUB 멜빵',
  '라스텔지아 보쉬 BOSH Black': '라스텔지아 보쉬',
  '공용 보아 리버시블 점퍼': '보아 리버시블 점퍼',
  'HIDE BALL CAP (CHARCOAL)': 'HIDE BALL CAP',
  '발로 그로시 숏패딩 2color': '발로 그로시 숏패딩',
  '꼼데가르송 하트 패치 울 가디건': '꼼데가르송 가디건',
  '맥포스 코브라 벨트': '맥포스 코브라',
  '옐로우삭스 ALPHABET 알파벳': '옐로우삭스 알파벳',
  '어그 K타즈 체스트넛 1143776K-CHE': '어그 K타즈',
  '어그 W 타즈 2슬리퍼 블랙 1174471-BLK': '어그 W 타즈',
  '쉐입오브디오션 MS Pearl gloss ring': '쉐입오브디오션',
  '레츠고 나일론 캠프캡 스위밍': '레츠고 캠프캡',
  '1st. ECWCS Parka Smoky Brown': 'ECWCS Parka',
  '뉴베리니팅 사슴가죽 글로밋장갑 - 차콜': '뉴베리니팅 장갑',
  'N-SNOW/COCOA': 'N-SNOW',
  'TIC TACC-307 (p)/BLACK': 'TIC TACC',
  'Grandma Fairisle Sweater Navy': 'Grandma Fairisle',
  '와이드 데님팬츠 light blue': '와이드 데님팬츠',
  '안느백 (Anne Bag)': '안느백',
  '아미 남여공용 스몰 하트 로고 패치 후드티셔츠': '아미 후드티'
};

// OCO 쇼핑몰에서 상품 검색 및 이미지 URL 추출
async function searchProductOnOCO(searchKeyword) {
  try {
    const searchUrl = `https://www.ocokorea.com/shop/search/search.do?searchKeyword=${encodeURIComponent(searchKeyword)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.ocokorea.com/',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    // 상품 이미지 URL 추출 시도
    let imageUrl = null;
    
    // OCO 쇼핑몰의 다양한 이미지 선택자 시도
    const selectors = [
      '.item-list img',
      '.product-item img',
      '.goods-img img',
      '.prd-img img',
      '.thumb img',
      '.product-thumb img',
      'img[data-src]',
      'img[data-original]',
      '.swiper-slide img',
      '.product-image img',
      'img.product-img',
      '.item img',
      'a img',
    ];

    for (const selector of selectors) {
      const imgs = $(selector);
      if (imgs.length > 0) {
        // 첫 번째 이미지 사용
        const img = imgs.first();
        imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy');
        
        if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.includes('placeholder')) {
          // 상대 경로를 절대 경로로 변환
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://www.ocokorea.com' + imageUrl;
          }
          
          // 이미지 URL이 유효한지 확인 (http/https로 시작)
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            break;
          }
        }
        imageUrl = null;
      }
    }

    // JavaScript로 로드되는 이미지 URL 패턴 찾기
    if (!imageUrl) {
      const html = response.data;
      // 이미지 URL 패턴 찾기 (일반적인 이미지 확장자)
      const imageUrlPattern = /(https?:\/\/[^\s"']+\.(jpg|jpeg|png|gif|webp)(\?[^\s"']*)?)/gi;
      const matches = html.match(imageUrlPattern);
      if (matches && matches.length > 0) {
        // OCO 도메인의 이미지 우선 선택
        const ocoImage = matches.find(url => url.includes('ocokorea.com') || url.includes('oco'));
        imageUrl = ocoImage || matches[0];
      }
    }

    return imageUrl;
  } catch (error) {
    console.error(`Error searching for "${searchKeyword}":`, error.message);
    return null;
  }
}

// 상품 이미지 업데이트
async function updateProductImages() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const products = await Product.find().lean();
    console.log(`Found ${products.length} products to update\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      const searchKeyword = productSearchMap[product.name];
      
      if (!searchKeyword) {
        console.log(`⏭️  No search keyword for: ${product.name}`);
        skippedCount++;
        continue;
      }

      console.log(`🔍 Searching for: ${product.name} (keyword: ${searchKeyword})`);
      
      const imageUrl = await searchProductOnOCO(searchKeyword);
      
      if (imageUrl) {
        try {
          await Product.findByIdAndUpdate(product._id, { image: imageUrl });
          console.log(`✅ Updated: ${product.name}`);
          console.log(`   Image URL: ${imageUrl}\n`);
          updatedCount++;
          
          // 요청 간 딜레이 (서버 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error updating ${product.name}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`⚠️  No image found for: ${product.name}\n`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateProductImages();

