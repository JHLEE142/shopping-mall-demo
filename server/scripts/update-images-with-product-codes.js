const mongoose = require('mongoose');
const Product = require('../src/models/product');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// 이미지 설명에서 추출한 제품코드 매핑
const productCodeMap = {
  'DAUB 여성 멜빵 팬츠 BLACK': '10729490202500166',
  '라스텔지아 보쉬 BOSH Black': '10629313202500004',
  '공용 보아 리버시블 점퍼': '10729466202501416',
  'HIDE BALL CAP (CHARCOAL)': '21723880320230019',
  '발로 그로시 숏패딩 2color': '21521370120230056',
  '꼼데가르송 하트 패치 울 가디건': '10729709202500001',
  '맥포스 코브라 벨트': '21628974202400164',
  '옐로우삭스 ALPHABET 알파벳': '10619202020220010',
  '어그 K타즈 체스트넛 1143776K-CHE': '10401775202400030',
  '어그 W 타즈 2슬리퍼 블랙 1174471-BLK': '10401775202500051',
  '쉐입오브디오션 MS Pearl gloss ring': '10629084202400030',
  '레츠고 나일론 캠프캡 스위밍': '10602556202400047',
  '1st. ECWCS Parka Smoky Brown': '21502312202400226',
  '뉴베리니팅 사슴가죽 글로밋장갑 - 차콜': '21729050202400012',
  'N-SNOW/COCOA': '21329153202400009',
  'TIC TACC-307 (p)/BLACK': '21302263202500149',
  'Grandma Fairisle Sweater Navy': '21528671202400411',
  '와이드 데님팬츠 light blue': '10717421020210005',
  '안느백 (Anne Bag)': '10501444202400081',
  '아미 남여공용 스몰 하트 로고 패치 후드티셔츠': '21529314202500004'
};

// OCO 쇼핑몰 상품 페이지에서 이미지 추출
async function getImageFromProductPage(productCode) {
  try {
    // 여러 가능한 URL 패턴 시도
    const urlPatterns = [
      `https://www.ocokorea.com/shop/goods/goods_view.do?goodsno=${productCode}`,
      `https://www.ocokorea.com/shop/item/item_view.do?itemno=${productCode}`,
      `https://www.ocokorea.com/goods/view/${productCode}`,
      `https://www.ocokorea.com/product/${productCode}`,
    ];

    for (const url of urlPatterns) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.ocokorea.com/',
          },
          timeout: 10000,
          validateStatus: (status) => status < 500, // 404도 허용
        });

        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          
          // 다양한 이미지 선택자 시도
          const selectors = [
            '.product-img img',
            '.goods-img img',
            '.prd-img img',
            '.thumb img',
            '.product-thumb img',
            '.swiper-slide img',
            'img[data-src]',
            'img[data-original]',
            '.detail-img img',
            '.view-img img',
          ];

          for (const selector of selectors) {
            const img = $(selector).first();
            if (img.length) {
              let imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy');
              
              if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.includes('placeholder')) {
                // 상대 경로를 절대 경로로 변환
                if (imageUrl.startsWith('//')) {
                  imageUrl = 'https:' + imageUrl;
                } else if (imageUrl.startsWith('/')) {
                  imageUrl = 'https://www.ocokorea.com' + imageUrl;
                }
                
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                  return imageUrl;
                }
              }
            }
          }

          // HTML에서 이미지 URL 패턴 찾기
          const html = response.data;
          const imageUrlPattern = /(https?:\/\/[^\s"']+ocokorea[^\s"']*\.(jpg|jpeg|png|gif|webp)(\?[^\s"']*)?)/gi;
          const matches = html.match(imageUrlPattern);
          if (matches && matches.length > 0) {
            // 상품 이미지로 보이는 URL 선택 (일반적으로 상품 이미지는 특정 경로 포함)
            const productImage = matches.find(url => 
              url.includes('goods') || 
              url.includes('product') || 
              url.includes('item') ||
              url.includes('prd')
            );
            return productImage || matches[0];
          }
        }
      } catch (error) {
        // 다음 URL 패턴 시도
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting image for product code ${productCode}:`, error.message);
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
      const productCode = productCodeMap[product.name];
      
      if (!productCode) {
        console.log(`⏭️  No product code for: ${product.name}`);
        skippedCount++;
        continue;
      }

      console.log(`🔍 Getting image for: ${product.name}`);
      console.log(`   Product Code: ${productCode}`);
      
      const imageUrl = await getImageFromProductPage(productCode);
      
      if (imageUrl) {
        try {
          await Product.findByIdAndUpdate(product._id, { image: imageUrl });
          console.log(`✅ Updated: ${product.name}`);
          console.log(`   Image URL: ${imageUrl}\n`);
          updatedCount++;
          
          // 요청 간 딜레이 (서버 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1500));
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

