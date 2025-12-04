# 설치 가이드

이 문서는 order-package를 프로젝트에 설치하는 상세한 가이드입니다.

## 빠른 시작

### 1. 백엔드 설치

```bash
# 1. 필요한 패키지 설치
npm install express mongoose jsonwebtoken cors dotenv

# 2. 파일 복사
cp order-package/backend/models/order.js server/src/models/
cp order-package/backend/controllers/orderController.js server/src/controllers/
cp order-package/backend/routes/orders.js server/src/routes/
cp order-package/backend/middleware/authMiddleware.js server/src/middleware/  # 이미 있다면 건너뛰기
```

### 2. 경로 수정

복사한 파일들의 모델 참조 경로를 확인하고 필요시 수정:

**`server/src/controllers/orderController.js`**:
```javascript
// 프로젝트 구조에 맞게 수정
const Order = require('../models/order');
const Cart = require('../models/cart');
```

**`server/src/middleware/authMiddleware.js`** (이미 있다면 수정 불필요):
```javascript
const User = require('../models/user');
```

### 3. 라우터 등록

**`server/src/routes/index.js`**:
```javascript
const orderRouter = require('./orders');

router.use('/orders', orderRouter);
```

### 4. 환경 변수 설정

**`.env`** 파일에 추가:
```
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/your-database
PORTONE_API_KEY=your_portone_api_key
PORTONE_API_SECRET=your_portone_api_secret
```

## 프론트엔드 설치

### 1. PortOne SDK 추가

**`index.html`** 또는 **`client/index.html`**:
```html
<script type="text/javascript" src="https://cdn.iamport.kr/js/iamport.payment-1.2.0.js"></script>
```

### 2. 파일 복사

```bash
cp order-package/frontend/components/OrderPage.jsx client/src/components/
cp order-package/frontend/services/orderService.js client/src/services/
cp order-package/frontend/services/cartService.js client/src/services/  # 또는 기존 파일에 fetchCart 추가
cp order-package/frontend/styles/order-package.css client/src/styles/
```

### 3. 서비스 파일 수정

**`client/src/services/orderService.js`**와 **`client/src/services/cartService.js`**의 `buildAuthHeaders` 함수를 프로젝트에 맞게 수정:

```javascript
import { getAuthToken } from '../utils/sessionStorage'; // 프로젝트의 인증 유틸리티

function buildAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

### 4. CSS 임포트

**`client/src/App.jsx`** 또는 **`client/src/main.jsx`**:
```javascript
import './styles/order-package.css';
```

또는 **`client/src/App.css`**에 포함:
```css
@import './styles/order-package.css';
```

### 5. 컴포넌트 사용

**`client/src/App.jsx`**:
```jsx
import OrderPage from './components/OrderPage';

function App() {
  return (
    <OrderPage
      user={currentUser}
      portOneImpKey="imp65366328" // PortOne 가맹점 식별코드
      onBackToCart={() => navigate('/cart')}
      onOrderPlaced={(order) => {
        navigate('/orders/' + order.orderNumber);
      }}
      onCartUpdate={(itemCount) => {
        // 장바구니 아이템 수 업데이트
      }}
    />
  );
}
```

### 6. 환경 변수 설정

**`.env`** 또는 **`client/.env`**:
```
VITE_API_BASE_URL=http://localhost:6500
```

## 의존성 확인

### 필수 모델

프로젝트에 다음 모델이 있어야 합니다:

1. **User 모델** (`server/src/models/user.js`)
   - `_id`, `email`, `name`, `user_type` 필드 필요

2. **Cart 모델** (`server/src/models/cart.js`)
   - `_id`, `user`, `items`, `status` 필드 필요

3. **Product 모델** (`server/src/models/product.js`)
   - `_id`, `name`, `price`, `image`, `sku` 필드 필요

## 문제 해결

### 모델을 찾을 수 없다는 오류

- 모델 파일이 올바른 경로에 있는지 확인
- `require` 경로가 프로젝트 구조에 맞는지 확인
- 모델이 올바르게 export되고 있는지 확인

### 인증 오류

- JWT_SECRET 환경 변수가 설정되어 있는지 확인
- 토큰이 올바르게 전달되는지 확인
- `buildAuthHeaders` 함수가 올바르게 구현되어 있는지 확인

### 결제 오류

- PortOne SDK가 올바르게 로드되었는지 확인
- `portOneImpKey` prop이 올바르게 전달되었는지 확인
- PortOne API 키와 시크릿이 올바르게 설정되었는지 확인

## 다음 단계

설치가 완료되면 [README.md](./README.md)를 참고하여 기능을 커스터마이징하세요.

