# Cart Package

다른 프로젝트에서 재사용 가능한 완전한 장바구니 기능 패키지입니다.

## 구조

```
cart-package/
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

2. 모델 파일을 `server/src/models/`에 복사
3. 컨트롤러 파일을 `server/src/controllers/`에 복사
4. 라우터 파일을 `server/src/routes/`에 복사
5. 미들웨어 파일을 `server/src/middleware/`에 복사 (이미 있다면 건너뛰기)

6. 메인 라우터에 추가 (`server/src/routes/index.js`):
```javascript
const cartRouter = require('./carts');

router.use('/carts', cartRouter);
```

**주의**: 
- `cartController.js`와 `cart.js` 모델에서 `Product` 모델을 참조합니다. 프로젝트에 `Product` 모델이 있어야 합니다.
- `authMiddleware.js`에서 `User` 모델을 참조합니다. 프로젝트에 `User` 모델이 있어야 합니다.

### 프론트엔드 설정

1. 필요한 패키지 설치:
```bash
npm install lucide-react
```

2. 컴포넌트 파일을 `client/src/components/`에 복사
3. 서비스 파일을 `client/src/services/`에 복사
4. CSS 스타일을 `client/src/App.css` 또는 별도 CSS 파일에 추가

5. `cartService.js`의 `buildAuthHeaders` 함수를 프로젝트의 인증 토큰 관리 방식에 맞게 수정:
```javascript
import { getAuthToken } from '../utils/sessionStorage';

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

6. App.jsx에서 사용:
```jsx
import CartPage from './components/CartPage';
import './styles/cart-package.css'; // 또는 App.css에 포함

function App() {
  return (
    <CartPage
      onCartChange={(itemCount) => {
        // 장바구니 아이템 수 변경 시 호출
        console.log('Cart items:', itemCount);
      }}
      onProceedToCheckout={() => {
        // 체크아웃 페이지로 이동
        navigate('/checkout');
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
```

프론트엔드 `.env` 파일에 추가:
```
VITE_API_BASE_URL=http://localhost:6500
```

## API 엔드포인트

### 인증 필요 (Bearer Token)

- `GET /api/carts` - 장바구니 조회
- `POST /api/carts/items` - 장바구니에 상품 추가
  - Body: `{ productId: string, quantity?: number, selectedOptions?: object }`
- `PUT /api/carts/items/:productId` - 장바구니 상품 수정
  - Body: `{ quantity?: number, selectedOptions?: object }`
- `DELETE /api/carts/items/:productId` - 장바구니에서 상품 삭제
- `DELETE /api/carts` - 장바구니 비우기

## 데이터베이스 스키마

### Cart

```javascript
{
  user: ObjectId (ref: 'User', required, indexed),
  status: String (enum: ['active', 'ordered', 'abandoned'], default: 'active', indexed),
  items: [{
    product: ObjectId (ref: 'Product', required),
    quantity: Number (required, min: 1),
    priceSnapshot: Number (required, min: 0),
    selectedOptions: Map<String, String> (default: {}),
    addedAt: Date (default: Date.now)
  }],
  summary: {
    currency: String (default: 'KRW'),
    subtotal: Number (default: 0, min: 0),
    discountTotal: Number (default: 0, min: 0),
    shippingFee: Number (default: 0, min: 0)
  },
  notes: String (default: ''),
  lockedAt: Date (default: null),
  timestamps: true
}
```

**인덱스:**
- `{ user: 1, status: 1 }` - 사용자별 활성 장바구니 조회 최적화

## 기능

### 장바구니 관리
- 장바구니 조회
- 상품 추가 (중복 시 수량 증가)
- 상품 수량 수정
- 상품 삭제
- 장바구니 비우기
- 가격 스냅샷 저장 (추가 시점의 가격 보존)

### UI 기능
- 반응형 디자인
- 실시간 수량 변경
- 장바구니 요약 (소계, 배송비, 총액)
- 추천 상품 표시
- 로딩 및 에러 상태 처리

## 커스터마이징

### 배송비 계산 로직 변경
`CartPage.jsx`의 `shippingFee` 계산 로직을 수정:
```javascript
const shippingFee = subtotal >= 100000 ? 0 : 3000; // 현재 로직
```

### 추천 상품 변경
`CartPage.jsx`의 `RECOMMENDED_PRODUCTS` 배열을 수정하거나 API에서 가져오도록 변경

### 스타일 변경
`cart-package.css` 파일에서 색상, 간격, 폰트 등을 수정

### API 엔드포인트 변경
각 서비스 파일의 `API_BASE_URL`을 수정하거나 환경 변수를 사용

## 의존성

### 백엔드
- mongoose
- express
- jsonwebtoken

### 프론트엔드
- react
- lucide-react (아이콘)

## 라이선스

MIT License

