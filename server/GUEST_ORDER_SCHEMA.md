# 비회원 주문 스키마 설계

## 개요
비회원 주문 기능을 추가하기 위한 데이터베이스 스키마 설계 문서입니다.

## 현재 상태 분석

현재 `Order` 모델에는 비회원 주문을 위한 기본 필드가 이미 일부 존재합니다:
- `user`: optional (회원/비회원 구분)
- `guestName`: 비회원 이름
- `guestEmail`: 비회원 이메일
- `contact.phone`: 연락처 전화번호
- `contact.email`: 연락처 이메일

## 필요한 추가/수정 사항

### 1. Order 스키마 수정

#### 1.1 비회원 주문 식별 필드 추가

```javascript
// Order 스키마에 추가할 필드들

{
  // 비회원 주문 여부 명확화 (선택적, user 필드가 null이면 자동으로 true로 간주)
  isGuest: {
    type: Boolean,
    default: function() {
      return !this.user; // user가 없으면 자동으로 true
    },
    index: true,
  },
  
  // 비회원 주문 조회용 인증 정보
  guestAuth: {
    // 비회원 주문 조회용 임시 토큰 (선택적, 보안 강화용)
    accessToken: {
      type: String,
      default: '',
      trim: true,
      index: true,
      sparse: true, // null/빈 값은 인덱스에서 제외
    },
    
    // 토큰 만료 시간
    tokenExpiresAt: {
      type: Date,
      default: null,
    },
    
    // 비회원 주문 조회용 비밀번호 해시 (이메일/전화번호 대신 추가 인증)
    // 주문 조회 시 이메일/전화번호와 함께 입력받아 검증
    passwordHash: {
      type: String,
      default: '',
      trim: true,
    },
  },
}
```

#### 1.2 기존 필드 검증 강화

```javascript
// guestName, guestEmail 필드에 대한 검증 로직 추가
// user가 없을 때는 guestName, guestEmail 또는 contact.email이 필수

// 스키마 레벨에서는 검증하지 않고, 컨트롤러 레벨에서 검증하는 것을 권장
```

### 2. 인덱스 추가

비회원 주문 조회 성능을 위한 인덱스:

```javascript
// 비회원 주문 조회용 복합 인덱스
orderSchema.index({ isGuest: 1, orderNumber: 1 });
orderSchema.index({ isGuest: 1, 'contact.email': 1 });
orderSchema.index({ isGuest: 1, 'contact.phone': 1 });
orderSchema.index({ 'guestAuth.accessToken': 1 }, { sparse: true });

// 기존 인덱스 유지
orderSchema.index({ user: 1, placedAt: -1 });
```

### 3. 검증 로직 (Controller 레벨)

#### 3.1 주문 생성 시 검증

```javascript
// createOrder 함수에서
if (!req.user) {
  // 비회원 주문인 경우
  if (!guestName && !contact.email && !contact.phone) {
    return res.status(400).json({ 
      message: '비회원 주문은 이름, 이메일, 또는 전화번호 중 하나는 필수입니다.' 
    });
  }
  
  // 비회원 주문 인증 토큰 생성 (선택적)
  const accessToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30); // 30일 유효
  
  orderPayload.isGuest = true;
  orderPayload.guestAuth = {
    accessToken,
    tokenExpiresAt,
  };
}
```

#### 3.2 비회원 주문 조회 인증

비회원 주문 조회 시 다음 중 하나의 방법으로 인증:

**방법 1: 주문번호 + 이메일/전화번호**
- 가장 간단하고 일반적인 방법
- 주문번호와 등록된 이메일 또는 전화번호로 조회

**방법 2: 주문번호 + accessToken**
- 더 안전한 방법
- 주문 완료 시 전달받은 accessToken으로 조회

**방법 3: 주문번호 + 비밀번호**
- 추가 보안이 필요한 경우
- 주문 시 설정한 비밀번호로 조회

### 4. 추가 고려사항

#### 4.1 개인정보 보호
- 비회원 주문의 개인정보는 GDPR, 개인정보보호법 등을 준수해야 함
- 일정 기간 후 자동 삭제 또는 익명화 정책 고려

#### 4.2 주문 조회 페이지
- 별도의 비회원 주문 조회 페이지 필요
- `/guest-order-lookup` 같은 경로

#### 4.3 이메일 알림
- 비회원 주문도 주문 완료, 배송 시작 등 이메일 알림 필요
- `guestEmail` 또는 `contact.email` 사용

#### 4.4 주문 상태 변경 알림
- 비회원 주문 상태 변경 시 이메일/SMS 알림
- 연락처 정보 필수

## 스키마 변경 요약

### 추가 필드
1. `isGuest` (Boolean, indexed)
   - 비회원 주문 여부 명시
   - 기본값: user가 없으면 true

2. `guestAuth.accessToken` (String, indexed, sparse)
   - 비회원 주문 조회용 토큰
   - 선택적, 보안 강화용

3. `guestAuth.tokenExpiresAt` (Date)
   - 토큰 만료 시간
   - 기본 30일

4. `guestAuth.passwordHash` (String)
   - 비회원 주문 조회용 비밀번호 해시
   - 선택적, 추가 보안용

### 수정할 인덱스
- 기존 인덱스 유지
- 비회원 주문 조회 성능을 위한 새로운 복합 인덱스 추가

### 검증 규칙
- Controller 레벨에서 비회원 주문 시 필수 필드 검증
- `user`가 없을 때: `guestName`, `contact.email`, `contact.phone` 중 하나 이상 필수

## 마이그레이션 계획

1. **Phase 1: 스키마 추가**
   - `isGuest`, `guestAuth` 필드 추가
   - 새로운 인덱스 생성
   - 기존 데이터 마이그레이션: `user`가 없는 주문은 `isGuest: true`로 설정

2. **Phase 2: Controller 로직 수정**
   - 주문 생성 시 비회원 주문 처리 로직 추가
   - 비회원 주문 조회 API 추가

3. **Phase 3: 프론트엔드 구현**
   - 비회원 주문 페이지 구현
   - 비회원 주문 조회 페이지 구현

## 예시 데이터 구조

### 비회원 주문 예시

```javascript
{
  orderNumber: "ORD-20240102-12345",
  user: null, // 비회원
  isGuest: true,
  guestName: "홍길동",
  guestEmail: "guest@example.com",
  contact: {
    phone: "010-1234-5678",
    email: "guest@example.com"
  },
  guestAuth: {
    accessToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    tokenExpiresAt: ISODate("2024-02-01T00:00:00.000Z"),
    passwordHash: "" // 선택적
  },
  status: "pending",
  items: [...],
  shipping: {
    address: {
      name: "홍길동",
      phone: "010-1234-5678",
      postalCode: "12345",
      address1: "서울시 강남구",
      address2: "테헤란로 123"
    }
  },
  // ... 나머지 필드
}
```

## 보안 고려사항

1. **개인정보 암호화**
   - 민감한 개인정보(전화번호, 이메일)는 필요시 암호화 저장 고려

2. **토큰 보안**
   - accessToken은 충분히 긴 랜덤 문자열 사용 (최소 32자)
   - HTTPS 통신 필수

3. **조회 제한**
   - 비회원 주문 조회는 일일 시도 횟수 제한 고려
   - IP 기반 rate limiting 적용

4. **데이터 보관 기간**
   - 비회원 주문 데이터는 법적 보관 기간 후 자동 삭제 또는 익명화

## API 엔드포인트 추가 필요

1. `POST /api/orders` - 주문 생성 (기존, 비회원 지원 추가)
2. `POST /api/guest-orders/lookup` - 비회원 주문 조회
3. `GET /api/guest-orders/:orderNumber` - 비회원 주문 상세 조회 (인증 필요)

