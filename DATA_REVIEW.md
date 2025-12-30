# 데이터 리뷰 문서

## 📋 목차
1. [주문 데이터 구조 (Order)](#1-주문-데이터-구조-order)
2. [상품 데이터 구조 (Product)](#2-상품-데이터-구조-product)
3. [Excel Import 검증 및 위험 케이스](#3-excel-import-검증-및-위험-케이스)
4. [개선 제안](#4-개선-제안)

---

## 1. 주문 데이터 구조 (Order)

### 1.1 스키마 개요

```javascript
{
  orderNumber: String (required, unique, indexed),
  user: ObjectId (ref: 'User', indexed),
  guestName: String (default: ''),
  guestEmail: String (default: '', lowercase),
  contact: {
    phone: String,
    email: String (lowercase)
  },
  status: String (enum: ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'], default: 'pending', indexed),
  items: [{
    product: ObjectId (ref: 'Product', required),
    name: String (required),
    sku: String (default: ''),
    thumbnail: String (default: ''),
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
    grandTotal: Number (required, min: 0),
    couponDiscount: Number (default: 0, min: 0)
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
  audit: [{
    status: String,
    message: String,
    actor: ObjectId (ref: 'User'),
    createdAt: Date
  }],
  placedAt: Date (default: Date.now),
  cancelledAt: Date,
  timestamps: true (createdAt, updatedAt)
}
```

### 1.2 인덱스

- `orderNumber`: unique index
- `user`: index
- `status`: index
- `{ user: 1, placedAt: -1 }`: 복합 인덱스 (사용자별 주문 조회 최적화)

### 1.3 검증 규칙

#### ✅ 잘 구현된 부분

1. **필수 필드 검증**
   - `orderNumber`: unique 제약으로 중복 방지
   - `items`: 최소 1개 이상 필수 (배열 validator)
   - `shipping.address`: name, phone, postalCode, address1 필수

2. **금액 검증**
   - 모든 금액 필드: `min: 0` (음수 방지)
   - `quantity`: `min: 1` (0개 주문 방지)
   - `unitPrice`, `lineTotal`: `min: 0`

3. **스냅샷 구조**
   - 주문 아이템의 `name`, `sku`, `thumbnail`을 주문 시점에 저장
   - 상품 정보 변경 시에도 주문 정보 보존

4. **감사 로그 (Audit Trail)**
   - `audit` 배열로 주문 상태 변경 이력 추적

#### ⚠️ 잠재적 문제점

1. **데이터 일관성 검증 부족**

   **문제**: `summary.grandTotal`이 실제 계산값과 일치하는지 검증 없음
   
   ```javascript
   // 현재 코드는 grandTotal을 직접 받지만 검증하지 않음
   // 올바른 계산: subtotal - discountTotal - couponDiscount + shippingFee + tax = grandTotal
   ```
   
   **위험 케이스**:
   - 잘못된 `grandTotal` 값이 저장될 수 있음
   - 금액 불일치로 인한 정산 문제
   
   **권장 해결책**:
   ```javascript
   // orderSchema.pre('save') 또는 controller에서 검증
   const calculatedTotal = summary.subtotal 
     - summary.discountTotal 
     - summary.couponDiscount 
     + summary.shippingFee 
     + summary.tax;
   
   if (Math.abs(summary.grandTotal - calculatedTotal) > 0.01) {
     throw new Error('Grand total does not match calculated total');
   }
   ```

2. **주문 아이템 라인 총액 검증 부족**

   **문제**: `lineTotal`이 `quantity * unitPrice - lineDiscount`와 일치하는지 검증 없음
   
   **위험 케이스**:
   - 잘못된 `lineTotal` 값으로 인한 금액 오류
   
   **권장 해결책**:
   ```javascript
   orderItemSchema.pre('validate', function() {
     const calculatedLineTotal = (this.quantity * this.unitPrice) - this.lineDiscount;
     if (Math.abs(this.lineTotal - calculatedLineTotal) > 0.01) {
       throw new Error('Line total does not match calculated value');
     }
   });
   ```

3. **주문 상태 전이 검증 부족**

   **문제**: 주문 상태가 올바른 순서로 변경되는지 검증 없음
   
   **위험 케이스**:
   - `pending` → `fulfilled` (paid 단계 건너뛰기)
   - `cancelled` → `fulfilled` (취소된 주문을 배송 완료로 변경)
   
   **권장 해결책**:
   ```javascript
   const STATUS_TRANSITIONS = {
     pending: ['paid', 'cancelled'],
     paid: ['fulfilled', 'cancelled', 'refunded'],
     fulfilled: ['refunded'],
     cancelled: [], // 취소된 주문은 더 이상 변경 불가
     refunded: [] // 환불된 주문은 더 이상 변경 불가
   };
   
   orderSchema.pre('save', function() {
     if (this.isModified('status') && this.$locals.oldStatus) {
       const allowedNextStatuses = STATUS_TRANSITIONS[this.$locals.oldStatus];
       if (!allowedNextStatuses.includes(this.status)) {
         throw new Error(`Invalid status transition: ${this.$locals.oldStatus} → ${this.status}`);
       }
     }
   });
   ```

4. **배송 날짜 검증 부족**

   **문제**: `deliveredAt`이 `dispatchedAt`보다 이전일 수 있음
   
   **위험 케이스**:
   - 배송 완료일이 발송일보다 이전으로 저장됨
   
   **권장 해결책**:
   ```javascript
   orderSchema.pre('save', function() {
     if (this.shipping.dispatchedAt && this.shipping.deliveredAt) {
       if (this.shipping.deliveredAt < this.shipping.dispatchedAt) {
         throw new Error('Delivered date cannot be earlier than dispatched date');
       }
     }
   });
   ```

5. **결제 정보 검증 부족**

   **문제**: `payment.amount`와 `summary.grandTotal`이 일치하는지 검증 없음
   
   **위험 케이스**:
   - 결제 금액과 주문 금액 불일치
   
   **권장 해결책**:
   ```javascript
   orderSchema.pre('save', function() {
     if (this.payment.status === 'paid' && this.payment.amount > 0) {
       if (Math.abs(this.payment.amount - this.summary.grandTotal) > 0.01) {
         throw new Error('Payment amount does not match order total');
       }
     }
   });
   ```

### 1.4 시뮬레이션 데이터 생성 (스크립트)

현재 `resetAndCreateOrders.js`, `addMoreOrders.js` 스크립트에서 생성되는 시뮬레이션 데이터의 특징:

**✅ 잘 구현된 부분**:
- 고유 주문 번호 생성 (`YYYYMMDD-XXXXXX` 형식)
- 랜덤 상태 분포 (pending, paid, fulfilled, cancelled)
- 랜덤 상품 선택 및 수량
- 배송 정보 자동 생성
- 결제 정보 자동 생성

**⚠️ 개선 필요**:
- 금액 계산 검증 추가 (grandTotal = subtotal - discount + shippingFee)
- 배송 날짜 검증 (deliveredAt > dispatchedAt)
- 주문 상태별 날짜 일관성 (paid 상태면 paidAt 설정)

---

## 2. 상품 데이터 구조 (Product)

### 2.1 스키마 개요

```javascript
{
  sku: String (required, unique, uppercase, indexed),
  name: String (required),
  price: Number (required, min: 0),
  categoryId: ObjectId (ref: 'Category', required, indexed),
  categoryPathIds: [ObjectId] (ref: 'Category'),
  categoryPathText: String, // "주방용품 > 조리도구 > 건지기/망"
  category: String, // 하위 호환성 (최종 카테고리명)
  categoryMain: String,
  categoryMid: String,
  categorySub: String,
  image: String (default: ''),
  images: [String] (max: 4),
  description: String,
  colors: [{
    name: String (required),
    value: String (required), // HEX code
    image: String
  }],
  sizes: [{
    label: String (required), // "S (KR 95)"
    value: String (required), // "S"
    available: Boolean (default: true)
  }],
  shipping: {
    isFree: Boolean (default: false),
    fee: Number (default: 0, min: 0),
    estimatedDays: Number (default: 3, min: 1)
  },
  returnPolicy: {
    isReturnable: Boolean (default: true),
    returnDays: Number (default: 30, min: 0),
    returnFee: Number (default: 0, min: 0)
  },
  phoneme_name: String (indexed), // 검색 최적화
  embedding: [Number], // 벡터 임베딩
  inventory: {
    stock: Number (default: 0, min: 0),
    reserved: Number (default: 0, min: 0),
    reorderPoint: Number (default: 0),
    supplier: String,
    cost: Number (default: 0, min: 0),
    status: String (enum: ['in-stock', 'low-stock', 'critical', 'out-of-stock'], default: 'in-stock'),
    updatedAt: Date
  },
  timestamps: true
}
```

### 2.2 검증 규칙

#### ✅ 잘 구현된 부분

1. **필수 필드 검증**
   - `sku`: unique, uppercase로 정규화
   - `name`: 필수
   - `price`: min: 0 (음수 방지)
   - `categoryId`: 필수, ObjectId 참조

2. **배열 검증**
   - `images`: max: 4 (최대 4개 이미지)

3. **금액/수량 검증**
   - 모든 금액/수량 필드: `min: 0`
   - `estimatedDays`: `min: 1`

#### ⚠️ 잠재적 문제점

1. **재고 일관성 검증 부족**

   **문제**: `inventory.reserved`가 `inventory.stock`보다 클 수 있음
   
   **위험 케이스**:
   - 예약 수량이 실제 재고보다 많음
   - `stock = 10, reserved = 15` 같은 불가능한 상태
   
   **권장 해결책**:
   ```javascript
   productSchema.pre('save', function() {
     if (this.inventory.reserved > this.inventory.stock) {
       throw new Error('Reserved quantity cannot exceed stock quantity');
     }
     
     // 재고 상태 자동 업데이트
     if (this.inventory.stock === 0) {
       this.inventory.status = 'out-of-stock';
     } else if (this.inventory.stock <= this.inventory.reorderPoint) {
       this.inventory.status = 'critical';
     } else if (this.inventory.stock <= this.inventory.reorderPoint * 2) {
       this.inventory.status = 'low-stock';
     } else {
       this.inventory.status = 'in-stock';
     }
   });
   ```

2. **카테고리 경로 일관성 검증 부족**

   **문제**: `categoryPathText`와 `categoryMain/Mid/Sub`가 일치하지 않을 수 있음
   
   **위험 케이스**:
   - `categoryPathText = "주방용품 > 조리도구 > 건지기/망"`
   - `categoryMain = "욕실용품"` (불일치)
   
   **권장 해결책**:
   ```javascript
   productSchema.pre('save', function() {
     if (this.categoryMain || this.categoryMid || this.categorySub) {
       const parts = [];
       if (this.categoryMain) parts.push(this.categoryMain);
       if (this.categoryMid) parts.push(this.categoryMid);
       if (this.categorySub) parts.push(this.categorySub);
       const expectedPathText = parts.join(' > ');
       
       if (this.categoryPathText && this.categoryPathText !== expectedPathText) {
         console.warn(`Category path text mismatch: expected "${expectedPathText}", got "${this.categoryPathText}"`);
         // 자동 수정 또는 에러 발생
       }
     }
   });
   ```

3. **색상 값 검증 부족**

   **문제**: `colors[].value`가 유효한 HEX 코드인지 검증 없음
   
   **위험 케이스**:
   - `value = "red"` (HEX 형식 아님)
   - `value = "#GGGGGG"` (유효하지 않은 HEX)
   
   **권장 해결책**:
   ```javascript
   const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
   
   productSchema.path('colors').validate(function(colors) {
     if (!Array.isArray(colors)) return true;
     return colors.every(color => hexColorRegex.test(color.value));
   }, 'Color value must be a valid HEX color code (e.g., #FF0000)');
   ```

4. **가격 검증 부족**

   **문제**: `price`가 0이 될 수 있음 (무료 상품은 명시적으로 처리 필요)
   
   **위험 케이스**:
   - `price = 0`인 상품이 실수로 생성됨
   
   **권장 해결책**:
   ```javascript
   productSchema.path('price').validate(function(price) {
     // 0원 상품은 명시적으로 허용하되, 경고 로그 추가
     if (price === 0) {
       console.warn(`Product ${this.sku} has price of 0`);
     }
     return price >= 0;
   }, 'Price must be a positive number');
   ```

5. **상품 상태 필드 부재**

   **문제**: 상품 판매 상태를 나타내는 필드가 없음 (`status` 필드 없음)
   
   **위험 케이스**:
   - 판매 중지 상품을 구분할 수 없음
   - 재고는 있지만 판매 중지인 경우 처리 불가
   
   **권장 해결책**:
   ```javascript
   status: {
     type: String,
     enum: ['draft', 'active', 'inactive', 'discontinued'],
     default: 'active',
     index: true
   }
   ```

---

## 3. Excel Import 검증 및 위험 케이스

### 3.1 Excel Import 컬럼 매핑

현재 코드에서 지원하는 컬럼명:

```javascript
// 바코드 (SKU)
['바코드', 'barcode', 'Barcode', 'BARCODE', 'SKU', 'sku']

// 상품명
['상품명', 'name', 'Name', 'NAME', '제품명', 'product_name']

// 우수회원5 가격 (G열 직접 접근 또는 컬럼명)
G열 (인덱스 6) 또는 ['우수회원5', 'VIP5', 'vip5', '우수회원', 'member_price']

// 카테고리
['카테고리', 'category', 'Category', 'CATEGORY', 'category_path']
```

### 3.2 검증 로직

#### ✅ 잘 구현된 부분

1. **필수 필드 검증**
   - SKU (바코드): 필수, 빈 문자열 체크
   - 상품명: 필수, 빈 문자열 체크
   - 우수회원5 가격: 필수, 숫자 검증
   - 카테고리: 필수

2. **가격 계산**
   - 우수회원5 값 × 1.2로 정가 계산
   - `Math.round()`로 반올림

3. **SKU 정규화**
   - `trim().toUpperCase()`로 공백 제거 및 대문자 변환

4. **카테고리 자동 생성**
   - `upsertCategoryFromPath()`로 카테고리 경로 파싱 및 자동 생성

5. **중복 체크**
   - 커밋 시 SKU 중복 체크

#### ⚠️ 위험 케이스 및 개선 필요

1. **가격 검증 부족**

   **위험 케이스**:
   ```javascript
   // 현재 코드
   const vip5Num = Number(vip5);
   if (!isNaN(vip5Num) && vip5Num >= 0) {
     mapped.price = Math.round(vip5Num * 1.2);
   }
   ```
   
   **문제점**:
   - `vip5 = 0`인 경우 `price = 0` (무료 상품?)
   - `vip5 = -100`인 경우 `vip5Num >= 0` 검증으로 걸러지지만, 에러 메시지가 명확하지 않음
   - `vip5 = "100원"` 같은 문자열 포함 숫자는 `NaN`으로 처리되지만, 사용자에게 명확한 피드백 없음
   - `vip5 = 999999999` 같은 비정상적으로 큰 숫자 검증 없음
   
   **권장 개선**:
   ```javascript
   // 가격 검증 강화
   const vip5Num = Number(vip5);
   if (isNaN(vip5Num)) {
     validation.ok = false;
     validation.errors.push(`VIP5 price must be a number (got: "${vip5}")`);
   } else if (vip5Num < 0) {
     validation.ok = false;
     validation.errors.push(`VIP5 price cannot be negative (got: ${vip5Num})`);
   } else if (vip5Num === 0) {
     validation.ok = false;
     validation.errors.push('VIP5 price cannot be zero (free products are not allowed)');
   } else if (vip5Num > 100000000) {
     validation.ok = false;
     validation.errors.push(`VIP5 price is too large (got: ${vip5Num}, max: 100,000,000)`);
   } else {
     const calculatedPrice = Math.round(vip5Num * 1.2);
     if (calculatedPrice === 0) {
       validation.ok = false;
       validation.errors.push(`Calculated price is zero (VIP5: ${vip5Num} * 1.2 = ${calculatedPrice})`);
     } else {
       mapped.price = calculatedPrice;
     }
   }
   ```

2. **SKU 형식 검증 부족**

   **위험 케이스**:
   - `sku = "  "` (공백만 있는 경우): `trim()`으로 처리되지만, 검증 단계에서 이미 통과
   - `sku = "ABC-123-456-789"` (너무 긴 SKU)
   - `sku = "ABC@#$%123"` (특수문자 포함)
   - `sku = "12345678901234567890"` (너무 긴 숫자)
   
   **권장 개선**:
   ```javascript
   // SKU 검증 강화
   if (!barcode || (typeof barcode === 'string' && !barcode.trim())) {
     validation.ok = false;
     validation.errors.push('Barcode is required');
   } else {
     const trimmedSku = String(barcode).trim().toUpperCase();
     
     // 길이 검증
     if (trimmedSku.length === 0) {
       validation.ok = false;
       validation.errors.push('Barcode cannot be empty after trimming');
     } else if (trimmedSku.length > 50) {
       validation.ok = false;
       validation.errors.push(`Barcode is too long (${trimmedSku.length} chars, max: 50)`);
     } else if (trimmedSku.length < 3) {
       validation.ok = false;
       validation.errors.push(`Barcode is too short (${trimmedSku.length} chars, min: 3)`);
     }
     
     // 형식 검증 (영문자, 숫자, 하이픈, 언더스코어만 허용)
     const skuPattern = /^[A-Z0-9_-]+$/;
     if (!skuPattern.test(trimmedSku)) {
       validation.ok = false;
       validation.errors.push(`Barcode contains invalid characters (only letters, numbers, hyphens, and underscores allowed)`);
     }
     
     mapped.sku = trimmedSku;
   }
   ```

3. **상품명 검증 부족**

   **위험 케이스**:
   - `name = "   "` (공백만 있는 경우)
   - `name = "A"` (너무 짧은 상품명)
   - `name = "상품명상품명상품명..."` (너무 긴 상품명, 500자 이상)
   - `name = "상품명\n\n\n"` (줄바꿈 문자 포함)
   
   **권장 개선**:
   ```javascript
   // 상품명 검증 강화
   if (!name || (typeof name === 'string' && !name.trim())) {
     validation.ok = false;
     validation.errors.push('Product name is required');
   } else {
     const trimmedName = String(name).trim();
     
     if (trimmedName.length === 0) {
       validation.ok = false;
       validation.errors.push('Product name cannot be empty after trimming');
     } else if (trimmedName.length < 2) {
       validation.ok = false;
       validation.errors.push(`Product name is too short (${trimmedName.length} chars, min: 2)`);
     } else if (trimmedName.length > 200) {
       validation.ok = false;
       validation.errors.push(`Product name is too long (${trimmedName.length} chars, max: 200)`);
     }
     
     // 줄바꿈 문자 제거 또는 경고
     if (trimmedName.includes('\n') || trimmedName.includes('\r')) {
       validation.warnings = validation.warnings || [];
       validation.warnings.push('Product name contains line breaks, they will be removed');
       mapped.name = trimmedName.replace(/[\n\r]+/g, ' ');
     } else {
       mapped.name = trimmedName;
     }
   }
   ```

4. **카테고리 경로 검증 부족**

   **위험 케이스**:
   - `categoryPath = "주방용품"` (1단계만 있는 경우는 허용됨)
   - `categoryPath = "주방용품 > > 조리도구"` (빈 단계 포함)
   - `categoryPath = "주방용품 > 조리도구 > 건지기/망 > 추가단계"` (4단계 이상)
   - `categoryPath = "  "` (공백만 있는 경우)
   - `categoryPath = "주방용품>>조리도구"` (구분자 공백 없음, 현재 `split('>')`로 처리되지만 경고 필요)
   
   **권장 개선**:
   ```javascript
   // 카테고리 경로 검증 강화
   if (!categoryPath || (typeof categoryPath === 'string' && !categoryPath.trim())) {
     validation.ok = false;
     validation.errors.push('Category is required');
   } else {
     const trimmedPath = String(categoryPath).trim();
     
     if (trimmedPath.length === 0) {
       validation.ok = false;
       validation.errors.push('Category path cannot be empty');
     } else {
       // 구분자로 분리
       const parts = trimmedPath.split('>').map(p => p.trim()).filter(p => p);
       
       if (parts.length === 0) {
         validation.ok = false;
         validation.errors.push('Category path must contain at least one category name');
       } else if (parts.length > 3) {
         validation.ok = false;
         validation.errors.push(`Category path has too many levels (${parts.length} levels, max: 3)`);
       } else {
         // 각 카테고리명 검증
         for (let i = 0; i < parts.length; i++) {
           const part = parts[i];
           if (part.length < 2) {
             validation.ok = false;
             validation.errors.push(`Category level ${i + 1} name is too short (min: 2 chars)`);
           } else if (part.length > 50) {
             validation.ok = false;
             validation.errors.push(`Category level ${i + 1} name is too long (max: 50 chars)`);
           }
         }
       }
       
       if (validation.ok) {
         // 카테고리 처리 로직
         try {
           const categoryResult = await upsertCategoryFromPath(trimmedPath);
           // ...
         } catch (categoryError) {
           validation.ok = false;
           validation.errors.push(`Category error: ${categoryError.message}`);
         }
       }
     }
   }
   ```

5. **Excel 파일 형식 검증 부족**

   **위험 케이스**:
   - 파일이 Excel 형식이 아닌 경우 (CSV, TXT 등)
   - 첫 번째 시트가 비어있는 경우
   - 헤더 행이 없는 경우
   - 헤더 행만 있고 데이터 행이 없는 경우
   - G열이 존재하지 않는 경우 (컬럼 수 부족)
   
   **권장 개선**:
   ```javascript
   // Excel 파일 형식 검증
   if (!req.file) {
     return res.status(400).json({ message: 'Excel file is required' });
   }
   
   // MIME 타입 검증
   const allowedMimeTypes = [
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
     'application/vnd.ms-excel', // .xls
   ];
   if (!allowedMimeTypes.includes(req.file.mimetype)) {
     return res.status(400).json({ 
       message: `Invalid file type: ${req.file.mimetype}. Only Excel files (.xlsx, .xls) are allowed.` 
     });
   }
   
   // 파일 크기 제한 (예: 10MB)
   const maxFileSize = 10 * 1024 * 1024; // 10MB
   if (req.file.size > maxFileSize) {
     return res.status(400).json({ 
       message: `File is too large: ${(req.file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.` 
     });
   }
   
   // Excel 파싱
   const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
   
   if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
     return res.status(400).json({ message: 'Excel file has no sheets' });
   }
   
   const sheetName = workbook.SheetNames[0];
   const worksheet = workbook.Sheets[sheetName];
   
   if (!worksheet) {
     return res.status(400).json({ message: 'First sheet is empty' });
   }
   
   // 데이터 파싱
   const data = XLSX.utils.sheet_to_json(worksheet, { 
     header: 1,
     defval: null
   });
   
   if (!data || data.length === 0) {
     return res.status(400).json({ message: 'Excel file is empty' });
   }
   
   // 헤더 검증
   const headers = data[0] || [];
   if (headers.length === 0) {
     return res.status(400).json({ message: 'Excel file has no header row' });
   }
   
   // G열 존재 확인
   if (headers.length < 7) {
     return res.status(400).json({ 
       message: `Excel file has insufficient columns (${headers.length} columns, at least 7 columns including G column required)` 
     });
   }
   
   // 데이터 행 확인
   const rows = data.slice(1);
   if (rows.length === 0) {
     return res.status(400).json({ message: 'Excel file has no data rows' });
   }
   ```

6. **트랜잭션 처리 부족**

   **위험 케이스**:
   - 여러 상품을 등록하는 중간에 오류 발생 시, 일부만 등록됨
   - 카테고리는 생성되었지만 상품 생성 실패 시 데이터 불일치
   
   **권장 개선**:
   ```javascript
   // MongoDB 세션을 사용한 트랜잭션
   const session = await mongoose.startSession();
   session.startTransaction();
   
   try {
     for (const item of rowsToProcess) {
       // 카테고리 생성/조회
       const categoryResult = await upsertCategoryFromPath(categoryPath, { session });
       
       // 상품 생성
       await Product.create([productPayload], { session });
     }
     
     await session.commitTransaction();
   } catch (error) {
     await session.abortTransaction();
     throw error;
   } finally {
     session.endSession();
   }
   ```

7. **성능 이슈**

   **위험 케이스**:
   - 각 행마다 `upsertCategoryFromPath()`를 호출하여 DB 쿼리가 많음
   - 카테고리 경로가 중복되는 경우에도 매번 조회/생성
   
   **권장 개선**:
   ```javascript
   // 카테고리 경로를 미리 집계하여 한 번에 처리
   const categoryPaths = new Set();
   previewData.forEach(item => {
     if (item.raw.categoryPath) {
       categoryPaths.add(item.raw.categoryPath);
     }
   });
   
   // 카테고리 미리 생성/조회
   const categoryMap = new Map();
   for (const categoryPath of categoryPaths) {
     const categoryResult = await upsertCategoryFromPath(categoryPath);
     categoryMap.set(categoryPath, categoryResult.category._id);
   }
   
   // 상품 생성 시 categoryMap에서 조회
   const categoryId = categoryMap.get(item.raw.categoryPath);
   ```

---

## 4. 개선 제안

### 🔴 높은 우선순위

1. **주문 데이터 검증 강화**
   - `grandTotal` 계산 검증 추가
   - `lineTotal` 계산 검증 추가
   - 주문 상태 전이 검증 추가
   - 배송 날짜 검증 추가

2. **상품 데이터 검증 강화**
   - 재고 일관성 검증 (`reserved <= stock`)
   - 카테고리 경로 일관성 검증
   - 색상 값 HEX 형식 검증
   - 상품 상태 필드 추가

3. **Excel Import 검증 강화**
   - 가격 범위 검증 (0, 음수, 비정상적으로 큰 값)
   - SKU 형식 검증 (길이, 특수문자)
   - 상품명 검증 (길이, 줄바꿈)
   - 카테고리 경로 검증 (레벨 수, 빈 단계)
   - Excel 파일 형식 검증 (MIME 타입, 크기, 시트 존재)

4. **트랜잭션 처리**
   - Excel Import 시 트랜잭션 사용하여 원자성 보장

### 🟡 중간 우선순위

5. **성능 최적화**
   - Excel Import 시 카테고리 미리 생성/조회
   - 배치 처리로 DB 쿼리 최소화

6. **에러 메시지 개선**
   - 사용자 친화적인 에러 메시지
   - 에러 위치 정보 (행 번호, 컬럼명)

7. **로깅 및 모니터링**
   - Import 실패 로그 저장
   - 성능 메트릭 수집

### 🟢 낮은 우선순위

8. **데이터 마이그레이션 스크립트**
   - 기존 데이터 검증 및 정리
   - 불일치 데이터 수정

9. **테스트 데이터 생성 개선**
   - 시뮬레이션 데이터 생성 시 검증 로직 적용
   - 금액 계산 정확성 보장

---

## 📊 요약

### ✅ 잘 구현된 부분

1. **주문 데이터**
   - 필수 필드 검증
   - 금액/수량 음수 방지
   - 스냅샷 구조로 데이터 보존
   - 감사 로그

2. **상품 데이터**
   - SKU unique 제약
   - 필수 필드 검증
   - 이미지 개수 제한

3. **Excel Import**
   - 필수 필드 검증
   - 가격 계산 로직
   - SKU 정규화
   - 카테고리 자동 생성
   - 중복 체크

### ⚠️ 개선 필요

1. **주문 데이터**
   - 금액 계산 일관성 검증 부족
   - 주문 상태 전이 검증 부족
   - 배송 날짜 검증 부족

2. **상품 데이터**
   - 재고 일관성 검증 부족
   - 카테고리 경로 일관성 검증 부족
   - 색상 값 형식 검증 부족
   - 상품 상태 필드 부재

3. **Excel Import**
   - 가격 범위 검증 부족
   - SKU 형식 검증 부족
   - 상품명 검증 부족
   - 카테고리 경로 검증 부족
   - Excel 파일 형식 검증 부족
   - 트랜잭션 처리 부족
   - 성능 이슈

---

**작성일**: 2024년
**버전**: 1.0

