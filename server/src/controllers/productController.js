const Product = require('../models/product');
const Category = require('../models/category');
const Review = require('../models/review');
const XLSX = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');
const { calculateStringSimilarity } = require('../utils/phonemeConverter');

// 카테고리별 multiplier 매핑 (카테고리 문자열 포함 매칭)
function getCategoryMultiplier(categoryPathText) {
  if (!categoryPathText || typeof categoryPathText !== 'string') {
    return 2.10; // 기본값
  }

  const categoryPath = categoryPathText.trim();

  // 1.65 (유입형 A)
  const multiplier165 = [
    '주방용품 > 조리도구 > 건지기/망',
    '생활잡화 > 일회용품 > 비닐봉투/비닐장갑/지퍼백',
    '생활잡화 > 일회용품 > 물티슈/티슈',
    '생활잡화 > 일회용품 > 일회용식기',
    '생활잡화 > 일회용품 > 일회용디스펜서',
    '생활잡화 > 일회용품 > 일회용컵',
    '생활잡화 > 일회용품 > 랩/호일',
    '생활잡화 > 일회용품 > 이쑤시게/면봉/꼬치',
    '생활잡화 > 일회용품 > 기타용품',
    '욕실/세탁/청소 > 세제/섬유유연제 > 주방용세제',
    '욕실/세탁/청소 > 세제/섬유유연제 > 다용도세제',
    '욕실/세탁/청소 > 세제/섬유유연제 > 세탁용세제'
  ];

  // 1.75 (주력형 B + 욕실청소 균형형 E)
  const multiplier175 = [
    '주방용품 > 조리도구 > 도마',
    '주방용품 > 조리도구 > 가위/칼/칼갈이',
    '주방용품 > 조리도구 > 국자/주걱/뒤지게',
    '주방용품 > 조리도구 > 채칼/강판',
    '주방용품 > 조리도구 > 절구/다지기',
    '주방용품 > 조리도구 > 거품기/집게',
    '주방용품 > 조리도구 > 기타용품',
    '주방용품 > 조리도구 > 채반/바구니',
    '주방용품 > 조리기구 > 후라이팬/구이팬',
    '주방용품 > 조리기구 > 냄비',
    '주방용품 > 조리기구 > 내열냄비/뚝배기',
    '주방용품 > 조리기구 > 찜기/곰솥/들통',
    '주방용품 > 조리기구 > 주전자',
    '주방용품 > 조리기구 > 기타용품',
    '주방용품 > 식기/생활자기 > 공기/대접/접시',
    '주방용품 > 식기/생활자기 > 컵/머그/잔',
    '주방용품 > 식기/생활자기 > 스푼/티스푼',
    '주방용품 > 식기/생활자기 > 수저통/케이스/받침',
    '주방용품 > 식기/생활자기 > 유아식기',
    '주방용품 > 식기/생활자기 > 보온/보냉제품',
    '욕실/세탁/청소 > 청소용품 > 행주/걸레',
    '욕실/세탁/청소 > 청소용품 > 먼지떨이/먼지제거기',
    '욕실/세탁/청소 > 청소용품 > 마대/밀대/유리닦이',
    '욕실/세탁/청소 > 청소용품 > 수세미/솔',
    '욕실/세탁/청소 > 청소용품 > 휴지통/분리수거',
    '욕실/세탁/청소 > 청소용품 > 빗자루/쓰레받이',
    '욕실/세탁/청소 > 청소용품 > 기타용품',
    '욕실/세탁/청소 > 세탁용품 > 빨래집게/빨랫줄',
    '욕실/세탁/청소 > 세탁용품 > 건조대/바구니/다림판',
    '욕실/세탁/청소 > 세탁용품 > 기타세탁용품',
    '욕실/세탁/청소 > 제습/방향/탈취 > 제습제',
    '욕실/세탁/청소 > 제습/방향/탈취 > 탈취제',
    '욕실/세탁/청소 > 제습/방향/탈취 > 방향제',
    '욕실/세탁/청소 > 욕실용품 > 대야/바가지',
    '욕실/세탁/청소 > 욕실용품 > 수건/타올',
    '욕실/세탁/청소 > 욕실용품 > 욕실의자/바구니',
    '욕실/세탁/청소 > 욕실용품 > 욕실정리소품',
    '욕실/세탁/청소 > 욕실용품 > 변기커버',
    '욕실/세탁/청소 > 욕실용품 > 욕실화',
    '욕실/세탁/청소 > 욕실용품 > 때밀이/샤워타올'
  ];

  // 1.85 (객단가/구성형 C)
  const multiplier185 = [
    '주방용품 > 보관/밀폐용기 > 플라스틱용기',
    '주방용품 > 보관/밀폐용기 > 물통/물병',
    '주방용품 > 보관/밀폐용기 > 도자기/유리용기',
    '주방용품 > 보관/밀폐용기 > 양념통/소스통',
    '주방용품 > 보관/밀폐용기 > 도시락/찬합',
    '주방용품 > 보관/밀폐용기 > 스텐용기',
    '주방용품 > 보관/밀폐용기 > 김치통',
    '주방용품 > 보관/밀폐용기 > 아이스트레이',
    '주방용품 > 보관/밀폐용기 > 기타보관/밀폐용기',
    '주방용품 > 주방잡화/소품 > 쟁반/트레이',
    '주방용품 > 주방잡화/소품 > 냄비받침',
    '주방용품 > 주방잡화/소품 > 기타주방잡화',
    '주방용품 > 주방잡화/소품 > 망/커버/뚜껑',
    '주방용품 > 주방잡화/소품 > 고무장갑/주방장갑',
    '주방용품 > 주방잡화/소품 > 커피/티',
    '수납/정리 > 리빙박스/바구니 > 리빙박스',
    '수납/정리 > 리빙박스/바구니 > 바구니',
    '수납/정리 > 리빙박스/바구니 > 패브릭정리함',
    '수납/정리 > 소품걸이/옷걸이/커버 > 커버',
    '수납/정리 > 소품걸이/옷걸이/커버 > 소품걸이/후크',
    '수납/정리 > 소품걸이/옷걸이/커버 > 옷걸이/바지걸이',
    '수납/정리 > 서랍장/수납함 > 기타정리소품',
    '수납/정리 > 서랍장/수납함 > 데스크정리소품',
    '수납/정리 > 서랍장/수납함 > 데스크서랍장',
    '수납/정리 > 서랍장/수납함 > 대형서랍장',
    '수납/정리 > 선반/진열대 > 다용도선반',
    '수납/정리 > 선반/진열대 > 주방선반',
    '수납/정리 > 선반/진열대 > 욕실선반',
    '수납/정리 > 선반/진열대 > 메탈랙',
    '인테리어 > 거울/시계/액자 > 액자',
    '인테리어 > 거울/시계/액자 > 시계',
    '인테리어 > 거울/시계/액자 > 탁상용거울',
    '인테리어 > 거울/시계/액자 > 벽걸이/전신거울',
    '인테리어 > 인테리어소품 > 베개/방석/담요',
    '인테리어 > 인테리어소품 > 기타소품',
    '인테리어 > 인테리어소품 > 마블',
    '인테리어 > 매트/카페트 > 매트/발판',
    '인테리어 > 매트/카페트 > 카페트',
    '인테리어 > 커튼/블라인드 > 커튼',
    '인테리어 > 커튼/블라인드 > 커튼봉/레일/기타부품',
    '인테리어 > 커튼/블라인드 > 블라인드/롤스크린',
    '인테리어 > 스티커/시트지/벽지',
    '인테리어 > 스티커/시트지/벽지 > 데코스티커',
    '인테리어 > 스티커/시트지/벽지 > 벽지/시트지',
    '인테리어 > 스티커/시트지/벽지 > 다용도시트지',
    '여가/건강 > 차량용품 > 세차/관리',
    '여가/건강 > 차량용품 > 차량용액세서리',
    '여가/건강 > 차량용품 > 차량용방향제/탈취제',
    '디지털/가전 > PC/스마트폰 > 스마트폰용품',
    '디지털/가전 > PC/스마트폰 > PC용품',
    '디지털/가전 > PC/스마트폰 > 음향기기',
    '디지털/가전 > PC/스마트폰 > 다용도/기타거치대',
    '디지털/가전 > 기타용품 > 케이블/랜선',
    '디지털/가전 > 기타용품 > 공유기/허브/USB',
    '디지털/가전 > 주방가전 > 홈메이드',
    '디지털/가전 > 주방가전 > 쿠커/그릴/팬',
    '디지털/가전 > 생활미용가전 > 이미용',
    '디지털/가전 > 생활미용가전 > 생활가전'
  ];

  // 카테고리 경로 문자열 포함 매칭
  if (multiplier165.some(cat => categoryPath.includes(cat))) {
    return 1.65;
  }
  if (multiplier175.some(cat => categoryPath.includes(cat))) {
    return 1.75;
  }
  if (multiplier185.some(cat => categoryPath.includes(cat))) {
    return 1.85;
  }

  // 기본값 2.10 (고마진 D)
  return 2.10;
}

function getPriceMultiplierByWholesale(wholesalePrice) {
  if (wholesalePrice <= 10000) return 1.85;
  if (wholesalePrice <= 30000) return 1.45;
  if (wholesalePrice <= 50000) return 1.35;
  return 1.30;
}

function roundUpToHundreds(value) {
  return Math.ceil(value / 100) * 100;
}

function calculateSalePriceFromWholesale(wholesalePrice) {
  const multiplier = getPriceMultiplierByWholesale(wholesalePrice);
  const basePrice = roundUpToHundreds(wholesalePrice * multiplier);
  const minimumPrice = roundUpToHundreds(wholesalePrice + 3500);
  return {
    price: Math.max(basePrice, minimumPrice),
    multiplier,
  };
}

// 재고 상태 계산 헬퍼 함수
function calculateInventoryStatus(inventory) {
  if (!inventory) {
    return 'in-stock';
  }
  
  const stock = inventory.stock ?? 0;
  const reserved = inventory.reserved ?? 0;
  let reorderPoint = inventory.reorderPoint ?? 0;
  const available = Math.max(stock - reserved, 0);
  
  // reorderPoint가 0이거나 재고보다 크면 합리적인 기본값 설정
  // 기본값: 재고 수량의 20% (최소 10개)
  if (reorderPoint <= 0 || reorderPoint > stock) {
    reorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
  }
  
  // 재고 상태 계산
  if (available <= 0) {
    return 'out-of-stock';
  } else if (available <= reorderPoint * 0.3) {
    return 'critical';
  } else if (available <= reorderPoint) {
    return 'low-stock';
  } else {
    return 'in-stock';
  }
}

async function createProduct(req, res, next) {
  try {
    const payload = { ...req.body };
    
    // 카테고리 정보 처리
    // categoryId가 있으면 우선 사용 (새로운 방식)
    if (payload.categoryId) {
      // categoryId, categoryPathIds, categoryPathText는 그대로 사용
      // categoryPathIds는 배열로 변환 (문자열 배열이 올 수 있음)
      if (payload.categoryPathIds && Array.isArray(payload.categoryPathIds)) {
        payload.categoryPathIds = payload.categoryPathIds.map(id => 
          typeof id === 'string' ? id : id.toString()
        );
      }
      
      // 하위 호환성을 위해 categoryMain, categoryMid, categorySub도 설정
      if (!payload.categoryMain && payload.categoryPathText) {
        // categoryPathText에서 파싱
        const pathParts = payload.categoryPathText.split(' > ').map(p => p.trim());
        if (pathParts.length >= 1) payload.categoryMain = pathParts[0];
        if (pathParts.length >= 2) payload.categoryMid = pathParts[1];
        if (pathParts.length >= 3) payload.categorySub = pathParts[2];
      }
      
      // category 필드는 최종 선택된 카테고리 (categoryPathText의 마지막 또는 categorySub/categoryMid/categoryMain)
      if (!payload.category) {
        payload.category = payload.categorySub || payload.categoryMid || payload.categoryMain || '';
      }
    } else if (payload.categoryMain) {
      // categoryMain이 있으면 계층 구조 카테고리 사용 (하위 호환성)
      payload.categoryMain = payload.categoryMain.trim();
      payload.categoryMid = payload.categoryMid ? payload.categoryMid.trim() : null;
      payload.categorySub = payload.categorySub ? payload.categorySub.trim() : null;
      // category 필드는 최종 선택된 카테고리 (소분류 > 중분류 > 대분류)
      if (!payload.category) {
        payload.category = payload.categorySub || payload.categoryMid || payload.categoryMain;
      }
    } else if (payload.category) {
      // 하위 호환성: category만 있으면 categoryMain으로 설정
      payload.categoryMain = payload.category.trim();
      payload.categoryMid = null;
      payload.categorySub = null;
    }
    
    // 할인율과 원래 가격 처리
    if (payload.discountRate !== undefined) {
      const discountRate = Number(payload.discountRate);
      if (isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
        payload.discountRate = 0;
      } else {
        payload.discountRate = discountRate;
      }
    } else {
      payload.discountRate = 0;
    }
    
    if (payload.originalPrice !== undefined && payload.originalPrice !== null) {
      const originalPrice = Number(payload.originalPrice);
      if (isNaN(originalPrice) || originalPrice < 0) {
        payload.originalPrice = null;
      } else {
        payload.originalPrice = originalPrice;
      }
    } else {
      payload.originalPrice = null;
    }
    
    if (payload.inventory) {
      payload.inventory.updatedAt = new Date();
      // 재고 상태 자동 계산
      if (!payload.inventory.status) {
        payload.inventory.status = calculateInventoryStatus(payload.inventory);
      }
      // reorderPoint 자동 설정 (0이거나 재고보다 크면)
      const stock = payload.inventory.stock ?? 0;
      const reorderPoint = payload.inventory.reorderPoint ?? 0;
      if (reorderPoint <= 0 || reorderPoint > stock) {
        payload.inventory.reorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
      }
    }
    const newProduct = await Product.create(payload);
    
    // 신상품 알림 구독자에게 알림 전송 (비동기로 처리, 에러가 발생해도 상품 생성은 성공)
    try {
      const ProductNotificationSubscription = require('../models/productNotificationSubscription');
      const Notification = require('../models/notification');
      
      const subscribers = await ProductNotificationSubscription.find({ isActive: true }).populate('user');
      
      if (subscribers.length > 0) {
        const notifications = subscribers.map(sub => ({
          user: sub.user._id,
          type: 'new_product',
          title: '새로운 상품이 등록되었습니다',
          message: `${newProduct.name}이(가) 등록되었습니다. 지금 확인해보세요!`,
          relatedProduct: newProduct._id,
        }));
        
        // 알림 생성 (배치 처리)
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      // 알림 전송 실패해도 상품 생성은 성공으로 처리
      console.error('신상품 알림 전송 실패:', notificationError);
    }
    
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    
    // 카테고리 필터
    const categoryFilter = req.query.category;
    // 검색 쿼리
    const searchQuery = req.query.search;
    const query = {};
    
    if (categoryFilter) {
      // 대분류 기준으로 필터링 (categoryMain 필드 사용)
      query.categoryMain = categoryFilter;
    }
    
    // 검색 기능: 상품 이름 또는 설명에서 검색
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i'); // 대소문자 구분 없이 검색
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
      ];
    }

    const [items, totalItems] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // 각 상품의 재고 상태 및 리뷰 집계 추가
    const itemsWithStatus = await Promise.all(
      items.map(async (item) => {
        if (item.inventory) {
          const stock = item.inventory.stock ?? 0;
          let reorderPoint = item.inventory.reorderPoint ?? 0;
          let needsUpdate = false;
          
          // reorderPoint가 0이거나 재고보다 크면 합리적인 기본값 계산
          // 기본값: 재고 수량의 20% (최소 10개)
          if (reorderPoint <= 0 || reorderPoint > stock) {
            const calculatedReorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
            // 응답에 계산된 reorderPoint 반영
            item.inventory.reorderPoint = calculatedReorderPoint;
            reorderPoint = calculatedReorderPoint;
            needsUpdate = true;
          }
          
          // 재고 상태 계산
          const calculatedStatus = calculateInventoryStatus(item.inventory);
          // 상태가 다르면 업데이트 필요
          if (item.inventory.status !== calculatedStatus) {
            item.inventory.status = calculatedStatus;
            needsUpdate = true;
          }
          
          // 데이터베이스에 업데이트가 필요하면 저장
          if (needsUpdate && item._id) {
            try {
              await Product.findByIdAndUpdate(
                item._id,
                {
                  $set: {
                    'inventory.reorderPoint': reorderPoint,
                    'inventory.status': calculatedStatus,
                    'inventory.updatedAt': new Date(),
                  },
                },
                { new: true }
              );
            } catch (error) {
              // 업데이트 실패해도 응답은 계속 진행
              console.error(`Failed to update inventory for product ${item._id}:`, error);
            }
          }
        }

        // 리뷰 집계 (평균 rating, 리뷰 개수)
        try {
          const reviewStats = await Review.aggregate([
            { $match: { productId: item._id } },
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
              }
            }
          ]);

          if (reviewStats.length > 0) {
            item.rating = Math.round(reviewStats[0].averageRating * 10) / 10; // 소수점 첫째자리까지
            item.reviewCount = reviewStats[0].reviewCount;
          } else {
            item.rating = 0;
            item.reviewCount = 0;
          }
        } catch (error) {
          console.error(`Failed to aggregate reviews for product ${item._id}:`, error);
          item.rating = 0;
          item.reviewCount = 0;
        }

        return item;
      })
    );

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    res.json({
      page,
      limit,
      totalItems,
      totalPages,
      items: itemsWithStatus,
    });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const payload = { ...req.body };
    const updateQuery = {};
    
    // 카테고리 정보 처리
    // categoryId가 있으면 우선 사용 (새로운 방식)
    if (payload.categoryId) {
      // categoryId, categoryPathIds, categoryPathText 업데이트
      updateQuery.categoryId = payload.categoryId;
      
      if (payload.categoryPathIds && Array.isArray(payload.categoryPathIds)) {
        updateQuery.categoryPathIds = payload.categoryPathIds.map(id => 
          typeof id === 'string' ? id : id.toString()
        );
      } else if (payload.categoryPathIds === null || payload.categoryPathIds === undefined) {
        updateQuery.categoryPathIds = [];
      }
      
      if (payload.categoryPathText !== undefined) {
        updateQuery.categoryPathText = payload.categoryPathText || '';
      }
      
      // 하위 호환성을 위해 categoryMain, categoryMid, categorySub도 설정
      if (payload.categoryPathText) {
        const pathParts = payload.categoryPathText.split(' > ').map(p => p.trim());
        if (pathParts.length >= 1) updateQuery.categoryMain = pathParts[0];
        if (pathParts.length >= 2) updateQuery.categoryMid = pathParts[1];
        if (pathParts.length >= 3) updateQuery.categorySub = pathParts[2];
      } else if (payload.categoryMain) {
        updateQuery.categoryMain = payload.categoryMain.trim();
        updateQuery.categoryMid = payload.categoryMid ? payload.categoryMid.trim() : null;
        updateQuery.categorySub = payload.categorySub ? payload.categorySub.trim() : null;
      }
      
      // category 필드는 최종 선택된 카테고리
      updateQuery.category = payload.category || (payload.categorySub || payload.categoryMid || payload.categoryMain || '');
    } else if (payload.categoryMain) {
      // categoryMain이 있으면 계층 구조 카테고리 사용 (하위 호환성)
      updateQuery.categoryMain = payload.categoryMain.trim();
      updateQuery.categoryMid = payload.categoryMid ? payload.categoryMid.trim() : null;
      updateQuery.categorySub = payload.categorySub ? payload.categorySub.trim() : null;
      // category 필드는 최종 선택된 카테고리 (소분류 > 중분류 > 대분류)
      updateQuery.category = payload.category || (payload.categorySub || payload.categoryMid || payload.categoryMain);
    } else if (payload.category) {
      // 하위 호환성: category만 있으면 categoryMain으로 설정
      updateQuery.categoryMain = payload.category.trim();
      updateQuery.categoryMid = null;
      updateQuery.categorySub = null;
      updateQuery.category = payload.category.trim();
    }
    
    // 할인율과 원래 가격 처리
    if (payload.discountRate !== undefined) {
      const discountRate = Number(payload.discountRate);
      if (isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
        updateQuery.discountRate = 0;
      } else {
        updateQuery.discountRate = discountRate;
      }
    }
    
    if (payload.originalPrice !== undefined) {
      if (payload.originalPrice === null || payload.originalPrice === '') {
        updateQuery.originalPrice = null;
      } else {
        const originalPrice = Number(payload.originalPrice);
        if (isNaN(originalPrice) || originalPrice < 0) {
          updateQuery.originalPrice = null;
        } else {
          updateQuery.originalPrice = originalPrice;
        }
      }
    }
    
    // inventory 필드가 있으면 nested object 업데이트 처리
    if (payload.inventory) {
      const inventory = { ...payload.inventory };
      
      // inventory.updatedAt 자동 설정
      inventory.updatedAt = new Date();
      
      // 재고 상태 자동 계산
      const stock = inventory.stock ?? 0;
      const reserved = inventory.reserved ?? 0;
      let reorderPoint = inventory.reorderPoint ?? 0;
      const available = Math.max(stock - reserved, 0);
      
      // reorderPoint가 0이거나 재고보다 크면 합리적인 기본값 설정
      // 기본값: 재고 수량의 20% (최소 10개)
      if (reorderPoint <= 0 || reorderPoint > stock) {
        reorderPoint = Math.max(Math.ceil(stock * 0.2), 10);
        inventory.reorderPoint = reorderPoint;
      }
      
      // 재고 상태 계산 (헬퍼 함수 사용)
      inventory.status = calculateInventoryStatus(inventory);
      
      // MongoDB에서 nested object 업데이트는 dot notation 사용
      updateQuery['inventory.stock'] = inventory.stock;
      updateQuery['inventory.reserved'] = inventory.reserved;
      updateQuery['inventory.reorderPoint'] = inventory.reorderPoint;
      updateQuery['inventory.supplier'] = inventory.supplier || '';
      updateQuery['inventory.cost'] = inventory.cost || 0;
      updateQuery['inventory.status'] = inventory.status;
      updateQuery['inventory.updatedAt'] = inventory.updatedAt;
    }
    
    // 다른 필드들도 업데이트 (inventory, discountRate, originalPrice 제외)
    Object.keys(payload).forEach((key) => {
      if (key !== 'inventory' && key !== 'discountRate' && key !== 'originalPrice' && key !== '_id' && key !== '__v') {
        // image 필드는 유효한 값이 있을 때만 업데이트 (빈 문자열이면 기존 이미지 유지)
        if (key === 'image') {
          if (payload[key] && payload[key].trim() !== '') {
            updateQuery[key] = payload[key].trim();
          }
          // 빈 문자열이면 updateQuery에 포함하지 않아서 기존 이미지가 유지됨
          return;
        }
        updateQuery[key] = payload[key];
      }
    });
    
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateQuery },
      {
        new: true,
        runValidators: true,
      }
    ).lean();
    
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

// 웹페이지에서 상품 이미지 추출 함수
async function fetchProductImages(productUrl) {
  try {
    if (!productUrl || typeof productUrl !== 'string' || !productUrl.trim()) {
      return { mainImage: '', detailImages: [] };
    }

    const url = productUrl.trim();
    console.log(`🖼️ [FETCH IMAGES] Fetching images from URL: ${url}`);

    // URL 유효성 검증
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.warn(`⚠️ [FETCH IMAGES] Invalid URL format: ${url}`);
      return { mainImage: '', detailImages: [] };
    }

    // HTTP 요청으로 HTML 가져오기 (타임아웃 10초, 재시도 1회)
    let response;
    const startTime = Date.now();
    try {
      response = await axios.get(url, {
        timeout: 10000, // 10초 타임아웃 (이미지 가져오기 성공률 향상)
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // 5xx 에러가 아니면 계속 진행
      });
      const fetchDuration = Date.now() - startTime;
      console.log(`✅ [FETCH IMAGES] Successfully fetched HTML from ${url} in ${fetchDuration}ms (Status: ${response.status})`);
    } catch (firstError) {
      const firstAttemptDuration = Date.now() - startTime;
      console.warn(`⚠️ [FETCH IMAGES] First attempt failed for ${url} after ${firstAttemptDuration}ms:`, firstError.message);
      // 첫 번째 시도 실패 시 1회 재시도
      console.log(`🔄 [FETCH IMAGES] Retrying for ${url}...`);
      const retryStartTime = Date.now();
      try {
        response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500
        });
        const retryDuration = Date.now() - retryStartTime;
        console.log(`✅ [FETCH IMAGES] Retry successful for ${url} in ${retryDuration}ms (Status: ${response.status})`);
      } catch (retryError) {
        const retryDuration = Date.now() - retryStartTime;
        console.error(`❌ [FETCH IMAGES] Retry also failed for ${url} after ${retryDuration}ms:`, retryError.message);
        throw retryError; // 재시도도 실패하면 에러 throw
      }
    }

    const html = response.data;
    const $ = cheerio.load(html);

    let mainImage = '';
    const detailImages = [];

    // tckjong.com 사이트 특화 이미지 추출
    const isTckjongSite = url.includes('tckjong.com');
    
    if (isTckjongSite) {
      console.log(`🔍 [FETCH IMAGES] Detected tckjong.com site, using specialized extraction...`);
      
      // 1. 대표 이미지: id="mainImg" 속성을 가진 img 태그에서 가져오기 (최우선)
      const mainImgElement = $('#mainImg').first();
      if (mainImgElement.length > 0) {
        let src = mainImgElement.attr('src') || mainImgElement.attr('data-src') || mainImgElement.attr('data-original') || mainImgElement.attr('data-lazy-src');
        if (src) {
          // 상대 경로를 절대 경로로 변환
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            src = urlObj.origin + src;
          } else if (!src.startsWith('http')) {
            const urlObj = new URL(url);
            src = new URL(src, urlObj.origin).href;
          }
          
          // 쿼리 파라미터 제거
          mainImage = src.split('?')[0];
          console.log(`✅ [FETCH IMAGES] Main image found from id="mainImg": ${mainImage}`);
        }
      }
      
      // 2. id="mainImg"에서 못 찾은 경우, 다양한 패턴으로 찾기
      if (!mainImage) {
        // 패턴 1: tckjongg.wisacdn.com/data/product/ 또는 tckjonge.wisacdn.com/data/product/
        const productImagePattern1 = /https?:\/\/(tckjongg|tckjonge)\.wisacdn\.com\/data\/product\/[^\s"'<>)]+\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)(\?[^\s"'<>)]*)?/gi;
        const productImageMatches1 = html.match(productImagePattern1);
        
        if (productImageMatches1 && productImageMatches1.length > 0) {
          mainImage = productImageMatches1[0].split('?')[0];
          console.log(`✅ [FETCH IMAGES] Main image found (pattern 1 - data/product/): ${mainImage}`);
        }
        
        // 패턴 2: tckjongg.wisacdn.com/_data/product/ 또는 tckjonge.wisacdn.com/_data/product/ (언더스코어 포함)
        if (!mainImage) {
          const productImagePattern2 = /https?:\/\/(tckjongg|tckjonge)\.wisacdn\.com\/_data\/product\/[^\s"'<>)]+\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)(\?[^\s"'<>)]*)?/gi;
          const productImageMatches2 = html.match(productImagePattern2);
          
          if (productImageMatches2 && productImageMatches2.length > 0) {
            mainImage = productImageMatches2[0].split('?')[0];
            console.log(`✅ [FETCH IMAGES] Main image found (pattern 2 - _data/product/): ${mainImage}`);
          }
        }
        
        // 패턴 3: img 태그에서 직접 찾기
        if (!mainImage) {
          $('img').each((index, elem) => {
            const img = $(elem);
            let src = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src');
            
            if (src) {
              // 상대 경로를 절대 경로로 변환
              if (src.startsWith('//')) {
                src = 'https:' + src;
              } else if (src.startsWith('/')) {
                const urlObj = new URL(url);
                src = urlObj.origin + src;
              } else if (!src.startsWith('http')) {
                const urlObj = new URL(url);
                src = new URL(src, urlObj.origin).href;
              }
              
              const cleanSrc = src.split('?')[0];
              
              // data/product/ 또는 _data/product/ 패턴 확인
              if ((cleanSrc.includes('tckjongg.wisacdn.com/data/product/') || 
                   cleanSrc.includes('tckjonge.wisacdn.com/data/product/') ||
                   cleanSrc.includes('tckjongg.wisacdn.com/_data/product/') ||
                   cleanSrc.includes('tckjonge.wisacdn.com/_data/product/')) && !mainImage) {
                mainImage = cleanSrc;
                console.log(`✅ [FETCH IMAGES] Main image found from img tag: ${mainImage}`);
                return false; // break
              }
            }
          });
        }
      }
      
      // 3. 상세 이미지: 다양한 패턴으로 찾기
      // 패턴 1: data/attach/
      const attachImagePattern1 = /https?:\/\/(tckjongg|tckjonge)\.wisacdn\.com\/data\/attach\/[^\s"'<>)]+\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)(\?[^\s"'<>)]*)?/gi;
      const attachImageMatches1 = html.match(attachImagePattern1);
      
      if (attachImageMatches1 && attachImageMatches1.length > 0) {
        const uniqueAttachImages = [...new Set(attachImageMatches1.map(url => url.split('?')[0]))];
        uniqueAttachImages.forEach(imgUrl => {
          if (imgUrl !== mainImage && detailImages.indexOf(imgUrl) === -1 && detailImages.length < 20) {
            detailImages.push(imgUrl);
            console.log(`  ✅ [FETCH IMAGES] Detail image found (pattern 1 - data/attach/): ${imgUrl}`);
          }
        });
      }
      
      // 패턴 2: _data/attach/ (언더스코어 포함)
      const attachImagePattern2 = /https?:\/\/(tckjongg|tckjonge)\.wisacdn\.com\/_data\/attach\/[^\s"'<>)]+\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)(\?[^\s"'<>)]*)?/gi;
      const attachImageMatches2 = html.match(attachImagePattern2);
      
      if (attachImageMatches2 && attachImageMatches2.length > 0) {
        const uniqueAttachImages = [...new Set(attachImageMatches2.map(url => url.split('?')[0]))];
        uniqueAttachImages.forEach(imgUrl => {
          if (imgUrl !== mainImage && detailImages.indexOf(imgUrl) === -1 && detailImages.length < 20) {
            detailImages.push(imgUrl);
            console.log(`  ✅ [FETCH IMAGES] Detail image found (pattern 2 - _data/attach/): ${imgUrl}`);
          }
        });
      }
      
      // 패턴 3: img 태그에서 직접 찾기
      $('img').each((index, elem) => {
        const img = $(elem);
        const imgId = img.attr('id');
        // 이미 id="mainImg"는 처리했으므로 건너뛰기
        if (imgId === 'mainImg' || imgId === 'mainimg') return;
        
        let src = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src');
        
        if (src) {
          // 상대 경로를 절대 경로로 변환
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            src = urlObj.origin + src;
          } else if (!src.startsWith('http')) {
            const urlObj = new URL(url);
            src = new URL(src, urlObj.origin).href;
          }
          
          // 쿼리 파라미터 제거
          const cleanSrc = src.split('?')[0];
          
          // 상세 이미지 패턴 확인 (data/attach/ 또는 _data/attach/)
          if ((cleanSrc.includes('tckjongg.wisacdn.com/data/attach/') || 
               cleanSrc.includes('tckjonge.wisacdn.com/data/attach/') ||
               cleanSrc.includes('tckjongg.wisacdn.com/_data/attach/') ||
               cleanSrc.includes('tckjonge.wisacdn.com/_data/attach/')) && 
              cleanSrc !== mainImage && 
              detailImages.indexOf(cleanSrc) === -1 && 
              detailImages.length < 20) {
            detailImages.push(cleanSrc);
            console.log(`  ✅ [FETCH IMAGES] Detail image found from img tag: ${cleanSrc}`);
          }
        }
      });
      
      // tckjong 사이트 처리 완료
      if (mainImage || detailImages.length > 0) {
        console.log(`✅ [FETCH IMAGES] tckjong.com extraction completed - Main: ${mainImage ? 'YES (' + mainImage.substring(0, 60) + '...)' : 'NO'}, Details: ${detailImages.length}`);
        return {
          mainImage: mainImage || '',
          detailImages: detailImages
        };
      } else {
        console.warn(`⚠️ [FETCH IMAGES] tckjong.com extraction failed - no images found. HTML length: ${html.length}`);
        // HTML 일부를 로그로 출력 (디버깅용)
        const htmlSample = html.substring(0, 2000);
        console.log(`🔍 [FETCH IMAGES] HTML sample (first 2000 chars):`, htmlSample);
      }
    }

    // UI 요소 필터링 헬퍼 함수
    const isUIElement = (src) => {
      const lowerSrc = src.toLowerCase();
      const uiPatterns = [
        'btn_', 'button', 'icon', 'logo', 'banner', 'spacer', 'placeholder',
        'nav', 'header', 'footer', 'menu', 'close', 'popup', 'arrow',
        'common/', '_skin/', 'img/common/', 'img/button/', 'img/main/btn',
        'ea_up', 'ea_down', 'up.gif', 'down.gif', 'left.gif', 'right.gif',
        '/common/', '/button/', '/skin/', 'btn_close', 'btn_popup', 'btn_'
      ];
      return uiPatterns.some(pattern => lowerSrc.includes(pattern));
    };

    // 1. 대표 이미지 추출 (일반적인 쇼핑몰 구조)
    // 우선순위: id="mainImg" > 일반적인 쇼핑몰 구조
    // 먼저 id="mainImg"로 명시적으로 지정된 이미지 찾기
    const mainImgElement = $('#mainImg').first();
    if (mainImgElement.length > 0) {
      let src = mainImgElement.attr('src') || mainImgElement.attr('data-src') || mainImgElement.attr('data-original');
      if (src) {
        // 상대 경로를 절대 경로로 변환
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          const urlObj = new URL(url);
          src = urlObj.origin + src;
        } else if (!src.startsWith('http')) {
          const urlObj = new URL(url);
          src = new URL(src, urlObj.origin).href;
        }
        
        // UI 요소 필터링
        if (!isUIElement(src)) {
          mainImage = src;
          console.log(`✅ [FETCH IMAGES] Main image found via id="mainImg": ${mainImage}`);
        }
      }
    }

    // id="mainImg"에서 찾지 못한 경우, 일반적인 선택자로 찾기
    if (!mainImage) {
      const mainImageSelectors = [
        '#mainImg img',
        'img#mainImg',
        '#product-image img',
        '#main-image img',
        '.product-image img',
        '.main-image img',
        '.product-img img',
        '.detail-image img',
        '.product-photo img',
        '.product-main-image img',
        '.product-view img',
        'img[src*="product"]',
        '.item-img img'
      ];

      for (const selector of mainImageSelectors) {
        const imgs = $(selector);
        for (let i = 0; i < imgs.length; i++) {
          const img = $(imgs[i]);
          let src = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src');
          if (src) {
            // 상대 경로를 절대 경로로 변환
            if (src.startsWith('//')) {
              src = 'https:' + src;
            } else if (src.startsWith('/')) {
              const urlObj = new URL(url);
              src = urlObj.origin + src;
            } else if (!src.startsWith('http')) {
              const urlObj = new URL(url);
              src = new URL(src, urlObj.origin).href;
            }
            
            // UI 요소 필터링
            if (!isUIElement(src)) {
              // 이미지 크기 확인 (너무 작은 것은 아이콘일 가능성)
              const width = parseInt(img.attr('width')) || 0;
              const height = parseInt(img.attr('height')) || 0;
              if (width === 0 || height === 0 || (width > 50 && height > 50)) {
                mainImage = src;
                console.log(`✅ [FETCH IMAGES] Main image found via selector "${selector}": ${mainImage}`);
                break;
              }
            }
          }
        }
        if (mainImage) break;
      }
    }

    // 2. 상세 이미지 추출 (두 번째 이미지 영역 - 상세 설명 부분)
    // 상세 설명 영역에 있는 이미지만 추출 (UI 요소 제외)
    // .content img는 너무 일반적이라 제외
    const detailImageSelectors = [
      '.product-detail img',
      '.description img',
      '.detail-info img',
      '.product-desc img',
      '.detail-content img',
      '#product-detail img',
      '#description img',
      '.product-info img',
      '.tab-content img',
      '.product-detail-info img',
      '.viewContent img',
      '.view-content img',
      '.prod-detail img',
      '.detail-view img',
      '.detail_view img',
      '.detailImg img',
      '.detail_img img',
      '.product-desc-content img',
      '.desc-content img'
    ];

    // 먼저 특정 영역에서 이미지 찾기
    for (const selector of detailImageSelectors) {
      const elements = $(selector);
      console.log(`🔍 [FETCH IMAGES] Checking selector "${selector}": found ${elements.length} elements`);
      
      elements.each((index, elem) => {
        // 대표 이미지와 동일한 이미지는 제외
        const img = $(elem);
        let src = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src');
        if (src) {
          // 상대 경로를 절대 경로로 변환
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            src = urlObj.origin + src;
          } else if (!src.startsWith('http')) {
            // 상대 경로 처리
            const urlObj = new URL(url);
            src = new URL(src, urlObj.origin).href;
          }
          
          // UI 요소 필터링 및 유효성 검사
          if (src !== mainImage && 
              !isUIElement(src) &&
              detailImages.indexOf(src) === -1 && // 중복 제거
              detailImages.length < 10) { // 최대 10개까지
            // 이미지 크기 확인 (너무 작은 것은 아이콘일 가능성)
            const width = parseInt(img.attr('width')) || 0;
            const height = parseInt(img.attr('height')) || 0;
            // 크기가 지정되지 않았거나, 충분히 큰 이미지만 추가
            if (width === 0 || height === 0 || (width > 100 && height > 100)) {
              detailImages.push(src);
              console.log(`  ✅ [FETCH IMAGES] Detail image found: ${src}`);
            }
          }
        }
      });
      
      // 충분한 이미지를 찾았으면 중단
      if (detailImages.length >= 3) break;
    }

    // 특정 선택자에서 찾지 못한 경우, 페이지의 모든 이미지에서 찾기 (대표 이미지 제외)
    if (detailImages.length === 0) {
      console.log(`⚠️ [FETCH IMAGES] No detail images found with specific selectors, trying all images on page...`);
      $('img').each((index, elem) => {
        const img = $(elem);
        let src = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src');
        if (src) {
          // 상대 경로를 절대 경로로 변환
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            src = urlObj.origin + src;
          } else if (!src.startsWith('http')) {
            const urlObj = new URL(url);
            src = new URL(src, urlObj.origin).href;
          }
          
          // UI 요소 필터링 및 유효성 검사
          if (src !== mainImage && 
              !isUIElement(src) &&
              detailImages.indexOf(src) === -1 &&
              detailImages.length < 10) {
            // 이미지 크기 확인
            const width = parseInt(img.attr('width')) || 0;
            const height = parseInt(img.attr('height')) || 0;
            // 크기가 지정되지 않았거나, 충분히 큰 이미지만 추가
            if (width === 0 || height === 0 || (width > 100 && height > 100)) {
              detailImages.push(src);
              console.log(`  ✅ [FETCH IMAGES] Detail image found from all images: ${src}`);
            }
          }
        }
      });
    }

    console.log(`✅ [FETCH IMAGES] Image extraction completed for ${url}:`);
    console.log(`   - Main image: ${mainImage ? 'YES (' + mainImage.substring(0, 60) + '...)' : 'NO'}`);
    console.log(`   - Detail images: ${detailImages.length} found`);
    if (detailImages.length > 0 && detailImages.length <= 3) {
      detailImages.forEach((img, idx) => {
        console.log(`   - Detail ${idx + 1}: ${img.substring(0, 60)}...`);
      });
    }
    
    return {
      mainImage: mainImage || '',
      detailImages: detailImages
    };
  } catch (error) {
    console.error(`❌ [FETCH IMAGES] Error fetching images from ${productUrl}:`, error.message);
    return { mainImage: '', detailImages: [] };
  }
}

// 카테고리 경로를 파싱하고 upsert하는 헬퍼 함수
async function upsertCategoryFromPath(categoryPath) {
  const startTime = Date.now();
  
  if (!categoryPath || typeof categoryPath !== 'string') {
    throw new Error('Invalid category path');
  }

  const parts = categoryPath.split('>').map(p => p.trim()).filter(p => p);
  if (parts.length === 0) {
    throw new Error('Category path cannot be empty');
  }
  
  console.log(`🔍 [UPSERT CATEGORY] Starting for path: "${categoryPath}" (${parts.length} levels)`);

  // slug/code 생성 헬퍼
  function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-가-힣]/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  let parentCategory = null;
  let pathIds = [];
  let pathNames = [];

  // 각 레벨의 카테고리를 순차적으로 생성/조회
  for (let i = 0; i < parts.length; i++) {
    const levelStartTime = Date.now();
    const name = parts[i];
    const level = i + 1;
    const code = generateSlug(name);
    const slug = code;

    console.log(`  🔄 [UPSERT CATEGORY] Level ${level}: "${name}" (code: ${code})`);

    // 기존 카테고리 찾기 (code로)
    let category = await Category.findOne({ code });

    if (category) {
      console.log(`  ✅ [UPSERT CATEGORY] Level ${level}: Found existing category`);
      // 기존 카테고리가 있으면 업데이트 (parentId, level, pathIds, pathNames 등)
      category.parentId = parentCategory ? parentCategory._id : null;
      category.level = level;
      category.pathIds = [...pathIds];
      category.pathNames = [...pathNames];
      category.isLeaf = level === 3; // 소분류만 isLeaf=true
      category.isActive = true;
      await category.save();
    } else {
      console.log(`  ➕ [UPSERT CATEGORY] Level ${level}: Creating new category`);
      // 새 카테고리 생성
      category = await Category.create({
        name,
        slug,
        code,
        parentId: parentCategory ? parentCategory._id : null,
        level,
        pathIds: [...pathIds],
        pathNames: [...pathNames],
        isLeaf: level === 3,
        isActive: true,
        order: 0,
      });
      console.log(`  ✅ [UPSERT CATEGORY] Level ${level}: Created category ID: ${category._id}`);
    }

    // 부모 카테고리의 isLeaf를 false로 업데이트
    if (parentCategory) {
      await Category.findByIdAndUpdate(parentCategory._id, { $set: { isLeaf: false } });
    }

    // 다음 레벨을 위한 준비 (현재 카테고리 ID를 pathIds에 추가)
    pathIds.push(category._id);
    pathNames.push(name);
    parentCategory = category;
    
    const levelDuration = Date.now() - levelStartTime;
    if (levelDuration > 500) {
      console.warn(`  ⚠️ [UPSERT CATEGORY] Level ${level}: Took ${levelDuration}ms`);
    }
  }

  // 최종 카테고리 반환 (leaf 카테고리)
  // 1단계만 있으면 그 카테고리를 leaf로 간주
  if (parts.length === 1) {
    await Category.findByIdAndUpdate(parentCategory._id, { $set: { isLeaf: true } });
    parentCategory.isLeaf = true;
  }

  const totalDuration = Date.now() - startTime;
  console.log(`✅ [UPSERT CATEGORY] Completed for "${categoryPath}" in ${totalDuration}ms`);

  return {
    category: parentCategory,
    pathIds,
    pathNames,
  };
}

// 엑셀 파일 업로드 및 미리보기
async function importExcel(req, res, next) {
  const startTime = Date.now();
  console.log('📥 [EXCEL IMPORT API HIT] Request received at', new Date().toISOString());
  
  try {
    if (!req.file) {
      console.log('❌ [EXCEL IMPORT] No file in request');
      return res.status(400).json({ message: 'Excel file is required' });
    }

    console.log('✅ [EXCEL IMPORT] File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      sizeMB: (req.file.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    // 엑셀 파일 파싱
    console.log('📊 [EXCEL IMPORT] Starting Excel parsing...');
    const parseStartTime = Date.now();
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const parseDuration = Date.now() - parseStartTime;
    console.log('✅ [EXCEL IMPORT] Excel parsing completed in', parseDuration + 'ms');
    
    const sheetName = workbook.SheetNames[0];
    console.log('📋 [EXCEL IMPORT] Using sheet:', sheetName);
    const worksheet = workbook.Sheets[sheetName];
    
    // G열(인덱스 6)에서 직접 데이터 가져오기
    // 먼저 헤더가 있는 경우와 없는 경우 모두 처리하기 위해 sheet_to_json 사용
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // 배열 형태로 반환 (헤더 포함)
      defval: null // 빈 셀은 null로 반환
    });
    
    // 헤더 행 제거하고 데이터만 추출
    const headers = data[0] || [];
    const allRows = data.slice(1);
    
    console.log(`📊 [EXCEL IMPORT] Total rows in file: ${allRows.length}`);
    console.log('📊 [EXCEL IMPORT] G column (index 6) header:', headers[6] || 'N/A');

    if (!allRows || allRows.length === 0) {
      console.log('❌ [EXCEL IMPORT] Excel file is empty');
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // 컬럼명 매핑 (다양한 형식 지원)
    const findColumn = (row, possibleNames) => {
      for (const name of possibleNames) {
        if (row.hasOwnProperty(name)) {
          return row[name];
        }
      }
      return null;
    };

    // DB에 이미 있는 SKU들을 일괄 조회 (성능 최적화)
    console.log('🔍 [EXCEL IMPORT] Checking existing SKUs in database...');
    const existingProducts = await Product.find({}).select('sku').lean();
    const existingSkus = new Set(existingProducts.map(p => p.sku.toUpperCase()));
    console.log(`📊 [EXCEL IMPORT] Found ${existingSkus.size} existing SKUs in database`);

    console.log(`🔄 [EXCEL IMPORT] Starting row processing (target: 1000 valid unique products)...`);
    const previewData = [];
    const targetValidProducts = 1000;
    // 중복 제외를 고려하여 더 많은 행 읽기 (최대 1500개 행까지 읽어서 중복 제외 후 500개 채우기)
    const maxRowsToCheck = Math.min(allRows.length, 3000);
    
    // 엑셀 파일 내 중복 체크를 위한 SKU Map
    const fileSkuMap = new Map(); // SKU -> 첫 번째 발견된 rowIndex
    const fileDuplicateSkus = new Set(); // 중복된 SKU들
    let actualRowsProcessed = 0; // 실제 처리한 행 수 추적

    for (let i = 0; i < maxRowsToCheck && previewData.length < targetValidProducts; i++) {
      actualRowsProcessed = i + 1; // 실제 처리한 행 수 업데이트
      const rowStartTime = Date.now();
      const rawRow = allRows[i];
      const rowIndex = i + 2; // 엑셀 행 번호 (헤더 제외, 1-based)

      // 행을 객체로 변환
      const row = {};
      headers.forEach((header, index) => {
        row[header] = rawRow[index] !== undefined ? rawRow[index] : null;
      });
      // G열(인덱스 6) 데이터를 직접 추가
      row['__G_COLUMN__'] = rawRow[6] !== undefined ? rawRow[6] : null;

      // 진행 상황 로그
      const foundCount = previewData.length;
      console.log(`📊 [EXCEL IMPORT] Row ${i + 1}/${maxRowsToCheck}: Processing... (Found: ${foundCount}/${targetValidProducts} valid products)`);

      // 원본 데이터 추출
      const barcode = findColumn(row, ['바코드', 'barcode', 'Barcode', 'BARCODE', 'SKU', 'sku']);
      const name = findColumn(row, ['상품명', 'name', 'Name', 'NAME', '제품명', 'product_name']);
      // G열(인덱스 6)에서 직접 가져오기 (우선순위: G열 직접 접근 > 컬럼명 매칭)
      const vip5 = row['__G_COLUMN__'] !== null && row['__G_COLUMN__'] !== undefined 
        ? row['__G_COLUMN__'] 
        : findColumn(row, ['우수회원5', 'VIP5', 'vip5', '우수회원', 'member_price']);
      const categoryPath = findColumn(row, ['카테고리', 'category', 'Category', 'CATEGORY', 'category_path']);
      const productUrl = findColumn(row, ['상품URL', 'productUrl', 'product_url', 'ProductURL', 'PRODUCT_URL', 'url', 'URL']);

      // 디버깅: 첫 번째 행에서만 전체 row 구조와 찾은 값들을 로그
      if (i === 0) {
        console.log('📋 [EXCEL IMPORT] First row - Available columns:', Object.keys(row));
        console.log('📋 [EXCEL IMPORT] First row - Extracted values:', {
          barcode,
          name,
          vip5,
          vip5Type: typeof vip5,
          vip5Value: vip5,
          categoryPath,
          productUrl,
          productUrlType: typeof productUrl
        });
        console.log('📋 [EXCEL IMPORT] First row - Full row data:', JSON.stringify(row, null, 2));
      }
      
      // productUrl이 있는 경우 로그 (처음 5개 행만)
      if (i < 5 && productUrl && productUrl.trim()) {
        console.log(`🔗 [EXCEL IMPORT] Row ${rowIndex}: Product URL found: ${productUrl}`);
      }

      const raw = { barcode, name, vip5, categoryPath, productUrl };

      // 검증 및 매핑
      const validation = { ok: true, errors: [] };
      const mapped = { sku: null, name: null, price: null, category: { l1: null, l2: null, l3: null }, categoryId: null };

      // SKU 검증 (필수)
      let sku = null;
      if (!barcode || (typeof barcode === 'string' && !barcode.trim())) {
        validation.ok = false;
        validation.errors.push('Barcode is required');
      } else {
        sku = String(barcode).trim().toUpperCase();
        mapped.sku = sku;
        
        // 엑셀 파일 내 SKU 중복 체크 (실시간)
        if (fileSkuMap.has(sku)) {
          // 중복 발견: 이전 행과 현재 행 모두 중복으로 표시
          fileDuplicateSkus.add(sku);
          validation.ok = false;
          validation.errors.push(`Duplicate SKU in Excel file: ${sku} (first found at row ${fileSkuMap.get(sku)})`);
          console.log(`⏭️ [EXCEL IMPORT] Row ${rowIndex}: Skipping - Duplicate SKU in file: ${sku} (first found at row ${fileSkuMap.get(sku)})`);
        } else {
          // 첫 번째 발견된 SKU
          fileSkuMap.set(sku, rowIndex);
          
          // DB에 이미 있는 SKU인지 체크 (기존 상품은 제외)
          if (existingSkus.has(sku)) {
            validation.ok = false;
            validation.errors.push(`SKU already exists in database: ${sku}`);
            console.log(`⏭️ [EXCEL IMPORT] Row ${rowIndex}: Skipping - SKU already exists in DB: ${sku}`);
          }
        }
      }

      // 상품명 검증 (필수)
      if (!name || (typeof name === 'string' && !name.trim())) {
        validation.ok = false;
        validation.errors.push('Product name is required');
      } else {
        mapped.name = String(name).trim();
      }

      // 할인율 랜덤 배정 함수 (10~60%, 비율에 따라 가중치 적용)
      function getRandomDiscountRate() {
        const discountOptions = [
          // 10%대: 가중치 1
          ...Array(1).fill().map(() => Math.floor(Math.random() * 10) + 10),
          // 20%대: 가중치 2
          ...Array(2).fill().map(() => Math.floor(Math.random() * 10) + 20),
          // 30%대: 가중치 3
          ...Array(3).fill().map(() => Math.floor(Math.random() * 10) + 30),
          // 40%: 가중치 2
          ...Array(2).fill(40),
          // 50%: 가중치 1
          ...Array(1).fill(50),
          // 60%: 가중치 1
          ...Array(1).fill(60),
        ];
        return discountOptions[Math.floor(Math.random() * discountOptions.length)];
      }

      // 카테고리 경로 추출 (가격 계산을 위해 먼저 처리)
      let categoryPathText = null;
      if (categoryPath && String(categoryPath).trim()) {
        categoryPathText = String(categoryPath).trim();
      }

      // 가격: 우수회원5 컬럼 값을 도매가로 보고 가격 구간 배수 적용
      if (vip5 !== null && vip5 !== undefined && vip5 !== '') {
        const vip5Num = Number(vip5);
        if (!isNaN(vip5Num) && vip5Num >= 0) {
          const { price } = calculateSalePriceFromWholesale(vip5Num);
          mapped.price = price;
          
          // 할인율 랜덤 배정
          const discountRate = getRandomDiscountRate();
          mapped.discountRate = discountRate;
          
          // 원래 가격 역산: 현재 가격 / (1 - 할인율/100), 100원 단위로 올림
          const originalPrice = mapped.price / (1 - discountRate / 100);
          mapped.originalPrice = roundUpToHundreds(originalPrice);
        } else {
          validation.ok = false;
          validation.errors.push(`VIP5 price must be a valid number (got: ${vip5}, type: ${typeof vip5})`);
          // 디버깅: 첫 번째 행에서만 상세 로그
          if (i === 0) {
            console.log(`❌ [EXCEL IMPORT] Row ${rowIndex}: Invalid VIP5 value:`, {
              raw: vip5,
              type: typeof vip5,
              number: vip5Num,
              isNaN: isNaN(vip5Num)
            });
          }
        }
      } else {
        validation.ok = false;
        validation.errors.push('VIP5 price is required');
        // 디버깅: 첫 번째 행에서만 상세 로그
        if (i === 0) {
          console.log(`❌ [EXCEL IMPORT] Row ${rowIndex}: VIP5 is missing or empty:`, {
            vip5,
            isNull: vip5 === null,
            isUndefined: vip5 === undefined,
            isEmpty: vip5 === '',
            type: typeof vip5
          });
        }
      }

      // 카테고리 처리 (옵션, 있으면 검증)
      if (categoryPath && String(categoryPath).trim()) {
        try {
          const categoryStartTime = Date.now();
          const categoryPathStr = String(categoryPath).trim();
          console.log(`🔍 [EXCEL IMPORT] Row ${rowIndex}: Processing category: "${categoryPathStr}"`);
          
          const categoryResult = await upsertCategoryFromPath(categoryPathStr);
          
          const categoryDuration = Date.now() - categoryStartTime;
          if (categoryDuration > 1000) {
            console.warn(`⚠️ [EXCEL IMPORT] Row ${rowIndex}: Category processing took ${categoryDuration}ms`);
          }
          
          const parts = categoryPathStr.split('>').map(p => p.trim()).filter(p => p);
          
          mapped.category.l1 = parts[0] || null;
          mapped.category.l2 = parts[1] || null;
          mapped.category.l3 = parts[2] || null;
          mapped.categoryId = categoryResult.category._id.toString();
          
          console.log(`✅ [EXCEL IMPORT] Row ${rowIndex}: Category resolved to ID: ${mapped.categoryId}`);
        } catch (categoryError) {
          console.error(`❌ [EXCEL IMPORT] Row ${rowIndex}: Category error:`, categoryError.message);
          validation.ok = false;
          validation.errors.push(`Category error: ${categoryError.message}`);
        }
      } else {
        validation.ok = false;
        validation.errors.push('Category is required');
      }

      const rowDuration = Date.now() - rowStartTime;
      if (rowDuration > 2000) {
        console.warn(`⚠️ [EXCEL IMPORT] Row ${rowIndex}: Processing took ${rowDuration}ms`);
      }

      // 미리보기 아이템 생성
      const previewItem = {
        rowIndex,
        raw,
        mapped,
        validation,
      };
      
      // 중복된 SKU는 미리보기에 추가하지 않음 (실시간 제외)
      // 기존 상품도 미리보기에서 제외 (신규 상품만 포함)
      if (!fileDuplicateSkus.has(sku) && validation.ok && (!sku || !existingSkus.has(sku))) {
        // 유효하고 중복이 아니며 기존 상품이 아닌 항목만 previewData에 추가
        previewData.push(previewItem);
        console.log(`✅ [EXCEL IMPORT] Row ${rowIndex} added (new): SKU: ${mapped.sku} | Name: ${mapped.name} (${previewData.length}/${targetValidProducts})`);
      } else {
        // 1개씩 처리 완료 후 콘솔 로그 (유효하지 않거나 중복이거나 기존 상품인 경우)
        const errors = validation.errors.length > 0 ? ` - ${validation.errors.join(', ')}` : '';
        console.log(`⏭️ [EXCEL IMPORT] Row ${rowIndex} skipped: SKU: ${mapped.sku || 'N/A'} | Name: ${mapped.name || 'N/A'}${errors}`);
      }
      
      // 목표 개수에 도달하면 중단 (중복 제외한 유효 항목 기준)
      if (previewData.length >= targetValidProducts) {
        console.log(`🎯 [EXCEL IMPORT] Target reached: ${previewData.length} valid unique products found. Stopping...`);
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    // previewData에는 이미 중복이 제외된 유효한 항목만 있음
    const validCount = previewData.length;
    // 실제 처리한 행 수에서 유효 행 수를 뺀 것
    const invalidCount = Math.max(0, actualRowsProcessed - validCount);
    
    console.log(`📊 [EXCEL IMPORT] Processing summary: ${actualRowsProcessed} total rows processed, ${validCount} valid unique products added to preview, ${invalidCount} invalid/duplicate rows excluded, ${fileDuplicateSkus.size} duplicate SKUs found in file`);

    console.log('✅ [EXCEL IMPORT] Processing completed:', {
      totalRows: previewData.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duration: totalDuration + 'ms',
      durationSeconds: (totalDuration / 1000).toFixed(2) + 's'
    });

    const responseData = {
      preview: previewData,
      totalRows: previewData.length,
      validRows: validCount,
      invalidRows: invalidCount,
    };

    console.log('📤 [EXCEL IMPORT] Sending response...');
    console.log('📤 [EXCEL IMPORT] Response data size:', JSON.stringify(responseData).length, 'bytes');
    
    res.json(responseData);
    
    console.log('✅ [EXCEL IMPORT] Response sent successfully at', new Date().toISOString());
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('❌ [EXCEL IMPORT] ERROR after', totalDuration + 'ms:', error.message);
    console.error('❌ [EXCEL IMPORT] Error stack:', error.stack);
    console.error('❌ [EXCEL IMPORT] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // 반드시 응답 보내기
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Excel import failed: ' + (error.message || 'Unknown error'),
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      console.error('⚠️ [EXCEL IMPORT] Response already sent, cannot send error response');
    }
  }
}

// 상품 등록 커밋 (최대 1000개까지 처리)
async function commitImport(req, res, next) {
  try {
    const { preview } = req.body;

    if (!preview || !Array.isArray(preview)) {
      return res.status(400).json({ message: 'Preview data is required' });
    }

    // 유효한 행만 필터링 (최대 1000개)
    const validRows = preview.filter(item => item.validation && item.validation.ok).slice(0, 1000);

    if (validRows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    const rowsToProcess = validRows;

    // 엑셀 파일 내 중복 SKU 체크 (먼저 체크하여 중복 표시)
    const skuMap = new Map(); // SKU -> 첫 번째 발견된 rowIndex
    const duplicateRows = new Set(); // 중복된 rowIndex들
    
    rowsToProcess.forEach((item, index) => {
      const sku = item.mapped?.sku;
      if (sku) {
        if (skuMap.has(sku)) {
          // 중복 발견: 현재 행과 이전에 발견된 행 모두 중복으로 표시
          duplicateRows.add(item.rowIndex);
          const firstIndex = skuMap.get(sku);
          duplicateRows.add(rowsToProcess[firstIndex].rowIndex);
        } else {
          skuMap.set(sku, index);
        }
      }
    });

    // DB에 존재하는 SKU 일괄 조회 (가격 업데이트를 위해 전체 정보 조회)
    const skusToCheck = Array.from(skuMap.keys());
    const existingProductsMap = new Map();
    const existingProducts = await Product.find({ sku: { $in: skusToCheck } }).lean();
    existingProducts.forEach(p => {
      existingProductsMap.set(p.sku.toUpperCase(), p);
    });
    const existingSkus = new Set(existingProducts.map(p => p.sku.toUpperCase()));

    const results = {
      successCount: 0,
      failCount: 0,
      failItems: [],
      duplicateItems: [],
      processedCount: rowsToProcess.length,
      totalValidRows: validRows.length,
    };

    const totalItems = rowsToProcess.length;
    console.log(`📦 [EXCEL COMMIT] Starting import of ${totalItems} products...`);
    
    // 첫 번째 항목의 구조 확인 (디버깅)
    if (rowsToProcess.length > 0) {
      const firstItem = rowsToProcess[0];
      console.log(`🔍 [EXCEL COMMIT] First item structure check:`, {
        hasRaw: !!firstItem.raw,
        rawKeys: firstItem.raw ? Object.keys(firstItem.raw) : [],
        productUrl: firstItem.raw?.productUrl,
        rowIndex: firstItem.rowIndex,
        sku: firstItem.mapped?.sku,
        name: firstItem.mapped?.name
      });
    }

    for (let index = 0; index < rowsToProcess.length; index++) {
      const item = rowsToProcess[index];
      
      try {
        const { mapped } = item;
        const sku = mapped.sku;

        // 엑셀 파일 내 중복 체크
        if (duplicateRows.has(item.rowIndex)) {
          results.failCount++;
          results.duplicateItems.push({
            rowIndex: item.rowIndex,
            sku: sku,
            name: mapped.name,
            reason: `Duplicate SKU in Excel file: ${sku}`,
          });
          results.failItems.push({
            rowIndex: item.rowIndex,
            sku: sku,
            name: mapped.name,
            reason: `Duplicate SKU in Excel file: ${sku}`,
          });
          continue;
        }

        // DB에 존재하는 상품인지 체크 (가격 업데이트 처리)
        const existingProduct = existingProductsMap.get(sku.toUpperCase());
        const isExistingProduct = !!existingProduct;

        // 카테고리 재확인 및 upsert
        let categoryId = mapped.categoryId;
        if (item.raw && item.raw.categoryPath) {
          try {
            const categoryResult = await upsertCategoryFromPath(String(item.raw.categoryPath).trim());
            categoryId = categoryResult.category._id;
          } catch (categoryError) {
            results.failCount++;
            results.failItems.push({
              rowIndex: item.rowIndex,
              sku: mapped.sku,
              name: mapped.name,
              reason: `Category error: ${categoryError.message}`,
            });
            continue;
          }
        }

        // 카테고리 경로 텍스트 생성
        const categoryParts = [];
        if (mapped.category.l1) categoryParts.push(mapped.category.l1);
        if (mapped.category.l2) categoryParts.push(mapped.category.l2);
        if (mapped.category.l3) categoryParts.push(mapped.category.l3);
        const categoryPathText = categoryParts.join(' > ');

        // 이미지 추출 (상품URL이 있는 경우) - 순차 처리로 복원
        let mainImage = '';
        let detailImages = [];
        let descriptionHtml = '';
        
        // raw 필드가 없거나 productUrl이 없는 경우 확인
        if (!item.raw) {
          console.warn(`⚠️ [EXCEL COMMIT] Row ${item.rowIndex}: No raw field found - SKU: ${sku}, Name: ${mapped.name}`);
        }
        
        const productUrl = item.raw?.productUrl;
        if (productUrl && String(productUrl).trim()) {
          const urlToFetch = String(productUrl).trim();
          console.log(`🖼️ [EXCEL COMMIT] Row ${item.rowIndex}: Fetching images from URL: ${urlToFetch}`);
          try {
            const imageResult = await fetchProductImages(urlToFetch);
            mainImage = imageResult.mainImage || '';
            detailImages = imageResult.detailImages || [];
            console.log(`✅ [EXCEL COMMIT] Row ${item.rowIndex}: Images fetched - Main: ${mainImage ? mainImage.substring(0, 80) + '...' : 'No'}, Details: ${detailImages.length}`);
            
            if (mainImage) {
              console.log(`📸 [EXCEL COMMIT] Row ${item.rowIndex}: Main image URL: ${mainImage}`);
            }
            
            // 상세 이미지 로그 출력
            if (detailImages.length > 0) {
              console.log(`📸 [EXCEL COMMIT] Row ${item.rowIndex}: Detail images URLs (${detailImages.length}):`, detailImages.slice(0, 3).map(url => url.substring(0, 80) + '...'));
              // 상세 이미지들을 HTML 형식으로 변환하여 description에 추가
              const imageTags = detailImages.map(imgUrl => `<img src="${imgUrl}" alt="${mapped.name}" style="max-width: 100%; height: auto; margin: 10px 0; display: block;" />`).join('\n');
              descriptionHtml = `<div class="product-detail-images">${imageTags}</div>`;
              console.log(`📝 [EXCEL COMMIT] Row ${item.rowIndex}: Description HTML created with ${detailImages.length} images`);
            } else {
              console.log(`⚠️ [EXCEL COMMIT] Row ${item.rowIndex}: No detail images found from URL`);
            }
          } catch (imageError) {
            console.error(`❌ [EXCEL COMMIT] Row ${item.rowIndex}: Image fetch error:`, imageError.message);
            console.error(`❌ [EXCEL COMMIT] Row ${item.rowIndex}: Image fetch error stack:`, imageError.stack);
            // 이미지 추출 실패해도 상품 등록은 계속 진행
          }
        } else {
          if (index < 5) { // 처음 5개만 로그
            console.log(`⚠️ [EXCEL COMMIT] Row ${item.rowIndex}: No product URL provided - SKU: ${sku}, raw: ${item.raw ? 'exists' : 'missing'}, productUrl: ${productUrl || 'empty'}`);
          }
        }

        // 기존 상품인 경우 업데이트, 신규 상품인 경우 생성
        if (isExistingProduct) {
          // 기존 상품 업데이트 (가격, 이미지, 카테고리, 상품명 등)
          const updatePayload = {
            name: mapped.name, // 상품명 업데이트
            price: mapped.price,
            originalPrice: mapped.originalPrice || null,
            discountRate: mapped.discountRate || 0,
            categoryId: categoryId,
            categoryPathText: categoryPathText,
            categoryMain: mapped.category.l1 || null,
            categoryMid: mapped.category.l2 || null,
            categorySub: mapped.category.l3 || null,
            category: mapped.category.l3 || mapped.category.l2 || mapped.category.l1 || '',
          };
          
          // 이미지가 추출된 경우에만 업데이트
          if (mainImage) {
            updatePayload.image = mainImage;
          }
          if (detailImages.length > 0) {
            updatePayload.images = detailImages.slice(0, 4);
          }
          if (descriptionHtml) {
            updatePayload.description = descriptionHtml;
          }
          
          console.log(`🔄 [EXCEL COMMIT] Row ${item.rowIndex}: Updating product - SKU: ${mapped.sku}, Name: ${mapped.name}, Price: ${mapped.price}, OriginalPrice: ${mapped.originalPrice}, DiscountRate: ${mapped.discountRate}`);
          if (mainImage) {
            console.log(`📸 [EXCEL COMMIT] Row ${item.rowIndex}: Updating images - Main: ${mainImage.substring(0, 80)}..., Details: ${detailImages.length}`);
          }
          
          await Product.findByIdAndUpdate(
            existingProduct._id,
            { $set: updatePayload },
            { new: true, runValidators: true }
          );
          
          results.successCount++;
        } else {
          // 신규 상품 생성
          const productPayload = {
            sku: mapped.sku,
            name: mapped.name,
            price: mapped.price,
            originalPrice: mapped.originalPrice || null,
            discountRate: mapped.discountRate || 0,
            categoryId: categoryId,
            categoryPathText: categoryPathText,
            categoryMain: mapped.category.l1 || null,
            categoryMid: mapped.category.l2 || null,
            categorySub: mapped.category.l3 || null,
            category: mapped.category.l3 || mapped.category.l2 || mapped.category.l1 || '',
            image: mainImage, // 대표 이미지
            images: detailImages.slice(0, 4), // 상세 이미지 (최대 4개)
            description: descriptionHtml, // 상세 설명에 이미지 포함
            stockManagement: 'track',
            totalStock: 0,
            status: 'active', // 판매중으로 설정
            shipping: {
              isFree: false,
              fee: 3000,
              estimatedDays: 3,
            },
            returnPolicy: {
              isReturnable: true,
              returnDays: 15,
              returnFee: 0,
            },
          };
          
          // 최종 저장 전 로그
          console.log(`💾 [EXCEL COMMIT] Row ${item.rowIndex}: Creating product - SKU: ${mapped.sku}, Name: ${mapped.name}`);
          console.log(`💾 [EXCEL COMMIT] Row ${item.rowIndex}: Image data - Main: ${mainImage ? mainImage.substring(0, 80) + '...' : '(empty)'}, Details: ${detailImages.length}, Description length: ${descriptionHtml.length}`);

          const newProduct = await Product.create(productPayload);
          
          // 저장 후 확인 로그 - 실제 저장된 값 확인
          console.log(`✅ [EXCEL COMMIT] Row ${item.rowIndex}: Product created - ID: ${newProduct._id}`);
          console.log(`✅ [EXCEL COMMIT] Row ${item.rowIndex}: Saved image field: ${newProduct.image ? newProduct.image.substring(0, 80) + '...' : '(empty)'}`);
          console.log(`✅ [EXCEL COMMIT] Row ${item.rowIndex}: Saved images array: ${newProduct.images?.length || 0} items${newProduct.images?.length > 0 ? ' - ' + newProduct.images.slice(0, 2).map(img => img.substring(0, 50) + '...').join(', ') : ''}`);
          
          // 신상품 알림 구독자에게 알림 전송 (비동기로 처리, 에러가 발생해도 상품 생성은 성공)
          try {
            const ProductNotificationSubscription = require('../models/productNotificationSubscription');
            const Notification = require('../models/notification');
            
            const subscribers = await ProductNotificationSubscription.find({ isActive: true }).populate('user');
            
            if (subscribers.length > 0) {
              const notifications = subscribers.map(sub => ({
                user: sub.user._id,
                type: 'new_product',
                title: '새로운 상품이 등록되었습니다',
                message: `${newProduct.name}이(가) 등록되었습니다. 지금 확인해보세요!`,
                relatedProduct: newProduct._id,
              }));
              
              // 알림 생성 (배치 처리)
              await Notification.insertMany(notifications);
            }
          } catch (notificationError) {
            // 알림 전송 실패해도 상품 생성은 성공으로 처리
            console.error('신상품 알림 전송 실패:', notificationError);
          }
          
          results.successCount++;
        }
      } catch (error) {
        results.failCount++;
        results.failItems.push({
          rowIndex: item.rowIndex,
          sku: mapped.sku,
          name: mapped.name,
          reason: error.message || 'Unknown error',
        });
      }
      
      // 100개당 또는 마지막 항목일 때 진행 상황 로그 (처리 후 출력)
      const processed = index + 1;
      if (processed % 100 === 0 || processed === rowsToProcess.length) {
        const percentage = ((processed / totalItems) * 100).toFixed(1);
        console.log(`📊 [EXCEL COMMIT] Progress: ${processed}/${totalItems} (${percentage}%) - Success: ${results.successCount}, Failed: ${results.failCount}, Duplicates: ${results.duplicateItems.length}`);
      }
    }

    console.log(`✅ [EXCEL COMMIT] Import completed! Total: ${totalItems}, Success: ${results.successCount}, Failed: ${results.failCount} (${results.duplicateItems.length} duplicates)`);
    
    res.json({
      ...results,
      message: `Processed ${results.processedCount} items. Success: ${results.successCount}, Failed: ${results.failCount} (${results.duplicateItems.length} duplicates)`,
    });
  } catch (error) {
    console.error('Commit import error:', error);
    next(error);
  }
}

// 유사한 상품 추천 (카테고리 + 상품 이름 유사도 고려)
async function getSimilarProducts(req, res, next) {
  try {
    const { id } = req.params;
    const limit = Math.max(parseInt(req.query.limit, 10) || 4, 1);
    
    // 현재 상품 조회
    const currentProduct = await Product.findById(id).lean();
    if (!currentProduct) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 같은 카테고리의 상품들을 가져오기
    let categoryFilter = null;
    
    // 우선순위: categoryMain > categoryMid > categorySub > category
    if (currentProduct.categoryMain) {
      categoryFilter = currentProduct.categoryMain;
    } else if (currentProduct.categoryMid) {
      categoryFilter = currentProduct.categoryMid;
    } else if (currentProduct.categorySub) {
      categoryFilter = currentProduct.categorySub;
    } else if (currentProduct.category) {
      categoryFilter = currentProduct.category;
    }

    if (!categoryFilter) {
      return res.json({ items: [] });
    }

    // 같은 카테고리의 모든 상품 조회 (현재 상품 제외)
    const products = await Product.find({
      $or: [
        { categoryMain: categoryFilter },
        { categoryMid: categoryFilter },
        { categorySub: categoryFilter },
        { category: categoryFilter },
      ],
      _id: { $ne: currentProduct._id },
    }).lean();

    if (products.length === 0) {
      return res.json({ items: [] });
    }

    // 상품 이름 유사도 계산 및 정렬
    const currentProductName = currentProduct.name || '';
    const productsWithSimilarity = products.map(product => {
      const productName = product.name || '';
      const nameSimilarity = calculateStringSimilarity(currentProductName, productName);
      
      // 카테고리 일치도 점수 추가
      let categoryScore = 0;
      if (product.categoryMain === currentProduct.categoryMain) categoryScore += 0.3;
      if (product.categoryMid === currentProduct.categoryMid) categoryScore += 0.3;
      if (product.categorySub === currentProduct.categorySub) categoryScore += 0.4;
      
      // 최종 점수: 이름 유사도 60% + 카테고리 일치도 40%
      const finalScore = (nameSimilarity * 0.6) + (categoryScore * 0.4);
      
      return {
        product,
        similarity: finalScore,
        nameSimilarity,
        categoryScore,
      };
    });

    // 유사도 순으로 정렬
    productsWithSimilarity.sort((a, b) => b.similarity - a.similarity);

    // 상위 limit개만 반환
    const topProducts = productsWithSimilarity
      .slice(0, limit)
      .map(item => item.product);

    // 리뷰 집계 추가
    const productsWithReviews = await Promise.all(
      topProducts.map(async (product) => {
        try {
          const reviewStats = await Review.aggregate([
            { $match: { productId: product._id } },
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
              }
            }
          ]);

          if (reviewStats.length > 0) {
            product.rating = Math.round(reviewStats[0].averageRating * 10) / 10;
            product.reviewCount = reviewStats[0].reviewCount;
          } else {
            product.rating = 0;
            product.reviewCount = 0;
          }
        } catch (error) {
          console.error(`Failed to aggregate reviews for product ${product._id}:`, error);
          product.rating = 0;
          product.reviewCount = 0;
        }
        return product;
      })
    );

    return res.json({ items: productsWithReviews });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  importExcel,
  commitImport,
  getSimilarProducts,
};


