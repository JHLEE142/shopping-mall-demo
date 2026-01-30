require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Order = require('../src/models/order');
const Product = require('../src/models/product');

const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping-mall-demo';

// Slack 주문 알림 전송 함수 (orderController에서 복사)
async function sendSlackOrderNotification(order) {
  try {
    // Slack Webhook URL (환경변수에서만 가져오기)
    const SLACK_WEBHOOK_ORDER = process.env.SLACK_WEBHOOK_ORDER;
    const SLACK_WEBHOOK_ADMIN = process.env.SLACK_WEBHOOK_ADMIN;
    
    // 환경변수가 없으면 알림 전송 건너뛰기
    if (!SLACK_WEBHOOK_ORDER && !SLACK_WEBHOOK_ADMIN) {
      console.log('⚠️  Slack Webhook URL이 설정되지 않아 알림을 전송하지 않습니다.');
      console.log('환경변수 SLACK_WEBHOOK_ORDER와 SLACK_WEBHOOK_ADMIN을 설정해주세요.');
      return;
    }

    // 주문 정보 포맷팅
    const orderNumber = order.orderNumber || 'N/A';
    const totalAmount = order.summary?.grandTotal || order.summary?.total || 0;
    const formattedAmount = new Intl.NumberFormat('ko-KR').format(totalAmount);
    
    // 고객 정보
    const customerName = order.user?.name || order.guestName || '비회원';
    const customerEmail = order.user?.email || order.guestEmail || order.contact?.email || 'N/A';
    const customerPhone = order.contact?.phone || order.shipping?.address?.phone || 'N/A';
    const isGuest = order.isGuest || !order.user;
    
    // 주문 상품 목록
    const itemsList = order.items?.map((item, index) => {
      const itemTotal = item.lineTotal || (item.quantity * item.unitPrice);
      return `${index + 1}. ${item.name} (${item.quantity}개) - ${new Intl.NumberFormat('ko-KR').format(itemTotal)}원`;
    }).join('\n') || '상품 정보 없음';
    
    // 배송지 정보
    const shippingAddress = order.shipping?.address;
    const address = shippingAddress 
      ? `${shippingAddress.address1} ${shippingAddress.address2 || ''}`.trim()
      : 'N/A';
    const recipientName = shippingAddress?.name || 'N/A';
    const recipientPhone = shippingAddress?.phone || 'N/A';
    
    // 결제 정보
    const paymentStatus = order.payment?.status || 'ready';
    const paymentMethod = order.payment?.method || 'N/A';
    const paymentStatusEmoji = paymentStatus === 'paid' ? '✅' : '⏳';
    
    // 메시지 구성
    const message = `🛒 *신규 주문 접수!*

*주문번호:* #${orderNumber}
*결제 상태:* ${paymentStatusEmoji} ${paymentStatus === 'paid' ? '결제 완료' : '결제 대기'}
*결제 수단:* ${paymentMethod}
*주문 금액:* ${formattedAmount}원

*고객 정보:*
• 이름: ${customerName} ${isGuest ? '(비회원)' : '(회원)'}
• 이메일: ${customerEmail}
• 전화번호: ${customerPhone}

*주문 상품:*
${itemsList}

*배송지 정보:*
• 수령인: ${recipientName}
• 전화번호: ${recipientPhone}
• 주소: ${address}
${order.shipping?.request ? `• 배송 요청사항: ${order.shipping.request}` : ''}

*주문 시간:* ${new Date(order.placedAt || Date.now()).toLocaleString('ko-KR')}`;

    console.log('\n📤 Slack 알림 전송 중...');
    console.log('메시지 내용:');
    console.log(message);
    console.log('\n');

    // Slack 메시지 전송 (#order 채널)
    if (SLACK_WEBHOOK_ORDER) {
      const response1 = await fetch(SLACK_WEBHOOK_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
        }),
      });
      
      if (response1.ok) {
        console.log('✅ #order 채널로 알림 전송 성공');
      } else {
        console.error('❌ #order 채널 알림 전송 실패:', response1.status, response1.statusText);
      }
    }

    // 관리자 채널에도 전송 (#admin 채널)
    if (SLACK_WEBHOOK_ADMIN) {
      const response2 = await fetch(SLACK_WEBHOOK_ADMIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
        }),
      });
      
      if (response2.ok) {
        console.log('✅ #admin 채널로 알림 전송 성공');
      } else {
        console.error('❌ #admin 채널 알림 전송 실패:', response2.status, response2.statusText);
      }
    }
  } catch (error) {
    // Slack 알림 실패는 로그만 남기고 주문 생성에는 영향 없음
    console.error('❌ Slack 주문 알림 전송 중 오류:', error.message);
    throw error;
  }
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

// 테스트 주문 생성
async function createTestOrder() {
  try {
    console.log('🔌 MongoDB 연결 중...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공\n');

    // 사용자 찾기 (회원 주문 테스트)
    const customerUser = await User.findOne({ email: 'ljh951006@naver.com' });
    if (!customerUser) {
      console.log('⚠️  회원을 찾을 수 없어 비회원 주문으로 생성합니다.');
    }

    // 항상 새로운 주문 생성

    // 상품 찾기
    let selectedProduct = null;
    const products = await Product.find().limit(3);
    
    if (products.length === 0) {
      console.log('⚠️  상품이 없어 더미 상품으로 주문을 생성합니다.\n');
      // 더미 상품 정보 사용
      selectedProduct = {
        _id: new mongoose.Types.ObjectId(),
        name: '테스트 상품',
        sku: 'TEST-001',
        image: 'https://via.placeholder.com/300',
        price: 25000,
      };
    } else {
      selectedProduct = products[0];
      console.log(`📦 ${products.length}개의 상품을 찾았습니다.\n`);
    }

    // 주문 아이템 생성 (첫 번째 상품 1개)
    const quantity = 1;
    const unitPrice = selectedProduct.price || 10000;
    const lineTotal = unitPrice * quantity;

    const items = [{
      product: selectedProduct._id,
      name: selectedProduct.name,
      sku: selectedProduct.sku || 'SKU-001',
      thumbnail: selectedProduct.image || '',
      options: {},
      quantity,
      unitPrice,
      lineDiscount: 0,
      lineTotal,
    }];

    // 주문 합계 계산
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingFee = subtotal >= 20000 ? 0 : 3000;
    const grandTotal = subtotal + shippingFee;

    const orderNumber = await generateUniqueOrderNumber();

    // 주문 생성
    const orderPayload = {
      orderNumber,
      user: customerUser?._id || undefined,
      isGuest: !customerUser,
      guestName: customerUser ? undefined : '테스트 고객',
      guestEmail: customerUser ? undefined : 'test@example.com',
      contact: {
        phone: '010-1234-5678',
        email: customerUser?.email || 'test@example.com',
      },
      status: 'pending',
      items,
      summary: {
        subtotal,
        shippingFee,
        discountTotal: 0,
        grandTotal,
        currency: 'KRW',
      },
      payment: {
        method: 'card',
        status: 'ready',
        amount: grandTotal,
        currency: 'KRW',
      },
      shipping: {
        address: {
          name: '홍길동',
          phone: '010-1234-5678',
          postalCode: '12345',
          address1: '서울특별시 강남구 테헤란로 123',
          address2: '101동 101호',
        },
        request: '부재 시 경비실에 맡겨주세요',
      },
      placedAt: new Date(),
      audit: [{
        status: 'pending',
        message: '테스트 주문 생성',
      }],
    };

    console.log('📝 주문 생성 중...');
    const order = await Order.create(orderPayload);
    console.log(`✅ 주문 생성 완료: ${order.orderNumber}\n`);

    // 주문 정보 populate
    const populatedOrder = await Order.findById(order._id).populate('user', 'name email user_type');
    
    // Slack 알림 전송
    await sendSlackOrderNotification(populatedOrder);
    
    console.log('\n✨ 테스트 완료! Slack 채널을 확인해주세요.\n');
    
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// 스크립트 실행
createTestOrder();

