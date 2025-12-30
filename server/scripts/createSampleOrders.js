require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Order = require('../src/models/order');
const Product = require('../src/models/product');

const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';

// 주문 상태 목록
const ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled'];

// 랜덤 날짜 생성 함수 (최근 90일 내)
function randomDate(daysAgo = 90) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

// 고유 주문 번호 생성
async function generateUniqueOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  let uniqueNumber = '';
  let exists = true;
  
  while (exists) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    uniqueNumber = `${datePart}-${randomPart}`;
    exists = await Order.exists({ orderNumber: uniqueNumber });
  }
  
  return uniqueNumber;
}

// 샘플 주문 생성
async function createSampleOrders() {
  try {
    console.log('MongoDB 연결 중...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB 연결 성공');

    // 사용자 찾기
    const adminUser = await User.findOne({ email: 'admin@admin.com' });
    const customerUser = await User.findOne({ email: 'ljh951006@naver.com' });

    if (!adminUser) {
      console.error('admin@admin.com 사용자를 찾을 수 없습니다.');
      return;
    }

    if (!customerUser) {
      console.error('ljh951006@naver.com 사용자를 찾을 수 없습니다.');
      return;
    }

    console.log(`관리자 ID: ${adminUser._id}`);
    console.log(`고객 ID: ${customerUser._id}`);

    // 상품 목록 가져오기
    const products = await Product.find().limit(50);
    if (products.length === 0) {
      console.error('상품이 없습니다. 먼저 상품을 생성해주세요.');
      return;
    }

    console.log(`${products.length}개의 상품을 찾았습니다.`);

    const users = [
      { user: adminUser, email: 'admin@admin.com' },
      { user: customerUser, email: 'ljh951006@naver.com' },
    ];

    for (const { user, email } of users) {
      console.log(`\n${email} 계정의 주문 생성 중...`);
      
      const orders = [];
      
      for (let i = 0; i < 10; i++) {
        // 랜덤 주문 상태 선택
        const status = ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)];
        
        // 랜덤 상품 1-3개 선택
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = [];
        const usedIndices = new Set();
        
        for (let j = 0; j < itemCount; j++) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * products.length);
          } while (usedIndices.has(randomIndex));
          usedIndices.add(randomIndex);
          selectedProducts.push(products[randomIndex]);
        }

        // 주문 아이템 생성
        const items = selectedProducts.map((product) => {
          const quantity = Math.floor(Math.random() * 3) + 1;
          const unitPrice = product.priceSale || product.price || 10000;
          const lineTotal = unitPrice * quantity;

          return {
            product: product._id,
            name: product.name,
            sku: product.sku || '',
            thumbnail: product.image || '',
            options: {},
            quantity,
            unitPrice,
            lineDiscount: 0,
            lineTotal,
          };
        });

        // 주문 합계 계산
        const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
        const discountTotal = items.reduce((sum, item) => sum + item.lineDiscount, 0);
        const shippingFee = subtotal >= 100000 ? 0 : 3000;
        const grandTotal = subtotal - discountTotal + shippingFee;

        // 주문 날짜 생성
        const createdAt = randomDate(90);
        const placedAt = new Date(createdAt);

        // 배송 정보 생성
        const shipping = {
          address: {
            name: user.name || '홍길동',
            phone: '010-1234-5678',
            postalCode: '12345',
            address1: user.address || '서울특별시 강남구 테헤란로',
            address2: '123-45',
          },
          request: '',
        };

        // 배송 완료일 설정 (fulfilled 상태인 경우)
        if (status === 'fulfilled') {
          const daysToDeliver = Math.floor(Math.random() * 5) + 1;
          shipping.dispatchedAt = new Date(createdAt.getTime() + daysToDeliver * 24 * 60 * 60 * 1000);
          shipping.deliveredAt = new Date(shipping.dispatchedAt.getTime() + daysToDeliver * 24 * 60 * 60 * 1000);
        } else if (status === 'paid') {
          const daysToDispatch = Math.floor(Math.random() * 3) + 1;
          shipping.dispatchedAt = new Date(createdAt.getTime() + daysToDispatch * 24 * 60 * 60 * 1000);
        }

        // 결제 정보
        const payment = {
          method: 'card',
          status: status === 'pending' ? 'ready' : 'paid',
          amount: grandTotal,
          currency: 'KRW',
          transactionId: `TXN${Date.now()}${i}`,
          receiptUrl: '',
          paidAt: status !== 'pending' ? placedAt : null,
        };

        const orderNumber = await generateUniqueOrderNumber();

        const order = {
          orderNumber,
          user: user._id,
          guestName: user.name || '',
          guestEmail: user.email || '',
          contact: {
            phone: shipping.address.phone,
            email: user.email || '',
          },
          status,
          items,
          summary: {
            currency: 'KRW',
            subtotal,
            discountTotal,
            shippingFee,
            tax: 0,
            grandTotal,
            couponDiscount: 0,
          },
          payment,
          shipping,
          notes: '',
          placedAt,
          createdAt,
          updatedAt: createdAt,
        };

        orders.push(order);
      }

      // 주문 일괄 생성
      const createdOrders = await Order.insertMany(orders);
      console.log(`${email} 계정에 ${createdOrders.length}개의 주문이 생성되었습니다.`);
      
      // 생성된 주문 번호 출력
      createdOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.orderNumber} - ${order.status} - ${order.summary.grandTotal.toLocaleString()}원`);
      });
    }

    console.log('\n모든 주문 생성이 완료되었습니다.');
  } catch (error) {
    console.error('주문 생성 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

createSampleOrders();

