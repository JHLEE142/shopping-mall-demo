# 쿠폰 API 문서

## 엔드포인트 목록

### 1. 전체 쿠폰 목록 조회
**GET** `/api/coupons`

공개 쿠폰 목록을 조회합니다.

**Query Parameters:**
- `page` (number, optional): 페이지 번호 (기본값: 1)
- `limit` (number, optional): 페이지당 항목 수 (기본값: 20)
- `isActive` (boolean, optional): 활성화 여부 필터
- `issueType` (string, optional): 발급 방식 필터 ('auto', 'manual', 'code')
- `search` (string, optional): 검색어 (이름, 코드)

**Response:**
```json
{
  "success": true,
  "message": "쿠폰 목록 조회 성공",
  "data": {
    "coupons": [
      {
        "_id": "...",
        "name": "신규 가입 축하 쿠폰",
        "description": "첫 구매 시 사용 가능한 10% 할인 쿠폰",
        "code": "WELCOME10",
        "discountType": "percent",
        "discount": 10,
        "minPurchase": 30000,
        "maxDiscount": 50000,
        "validFrom": "2024-01-01T00:00:00.000Z",
        "validUntil": "2024-12-31T23:59:59.999Z",
        "maxIssues": 1000,
        "maxIssuesPerUser": 1,
        "issueType": "manual",
        "isActive": true,
        "issuedCount": 50,
        "usedCount": 20
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

---

### 2. 내 쿠폰 목록 조회
**GET** `/api/coupons/my`

**인증 필요:** Bearer Token

내가 보유한 쿠폰 목록을 조회합니다.

**Query Parameters:**
- `status` (string, optional): 상태 필터 ('available', 'used', 'expired')
- `page` (number, optional): 페이지 번호 (기본값: 1)
- `limit` (number, optional): 페이지당 항목 수 (기본값: 20)

**Response:**
```json
{
  "success": true,
  "message": "내 쿠폰 목록 조회 성공",
  "data": {
    "coupons": [
      {
        "_id": "...",
        "userId": "...",
        "couponId": {
          "_id": "...",
          "name": "신규 가입 축하 쿠폰",
          "code": "WELCOME10",
          "discountType": "percent",
          "discount": 10,
          "minPurchase": 30000
        },
        "status": "available",
        "expiresAt": "2024-12-31T23:59:59.999Z",
        "issuedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### 3. 쿠폰 상세 조회
**GET** `/api/coupons/:id`

쿠폰 상세 정보를 조회합니다.

**Path Parameters:**
- `id`: 쿠폰 ID

**Response:**
```json
{
  "success": true,
  "message": "쿠폰 조회 성공",
  "data": {
    "coupon": {
      "_id": "...",
      "name": "신규 가입 축하 쿠폰",
      "description": "첫 구매 시 사용 가능한 10% 할인 쿠폰",
      "code": "WELCOME10",
      "discountType": "percent",
      "discount": 10,
      "minPurchase": 30000,
      "maxDiscount": 50000,
      "validFrom": "2024-01-01T00:00:00.000Z",
      "validUntil": "2024-12-31T23:59:59.999Z",
      "maxIssues": 1000,
      "maxIssuesPerUser": 1,
      "issueType": "manual",
      "applicableCategories": [],
      "applicableProducts": [],
      "isActive": true,
      "issuedCount": 50,
      "usedCount": 20
    }
  }
}
```

---

### 4. 쿠폰 받기 (발급)
**POST** `/api/coupons/claim`

**인증 필요:** Bearer Token

쿠폰을 받습니다 (발급).

**Request Body:**
```json
{
  "couponId": "쿠폰 ID (선택)",
  "code": "쿠폰 코드 (선택)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "쿠폰이 발급되었습니다.",
  "data": {
    "coupon": {
      "_id": "...",
      "userId": "...",
      "couponId": {
        "_id": "...",
        "name": "신규 가입 축하 쿠폰",
        "code": "WELCOME10",
        "discountType": "percent",
        "discount": 10
      },
      "status": "available",
      "expiresAt": "2024-12-31T23:59:59.999Z",
      "issuedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**에러 응답:**
- `400`: 이미 보유한 쿠폰, 발급 한도 초과, 유효기간 만료
- `404`: 쿠폰을 찾을 수 없음

---

### 5. 쿠폰 사용
**POST** `/api/coupons/use`

**인증 필요:** Bearer Token

쿠폰을 사용합니다.

**Request Body:**
```json
{
  "userCouponId": "사용자 쿠폰 ID",
  "orderId": "주문 ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "쿠폰이 사용되었습니다.",
  "data": null
}
```

**에러 응답:**
- `400`: 사용할 수 없는 쿠폰, 만료된 쿠폰
- `404`: 쿠폰을 찾을 수 없음

---

### 6. 쿠폰 생성 (관리자)
**POST** `/api/coupons`

**인증 필요:** Bearer Token (Admin)

새 쿠폰을 생성합니다.

**Request Body:**
```json
{
  "name": "신규 가입 축하 쿠폰",
  "description": "첫 구매 시 사용 가능한 10% 할인 쿠폰",
  "code": "WELCOME10",
  "discountType": "percent",
  "discount": 10,
  "minPurchase": 30000,
  "maxDiscount": 50000,
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validUntil": "2024-12-31T23:59:59.999Z",
  "maxIssues": 1000,
  "maxIssuesPerUser": 1,
  "issueType": "manual",
  "applicableCategories": [],
  "applicableProducts": [],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "쿠폰이 생성되었습니다.",
  "data": {
    "coupon": { ... }
  }
}
```

---

### 7. 쿠폰 수정 (관리자)
**PUT** `/api/coupons/:id`

**인증 필요:** Bearer Token (Admin)

쿠폰 정보를 수정합니다.

**Path Parameters:**
- `id`: 쿠폰 ID

**Request Body:**
```json
{
  "name": "수정된 쿠폰 이름",
  "isActive": false
}
```

---

### 8. 쿠폰 삭제 (관리자)
**DELETE** `/api/coupons/:id`

**인증 필요:** Bearer Token (Admin)

쿠폰을 삭제합니다. 사용 중인 쿠폰이 있으면 비활성화 처리됩니다.

**Path Parameters:**
- `id`: 쿠폰 ID

---

## 쿠폰 타입 설명

### discountType
- `percent`: 할인율 (0~100)
- `amount`: 할인금액 (원)
- `shipping`: 무료배송

### status (UserCoupon)
- `available`: 사용 가능
- `used`: 사용 완료
- `expired`: 만료됨

### issueType
- `auto`: 자동 발급 (회원가입 시 등)
- `manual`: 수동 발급 (관리자가 발급)
- `code`: 코드 입력으로 발급

