# ShopBuddy API 라우터

기획서에 맞춰 설계된 모든 API 엔드포인트입니다.

## 라우터 구조

### 1. 인증 및 사용자 (`/api/auth`, `/api/users`)

#### 인증 (`/api/auth`)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/me` - 현재 사용자 정보

#### 사용자 (`/api/users`)
- `GET /api/users/:id` - 사용자 프로필 조회
- `PUT /api/users/:id` - 사용자 프로필 수정
- `GET /api/users/:id/addresses` - 주소 목록 조회
- `POST /api/users/:id/addresses` - 주소 추가
- `GET /api/users/:id/orders` - 주문 내역 조회

### 2. 셀러 관련 (`/api/seller-applications`, `/api/sellers`)

#### 판매자 신청 (`/api/seller-applications`)
- `POST /api/seller-applications` - 판매자 신청
- `GET /api/seller-applications/my-application` - 내 신청서 조회
- `PUT /api/seller-applications/:id` - 신청서 수정
- `GET /api/seller-applications` - 관리자: 신청서 목록
- `GET /api/seller-applications/:id` - 관리자: 신청서 상세
- `POST /api/seller-applications/:id/approve` - 관리자: 승인
- `POST /api/seller-applications/:id/reject` - 관리자: 반려

#### 판매자 (`/api/sellers`)
- `GET /api/sellers/:id` - 판매자 정보 조회
- `GET /api/sellers/me/profile` - 내 판매자 정보
- `PUT /api/sellers/me/profile` - 판매자 정보 수정
- `GET /api/sellers/:id/products` - 판매자 상품 목록
- `GET /api/sellers/me/stats` - 내 판매 통계
- `GET /api/sellers/me/orders` - 내 주문 목록
- `POST /api/sellers/me/orders/:orderId/ship` - 주문 출고 처리
- `GET /api/sellers/me/payouts` - 정산 내역 조회
- `GET /api/sellers/me/payouts/:id` - 정산 상세 조회

### 3. 상품 관련 (`/api/categories`, `/api/products`)

#### 카테고리 (`/api/categories`)
- `GET /api/categories` - 카테고리 목록 (계층 구조)
- `GET /api/categories/:id` - 카테고리 상세
- `POST /api/categories` - 관리자: 카테고리 생성
- `PUT /api/categories/:id` - 관리자: 카테고리 수정
- `DELETE /api/categories/:id` - 관리자: 카테고리 삭제

#### 상품 (`/api/products`)
- `GET /api/products` - 상품 목록 (필터링, 정렬, 페이지네이션)
- `GET /api/products/:id` - 상품 상세
- `POST /api/products/:id/ai-description` - AI 상품 설명 생성
- `POST /api/products` - 판매자: 상품 등록
- `PUT /api/products/:id` - 판매자: 상품 수정
- `DELETE /api/products/:id` - 판매자: 상품 삭제
- `GET /api/products/:id/options` - 상품 옵션 조회
- `GET /api/products/:id/images` - 상품 이미지 조회

### 4. 쇼핑 관련 (`/api/carts`, `/api/orders`)

#### 장바구니 (`/api/carts`)
- `GET /api/carts` - 장바구니 조회
- `POST /api/carts/items` - 장바구니에 상품 추가
- `PUT /api/carts/items/:itemId` - 장바구니 항목 수정
- `DELETE /api/carts/items/:itemId` - 장바구니 항목 삭제
- `DELETE /api/carts` - 장바구니 비우기

#### 주문 (`/api/orders`)
- `POST /api/orders` - 주문 생성 (장바구니에서)
- `POST /api/orders/direct` - 바로 구매
- `GET /api/orders` - 주문 목록 조회
- `GET /api/orders/:id` - 주문 상세 조회
- `POST /api/orders/:id/cancel` - 주문 취소
- `POST /api/orders/auto-fill` - 주문서 자동 작성 (AI)

### 5. 결제 및 배송 (`/api/payments`, `/api/refunds`, `/api/shipments`)

#### 결제 (`/api/payments`)
- `POST /api/payments` - 결제 생성
- `GET /api/payments/:id` - 결제 상세 조회
- `POST /api/payments/:id/approve` - 결제 승인 (PG 콜백)
- `POST /api/payments/:id/fail` - 결제 실패 처리

#### 환불 (`/api/refunds`)
- `POST /api/refunds` - 환불 신청
- `GET /api/refunds` - 환불 목록 조회
- `GET /api/refunds/:id` - 환불 상세 조회
- `POST /api/refunds/:id/approve` - 관리자: 환불 승인
- `POST /api/refunds/:id/reject` - 관리자: 환불 반려

#### 배송 (`/api/shipments`)
- `GET /api/shipments/:orderId` - 배송 정보 조회
- `GET /api/shipments/:orderId/tracking` - 배송 추적
- `POST /api/shipments/:orderId` - 판매자: 배송 정보 등록
- `PUT /api/shipments/:orderId/status` - 관리자: 배송 상태 업데이트

### 6. 정산 및 리뷰 (`/api/payouts`, `/api/reviews`)

#### 정산 (`/api/payouts`)
- `GET /api/payouts/me` - 판매자: 정산 내역 조회
- `GET /api/payouts/me/:id` - 판매자: 정산 상세
- `GET /api/payouts` - 관리자: 정산 목록
- `POST /api/payouts/calculate` - 관리자: 정산 생성
- `POST /api/payouts/:id/approve` - 관리자: 정산 승인
- `POST /api/payouts/:id/pay` - 관리자: 정산 지급 완료

#### 리뷰 (`/api/reviews`)
- `GET /api/reviews/product/:productId` - 상품 리뷰 목록
- `POST /api/reviews` - 리뷰 작성
- `GET /api/reviews/:id` - 리뷰 상세
- `PUT /api/reviews/:id` - 리뷰 수정
- `DELETE /api/reviews/:id` - 리뷰 삭제
- `POST /api/reviews/:id/helpful` - 리뷰 도움됨
- `POST /api/reviews/:id/reply` - 판매자: 리뷰 답변

### 7. AI 쇼핑 비서 (`/api/ai`)

- `POST /api/ai/conversations` - 대화 세션 생성
- `POST /api/ai/conversations/:sessionId/messages` - AI 채팅 (메시지 전송)
- `POST /api/ai/search` - 상품 검색 (AI 기반)
- `POST /api/ai/compare` - 상품 비교
- `POST /api/ai/recommend` - 상품 추천
- `POST /api/ai/products/:id/summary` - 상품 요약 (AI 생성)
- `GET /api/ai/conversations/:sessionId/messages` - 대화 히스토리
- `POST /api/ai/conversations/:sessionId/end` - 대화 세션 종료

### 8. 공급사 (`/api/suppliers`)

- `GET /api/suppliers` - 관리자: 공급사 목록
- `POST /api/suppliers` - 관리자: 공급사 등록
- `PUT /api/suppliers/:id` - 관리자: 공급사 수정
- `POST /api/suppliers/:id/sync` - 관리자: 상품 동기화
- `GET /api/suppliers/:id/products` - 관리자: 공급사 상품 목록

### 9. 관리자 (`/api/admin`)

- `GET /api/admin/dashboard` - 대시보드 통계
- `GET /api/admin/users` - 사용자 관리
- `GET /api/admin/sellers` - 판매자 관리
- `PUT /api/admin/sellers/:id/status` - 판매자 상태 변경
- `PUT /api/admin/sellers/:id/commission` - 커미션율 변경
- `GET /api/admin/orders` - 주문 관리
- `PUT /api/admin/orders/:id/status` - 주문 상태 변경
- `GET /api/admin/products` - 상품 관리
- `PUT /api/admin/products/:id/status` - 상품 상태 변경
- `GET /api/admin/commission-policy` - 커미션 정책 조회
- `PUT /api/admin/commission-policy` - 커미션 정책 수정

## 인증 및 권한

모든 라우터는 다음 권한을 가정합니다:

- **인증 필요**: 대부분의 엔드포인트는 인증이 필요합니다 (JWT 토큰)
- **구매자 (buyer)**: 기본 사용자 권한
- **판매자 (seller)**: 자신의 상품/주문/정산 관리
- **관리자 (admin)**: 모든 권한

## 다음 단계

1. **인증 미들웨어 구현**: JWT 토큰 검증
2. **권한 미들웨어 구현**: 역할 기반 접근 제어
3. **컨트롤러 구현**: 각 라우터의 비즈니스 로직
4. **유효성 검증**: 요청 데이터 검증 (express-validator 등)
5. **에러 핸들링**: 통일된 에러 응답 형식

## 참고사항

- 모든 라우터는 현재 스켈레톤 구조로 되어 있으며, 실제 비즈니스 로직은 컨트롤러에서 구현해야 합니다.
- TODO 주석이 있는 부분은 실제 구현이 필요한 부분입니다.
- 페이지네이션은 기본적으로 `page`와 `limit` 쿼리 파라미터를 사용합니다.

