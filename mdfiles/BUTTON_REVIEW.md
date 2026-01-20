## 버튼 동작/페이지 연결 조치 체크리스트

### 체크 범위
- `client/src/components` 전반 (메인 앱 UI)
- `client/src/App.jsx` 뷰 전환 확인
- 패키지 UI: `packages/shopbuddy-product-display-package`, `packages/cart-package`, `packages/order-package`

### 테스트 실행 결과
- `client` lint: `npm run lint` 실패 (`eslint` 미설치로 실행 불가)

### 확인 완료(정상 연결)
- [ O ] 메인 뷰 전환: 홈/로그인/회원가입/상품상세/룩북/장바구니/주문/찜/설정/적립금/마이페이지/주문목록/배송조회/교환반품/정책/공지/문의/최근본상품 등은 `App.jsx`의 `setView(...)`로 연결됨.
  - 설명: 라우터 없이 내부 view 상태 전환으로 페이지가 연결됨을 확인.
  - 테스트: 정적 확인(코드 연결 검토).
- [ O ] 핵심 구매 플로우: 상품 상세 → 장바구니 담기/바로구매 → 주문 결제 흐름이 코드상 연결됨.
  - 설명: `ProductDetailPage`와 `CartPage`, `OrderPage` 내 버튼들이 상태 및 API 호출을 수행.
  - 테스트: 정적 확인(코드 연결 검토).
- [ O ] 고객센터/피드백/공지/최근 본 상품: API 호출 및 UI 상태 처리가 구현됨.
  - 설명: 각 페이지에서 fetch/create 등의 서비스 호출과 로딩/에러 처리 존재.
  - 테스트: 정적 확인(코드 연결 검토).

### 조치 필요(미구현/비연결 버튼)

#### 홈/네비게이션
- [ O ] `client/src/components/HomeHero.jsx` 슬라이더 CTA 버튼 연결
  - 설명: 버튼 클릭 시 `filterOption`만 변경되고 실제 필터/이동 로직이 없음. 카테고리/검색 필터 적용 또는 컬렉션 페이지로 이동 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).
- [ O ] `client/src/components/MainNavbar.jsx` 상단 메뉴 `New`, `About` 연결
  - 설명: `closeMenu()`만 호출됨. 신규 상품/브랜드 소개 페이지 또는 외부 링크 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).
- [ O ] `client/src/components/SiteFooter.jsx` BOARD LIST 버튼 연결
  - 설명: 상담/FAQ/반품/구매후기 등 버튼에 `onClick` 없음. 고객센터 관련 페이지/외부 링크 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).

#### 로그인/회원가입
- [ O ] `client/src/components/LoginPage.jsx` 비밀번호 찾기 버튼 연결
  - 설명: 클릭 동작 없음. 비밀번호 재설정 페이지/플로우 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).
- [ ] `client/src/components/LoginPage.jsx` 소셜 로그인 버튼 연결
  - 설명: 구글/페이스북/애플 버튼 동작 없음. OAuth 연동 필요.
  - 테스트: 미구현.
- [ O ] `client/src/components/SignUpPage.jsx` 약관/정책 "보기" 버튼 연결
  - 설명: 약관/개인정보/마케팅 "보기" 버튼이 비어 있음. 모달 또는 상세 페이지 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).

#### 마이페이지
- [ O ] `client/src/components/MyPage.jsx` 알림 아이콘 버튼 연결
  - 설명: 알림 센터/알림 목록 페이지 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).
- [ O ] `client/src/components/MyPage.jsx` 프로필 편집 버튼 연결
  - 설명: 프로필 수정 페이지 또는 모달 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).
- [ O ] `client/src/components/MyPage.jsx` "머니 충전하기", "쿠폰" 섹션 연결
  - 설명: 머니 충전/쿠폰 관리 페이지 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).

#### 주문/장바구니
- [ O ] `client/src/components/OrderListPage.jsx` "주문 상세보기" 연결
  - 설명: 현재 `App.jsx`에서 콘솔 로그만 실행. 주문 상세 페이지 필요.
  - 테스트: 정적 확인(상세 뷰 전환).
- [ O ] `client/src/components/OrderListPage.jsx` "장바구니 담기" 연결
  - 설명: 버튼 클릭 로직이 비어 있음. 재주문/장바구니 담기 기능 필요.
  - 테스트: 정적 확인(장바구니 API 호출 연결).
- [ O ] `client/src/components/CartPage.jsx` 추천 상품 "View Details" 연결
  - 설명: 상품 상세 페이지 이동 로직 필요.
  - 테스트: 정적 확인(상세 이동 연결).

#### 상품 상세
- [ O ] `client/src/components/ProductDetailPage.jsx` 관심상품(하트) 버튼 연결
  - 설명: 찜하기 추가/해제 API 연동 필요.
  - 테스트: 정적 확인(찜 API 연결).
- [ O ] `client/src/components/ProductDetailPage.jsx` "상품평 보기" 버튼 연결
  - 설명: 리뷰 탭 이동/스크롤 로직 필요.
  - 테스트: 정적 확인(탭 이동 로직).
- [ O ] `client/src/components/ProductDetailPage.jsx` "모든 옵션 보기" 버튼 연결
  - 설명: 옵션 상세 모달/패널 필요.
  - 테스트: 정적 확인(모달 상태 연결).
- [ O ] `client/src/components/ProductDetailPage.jsx` 리뷰 이미지/필터 버튼 연결
  - 설명: 이미지 뷰어, 필터 초기화 로직 필요.
  - 테스트: 정적 확인(이미지/필터 상태 연결).
- [ O ] `client/src/components/ProductDetailPage.jsx` 뉴스레터 "구독 신청하기" 연결
  - 설명: 구독 API/폼 처리 필요.
  - 테스트: 정적 확인(폼 핸들러 연결).

#### 교환/반품
- [ O ] `client/src/components/ExchangeReturnPage.jsx` "변경하기" 버튼 연결
  - 설명: 회수지 변경 모달 또는 주소 설정 페이지 필요.
  - 테스트: 정적 확인(버튼 핸들러 연결).

#### 룩북/스타일 노트
- [ O ] `client/src/components/StyleNotePage.jsx` "스타일링 숏폼 보기" 버튼 연결
  - 설명: 영상/콘텐츠 페이지 또는 외부 링크 필요.
  - 테스트: 정적 확인(외부 링크 연결).

#### 관리자
- [ O ] `client/src/components/AdminDashboard.jsx` Sales "Filter" 버튼 연결
  - 설명: 주문 필터 모달/폼(기간/상태/결제수단 등) 필요.
  - 테스트: 정적 확인(모달 상태 연결).

#### 채팅 위젯
- [ O ] `client/src/components/ChatWidget.jsx` 상품 카드 "담기" 오류 수정
  - 설명: `handleAddToCart`에서 `addItemToCart` import가 없어 런타임 오류 가능. import 추가 및 장바구니 수 업데이트 처리 필요.
  - 테스트: 정적 확인(import 연결).

#### 패키지 UI 컴포넌트
- [ O ] `packages/shopbuddy-product-display-package/src/components/ProductCard.jsx` 댓글/공유 버튼 연결
  - 설명: 댓글/공유 기능 연동 필요.
  - 테스트: 정적 확인(핸들러 연결).
- [ O ] `packages/cart-package/frontend/components/CartPage.jsx` "Save for later" 기능 연결
  - 설명: 현재 알림만 표시. 찜/보관함 기능 필요.
  - 테스트: 정적 확인(보관함 핸들러 연결).
- [ O ] `packages/cart-package/frontend/components/CartPage.jsx` 추천 상품 "View Details" 연결
  - 설명: 상품 상세 이동 로직 필요.
  - 테스트: 정적 확인(상세 이동 연결).

### 필요한 페이지/기능 요약 (체크리스트)
- [ O ] 주문 상세 페이지
  - 설명: 주문 목록에서 상세로 이동 가능한 화면 필요.
  - 테스트: 정적 확인(상세 뷰 렌더).
- [ O ] 비밀번호 찾기/재설정 플로우
  - 설명: 로그인 화면의 "비밀번호 찾기" 버튼 연결 필요.
  - 테스트: 정적 확인(뷰 전환 및 API 추가).
- [ ] 소셜 로그인 연동
  - 설명: Google/Facebook/Apple OAuth 연결 필요.
  - 테스트: 미구현.
- [ O ] 약관/정책 상세 페이지 또는 모달
  - 설명: 회원가입 약관 "보기" 버튼 연결 필요.
  - 테스트: 정적 확인(뷰 전환).
- [ O ] 프로필 편집/알림 센터/머니 충전/쿠폰 관리
  - 설명: 마이페이지의 빈 버튼/카드 영역 대응.
  - 테스트: 정적 확인(뷰 전환).
- [ O ] 상품 상세 추가 기능(찜/리뷰/옵션/뉴스레터)
  - 설명: 상세 페이지 내 버튼들의 실제 동작 필요.
  - 테스트: 정적 확인(상태/핸들러 연결).
- [ O ] 고객센터 관련 페이지(FAQ/배송/반품/구매후기/문의)
  - 설명: 푸터/보드 버튼 연결 필요.
  - 테스트: 정적 확인(뷰 전환/링크).
- [ O ] 관리자 주문 필터 UI
  - 설명: Admin Sales 필터 기능 필요.
  - 테스트: 정적 확인(모달 상태).
- [ O ] 패키지 UI 버튼(댓글/공유/추천상품 상세/보관함)
  - 설명: 패키지 데모 UI의 빈 버튼 동작 연결 필요.
  - 테스트: 정적 확인(핸들러 연결).