# Order Package

다른 프로젝트에서 재사용 가능한 완전한 구매/주문 기능 패키지입니다.

## 구조

```
order-package/
├── backend/
│   ├── models/          # MongoDB 스키마
│   ├── controllers/     # API 컨트롤러
│   ├── routes/          # Express 라우터
│   └── middleware/      # 인증 미들웨어
├── frontend/
│   ├── components/      # React 컴포넌트
│   ├── services/        # API 서비스
│   └── styles/          # CSS 스타일
└── README.md
```

## 설치 및 사용 방법

### 백엔드 설정

1. 필요한 패키지 설치:
```bash
npm install express mongoose jsonwebtoken cors dotenv
```

2. 파일 복사:
   - `backend/models/order.js` → `server/src/models/order.js`
   - `backend/controllers/orderController.js` → `server/src/controllers/orderController.js`
   - `backend/routes/orders.js` → `server/src/routes/orders.js`
   - `backend/middleware/authMiddleware.js` → `server/src/middleware/authMiddleware.js` (이미 있다면 건너뛰기)

3. **중요**: 복사한 후 모델 참조 경로 수정

   `server/src/controllers/orderController.js` 파일에서:
   ```javascript
   // 이렇게 수정하세요:
   const Order = require('../models/order');
   const Cart = require('../models/cart');
   ```

   `server/src/middleware/authMiddleware.js` 파일에서 (이미 있다면 수정 불필요):
   ```javascript
   // 이렇게 수정하세요:
   const User = require('../models/user');
   ```

4. 메인 라우터에 추가 (`server/src/routes/index.js`):
```javascript
const orderRouter = require('./orders');

router.use('/orders', orderRouter);
```

**주의사항**: 
- `orderController.js`에서 `Cart` 모델을 참조합니다. 프로젝트에 `Cart` 모델이 있어야 합니다.
- `authMiddleware.js`에서 `User` 모델을 참조합니다. 프로젝트에 `User` 모델이 있어야 합니다.
- PortOne 결제 연동을 사용하려면 환경 변수 설정이 필요합니다.
- 프로젝트 구조가 다르면 모델 경로를 프로젝트 구조에 맞게 수정하세요.

### 프론트엔드 설정

1. PortOne SDK 스크립트를 HTML에 추가 (`index.html` 또는 `index.html`):
```html
<script type="text/javascript" src="https://cdn.iamport.kr/js/iamport.payment-1.2.0.js"></script>
```

2. 파일 복사:
   - `frontend/components/OrderPage.jsx` → `client/src/components/OrderPage.jsx`
   - `frontend/services/orderService.js` → `client/src/services/orderService.js`
   - `frontend/services/cartService.js` → `client/src/services/cartService.js` (또는 기존 cartService에 fetchCart 함수 추가)
   - `frontend/styles/order-package.css` → `client/src/styles/order-package.css` (또는 App.css에 포함)

3. **중요**: `orderService.js`와 `cartService.js`의 `buildAuthHeaders` 함수를 프로젝트의 인증 토큰 관리 방식에 맞게 수정:
```javascript
import { getAuthToken } from '../utils/sessionStorage';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

6. App.jsx에서 사용:
```jsx
import OrderPage from './components/OrderPage';
import './styles/order-package.css'; // 또는 App.css에 포함

function App() {
  return (
    <OrderPage
      user={currentUser}
      portOneImpKey="imp65366328" // PortOne 가맹점 식별코드
      onBackToCart={() => navigate('/cart')}
      onOrderPlaced={(order) => {
        // 주문 완료 후 처리
        navigate('/orders/' + order.orderNumber);
      }}
      onCartUpdate={(itemCount) => {
        // 장바구니 아이템 수 업데이트
        console.log('Cart items:', itemCount);
      }}
    />
  );
}
```

## 환경 변수

백엔드 `.env` 파일에 추가:
```
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/your-database
PORTONE_API_KEY=your_portone_api_key
PORTONE_API_SECRET=your_portone_api_secret
```

프론트엔드 `.env` 파일에 추가:
```
VITE_API_BASE_URL=http://localhost:6500
```

## API 엔드포인트

### 인증 필요 (Bearer Token)

- `POST /api/orders` - 주문 생성
  - Body: 주문 정보 (items, summary, payment, shipping, etc.)
- `GET /api/orders` - 주문 목록 조회
  - Query: `page`, `limit`, `status`, `userId` (admin only)
- `GET /api/orders/:id` - 주문 상세 조회 (orderNumber 또는 _id)
- `PUT /api/orders/:id` - 주문 수정 (admin only)
- `DELETE /api/orders/:id` - 주문 취소

## 데이터베이스 스키마

### Order

```javascript
{
  orderNumber: String (required, unique, indexed),
  user: ObjectId (ref: 'User', indexed),
  guestName: String (default: ''),
  guestEmail: String (default: ''),
  contact: {
    phone: String,
    email: String
  },
  status: String (enum: ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'], default: 'pending', indexed),
  items: [{
    product: ObjectId (ref: 'Product', required),
    name: String (required),
    sku: String,
    thumbnail: String,
    options: Map<String, String>,
    quantity: Number (required, min: 1),
    unitPrice: Number (required, min: 0),
    lineDiscount: Number (default: 0, min: 0),
    lineTotal: Number (required, min: 0)
  }],
  summary: {
    currency: String (default: 'KRW'),
    subtotal: Number (required, min: 0),
    discountTotal: Number (default: 0, min: 0),
    shippingFee: Number (default: 0, min: 0),
    tax: Number (default: 0, min: 0),
    grandTotal: Number (required, min: 0)
  },
  payment: {
    method: String,
    status: String (default: 'ready'),
    amount: Number (default: 0, min: 0),
    currency: String (default: 'KRW'),
    transactionId: String,
    receiptUrl: String,
    paidAt: Date
  },
  shipping: {
    address: {
      name: String (required),
      phone: String (required),
      postalCode: String (required),
      address1: String (required),
      address2: String (default: '')
    },
    request: String,
    carrier: String,
    trackingNumber: String,
    dispatchedAt: Date,
    deliveredAt: Date
  },
  sourceCart: ObjectId (ref: 'Cart'),
  notes: String,
  audit: [{
    status: String,
    message: String,
    actor: ObjectId (ref: 'User'),
    createdAt: Date
  }],
  placedAt: Date (default: Date.now),
  cancelledAt: Date,
  timestamps: true
}
```

**인덱스:**
- `{ user: 1, placedAt: -1 }` - 사용자별 주문 조회 최적화

## 기능

### 주문 관리
- 주문 생성 (결제 검증 포함)
- 주문 목록 조회 (페이지네이션, 필터링)
- 주문 상세 조회
- 주문 수정 (admin only)
- 주문 취소
- 주문 감사 로그 (audit trail)

### 결제 연동
- PortOne 결제 검증
- 결제 정보 저장
- 중복 주문 방지

### UI 기능
- 반응형 디자인
- 배송 정보 입력 폼
- 결제 방법 선택
- 주문 요약 표시
- 주문 성공/실패 화면
- PortOne 결제 모듈 통합

## PortOne 결제 연동

이 패키지는 PortOne(아임포트) 결제 시스템과 연동됩니다.

### 백엔드 설정
1. PortOne 가맹점 계정 생성
2. API Key와 Secret 발급
3. 환경 변수 설정:
```
PORTONE_API_KEY=your_api_key
PORTONE_API_SECRET=your_api_secret
```

### 프론트엔드 설정
1. PortOne SDK 스크립트 추가
2. `OrderPage` 컴포넌트에 `portOneImpKey` prop 전달

### 결제 검증
주문 생성 시 `paymentVerification.impUid`를 제공하면 서버에서 자동으로 결제를 검증합니다.

## 커스터마이징

### 배송비 계산 로직 변경
`OrderPage.jsx`의 `shippingFee` 계산 로직을 수정:
```javascript
const shippingFee = subtotal >= 100000 || !cart?.items?.length ? 0 : 3000;
```

### 결제 방법 추가
`OrderPage.jsx`의 `PAYMENT_METHODS` 배열을 수정:
```javascript
const PAYMENT_METHODS = [
  { value: 'online', label: 'Online Payment', description: '신용/체크카드, 간편결제' },
  { value: 'bank', label: 'Bank Transfer', description: '무통장 입금' },
];
```

### 스타일 변경
`order-package.css` 파일에서 색상, 간격, 폰트 등을 수정

### API 엔드포인트 변경
각 서비스 파일의 `API_BASE_URL`을 수정하거나 환경 변수를 사용

## 의존성

### 백엔드
- mongoose
- express
- jsonwebtoken

### 프론트엔드
- react
- PortOne SDK (스크립트 태그로 로드)

## 주의사항

1. **결제 검증**: 프로덕션 환경에서는 반드시 서버에서 결제를 검증해야 합니다.
2. **보안**: JWT_SECRET과 PortOne API 키는 절대 공개되지 않도록 주의하세요.
3. **에러 처리**: 결제 실패 시 적절한 에러 처리가 필요합니다.
4. **중복 주문 방지**: `transactionId`를 사용하여 중복 주문을 방지합니다.

## 라이선스

MIT License

