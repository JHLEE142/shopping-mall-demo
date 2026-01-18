# 비회원 장바구니 스키마 설계

## 개요
비회원도 장바구니를 사용할 수 있도록 하고, 같은 기기나 IP에서 접속 시 장바구니를 유지하기 위한 데이터베이스 스키마 설계 문서입니다.

## 현재 상태 분석

현재 `Cart` 모델의 문제점:
- `user` 필드가 `required: true`로 설정되어 있어 비회원 장바구니를 지원하지 않음
- 비회원 식별을 위한 필드가 없음

## 필요한 추가/수정 사항

### 1. Cart 스키마 수정

#### 1.1 user 필드 수정

```javascript
// user 필드를 optional로 변경
user: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: false, // required: true에서 변경
  index: true,
  default: null,
},
```

#### 1.2 비회원 식별 필드 추가

```javascript
// Cart 스키마에 추가할 필드들

{
  // 비회원 장바구니 식별자
  guestSessionId: {
    type: String,
    default: '',
    trim: true,
    index: true,
    sparse: true, // null/빈 값은 인덱스에서 제외
  },
  
  // 비회원 장바구니 식별을 위한 추가 정보
  guestInfo: {
    // 클라이언트에서 생성한 고유 디바이스 ID
    deviceId: {
      type: String,
      default: '',
      trim: true,
      index: true,
      sparse: true,
    },
    
    // IP 주소 (보조 식별자, 같은 네트워크 환경 식별용)
    ipAddress: {
      type: String,
      default: '',
      trim: true,
      index: true,
      sparse: true,
    },
    
    // User-Agent (브라우저/기기 정보, 보조 식별자)
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    
    // 세션 생성 시간
    sessionCreatedAt: {
      type: Date,
      default: Date.now,
    },
    
    // 마지막 접속 시간
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  
  // 비회원 장바구니 여부 (명확화를 위해)
  isGuest: {
    type: Boolean,
    default: function() {
      return !this.user; // user가 없으면 자동으로 true
    },
    index: true,
  },
}
```

### 2. 인덱스 추가

비회원 장바구니 조회 성능을 위한 인덱스:

```javascript
// 기존 인덱스 유지
cartSchema.index({ user: 1, status: 1 });

// 비회원 장바구니 조회용 인덱스
cartSchema.index({ isGuest: 1, guestSessionId: 1 });
cartSchema.index({ isGuest: 1, 'guestInfo.deviceId': 1 });
cartSchema.index({ isGuest: 1, 'guestInfo.ipAddress': 1, status: 1 });
cartSchema.index({ isGuest: 1, status: 1, 'guestInfo.lastAccessedAt': -1 });

// 복합 인덱스 (비회원 장바구니 조회 최적화)
cartSchema.index({ 
  isGuest: 1, 
  'guestInfo.deviceId': 1, 
  'guestInfo.ipAddress': 1, 
  status: 1 
});
```

### 3. 검증 로직 (Controller 레벨)

#### 3.1 장바구니 조회/생성 시 검증

```javascript
// getCart, addCartItem 등에서
async function getOrCreateCart(req) {
  let cart;
  
  if (req.user) {
    // 회원 장바구니
    cart = await Cart.findOne({ 
      user: req.user._id, 
      status: 'active' 
    });
  } else {
    // 비회원 장바구니
    const guestSessionId = req.headers['x-guest-session-id'] || 
                          req.body.guestSessionId || 
                          req.query.guestSessionId;
    
    if (!guestSessionId) {
      // guestSessionId가 없으면 새로 생성
      return null; // 클라이언트에서 새 세션 ID 생성 후 재요청
    }
    
    // deviceId와 IP 주소로도 조회 시도 (같은 기기/IP 식별)
    const deviceId = req.headers['x-device-id'] || req.body.deviceId;
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress;
    
    // 우선순위: guestSessionId > deviceId + IP
    cart = await Cart.findOne({
      isGuest: true,
      status: 'active',
      $or: [
        { guestSessionId: guestSessionId },
        { 
          'guestInfo.deviceId': deviceId,
          'guestInfo.ipAddress': ipAddress 
        }
      ]
    });
    
    if (cart) {
      // 마지막 접속 시간 업데이트
      cart.guestInfo.lastAccessedAt = new Date();
      await cart.save();
    }
  }
  
  return cart;
}
```

#### 3.2 장바구니 생성 시

```javascript
// addCartItem 함수에서
async function addCartItem(req, res) {
  let cart = await getOrCreateCart(req);
  
  if (!cart) {
    // 새 장바구니 생성
    if (req.user) {
      // 회원 장바구니
      cart = new Cart({
        user: req.user._id,
        items: [],
        status: 'active',
      });
    } else {
      // 비회원 장바구니
      const guestSessionId = req.headers['x-guest-session-id'] || 
                            req.body.guestSessionId;
      const deviceId = req.headers['x-device-id'] || req.body.deviceId;
      const ipAddress = req.ip || 
                       req.headers['x-forwarded-for'] || 
                       req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      if (!guestSessionId) {
        return res.status(400).json({ 
          message: '비회원 장바구니를 사용하려면 guestSessionId가 필요합니다.' 
        });
      }
      
      cart = new Cart({
        user: null,
        isGuest: true,
        guestSessionId: guestSessionId,
        guestInfo: {
          deviceId: deviceId || '',
          ipAddress: ipAddress || '',
          userAgent: userAgent,
          sessionCreatedAt: new Date(),
          lastAccessedAt: new Date(),
        },
        items: [],
        status: 'active',
      });
    }
  }
  
  // 상품 추가 로직...
  await cart.save();
  return res.json({ cart });
}
```

### 4. 클라이언트 측 구현

#### 4.1 비회원 세션 ID 생성 및 관리

```javascript
// 클라이언트에서 (localStorage 또는 sessionStorage 사용)
function getOrCreateGuestSessionId() {
  let guestSessionId = localStorage.getItem('guestSessionId');
  
  if (!guestSessionId) {
    // 고유 ID 생성 (UUID v4 또는 랜덤 문자열)
    guestSessionId = generateUUID(); // 또는 crypto.randomUUID()
    localStorage.setItem('guestSessionId', guestSessionId);
  }
  
  return guestSessionId;
}

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
}

// API 요청 시 헤더에 포함
fetch('/api/carts', {
  headers: {
    'X-Guest-Session-Id': getOrCreateGuestSessionId(),
    'X-Device-Id': getOrCreateDeviceId(),
  }
});
```

### 5. 장바구니 병합 로직

#### 5.1 비회원 → 회원 전환 시

```javascript
// 로그인 시 비회원 장바구니를 회원 장바구니로 병합
async function mergeGuestCartToUser(userId, guestSessionId, deviceId, ipAddress) {
  // 비회원 장바구니 찾기
  const guestCart = await Cart.findOne({
    isGuest: true,
    status: 'active',
    $or: [
      { guestSessionId: guestSessionId },
      { 
        'guestInfo.deviceId': deviceId,
        'guestInfo.ipAddress': ipAddress 
      }
    ]
  });
  
  if (!guestCart || guestCart.items.length === 0) {
    return;
  }
  
  // 회원 장바구니 찾기 또는 생성
  let userCart = await Cart.findOne({ 
    user: userId, 
    status: 'active' 
  });
  
  if (!userCart) {
    userCart = new Cart({
      user: userId,
      items: [],
      status: 'active',
    });
  }
  
  // 비회원 장바구니의 상품들을 회원 장바구니에 병합
  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(
      item => item.product.toString() === guestItem.product.toString() &&
              JSON.stringify(item.selectedOptions) === JSON.stringify(guestItem.selectedOptions)
    );
    
    if (existingItem) {
      // 같은 상품이 있으면 수량 합산
      existingItem.quantity += guestItem.quantity;
      existingItem.priceSnapshot = guestItem.priceSnapshot; // 최신 가격으로 업데이트
    } else {
      // 없으면 추가
      userCart.items.push(guestItem);
    }
  }
  
  // summary 재계산
  userCart.summary.subtotal = userCart.items.reduce(
    (sum, item) => sum + item.quantity * item.priceSnapshot,
    0
  );
  
  await userCart.save();
  
  // 비회원 장바구니 삭제 또는 상태 변경
  guestCart.status = 'abandoned';
  await guestCart.save();
  
  return userCart;
}
```

### 6. 장바구니 정리 (Cleanup)

#### 6.1 오래된 비회원 장바구니 정리

```javascript
// 주기적으로 실행할 정리 작업 (cron job)
async function cleanupOldGuestCarts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // 30일 이상 접속하지 않은 비회원 장바구니 삭제 또는 abandoned 처리
  const result = await Cart.updateMany(
    {
      isGuest: true,
      status: 'active',
      'guestInfo.lastAccessedAt': { $lt: thirtyDaysAgo }
    },
    {
      $set: { status: 'abandoned' }
    }
  );
  
  console.log(`Cleaned up ${result.modifiedCount} old guest carts`);
}
```

### 7. 스키마 변경 요약

#### 추가 필드
1. `isGuest` (Boolean, indexed)
   - 비회원 장바구니 여부 명시
   - 기본값: user가 없으면 true

2. `guestSessionId` (String, indexed, sparse)
   - 비회원 장바구니 식별자 (클라이언트에서 생성)
   - 필수 (비회원인 경우)

3. `guestInfo.deviceId` (String, indexed, sparse)
   - 클라이언트 디바이스 ID
   - 같은 기기 식별용

4. `guestInfo.ipAddress` (String, indexed, sparse)
   - IP 주소
   - 같은 네트워크 환경 식별용 (보조)

5. `guestInfo.userAgent` (String)
   - 브라우저/기기 정보
   - 보조 식별자

6. `guestInfo.sessionCreatedAt` (Date)
   - 세션 생성 시간

7. `guestInfo.lastAccessedAt` (Date)
   - 마지막 접속 시간
   - 정리 작업에 사용

#### 수정할 필드
- `user`: required: false로 변경

#### 추가할 인덱스
- 비회원 장바구니 조회 성능을 위한 복합 인덱스들

### 8. 검증 규칙

#### Controller 레벨 검증
- 비회원 장바구니 생성 시: `guestSessionId` 필수
- 비회원 장바구니 조회 시: `guestSessionId`, `deviceId`, `ipAddress` 중 하나 이상 사용
- `user`와 `guestSessionId`는 동시에 존재할 수 없음 (상호 배타적)

### 9. 예시 데이터 구조

#### 비회원 장바구니 예시

```javascript
{
  _id: ObjectId("..."),
  user: null, // 비회원
  isGuest: true,
  guestSessionId: "550e8400-e29b-41d4-a716-446655440000",
  guestInfo: {
    deviceId: "device-12345",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    sessionCreatedAt: ISODate("2024-01-02T10:00:00.000Z"),
    lastAccessedAt: ISODate("2024-01-02T15:30:00.000Z"),
  },
  status: "active",
  items: [
    {
      product: ObjectId("..."),
      quantity: 2,
      priceSnapshot: 50000,
      selectedOptions: { color: "red", size: "M" },
      addedAt: ISODate("2024-01-02T10:05:00.000Z"),
    }
  ],
  summary: {
    currency: "KRW",
    subtotal: 100000,
    discountTotal: 0,
    shippingFee: 3000,
  },
  notes: "",
  lockedAt: null,
  createdAt: ISODate("2024-01-02T10:00:00.000Z"),
  updatedAt: ISODate("2024-01-02T15:30:00.000Z"),
}
```

### 10. 보안 고려사항

1. **세션 ID 보안**
   - guestSessionId는 충분히 긴 랜덤 문자열 사용 (최소 32자)
   - UUID v4 권장
   - HTTPS 통신 필수

2. **IP 주소 처리**
   - IP 주소는 개인정보일 수 있으므로 필요시 해시화 고려
   - GDPR, 개인정보보호법 준수

3. **장바구니 접근 제어**
   - guestSessionId로만 접근 가능하도록 검증
   - 다른 사용자의 장바구니 접근 방지

4. **데이터 보관 기간**
   - 비회원 장바구니는 일정 기간 후 자동 정리
   - 30일 이상 미접속 시 abandoned 처리

### 11. API 엔드포인트 수정 필요

1. `GET /api/carts` - 장바구니 조회
   - 비회원: `X-Guest-Session-Id` 헤더 또는 쿼리 파라미터 필요

2. `POST /api/carts/items` - 상품 추가
   - 비회원: `X-Guest-Session-Id`, `X-Device-Id` 헤더 필요

3. `PUT /api/carts/items/:productId` - 상품 수량 변경
   - 비회원: `X-Guest-Session-Id` 헤더 필요

4. `DELETE /api/carts/items/:productId` - 상품 삭제
   - 비회원: `X-Guest-Session-Id` 헤더 필요

5. `POST /api/auth/login` - 로그인 시
   - 비회원 장바구니를 회원 장바구니로 병합하는 로직 추가

### 12. 마이그레이션 계획

1. **Phase 1: 스키마 수정**
   - `user` 필드를 optional로 변경
   - `isGuest`, `guestSessionId`, `guestInfo` 필드 추가
   - 새로운 인덱스 생성

2. **Phase 2: Controller 로직 수정**
   - 장바구니 조회/생성 로직에 비회원 지원 추가
   - 로그인 시 장바구니 병합 로직 추가

3. **Phase 3: 프론트엔드 구현**
   - 비회원 세션 ID 생성 및 관리
   - API 요청 시 헤더에 세션 ID 포함
   - 로그인 시 장바구니 병합 처리

4. **Phase 4: 정리 작업**
   - 오래된 비회원 장바구니 정리 cron job 추가

### 13. 동일 기기/IP 식별 전략

#### 우선순위
1. **guestSessionId** (최우선)
   - 클라이언트에서 생성한 고유 세션 ID
   - 가장 정확한 식별자

2. **deviceId + ipAddress** (보조)
   - guestSessionId가 없거나 만료된 경우
   - 같은 기기 + 같은 네트워크 환경에서 접속 시 같은 장바구니 유지

3. **ipAddress만** (최후 수단)
   - deviceId도 없는 경우
   - 같은 IP에서 접속한 최근 장바구니 사용 (주의: 공유 IP 환경에서 문제 가능)

#### 주의사항
- 공유 IP 환경(회사, 카페 등)에서는 다른 사용자의 장바구니에 접근할 수 있음
- 따라서 guestSessionId를 최우선으로 사용하고, deviceId + ipAddress는 보조 수단으로만 사용

### 14. 에러 처리

```javascript
// 비회원 장바구니 관련 에러 코드
{
  GUEST_SESSION_ID_REQUIRED: '비회원 장바구니를 사용하려면 세션 ID가 필요합니다.',
  GUEST_CART_NOT_FOUND: '장바구니를 찾을 수 없습니다.',
  GUEST_CART_EXPIRED: '장바구니 세션이 만료되었습니다.',
  CART_MERGE_FAILED: '장바구니 병합에 실패했습니다.',
}
```

