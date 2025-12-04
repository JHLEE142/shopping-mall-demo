# 카테고리 및 상품 API 문서

## 카테고리 API

### 1. 카테고리 목록 조회

**GET** `/api/categories`

카테고리 목록을 조회합니다.

#### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `parentId` | String | ❌ | 부모 카테고리 ID (지정 시 하위 카테고리만 조회) |
| `includeProductCount` | Boolean | ❌ | 상품 수 포함 여부 (기본값: false) |

#### Response

```json
{
  "success": true,
  "message": "카테고리 목록 조회 성공",
  "data": {
    "categories": [
      {
        "_id": "...",
        "name": "주방용품",
        "slug": "kitchen-supplies",
        "code": "kitchen",
        "color": "#FF6B6B",
        "description": "주방에서 필요한 모든 용품",
        "order": 1,
        "isActive": true,
        "productCount": 150,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

#### 예시

```bash
# 모든 최상위 카테고리 조회
GET /api/categories

# 상품 수 포함하여 조회
GET /api/categories?includeProductCount=true

# 특정 부모 카테고리의 하위 카테고리 조회
GET /api/categories?parentId=507f1f77bcf86cd799439011
```

---

### 2. 카테고리 상세 조회

**GET** `/api/categories/:id`

카테고리 ID 또는 코드로 상세 정보를 조회합니다.

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | String | ✅ | 카테고리 ID (ObjectId) 또는 코드 (예: 'kitchen') |

#### Response

```json
{
  "success": true,
  "message": "카테고리 조회 성공",
  "data": {
    "category": {
      "_id": "...",
      "name": "주방용품",
      "slug": "kitchen-supplies",
      "code": "kitchen",
      "color": "#FF6B6B",
      "description": "주방에서 필요한 모든 용품",
      "order": 1,
      "isActive": true,
      "productCount": 150,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### 예시

```bash
# ID로 조회
GET /api/categories/507f1f77bcf86cd799439011

# 코드로 조회
GET /api/categories/kitchen
```

---

### 3. 카테고리 생성 (관리자)

**POST** `/api/categories`

새 카테고리를 생성합니다. (관리자 권한 필요)

#### Headers

```
Authorization: Bearer <token>
```

#### Request Body

```json
{
  "name": "주방용품",
  "slug": "kitchen-supplies",
  "code": "kitchen",
  "color": "#FF6B6B",
  "description": "주방에서 필요한 모든 용품",
  "order": 1,
  "parentId": null,
  "commissionRate": 10
}
```

#### Response

```json
{
  "success": true,
  "message": "카테고리가 생성되었습니다.",
  "data": {
    "category": { ... }
  }
}
```

---

### 4. 카테고리 수정 (관리자)

**PUT** `/api/categories/:id`

카테고리 정보를 수정합니다. (관리자 권한 필요)

#### Headers

```
Authorization: Bearer <token>
```

#### Request Body

```json
{
  "name": "주방용품 (수정)",
  "color": "#FF0000"
}
```

---

### 5. 카테고리 삭제 (관리자)

**DELETE** `/api/categories/:id`

카테고리를 비활성화합니다. (관리자 권한 필요)

#### Headers

```
Authorization: Bearer <token>
```

---

### 6. 카테고리별 상품 수 업데이트 (관리자)

**PUT** `/api/categories/:id/product-count`

특정 카테고리의 상품 수를 계산하여 업데이트합니다.

#### Headers

```
Authorization: Bearer <token>
```

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | String | ✅ | 카테고리 ID 또는 코드 |

---

### 7. 모든 카테고리 상품 수 업데이트 (관리자)

**POST** `/api/categories/update-product-counts`

모든 카테고리의 상품 수를 일괄 업데이트합니다.

#### Headers

```
Authorization: Bearer <token>
```

---

## 상품 API (카테고리 필터링)

### 1. 상품 목록 조회 (카테고리 필터링)

**GET** `/api/products`

상품 목록을 조회합니다. 카테고리 코드로 필터링 가능합니다.

#### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `category` | String | ❌ | 카테고리 코드 (예: 'kitchen', 'all'은 전체) |
| `categoryId` | String | ❌ | 카테고리 ID (ObjectId) |
| `sellerId` | String | ❌ | 판매자 ID |
| `search` | String | ❌ | 검색어 (상품명, 설명, 태그) |
| `minPrice` | Number | ❌ | 최소 가격 |
| `maxPrice` | Number | ❌ | 최대 가격 |
| `sort` | String | ❌ | 정렬 기준 (기본값: 'createdAt') |
| `order` | String | ❌ | 정렬 순서 ('asc' 또는 'desc', 기본값: 'desc') |
| `page` | Number | ❌ | 페이지 번호 (기본값: 1) |
| `limit` | Number | ❌ | 페이지당 항목 수 (기본값: 20) |

#### Response

```json
{
  "success": true,
  "message": "상품 목록 조회 성공",
  "data": {
    "products": [
      {
        "_id": "...",
        "name": "상품명",
        "slug": "product-slug",
        "description": "상품 설명",
        "basePrice": 25000,
        "salePrice": 20000,
        "categoryId": {
          "_id": "...",
          "name": "주방용품",
          "slug": "kitchen-supplies",
          "code": "kitchen",
          "color": "#FF6B6B"
        },
        "sellerId": {
          "_id": "...",
          "businessName": "판매자명"
        },
        "status": "active",
        "viewCount": 100,
        "purchaseCount": 50,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 예시

```bash
# 전체 상품 조회
GET /api/products

# 카테고리 코드로 필터링
GET /api/products?category=kitchen

# 전체 상품 조회 (명시적)
GET /api/products?category=all

# 카테고리 ID로 필터링
GET /api/products?categoryId=507f1f77bcf86cd799439011

# 검색 및 필터링
GET /api/products?category=kitchen&search=냄비&minPrice=10000&maxPrice=50000

# 정렬 및 페이지네이션
GET /api/products?category=kitchen&sort=basePrice&order=asc&page=1&limit=20
```

---

## 프론트엔드 연동 예시

### React에서 사용

```javascript
import api from '../utils/api';

// 카테고리 목록 조회
const fetchCategories = async () => {
  const response = await api.get('/categories', {
    params: { includeProductCount: true }
  });
  return response.data.data.categories;
};

// 카테고리 코드로 상품 조회
const fetchProductsByCategory = async (categoryCode) => {
  const response = await api.get('/products', {
    params: { 
      category: categoryCode,
      page: 1,
      limit: 150
    }
  });
  return response.data.data.products;
};

// 카테고리 코드로 카테고리 정보 조회
const fetchCategoryByCode = async (code) => {
  const response = await api.get(`/categories/${code}`);
  return response.data.data.category;
};
```

---

## 에러 응답

모든 API는 다음과 같은 형식의 에러 응답을 반환합니다:

```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 정보 (개발 환경에서만)"
}
```

### 주요 HTTP 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

