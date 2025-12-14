# 상품 등록 데이터베이스 스키마 리뷰

## 📋 목차
1. [Product (상품) 스키마](#1-product-상품-스키마)
2. [Category (카테고리) 스키마](#2-category-카테고리-스키마)
3. [Review (리뷰) 스키마](#3-review-리뷰-스키마)
4. [ProductInquiry (상품 문의) 스키마](#4-productinquiry-상품-문의-스키마)
5. [Order Item (주문 상품) 스키마](#5-order-item-주문-상품-스키마)
6. [스키마 관계도](#6-스키마-관계도)
7. [개선 제안](#7-개선-제안)

---

## 1. Product (상품) 스키마

### 기본 정보
```javascript
{
  sku: String (required, unique, uppercase)  // 상품 고유 코드
  name: String (required)                    // 상품명
  price: Number (required, min: 0)           // 가격
  category: String (required)                // 카테고리명
  image: String (required)                  // 메인 이미지 URL
  description: String                       // 상품 설명 (Markdown 지원)
}
```

### 이미지 관리
```javascript
{
  image: String (required)                   // 메인 이미지 (하위 호환성)
  images: [String] (max: 4)                  // 다중 이미지 배열 (최대 4개)
}
```
- **현재 구조**: `image`는 필수, `images`는 선택적
- **권장**: `images` 배열의 첫 번째 요소를 메인 이미지로 사용하도록 통일

### 상품 옵션
```javascript
{
  colors: [{
    name: String (required)                  // 색상명 (예: "블랙")
    value: String (required)                  // 색상값 (HEX 코드)
    image: String                            // 색상별 이미지 URL (선택)
  }],
  sizes: [{
    label: String (required)                 // 사이즈 라벨 (예: "S (KR 95)")
    value: String (required)                 // 사이즈 값 (예: "S")
    available: Boolean (default: true)        // 재고 여부
  }]
}
```
- **현재 구조**: 배열로 여러 옵션 저장
- **개선 필요**: 사이즈별 재고 관리가 부족 (전체 재고만 관리)

### 배송 및 반품 정책
```javascript
{
  shipping: {
    isFree: Boolean (default: false)         // 무료배송 여부
    fee: Number (default: 0, min: 0)         // 배송비
    estimatedDays: Number (default: 3, min: 1) // 예상 배송일
  },
  returnPolicy: {
    isReturnable: Boolean (default: true)    // 반품 가능 여부
    returnDays: Number (default: 30, min: 0) // 반품 가능 기간
    returnFee: Number (default: 0, min: 0)   // 반품 배송비
  }
}
```

### 검색 최적화
```javascript
{
  phoneme_name: String (indexed)            // 한글→음성 변환 (검색용)
  embedding: [Number]                        // 벡터 임베딩 (의미 검색용)
}
```
- **용도**: 한국어 검색 및 의미 기반 검색 지원
- **인덱스**: `phoneme_name`에 인덱스 설정됨

### 재고 관리
```javascript
{
  inventory: {
    stock: Number (default: 0, min: 0)       // 재고 수량
    reserved: Number (default: 0, min: 0)    // 예약 수량
    reorderPoint: Number (default: 0)       // 재주문 임계값
    supplier: String                         // 공급업체
    cost: Number (default: 0, min: 0)       // 원가
    status: String (enum)                   // 재고 상태
      // 'in-stock', 'low-stock', 'critical', 'out-of-stock'
    updatedAt: Date                         // 재고 업데이트 시간
  }
}
```

### 인덱스
- `sku`: unique index
- `phoneme_name`: index (검색 최적화)
- `timestamps`: createdAt, updatedAt 자동 생성

---

## 2. Category (카테고리) 스키마

```javascript
{
  name: String (required)                    // 카테고리명
  slug: String (required, unique)            // URL 슬러그
  code: String (required, unique)           // 고유 코드
  description: String                         // 설명
  color: String (default: '#333333')         // 표시 색상 (HEX)
  image: String                              // 카테고리 이미지
  icon: String                               // 아이콘 URL/이름
  parentId: ObjectId (ref: Category)        // 부모 카테고리 (계층 구조)
  order: Number (default: 0)                 // 정렬 순서
  isActive: Boolean (default: true)         // 활성화 여부
  commissionRate: Number (0-100)             // 수수료율
  metaTitle: String                          // SEO 메타 제목
  metaDescription: String                    // SEO 메타 설명
  productCount: Number (default: 0)          // 상품 개수
}
```

### 인덱스
- `slug`: unique index
- `code`: unique index
- `parentId`: index (계층 조회)
- `isActive`: index
- `order`: index
- `productCount`: index (인기 카테고리 조회)

### 관계
- **Product**: `Product.category` (String)와 연결 (카테고리명으로 매칭)
- **개선 필요**: `Product.category`를 ObjectId 참조로 변경 고려

---

## 3. Review (리뷰) 스키마

```javascript
{
  productId: ObjectId (ref: Product, required, indexed)
  userId: ObjectId (ref: User, required, indexed)
  rating: Number (required, 1-5)            // 평점
  title: String (required)                   // 리뷰 제목
  body: String (required)                    // 리뷰 내용
  region: String                             // 작성자 지역
  fit: String                                // 사이즈 만족도 ("작음", "정사이즈", "큼")
  purchaseSize: String                       // 구매 사이즈
  images: [String]                           // 리뷰 이미지 URL 배열
  gender: String (enum)                      // 성별 ('male', 'female', 'other', '')
  purpose: String                            // 용도 (예: "러닝", "트레이닝")
  isVerified: Boolean (default: false)       // 구매 확인 여부
  createdAt: Date                            // 작성일
  updatedAt: Date                            // 수정일
}
```

### 인덱스
- `productId`: index
- `userId`: index
- `{ productId: 1, createdAt: -1 }`: 복합 인덱스 (상품별 최신 리뷰 조회)
- `{ userId: 1, productId: 1 }`: unique 복합 인덱스 (사용자당 상품당 1개 리뷰)

### 제약사항
- **중복 방지**: 한 사용자는 한 상품에 대해 하나의 리뷰만 작성 가능

---

## 4. ProductInquiry (상품 문의) 스키마

```javascript
{
  productId: ObjectId (ref: Product, required, indexed)
  userId: ObjectId (ref: User, required, indexed)
  question: String (required)                // 문의 내용
  isSecret: Boolean (default: false)        // 비밀글 여부
  status: String (enum, indexed)            // 상태
    // 'pending', 'answered', 'closed'
  answer: {
    content: String                          // 답변 내용
    answeredBy: ObjectId (ref: User)          // 답변 작성자
    answeredAt: Date                          // 답변 일시
  }
  createdAt: Date                            // 문의 작성일
  updatedAt: Date                            // 수정일
}
```

### 인덱스
- `productId`: index
- `userId`: index
- `status`: index
- `{ productId: 1, createdAt: -1 }`: 복합 인덱스 (상품별 최신 문의 조회)
- `{ userId: 1, createdAt: -1 }`: 복합 인덱스 (사용자별 문의 조회)
- `{ status: 1, createdAt: -1 }`: 복합 인덱스 (상태별 문의 조회)

---

## 5. Order Item (주문 상품) 스키마

```javascript
{
  product: ObjectId (ref: Product, required) // 상품 참조
  name: String (required)                    // 주문 시점의 상품명 (스냅샷)
  sku: String                                // 주문 시점의 SKU
  thumbnail: String                           // 주문 시점의 썸네일
  options: Map<String, String>                // 선택한 옵션 (색상, 사이즈 등)
  quantity: Number (required, min: 1)        // 주문 수량
  unitPrice: Number (required, min: 0)        // 단가
  lineDiscount: Number (default: 0, min: 0)  // 라인 할인액
  lineTotal: Number (required, min: 0)       // 라인 총액
}
```

### 특징
- **스냅샷 구조**: 주문 시점의 상품 정보를 저장 (상품 정보 변경 시에도 주문 정보 보존)
- **옵션 저장**: `options` Map으로 선택한 색상, 사이즈 등 저장

---

## 6. 스키마 관계도

```
┌─────────────┐
│   Product   │
│  (상품)     │
└──────┬──────┘
       │
       ├───┐
       │   │
       │   ├─→ Review (1:N) - 한 상품에 여러 리뷰
       │   │
       │   ├─→ ProductInquiry (1:N) - 한 상품에 여러 문의
       │   │
       │   └─→ Order.items (1:N) - 한 상품이 여러 주문에 포함
       │
       └─→ Category (N:1) - 여러 상품이 한 카테고리에 속함
            (현재: String 매칭, 개선: ObjectId 참조 권장)
```

---

## 7. 개선 제안

### 🔴 높은 우선순위

1. **Product.category를 ObjectId 참조로 변경**
   - 현재: `category: String` (카테고리명)
   - 권장: `category: ObjectId (ref: Category)`
   - 이점: 카테고리 삭제/변경 시 무결성 보장, 조인 쿼리 최적화

2. **사이즈별 재고 관리 추가**
   - 현재: 전체 재고만 관리 (`inventory.stock`)
   - 권장: `inventory.variants` 추가
   ```javascript
   inventory: {
     variants: [{
       color: String,
       size: String,
       stock: Number,
       reserved: Number
     }]
   }
   ```

3. **가격 이력 관리**
   - 현재: 현재 가격만 저장
   - 권장: 가격 변경 이력 테이블 추가 또는 `priceHistory` 배열
   ```javascript
   priceHistory: [{
     price: Number,
     changedAt: Date,
     reason: String
   }]
   ```

### 🟡 중간 우선순위

4. **상품 상태 필드 추가**
   ```javascript
   status: {
     type: String,
     enum: ['draft', 'active', 'inactive', 'discontinued'],
     default: 'draft'
   }
   ```

5. **할인 가격 필드 추가**
   - 현재: `price`만 있음
   - 권장: `priceSale` 필드 추가
   ```javascript
   price: Number,        // 정가
   priceSale: Number,    // 할인가
   discountPercent: Number // 할인율
   ```

6. **상품 태그 시스템**
   ```javascript
   tags: [String]        // 예: ["인기", "신상품", "할인"]
   ```

7. **상품 조회수/인기도 통계**
   ```javascript
   stats: {
     views: Number (default: 0),
     purchases: Number (default: 0),
     wishlistCount: Number (default: 0)
   }
   ```

### 🟢 낮은 우선순위

8. **상품 버전 관리**
   - 상품 정보 변경 이력 추적

9. **다국어 지원**
   ```javascript
   name: {
     ko: String,
     en: String
   }
   ```

10. **상품 관련 상품 (연관 상품)**
    ```javascript
    relatedProducts: [ObjectId (ref: Product)]
    ```

---

## 📊 현재 스키마 요약

### ✅ 잘 설계된 부분
- ✅ 다중 이미지 지원 (최대 4개)
- ✅ 색상/사이즈 옵션 지원
- ✅ 검색 최적화 (phoneme_name, embedding)
- ✅ 재고 관리 기본 구조
- ✅ 배송/반품 정책 관리
- ✅ 리뷰 중복 방지 (unique index)
- ✅ 문의 상태 관리

### ⚠️ 개선이 필요한 부분
- ⚠️ 카테고리 참조가 String (ObjectId 권장)
- ⚠️ 사이즈별 재고 관리 부족
- ⚠️ 할인 가격 필드 없음
- ⚠️ 상품 상태 관리 없음
- ⚠️ 가격 이력 관리 없음

---

## 📝 체크리스트

상품 등록 시 필수 입력 항목:
- [x] SKU (고유 코드)
- [x] 상품명
- [x] 가격
- [x] 카테고리
- [x] 메인 이미지
- [ ] 상품 설명 (선택)
- [ ] 다중 이미지 (최대 4개, 선택)
- [ ] 색상 옵션 (선택)
- [ ] 사이즈 옵션 (선택)
- [ ] 배송 정책 (기본값 있음)
- [ ] 반품 정책 (기본값 있음)
- [ ] 재고 정보 (기본값 있음)

---

**작성일**: 2024년
**버전**: 1.0

