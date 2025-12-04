# ShopBuddy Backend Package

ShopBuddy 백엔드 패키지 - 데이터베이스 스키마, API 라우터, 컨트롤러, 미들웨어를 포함한 완전한 백엔드 패키지입니다.

## 설치

```bash
npm install @shopbuddy/backend
```

또는 로컬 패키지로 사용:

```bash
npm install ./packages/shopbuddy-backend-package
```

## 사용 방법

### 1. 데이터베이스 연결

```javascript
import { connectDB } from '@shopbuddy/backend';
import express from 'express';

const app = express();

// MongoDB 연결
await connectDB();
```

### 2. 모델 사용

```javascript
import { Product, User, Order, Category } from '@shopbuddy/backend';

// 상품 조회
const products = await Product.find({ status: 'active' });

// 사용자 생성
const user = new User({
  name: '홍길동',
  email: 'hong@example.com',
  password: 'hashedPassword',
  role: 'buyer'
});
await user.save();
```

### 3. 라우터 사용

```javascript
import express from 'express';
import { routes } from '@shopbuddy/backend';

const app = express();
app.use(express.json());

// 모든 API 라우트 연결
app.use('/api', routes);
```

### 4. 미들웨어 사용

```javascript
import { authenticate, authorize } from '@shopbuddy/backend';

// 인증이 필요한 라우트
app.get('/api/users/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// 관리자 권한이 필요한 라우트
app.delete('/api/products/:id', authenticate, authorize('admin'), (req, res) => {
  // 관리자만 접근 가능
});
```

### 5. 유틸리티 함수 사용

```javascript
import { successResponse, errorResponse, paginatedResponse, calculatePagination } from '@shopbuddy/backend';

// 성공 응답
successResponse(res, { products }, '상품 목록 조회 성공');

// 에러 응답
errorResponse(res, '상품을 찾을 수 없습니다.', 404);

// 페이지네이션 응답
const pagination = calculatePagination(page, limit, total);
paginatedResponse(res, { products }, pagination);
```

## 포함된 모델

- **User** - 사용자
- **Seller** - 판매자
- **SellerApplication** - 판매자 신청
- **Category** - 카테고리
- **Product** - 상품
- **ProductOption** - 상품 옵션
- **ProductImage** - 상품 이미지
- **Supplier** - 공급사
- **SupplierProduct** - 공급사 상품
- **Cart** - 장바구니
- **Order** - 주문
- **Payment** - 결제
- **Refund** - 환불
- **Shipment** - 배송
- **SellerPayout** - 판매자 정산
- **Review** - 리뷰
- **Coupon** - 쿠폰
- **UserCoupon** - 사용자 쿠폰
- **Conversation** - AI 대화 세션
- **Message** - 메시지
- **AIIntent** - AI 의도
- **AIActionLog** - AI 액션 로그
- **PageView** - 페이지 뷰
- **TrafficSource** - 트래픽 소스
- **Visitor** - 방문자

## 포함된 라우터

- `/api/auth` - 인증
- `/api/users` - 사용자
- `/api/seller-applications` - 판매자 신청
- `/api/sellers` - 판매자
- `/api/categories` - 카테고리
- `/api/products` - 상품
- `/api/carts` - 장바구니
- `/api/orders` - 주문
- `/api/payments` - 결제
- `/api/refunds` - 환불
- `/api/shipments` - 배송
- `/api/payouts` - 정산
- `/api/reviews` - 리뷰
- `/api/ai` - AI 쇼핑 비서
- `/api/suppliers` - 공급사
- `/api/admin` - 관리자
- `/api/coupons` - 쿠폰
- `/api/statistics` - 통계
- `/api/traffic` - 트래픽

## 환경 변수

`.env` 파일에 다음 변수를 설정하세요:

```env
MONGODB_URI=mongodb://localhost:27017/shopbuddy
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## 요구사항

- Node.js 18+
- MongoDB 6.0+
- Express 4.18+

## 라이선스

ISC

