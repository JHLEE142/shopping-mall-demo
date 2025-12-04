# ShopBuddy 데이터베이스 스키마

AI 쇼핑 비서 기반 멀티 셀러 마켓플레이스 플랫폼을 위한 MongoDB 스키마 설계입니다.

## 스키마 구조

### 1. 사용자 및 권한 관리

#### User
- 모든 사용자 (구매자 + 셀러 후보)
- 역할: buyer, seller, admin
- 주소 정보 포함

#### Seller
- 입점 판매자 정보
- 사업자 정보, 계좌 정보, 커미션율
- 상태: pending, approved, suspended, rejected

#### SellerApplication
- 판매자 신청서
- 승인/반려 관리

### 2. 상품 관리

#### Category
- 카테고리 (계층 구조 지원)
- 카테고리별 커미션율 설정 가능

#### Product
- 상품 정보
- ownershipType: 'seller' (입점 셀러), 'platform' (도매콜/플랫폼 직접 판매)
- AI 설명 필드 (aiDescription, aiSummary)
- AI 추천 점수 (aiRecommendationScore)

#### ProductOption
- 상품 옵션 (사이즈, 색상 등)
- 옵션별 가격 조정 및 재고 관리

#### ProductImage
- 상품 이미지
- 대표 이미지 설정

### 3. 공급사 연동

#### Supplier
- 도매콜 등 공급사 정보
- API 연동 설정

#### SupplierProduct
- 공급사 상품 정보
- 내부 Product와 매핑
- 동기화 상태 관리

### 4. 쇼핑 및 주문

#### Cart
- 장바구니
- 30일 자동 만료

#### Order
- 주문 정보
- 커미션 정보 포함 (commissionRate, commissionAmount, sellerEarnings)
- 주문 항목별 셀러 정보

#### Payment
- 결제 정보
- 다양한 결제 수단 지원

#### Refund
- 환불 정보
- 전체/부분 환불 지원

#### Shipment
- 배송 정보
- 배송 추적 이력

### 5. 정산

#### SellerPayout
- 판매자 정산 정보
- 기간별 정산
- 정산 항목 상세 내역

### 6. 리뷰

#### Review
- 상품 리뷰
- AI 요약 포함
- 셀러 답변 기능

### 7. AI 쇼핑 비서

#### Conversation
- AI 대화 세션
- 컨텍스트 정보 (intent, category, budget, preferences)

#### Message
- 대화 메시지
- 사용자/AI/시스템 메시지
- 메시지 타입 (text, product_list, comparison 등)

#### AIIntent
- AI 의도 파싱 결과
- 엔티티 추출 정보

#### AIActionLog
- AI 액션 실행 로그
- 성능 메트릭 (responseTime, tokensUsed)

## 주요 관계

```
User (1) ──< (1) Seller
User (1) ──< (N) Order
User (1) ──< (1) Cart

Seller (1) ──< (N) Product
Seller (1) ──< (N) SellerPayout

Product (1) ──< (N) ProductOption
Product (1) ──< (N) ProductImage
Product (1) ──< (N) Review

Order (1) ──< (1) Payment
Order (1) ──< (1) Shipment
Order (1) ──< (N) Refund

Conversation (1) ──< (N) Message
Conversation (1) ──< (N) AIIntent
Conversation (1) ──< (N) AIActionLog
```

## 커미션 계산 로직

1. 주문 생성 시:
   - 각 주문 항목별로 sellerId 확인
   - Seller의 commissionRate 또는 Category의 commissionRate 사용
   - commissionAmount = totalPrice * (commissionRate / 100)
   - sellerEarnings = totalPrice - commissionAmount

2. 정산 시:
   - 기간 내 배송 완료된 주문만 포함
   - 환불 금액 차감
   - SellerPayout에 정산 내역 저장

## 인덱스 전략

- 자주 조회되는 필드에 인덱스 설정
- 복합 인덱스 활용 (userId + status 등)
- 텍스트 검색 인덱스 (Product의 name, description, tags)
- TTL 인덱스 (Cart의 expiresAt)

## 사용 예시

```javascript
import { Product, Order, Seller } from './models/index.js';

// 상품 조회
const products = await Product.find({ status: 'active' })
  .populate('categoryId')
  .populate('sellerId');

// 주문 생성 시 커미션 계산
const seller = await Seller.findById(orderItem.sellerId);
const commissionRate = seller.commissionRate || 10;
const commissionAmount = orderItem.totalPrice * (commissionRate / 100);
const sellerEarnings = orderItem.totalPrice - commissionAmount;
```

