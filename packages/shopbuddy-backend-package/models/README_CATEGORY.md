# 카테고리 및 상품 데이터베이스 스키마 설계

## 개요

이 문서는 ShopBuddy의 카테고리와 상품 관련 데이터베이스 스키마 설계를 설명합니다.

## 모델 구조

### 1. Category (카테고리)

카테고리 정보를 저장하는 모델입니다.

#### 필드

| 필드명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| `name` | String | 카테고리 이름 | ✅ |
| `slug` | String | URL 친화적 식별자 (고유) | ✅ |
| `code` | String | 카테고리 고유 코드 (프론트엔드 ID, 고유) | ✅ |
| `description` | String | 카테고리 설명 | ❌ |
| `color` | String | 카테고리 색상 (HEX 형식, 기본값: #333333) | ❌ |
| `image` | String | 카테고리 이미지 URL | ❌ |
| `icon` | String | 카테고리 아이콘 URL 또는 이름 | ❌ |
| `parentId` | ObjectId | 부모 카테고리 ID (계층 구조 지원) | ❌ |
| `order` | Number | 정렬 순서 (기본값: 0) | ❌ |
| `isActive` | Boolean | 활성화 여부 (기본값: true) | ❌ |
| `commissionRate` | Number | 카테고리별 수수료율 (0-100, null이면 기본값 사용) | ❌ |
| `metaTitle` | String | SEO 메타 타이틀 | ❌ |
| `metaDescription` | String | SEO 메타 설명 | ❌ |
| `productCount` | Number | 해당 카테고리 상품 수 (기본값: 0) | ❌ |
| `createdAt` | Date | 생성일시 (자동) | - |
| `updatedAt` | Date | 수정일시 (자동) | - |

#### 인덱스

- `slug`: 고유 인덱스
- `code`: 고유 인덱스
- `parentId`: 일반 인덱스 (계층 구조 조회용)
- `isActive`: 일반 인덱스 (활성 카테고리 필터링용)
- `order`: 일반 인덱스 (정렬용)
- `productCount`: 일반 인덱스 (인기 카테고리 조회용)

#### 예시 데이터

```javascript
{
  name: "주방용품",
  slug: "kitchen-supplies",
  code: "kitchen",
  description: "주방에서 사용하는 모든 용품",
  color: "#FF6B6B",
  image: "https://example.com/images/kitchen.jpg",
  icon: "kitchen-icon",
  parentId: null,
  order: 1,
  isActive: true,
  commissionRate: 10,
  productCount: 150
}
```

### 2. Product (상품)

상품 정보를 저장하는 모델입니다. Category와 `categoryId`로 연결됩니다.

#### 주요 필드

| 필드명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| `name` | String | 상품명 | ✅ |
| `slug` | String | URL 친화적 식별자 (고유) | ✅ |
| `description` | String | 상품 설명 | ✅ |
| `categoryId` | ObjectId | 카테고리 ID (Category 참조) | ✅ |
| `basePrice` | Number | 기본 가격 | ✅ |
| `salePrice` | Number | 할인 가격 | ❌ |
| `status` | String | 판매 상태 (draft/active/inactive/out_of_stock) | ❌ |
| `stockManagement` | String | 재고 관리 방식 (track/unlimited) | ❌ |
| `totalStock` | Number | 총 재고 수 | ❌ |
| `shipping` | Object | 배송 정보 | ❌ |
| `tags` | [String] | 태그 배열 | ❌ |

#### 인덱스

- `slug`: 고유 인덱스
- `categoryId`: 일반 인덱스 (카테고리별 필터링용)
- `status`: 일반 인덱스 (활성 상품 필터링용)
- `sellerId`: 일반 인덱스
- `ownershipType`: 일반 인덱스
- `aiRecommendationScore`: 일반 인덱스 (추천 상품 조회용)
- 텍스트 검색 인덱스: `name`, `description`, `tags`

## 관계 구조

```
Category (1) ──< (N) Product
    │
    └── (self-reference) parentId
```

- 하나의 카테고리는 여러 상품을 가질 수 있습니다 (1:N)
- 카테고리는 계층 구조를 지원합니다 (부모-자식 관계)

## 사용 예시

### 카테고리별 상품 조회

```javascript
// 카테고리 코드로 상품 조회
const category = await Category.findOne({ code: 'kitchen' });
const products = await Product.find({ 
  categoryId: category._id,
  status: 'active'
});
```

### 카테고리 계층 구조 조회

```javascript
// 최상위 카테고리 조회
const topCategories = await Category.find({ 
  parentId: null,
  isActive: true
}).sort({ order: 1 });

// 특정 카테고리의 하위 카테고리 조회
const subCategories = await Category.find({ 
  parentId: parentCategoryId,
  isActive: true
}).sort({ order: 1 });
```

### 카테고리별 상품 수 업데이트

```javascript
// 카테고리별 상품 수 계산 및 업데이트
const productCount = await Product.countDocuments({ 
  categoryId: categoryId,
  status: 'active'
});
await Category.findByIdAndUpdate(categoryId, { productCount });
```

## 프론트엔드 연동

프론트엔드에서 사용하는 카테고리 코드와 데이터베이스의 `code` 필드가 일치해야 합니다:

- `all` - 전체 상품
- `kitchen` - 주방용품
- `bathroom` - 욕실용품
- `bedding` - 침구/홈데코
- `cleaning` - 청소용품
- `daily` - 생활잡화
- `storage` - 수납/정리
- `interior` - 인테리어소품
- `electronics` - 전자제품
- `food` - 식품/음료
- `pet` - 반려동물용품
- `outdoor` - 야외/캠핑
- `office` - 사무용품
- `health` - 건강용품
- `beauty` - 뷰티/미용
- `baby` - 육아용품

## 마이그레이션 가이드

기존 데이터베이스에 카테고리를 추가하려면:

1. 각 카테고리에 `code` 필드 추가
2. 각 카테고리에 `color` 필드 추가
3. `productCount` 필드를 계산하여 업데이트

```javascript
// 카테고리 초기 데이터 생성 예시
const categories = [
  { name: '전체 상품', slug: 'all-products', code: 'all', color: '#333333', order: 0 },
  { name: '주방용품', slug: 'kitchen-supplies', code: 'kitchen', color: '#FF6B6B', order: 1 },
  { name: '욕실용품', slug: 'bathroom-supplies', code: 'bathroom', color: '#4ECDC4', order: 2 },
  // ... 나머지 카테고리
];

await Category.insertMany(categories);
```

