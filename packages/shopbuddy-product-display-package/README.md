# ShopBuddy Product Display Package

ShopBuddy 상품 표시 패키지 - 격자형과 원형 나열식 상품 표시 컴포넌트를 제공합니다.

## 설치

```bash
npm install @shopbuddy/product-display
```

또는 로컬 패키지로 사용:

```bash
npm install ./packages/shopbuddy-product-display-package
```

## 사용 방법

### 1. ProductGrid - 격자형 상품 나열

```jsx
import { ProductGrid } from '@shopbuddy/product-display'

function ProductsPage() {
  const products = [
    {
      _id: '1',
      name: '상품명',
      basePrice: 10000,
      salePrice: 8000,
      imageUrl: '/product.jpg',
      shipping: { isFree: true }
    },
    // ... 더 많은 상품
  ]

  const handleProductClick = (product) => {
    console.log('상품 클릭:', product)
    // 상품 상세 페이지로 이동 등
  }

  return (
    <ProductGrid 
      products={products}
      onProductClick={handleProductClick}
      options={{
        columns: 4, // 그리드 컬럼 수 (선택사항)
        gap: '1.5rem' // 그리드 간격 (선택사항)
      }}
    />
  )
}
```

### 2. ProductSphere - 원형 나열식 상품 표시 (3D 구체 배치)

```jsx
import { ProductSphere } from '@shopbuddy/product-display'

function ProductsPage() {
  const products = [
    {
      _id: '1',
      name: '상품명',
      basePrice: 10000,
      imageUrl: '/product.jpg',
      color: '#FF6B6B' // 원형 카드 배경색 (선택사항)
    },
    // ... 더 많은 상품
  ]

  const handleProductClick = (product) => {
    console.log('상품 클릭:', product)
  }

  return (
    <ProductSphere 
      products={products}
      onProductClick={handleProductClick}
      options={{
        enableFocus: true, // 포커스 기능 활성화 (기본값: true)
        minRadius: 300, // 최소 반지름 (기본값: 300)
        maxRadius: 800 // 최대 반지름 (기본값: 800)
      }}
    />
  )
}
```

### 3. ProductCard - 개별 상품 카드

```jsx
import { ProductCard } from '@shopbuddy/product-display'

function ProductCardExample() {
  const product = {
    _id: '1',
    name: '상품명',
    basePrice: 10000,
    salePrice: 8000,
    imageUrl: '/product.jpg'
  }

  return (
    <ProductCard 
      product={product}
      isCircle={true} // 원형 카드로 표시
      size="small" // 'small', 'uniform', 'large'
      isFocused={false} // 포커스 상태
    />
  )
}
```

## 컴포넌트 Props

### ProductGrid

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| products | Array | [] | 상품 배열 |
| onProductClick | Function | undefined | 상품 클릭 핸들러 |
| options | Object | {} | 옵션 객체 |
| options.columns | Number | undefined | 그리드 컬럼 수 (기본값: auto-fill) |
| options.gap | String | '1.5rem' | 그리드 간격 |

### ProductSphere

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| products | Array | [] | 상품 배열 |
| onProductClick | Function | undefined | 상품 클릭 핸들러 |
| options | Object | {} | 옵션 객체 |
| options.enableFocus | Boolean | true | 포커스 기능 활성화 |
| options.minRadius | Number | 300 | 최소 반지름 |
| options.maxRadius | Number | 800 | 최대 반지름 |

### ProductCard

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| product | Object | required | 상품 객체 |
| isCircle | Boolean | false | 원형 카드로 표시 |
| size | String | 'small' | 카드 크기 ('small', 'uniform', 'large') |
| isFocused | Boolean | false | 포커스 상태 |
| isGridItem | Boolean | false | 그리드 아이템으로 표시 |
| onSwipe | Function | undefined | 스와이프 핸들러 |

## 상품 객체 형식

```javascript
{
  _id: String, // 또는 id
  name: String, // 상품명
  basePrice: Number, // 기본 가격
  salePrice: Number, // 할인 가격 (선택사항)
  imageUrl: String, // 이미지 URL
  images: Array, // 이미지 배열 [{ url: String }]
  color: String, // 원형 카드 배경색 (선택사항)
  shipping: { // 배송 정보 (선택사항)
    isFree: Boolean
  },
  sellerName: String, // 판매자명 (선택사항)
  sellerId: { // 판매자 정보 (선택사항)
    businessName: String
  }
}
```

## 특징

### ProductGrid
- 반응형 그리드 레이아웃
- 호버 효과
- 할인율 표시
- 무료배송 배지
- 모바일 최적화

### ProductSphere
- 3D 구체 배치 알고리즘
- 드래그/터치로 회전
- 관성 회전 애니메이션
- 중앙 포커스 기능
- 반응형 크기 조정
- 모바일 최적화

## 요구사항

- React 18.2+
- React DOM 18.2+

## 스타일링

컴포넌트는 자체 CSS 파일을 포함하고 있습니다. 추가 스타일링이 필요한 경우 CSS 파일을 직접 수정하거나 CSS-in-JS를 사용할 수 있습니다.

## 라이선스

ISC

