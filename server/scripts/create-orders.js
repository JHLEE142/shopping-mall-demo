const Order = require('../src/models/order');
const User = require('../src/models/user');
const Product = require('../src/models/product');
const { connectToDatabase } = require('../src/config/database');
require('dotenv').config();

const ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'];
const PAYMENT_METHODS = ['card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'toss'];
const SHIPPING_CARRIERS = ['CJ대한통운', '한진택배', '로젠택배', '롯데택배'];

// 주문 번호 생성 함수
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${random}`;
}

// 랜덤 날짜 생성 (최근 6개월 내)
function getRandomDate(daysAgo = 0) {
  const now = new Date();
  const days = daysAgo + Math.floor(Math.random() * 180); // 최근 6개월
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date;
}

// 랜덤 배열 요소 선택
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 랜덤 숫자 범위
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createOrders() {
  try {
    const mongoUri =
      process.env.MONGODB_ATLAS_URL ||
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/shopping-mall-demo';

    console.log('Connecting to database...');
    await connectToDatabase(mongoUri);

    // 사용자와 상품 가져오기
    const users = await User.find({ user_type: 'customer' }).lean();
    const products = await Product.find().lean();

    if (users.length === 0) {
      console.log('❌ No customers found. Please create customers first.');
      process.exit(1);
    }

    if (products.length === 0) {
      console.log('❌ No products found. Please create products first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} customers and ${products.length} products`);
    console.log('Creating 200 orders...\n');

    const orders = [];
    const orderNumbers = new Set();

    for (let i = 0; i < 200; i++) {
      // 고유한 주문 번호 생성
      let orderNumber;
      do {
        orderNumber = generateOrderNumber();
      } while (orderNumbers.has(orderNumber));
      orderNumbers.add(orderNumber);

      // 랜덤 사용자 선택 (70% 회원, 30% 비회원)
      const isGuest = Math.random() < 0.3;
      const user = isGuest ? null : getRandomItem(users);

      // 주문 상태 결정 (대부분 paid 또는 fulfilled)
      const statusWeights = {
        paid: 0.4,
        fulfilled: 0.4,
        pending: 0.1,
        cancelled: 0.08,
        refunded: 0.02,
      };
      const status = getWeightedRandom(ORDER_STATUSES, statusWeights);

      // 주문 아이템 생성 (1-3개)
      const itemCount = getRandomInt(1, 3);
      const selectedProducts = [];
      const productIds = new Set();
      
      for (let j = 0; j < itemCount; j++) {
        let product;
        do {
          product = getRandomItem(products);
        } while (productIds.has(product._id.toString()));
        productIds.add(product._id.toString());
        selectedProducts.push(product);
      }

      const items = selectedProducts.map((product) => {
        const quantity = getRandomInt(1, 3);
        const unitPrice = product.price || 0;
        const lineDiscount = Math.random() < 0.2 ? Math.floor(unitPrice * 0.1) : 0; // 20% 확률로 10% 할인
        const lineTotal = unitPrice * quantity - lineDiscount;

        return {
          product: product._id,
          name: product.name,
          sku: product.sku || '',
          thumbnail: product.image || '',
          options: new Map(),
          quantity,
          unitPrice,
          lineDiscount,
          lineTotal,
        };
      });

      // 요약 계산
      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const discountTotal = items.reduce((sum, item) => sum + item.lineDiscount, 0);
      const shippingFee = subtotal > 50000 ? 0 : getRandomInt(2500, 3500); // 5만원 이상 무료배송
      const tax = Math.floor((subtotal - discountTotal) * 0.1); // 10% 부가세
      const grandTotal = subtotal - discountTotal + shippingFee + tax;

      // 결제 정보
      const paymentMethod = status === 'cancelled' || status === 'refunded' ? '' : getRandomItem(PAYMENT_METHODS);
      const paymentStatus = status === 'paid' || status === 'fulfilled' ? 'completed' : 
                           status === 'cancelled' ? 'cancelled' : 
                           status === 'refunded' ? 'refunded' : 'ready';
      const paidAt = status === 'paid' || status === 'fulfilled' ? getRandomDate(getRandomInt(0, 30)) : null;

      // 배송 정보
      const shippingAddress = user?.address || '서울특별시 강남구 테헤란로 123';
      const addressParts = shippingAddress.split(' ');
      const postalCode = getRandomInt(10000, 99999).toString();

      // 주문 일시
      const placedAt = getRandomDate(getRandomInt(0, 180));

      const order = {
        orderNumber,
        user: user?._id || null,
        guestName: isGuest ? getRandomItem(['홍길동', '김철수', '이영희', '박민수', '최지영']) : '',
        guestEmail: isGuest ? `guest${i}@example.com` : '',
        contact: {
          phone: `010-${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
          email: user?.email || (isGuest ? `guest${i}@example.com` : ''),
        },
        status,
        items,
        summary: {
          currency: 'KRW',
          subtotal,
          discountTotal,
          shippingFee,
          tax,
          grandTotal,
        },
        payment: {
          method: paymentMethod,
          status: paymentStatus,
          amount: grandTotal,
          currency: 'KRW',
          transactionId: paymentStatus === 'completed' ? `TXN${Date.now()}${i}` : '',
          paidAt,
        },
        shipping: {
          address: {
            name: user?.name || (isGuest ? getRandomItem(['홍길동', '김철수', '이영희', '박민수', '최지영']) : ''),
            phone: `010-${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
            postalCode,
            address1: shippingAddress,
            address2: Math.random() < 0.3 ? `${getRandomInt(1, 100)}동 ${getRandomInt(1, 1000)}호` : '',
          },
          request: Math.random() < 0.2 ? '문 앞에 놓아주세요' : '',
          carrier: status === 'fulfilled' ? getRandomItem(SHIPPING_CARRIERS) : '',
          trackingNumber: status === 'fulfilled' ? `${getRandomInt(1000000000, 9999999999)}` : '',
          dispatchedAt: status === 'fulfilled' ? getRandomDate(getRandomInt(0, 20)) : null,
          deliveredAt: status === 'fulfilled' && Math.random() < 0.7 ? getRandomDate(getRandomInt(0, 10)) : null,
        },
        placedAt,
        createdAt: placedAt,
        updatedAt: placedAt,
      };

      orders.push(order);
    }

    // 배치로 주문 생성
    console.log('Inserting orders into database...');
    const result = await Order.insertMany(orders, { ordered: false });

    console.log(`\n✅ Successfully created ${result.length} orders!`);
    console.log(`\nOrder status breakdown:`);
    const statusCount = {};
    orders.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate order number detected. Please try again.');
    }
    process.exit(1);
  }
}

// 가중치 기반 랜덤 선택
function getWeightedRandom(items, weights) {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    const weight = weights[item] || 0;
    if (random < weight) {
      return item;
    }
    random -= weight;
  }
  
  return items[0];
}

createOrders();

