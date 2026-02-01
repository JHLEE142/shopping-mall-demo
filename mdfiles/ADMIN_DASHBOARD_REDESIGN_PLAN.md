# Admin Dashboard 전면 수정 기획서

## 1. 개요

### 1.1 목적
- 기존 Admin Dashboard를 현대적이고 직관적인 UI로 전면 개편
- 첨부된 참고 이미지의 페이지 구성과 레이아웃을 기반으로 재설계
- 흑백 스타일로 통일된 디자인 시스템 적용
- 기존 기능 유지 (Slack 주문 알림 등)

### 1.2 범위
- UI/UX 전면 개편
- 메뉴 구조 재구성 (6개 메뉴)
- 각 페이지별 컴포넌트 재구성
- 필요시 데이터베이스 스키마, API, 라우터 추가/수정

### 1.3 제약사항
- 기존 Slack 주문 알림 기능 유지
- 기존 데이터 구조 최대한 활용
- 흑백 스타일 적용 (초록색 계열 제외)

---

## 2. 메뉴 구조

### 2.1 메뉴 구성
총 6개의 메뉴로 구성:

1. **Dashboard** (Overview 목적)
2. **Order** (주문 관리)
3. **Inventory** (재고 관리)
4. **Customers** (고객 관리)
5. **Report & Analytics** (리포트 및 분석)
6. **Inquiries** (문의 관리)

### 2.2 네비게이션 구조
```
Admin Dashboard
├── Dashboard (Overview)
├── Order
├── Inventory
├── Customers
├── Report & Analytics
└── Inquiries
```

---

## 3. 페이지별 상세 기획

## 3.1 Dashboard (Overview) 페이지

### 3.1.1 목적
전체 쇼핑몰의 주요 지표와 성과를 한눈에 볼 수 있는 대시보드

### 3.1.2 레이아웃 구성

#### A. 헤더 영역
- **제목**: "Dashboard Overview"
- **부제목**: "Welcome back! Your grocery store's performance view." (또는 쇼핑몰에 맞게 수정)
- **우측**: 
  - 검색바: "Search users, orders, products..." (돋보기 아이콘)
  - 알림 아이콘 (벨)
  - 사용자 프로필: 아바타 이미지, "Admin User", "admin@company.com"

#### B. KPI 카드 (4개) - 상단 행
각 카드는 흰색 배경, 작은 라인 그래프 포함

1. **Total Revenue**
   - 아이콘: 달러 기호 (원형 배경)
   - 값: "$24,582" (또는 원화 표시)
   - 트렌드: ↑ 18.2% this week (초록색 화살표)
   - 작은 라인 그래프: 초록색 파형 그래프

2. **Total Orders**
   - 아이콘: 쇼핑카트 (원형 배경)
   - 값: "3,842"
   - 트렌드: ↑ 12.5% this week (초록색 화살표)
   - 작은 라인 그래프: 파란색 파형 그래프

3. **Total Product**
   - 아이콘: 박스 (원형 배경)
   - 값: "1,247"
   - 트렌드: ↓ 2.3% this week (빨간색 화살표)
   - 작은 라인 그래프: 보라색 파형 그래프

4. **Active Customers**
   - 아이콘: 사람 아이콘 (원형 배경)
   - 값: "8,234"
   - 트렌드: ↑ 24.6% this week (초록색 화살표)
   - 작은 라인 그래프: 빨간색 파형 그래프

#### C. 차트 영역 (2개) - 중간 행

1. **Sales By Category (Line Graph) - 왼쪽 (큰 카드)**
   - 제목: "Sales By Category"
   - 총액: "$18,200.82" (또는 원화)
   - 트렌드: ↑ 8.24%
   - 드롭다운: "Weekly" 선택 가능
   - 라인 그래프:
     - X축: 요일 (MON, TUE, WED, THU, FRI, SAT, SUN)
     - Y축: $0 ~ $4,700
     - 초록색 라인과 음영 영역
     - 특정 포인트 하이라이트 (금요일: "$4,645.80")

2. **Sales By Category (Donut Chart) - 오른쪽 (작은 카드)**
   - 제목: "Sales By Category"
   - 드롭다운: "Monthly" 선택 가능
   - 도넛 차트:
     - 중앙: "16,100" "+45%"
     - 외곽 세그먼트:
       - Fruits: 34,000 (초록색)
       - Dairy: 25,500 (연한 초록색)
       - Vegetables: 25,600 (가장 연한 초록색)
       - Meat: 17,000 (진한 초록색)
   - 하단: "Total Number of Sales" "3,40,0031"

#### D. 리스트 영역 (2개) - 하단 행

1. **Top Products - 왼쪽**
   - 제목: "Top Products"
   - 드롭다운: "Monthly" 선택 가능
   - 상품 리스트 (3개):
     - Fresh Milk: 우유 이미지, "342 sold", "$684.00"
     - Wheat Bread: 빵 이미지, "256 sold", "$512.00"
     - Emerald Velvet: 작은 병 이미지, "$355.90"

2. **Recent Order - 오른쪽**
   - 제목: "Recent Order"
   - 필터 버튼: "Filter" (필터 아이콘)
   - 테이블:
     - 컬럼: #, Product, Date, Status, Price, Customer
     - 행 1: 1, Fresh Dairy (치즈 이미지), May 5, Received (초록색 버튼), $145.80, M-Starlight
     - 행 2: 2, Vegetables (야채 이미지), May 4, Received (초록색 버튼), $210.30, Serene W.
     - 행 3: 3, Rang Eggs (계란 이미지), May 3, Received (초록색 버튼), $298.40, James D.

### 3.1.3 데이터 요구사항
- 총 매출 (Total Revenue)
- 총 주문 수 (Total Orders)
- 총 상품 수 (Total Product)
- 활성 고객 수 (Active Customers)
- 카테고리별 판매 데이터 (일별, 주별, 월별)
- 인기 상품 데이터
- 최근 주문 데이터

### 3.1.4 API 요구사항
- `GET /api/admin/dashboard/stats` - KPI 데이터
- `GET /api/admin/dashboard/sales-by-category` - 카테고리별 판매 데이터
- `GET /api/admin/dashboard/top-products` - 인기 상품 데이터
- `GET /api/admin/dashboard/recent-orders` - 최근 주문 데이터

---

## 3.2 Order (주문 관리) 페이지

### 3.2.1 목적
모든 주문을 실시간으로 추적하고 관리

### 3.2.2 레이아웃 구성

#### A. 헤더 영역
- **제목**: "Order Management"
- **부제목**: "Track and manage all grocery orders in real time." (또는 쇼핑몰에 맞게 수정)
- **우측**: 
  - 검색바: "Search users, orders, products..." (돋보기 아이콘)
  - 알림 아이콘 (벨)
  - 사용자 프로필: 아바타 이미지, "Admin User", "admin@company.com"

#### B. 통계 카드 (4개) - 상단 행
각 카드는 흰색 배경

1. **Total New Orders**
   - 값: "3,842"
   - 변화: +54% (초록색)
   - 아이콘: 파란색 쇼핑카트 + 플러스

2. **Total Orders Pending**
   - 값: "124"
   - 변화: -10% (빨간색)
   - 아이콘: 보라색 시계

3. **Total Orders Completed**
   - 값: "3,487"
   - 변화: +54% (초록색)
   - 아이콘: 초록색 체크마크

4. **Total Orders Canceled**
   - 값: "231"
   - 변화: +54% (초록색)
   - 아이콘: 빨간색 X

#### C. 주문 목록 영역 - 메인

**섹션 헤더:**
- 제목: "Orders List"
- 탭 필터: "All Order" (활성, 초록색), "Pending", "Processing", "Out for Delivery", "Delivered"
- 검색바: 돋보기 아이콘, 플레이스홀더
- 필터 아이콘 (3개 가로선 + 원)
- 정렬 아이콘 (3개 가로선 길이 다름)
- "+ Add Order" 버튼 (초록색)

**주문 테이블:**
컬럼 구성:
1. **Product Name**
   - 상품 이미지 (작은 썸네일)
   - 상품명
   - "Items 4" (수량 표시)

2. **Customer Name**
   - 고객 아바타 (원형 이미지)
   - 고객명
   - 고객 타입 배지: "New Customer", "Pro Customer", "Star Customer"

3. **Order Id**
   - 주문번호: "#GR-284730" 형식
   - 주문일: "Jan 01.2025" 형식

4. **Amount**
   - 총액: "$10,120.00" (또는 원화)
   - 결제 수단: "Paid by Mastercard", "Cash on Delivery"

5. **Status**
   - 상태 배지 (색상별):
     - Accepted (초록색)
     - Pending (주황색)
     - Completed (파란색)
     - Rejected (빨간색)

6. **Action**
   - 점 3개 아이콘 (...)
   - 클릭 시 드롭다운: "Edit", "Star", "Delete"

**예시 데이터 행:**
- Coconut Clarity: 이미지, Items 4, Darrell Steward (New Customer), #GR-284730 (Jan 01.2025), $10,120.00 (Paid by Mastercard), Accepted
- Fresh Butter: 이미지, Items 3, Esther Howard (Pro Customer), #GR-284640 (Feb 24.2025), $5,180.00 (Cash on Delivery), Accepted
- Fresh Rice: 이미지, Items 3, Dianne Russell (Pro Customer), #GR-284530 (Mar 01.2025), $13,145.00 (Paid by Mastercard), Pending
- Pasta: 이미지, Items 4, Arlene McCoy (Star Customer), #GR-284430 (Apr 01.2025), $5,180.00 (Cash on Delivery), Completed
- Shrimp: 이미지, Items 2, Jacob Jones (Star Customer), #GR-284340 (May 25.2025), $9,720.00 (Cash on Delivery), Rejected
- Mustard Oil: 이미지, Items 4, Wade Warren (Pro Customer), #GR-284730 (May 20.2025), $12,120.00 (Paid by Mastercard), Completed
- Biscuits: 이미지, Items 4, Kathryn Murphy (Pro Customer), #GR-284740 (May 15.2025), $10,120.00 (Cash on Delivery), Rejected

**페이지네이션:**
- "← Previous" 버튼
- 페이지 번호: 1 (활성, 초록색), 2, ..., 10, 12, 13, 14
- "Next →" 버튼

### 3.2.3 데이터 요구사항
- 총 신규 주문 수
- 대기 중인 주문 수
- 완료된 주문 수
- 취소된 주문 수
- 주문 목록 (필터링, 검색, 정렬 지원)
- 주문별 상품 정보
- 주문별 고객 정보
- 주문별 결제 정보

### 3.2.4 API 요구사항
- `GET /api/admin/orders/stats` - 주문 통계
- `GET /api/admin/orders` - 주문 목록 (필터, 검색, 정렬, 페이지네이션)
- `GET /api/admin/orders/:id` - 주문 상세
- `PUT /api/admin/orders/:id` - 주문 수정
- `POST /api/admin/orders` - 주문 추가 (필요시)
- `DELETE /api/admin/orders/:id` - 주문 삭제 (필요시)

### 3.2.5 기능 요구사항
- 상태별 필터링 (All, Pending, Processing, Out for Delivery, Delivered)
- 검색 기능 (고객명, 주문번호, 상품명)
- 정렬 기능
- 주문 상세 보기
- 주문 수정
- 주문 삭제
- Slack 알림 기능 유지

---

## 3.3 Inventory (재고 관리) 페이지

### 3.3.1 목적
재고 수준을 모니터링하고 상품 재고를 관리

### 3.3.2 레이아웃 구성

#### A. 헤더 영역
- **제목**: "Inventory Management"
- **부제목**: "Monitor stock levels and manage product inventory."
- **우측**: 
  - 검색바: "Search users, orders, products..." (돋보기 아이콘)
  - 알림 아이콘 (벨)
  - 사용자 프로필: 아바타 이미지, "Admin User", "admin@company.com"

#### B. 요약 카드 (4개) - 상단 행
각 카드는 아이콘과 주요 지표 표시

1. **Total Products**
   - 값: "1,247"
   - 변화: +54% (초록색)
   - 아이콘: 쇼핑백

2. **Low Stock**
   - 값: "34"
   - 변화: -10% (빨간색)
   - 아이콘: 경고 표시

3. **Out Of Stock**
   - 값: "12"
   - 변화: +54% (초록색)
   - 아이콘: 빨간색 경고 표시

4. **Top Category**
   - 값: "231"
   - 변화: +54% (초록색)
   - 아이콘: 그리드

#### C. 상품 재고 영역 - 메인

**섹션 헤더:**
- 제목: "Product Inventory"
- 탭 필터: "All Products" (활성, 초록색), "In Stock", "Low Stock", "Out Of Stock"
- 검색바: 돋보기 아이콘, 플레이스홀더
- 필터 아이콘 (깔때기)
- 정렬 아이콘 (3개 가로선)
- "Export" 버튼 (초록색, 다운로드 아이콘)

**상품 재고 테이블:**
컬럼 구성:
1. **Product Name**
   - 상품 이미지 (작은 썸네일)
   - 상품명

2. **Category**
   - 카테고리명: "Fruits", "Dairy", "Bakery", "Vegetables", "Meat"

3. **Stock Level**
   - 재고 수량: "245 units"
   - 최소 재고: "Min:100"
   - 진행 바 (색상별):
     - 초록색: 충분한 재고
     - 주황색: 낮은 재고
     - 빨간색: 재고 없음

4. **Amount**
   - 가격: "$2.99/kg", "$3.99/L", "$2.49", "$5.99/dozen", "$4.99/kg", "$8.99/kg", "$4.49"

5. **Supplier**
   - 공급업체명: "Fresh Farms Co.", "Dairy Best", "Golden Bakery", "Sunny Farm", "Green Valley", "Premium Meats"

6. **Status**
   - 상태 배지:
     - "In Stock" (초록색)
     - "Low Stock" (주황색)
     - "Out of Stock" (빨간색)

7. **Action**
   - 점 3개 아이콘 (...)
   - 클릭 시 드롭다운: "Edit", "Delete" 등

**예시 데이터 행:**
- Organic Bananas: 바나나 아이콘, "Fruits", "245 units" (Min:100, 초록색 진행바), "$2.99/kg", "Fresh Farms Co.", "In Stock" (초록색)
- Fresh Milk: 우유 아이콘, "Dairy", "156 units" (Min:150, 초록색 진행바), "$3.99/L", "Dairy Best", "Low Stock" (주황색)
- Wheat Bread: 빵 아이콘, "Bakery", "0 units" (Min:50, 빨간색 진행바), "$2.49", "Golden Bakery", "Out of Stock" (빨간색)
- Range Eggs: 계란 아이콘, "Dairy", "89 units" (Min:100, 주황색 진행바), "$5.99/dozen", "Sunny Farm", "Low Stock" (주황색)
- Cherry Tomatoes: 토마토 아이콘, "Vegetables", "178 units" (Min:80, 초록색 진행바), "$4.99/kg", "Green Valley", "In Stock" (초록색)
- Chicken Breast: 닭고기 아이콘, "Meat", "124 units" (Min:100, 초록색 진행바), "$8.99/kg", "Premium Meats", "In Stock" (초록색)
- Greek Yogurt: 요구르트 아이콘, "Dairy", "0 units" (Min:60, 빨간색 진행바), "$4.49", "Dairy Best", "Low Stock" (주황색)

**페이지네이션:**
- "← Previous" 버튼
- 페이지 번호: 1 (활성, 초록색), 2, ..., 10, 12, 13, 14
- "Next →" 버튼

### 3.3.3 데이터 요구사항
- 총 상품 수
- 낮은 재고 상품 수
- 재고 없음 상품 수
- 인기 카테고리
- 상품별 재고 정보
- 상품별 공급업체 정보
- 재고 상태 (In Stock, Low Stock, Out of Stock)

### 3.3.4 API 요구사항
- `GET /api/admin/inventory/stats` - 재고 통계
- `GET /api/admin/inventory/products` - 상품 재고 목록 (필터, 검색, 정렬, 페이지네이션)
- `GET /api/admin/inventory/products/:id` - 상품 재고 상세
- `PUT /api/admin/inventory/products/:id` - 상품 재고 수정
- `POST /api/admin/inventory/export` - 재고 데이터 내보내기 (CSV/Excel)

### 3.3.5 기능 요구사항
- 상태별 필터링 (All, In Stock, Low Stock, Out of Stock)
- 검색 기능 (상품명, 카테고리)
- 정렬 기능
- 재고 수정
- 재고 내보내기 (CSV/Excel)
- 재고 진행 바 표시

---

## 3.4 Customers (고객 관리) 페이지

### 3.4.1 목적
고객 행동, 피드백, 인구통계를 분석

### 3.4.2 레이아웃 구성

#### A. 헤더 영역
- **제목**: "Customer Insights"
- **부제목**: "Analyze customer behavior, feedback, and demographics."
- **우측**: 
  - 검색바: "Search users, orders, products..." (돋보기 아이콘)
  - 알림 아이콘 (벨)
  - 사용자 프로필: 아바타 이미지, "Admin User", "admin@company.com"

#### B. 고객 인사이트 카드 (4개) - 상단 행
각 카드는 흰색 배경

1. **Total Customer**
   - 값: "8,234"
   - 변화: ↑ 15% (초록색 화살표)
   - 설명: "Total customer last month"
   - 아이콘: 두 사람 아이콘 (우측)

2. **New Customer**
   - 값: "542"
   - 변화: ↑ 24% (초록색 화살표)
   - 설명: "New customer last month"
   - 아이콘: 한 사람 아이콘 (우측)

3. **Avg. Rating**
   - 값: "4.7"
   - 변화: ↓ 0.3% (빨간색 화살표)
   - 설명: "Avg. Rating last month"
   - 아이콘: 별 아이콘 (우측)

4. **Repeat Customers**
   - 값: "67%"
   - 변화: ↑ 8.2% (초록색 화살표)
   - 설명: "Repeat customers last month"
   - 아이콘: 사람 + 원형 화살표 아이콘 (우측)

#### C. 차트 영역 (4개) - 중간/하단 행

1. **Customer Growth Trends - 왼쪽 (큰 카드)**
   - 제목: "Customer Growth Trends"
   - 현재 값: "$16,00.72" (또는 원화)
   - 트렌드: ↑ 6.20%
   - 드롭다운: "Monthly" 선택 가능
   - 라인 그래프:
     - X축: 월 (JAN, FEB, MAR, APR, MAY, JUN, JUL)
     - Y축: 0, 2500, 5000, 7500, 10000
     - 두 개의 겹치는 라인 그래프 (주로 초록색 계열)
     - 특정 포인트 하이라이트 (5월: "$4,645.80")

2. **Purchase Frequency - 오른쪽 (작은 카드)**
   - 제목: "Purchase Frequency"
   - 바 차트:
     - Daily: 900
     - Weekly: 2700 (가장 긴 바)
     - Bi-weekly: 1800
     - Monthly: 900
   - 초록색 바 + 연한 초록색 그라데이션 상단

3. **Age Distribution - 왼쪽 (작은 카드)**
   - 제목: "Age Distribution"
   - 도넛 차트:
     - 중앙: "Total customer 8,234"
     - 외곽 세그먼트: 4개 부분 (다양한 초록색 계열)
     - 라벨: "2134", "2856", "541", "1247", "1456"

4. **Category Preferences - 오른쪽 (작은 카드)**
   - 제목: "Category Preferences"
   - 가로 바 차트:
     - Fruits & Vegetables: 32% (초록색 줄무늬)
     - Dairy Products: 24% (초록색 줄무늬)
     - Meat & Seafood: 18% (초록색 줄무늬)
   - 각 바의 길이는 퍼센트에 비례

### 3.4.3 데이터 요구사항
- 총 고객 수
- 신규 고객 수
- 평균 평점
- 재구매 고객 비율
- 고객 성장 추세 (월별)
- 구매 빈도 분포
- 연령대 분포
- 카테고리 선호도

### 3.4.4 API 요구사항
- `GET /api/admin/customers/stats` - 고객 통계
- `GET /api/admin/customers/growth-trends` - 고객 성장 추세
- `GET /api/admin/customers/purchase-frequency` - 구매 빈도 분포
- `GET /api/admin/customers/age-distribution` - 연령대 분포
- `GET /api/admin/customers/category-preferences` - 카테고리 선호도
- `GET /api/admin/customers` - 고객 목록 (필터, 검색, 정렬, 페이지네이션)

### 3.4.5 기능 요구사항
- 고객 통계 대시보드
- 고객 성장 추세 차트
- 구매 빈도 분석
- 연령대 분포 분석
- 카테고리 선호도 분석
- 고객 목록 조회
- 고객 상세 정보 조회

---

## 3.5 Report & Analytics (리포트 및 분석) 페이지

### 3.5.1 목적
상세한 판매 리포트, 수익 요약, 월별 트렌드 제공

### 3.5.2 레이아웃 구성

#### A. 헤더 영역
- **제목**: "Reports & Analytics"
- **부제목**: "Detailed sales reports, profit summaries, and monthly trends."
- **우측**: 
  - 검색바: "Search users, orders, products..." (돋보기 아이콘)
  - 알림 아이콘 (벨)
  - 사용자 프로필: 아바타 이미지, "Admin User", "admin@company.com"

#### B. KPI 카드 (4개) - 상단 행
각 카드는 흰색 배경

1. **Total Sales**
   - 값: "$124,582" (또는 원화)
   - 트렌드: ↑ 18% last period (초록색 화살표)
   - 아이콘: 초록색 달러 기호 (원형 배경)

2. **Avg. Order Value**
   - 값: "$32.41" (또는 원화)
   - 트렌드: ↑ 5.7% last period (초록색 화살표)
   - 아이콘: 파란색 쇼핑카트 (원형 배경)

3. **Total Transactions**
   - 값: "$3,842" (또는 원화)
   - 트렌드: ↑ 12% last month (초록색 화살표)
   - 아이콘: 보라색 신용카드 (원형 배경)

4. **Growth Rate**
   - 값: "18.2%"
   - 트렌드: ↑ 3.4% last month (초록색 화살표)
   - 아이콘: 빨간색 바 차트 (원형 배경)

#### C. 차트 영역 (4개) - 중간/하단 행

1. **Sales Performance Overview - 왼쪽 (큰 카드)**
   - 제목: "Sales Performance Overview"
   - 총액: "$12,950.72" (또는 원화)
   - 트렌드: ↑ 6.20%
   - 드롭다운: "Weekly" 선택 가능
   - 라인 그래프:
     - X축: 월 (JAN, FEB, MAR, APR, MAY, JUN, JUL)
     - Y축: 0, 3500, 7000, 1050, 1400
     - 초록색 라인과 음영 영역
     - 특정 포인트 하이라이트 (5월: "$4,645.80")

2. **Top Selling Products - 오른쪽 (작은 카드)**
   - 제목: "Top Selling Products"
   - 드롭다운: "Monthly" 선택 가능
   - 상품 리스트: "Fresh Milk" - 우유 아이콘, "1089 units sold", "$4,345"
   - 바 차트:
     - X축: 요일 (TUE, WED, THU, FRI)
     - 값: TUE (840), WED (2000), THU (2000), FRI (1200)
     - 초록색 바

3. **Sales by Category - 왼쪽 (작은 카드)**
   - 제목: "Sales by Category"
   - 옵션: 점 3개 아이콘 (...)
   - 가로 바 차트:
     - Fruits & Vegetables: 32%
     - Dairy Products: 24%
     - Meat & Seafood: 18%
   - 초록색 가로 바

4. **Hourly Sales Pattern - 오른쪽 (작은 카드)**
   - 제목: "Hourly Sales Pattern"
   - 총액: "$12,950.72" (또는 원화)
   - 트렌드: ↑ 6.20%
   - 드롭다운: "Weekly" 선택 가능
   - 라인 그래프:
     - X축: 월 (JAN, FEB, MAR, APR, MAY, JUN)
     - Y축: 0, 3500, 7000, 1050, 1400
     - 초록색 라인과 음영 영역
     - 특정 포인트 하이라이트 (5월: "$4,645.80")

### 3.5.3 데이터 요구사항
- 총 판매액
- 평균 주문 금액
- 총 거래 수
- 성장률
- 판매 성과 개요 (주별, 월별)
- 인기 판매 상품
- 카테고리별 판매
- 시간대별 판매 패턴

### 3.5.4 API 요구사항
- `GET /api/admin/analytics/sales-stats` - 판매 통계
- `GET /api/admin/analytics/sales-performance` - 판매 성과 개요
- `GET /api/admin/analytics/top-selling-products` - 인기 판매 상품
- `GET /api/admin/analytics/sales-by-category` - 카테고리별 판매
- `GET /api/admin/analytics/hourly-sales-pattern` - 시간대별 판매 패턴
- `GET /api/admin/analytics/export` - 리포트 내보내기 (PDF/Excel)

### 3.5.5 기능 요구사항
- 판매 통계 대시보드
- 판매 성과 차트 (주별, 월별 선택)
- 인기 판매 상품 분석
- 카테고리별 판매 분석
- 시간대별 판매 패턴 분석
- 리포트 내보내기 (PDF/Excel)

---

## 3.6 Inquiries (문의 관리) 페이지

### 3.6.1 목적
1:1 문의 및 상품 문의를 관리하고 답변

### 3.6.2 레이아웃 구성

#### A. 헤더 영역
- **제목**: "Inquiries Management"
- **부제목**: "Manage customer inquiries and provide responses."
- **우측**: 
  - 검색바: "Search users, orders, products..." (돋보기 아이콘)
  - 알림 아이콘 (벨)
  - 사용자 프로필: 아바타 이미지, "Admin User", "admin@company.com"

#### B. 통계 카드 (4개) - 상단 행 (선택사항)
각 카드는 흰색 배경

1. **Total Inquiries**
   - 값: 총 문의 수
   - 변화: 전주 대비 변화율
   - 아이콘: 메시지 아이콘

2. **Pending Inquiries**
   - 값: 대기 중인 문의 수
   - 변화: 전주 대비 변화율
   - 아이콘: 시계 아이콘

3. **Answered Inquiries**
   - 값: 답변 완료 문의 수
   - 변화: 전주 대비 변화율
   - 아이콘: 체크마크 아이콘

4. **Response Time (Avg)**
   - 값: 평균 응답 시간 (예: "2.5 hours")
   - 변화: 전주 대비 변화율
   - 아이콘: 시간 아이콘

#### C. 문의 목록 영역 - 메인

**섹션 헤더:**
- 제목: "Inquiries List"
- 탭 필터: "All Inquiries" (활성), "1:1 문의", "상품 문의"
- 검색바: 돋보기 아이콘, "문의 내용 검색..."
- 필터 아이콘
- 정렬 아이콘
- 새로고침 버튼

**문의 테이블:**
컬럼 구성 (1:1 문의):
1. **번호**
   - 순번

2. **사용자**
   - 사용자 아바타
   - 사용자명
   - 이메일

3. **유형**
   - 문의 유형 배지: "일반", "주문", "상품", "결제", "배송", "반품/교환", "기타"

4. **제목**
   - 문의 제목

5. **상태**
   - 상태 배지:
     - "대기중" (주황색)
     - "답변완료" (초록색)
     - "종료" (회색)

6. **작성일**
   - 날짜 형식: "2025.01.15"

7. **관리**
   - "상세보기" 버튼

컬럼 구성 (상품 문의):
1. **번호**
   - 순번

2. **사용자**
   - 사용자 아바타
   - 사용자명
   - 이메일

3. **상품**
   - 상품 이미지 (작은 썸네일)
   - 상품명

4. **문의 내용**
   - 문의 내용 미리보기 (최대 300px, 말줄임표)

5. **상태**
   - 상태 배지:
     - "대기중" (주황색)
     - "답변완료" (초록색)
     - "종료" (회색)

6. **작성일**
   - 날짜 형식: "2025.01.15"

7. **관리**
   - "상세보기" 버튼

**문의 상세 모달:**
- 문의 상세 정보 표시
- 답변 작성 폼 (답변 미완료 시)
- 답변 내용 표시 (답변 완료 시)
- 답변일, 답변자 정보

**페이지네이션:**
- "← Previous" 버튼
- 페이지 번호 표시
- "Next →" 버튼

### 3.6.3 데이터 요구사항
- 총 문의 수
- 대기 중인 문의 수
- 답변 완료 문의 수
- 평균 응답 시간
- 문의 목록 (1:1 문의, 상품 문의)
- 문의 상세 정보
- 답변 정보

### 3.6.4 API 요구사항
- `GET /api/admin/inquiries/stats` - 문의 통계 (선택사항)
- `GET /api/admin/inquiries/one-on-one` - 1:1 문의 목록 (이미 존재)
- `GET /api/admin/inquiries/product` - 상품 문의 목록 (이미 존재)
- `POST /api/admin/inquiries/:id/answer` - 문의 답변 (이미 존재)

### 3.6.5 기능 요구사항
- 1:1 문의 목록 조회
- 상품 문의 목록 조회
- 문의 상세 보기
- 문의 답변 작성
- 문의 상태 필터링
- 문의 검색
- 페이지네이션

---

## 4. 공통 컴포넌트

### 4.1 사이드바 (Sidebar)
- **로고 영역**: "NekoNoble Admin" (고양이 아이콘 포함 가능)
- **메인 메뉴**:
  - Dashboard (그리드 아이콘)
  - Order (쇼핑카트 아이콘)
  - Inventory (박스 아이콘)
  - Customers (사람들 아이콘)
  - Report & Analytics (바 차트 아이콘)
  - Inquiries (메시지 아이콘)
- **기타 메뉴**:
  - Settings (톱니바퀴 아이콘)
  - Help/Support (물음표 아이콘)
  - Logout (나가기 아이콘)
- **하단 도움말 카드**: "Need Help?" 섹션 (선택사항)

### 4.2 헤더 (Header)
- **좌측**: 페이지 제목, 부제목
- **중앙**: 검색바
- **우측**: 알림 아이콘, 사용자 프로필

### 4.3 공통 스타일
- **색상**: 흑백 계열 (회색, 흰색, 검은색)
- **카드**: 흰색 배경, 둥근 모서리, 그림자
- **버튼**: 검은색/회색 계열
- **배지**: 상태별 색상 (초록색 → 회색, 주황색 → 회색, 빨간색 → 진한 회색)
- **아이콘**: Lucide React 아이콘 사용

---

## 5. 데이터베이스 스키마

### 5.1 기존 스키마 활용
- Order 모델 (이미 존재)
- Product 모델 (이미 존재)
- User 모델 (이미 존재)
- Inquiry 모델 (이미 존재)
- ProductInquiry 모델 (이미 존재)

### 5.2 추가 필요 스키마 (필요시)

#### 5.2.1 CustomerSegment (고객 세그먼트)
```javascript
{
  userId: ObjectId (ref: User),
  segment: String (enum: ['New', 'Pro', 'Star']),
  totalOrders: Number,
  totalSpent: Number,
  lastOrderDate: Date,
  updatedAt: Date
}
```

#### 5.2.2 AnalyticsCache (분석 캐시)
```javascript
{
  type: String (enum: ['daily', 'weekly', 'monthly']),
  date: Date,
  metrics: {
    revenue: Number,
    orders: Number,
    customers: Number,
    products: Number
  },
  categorySales: [{
    category: String,
    sales: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. API 엔드포인트

### 6.1 Dashboard API
- `GET /api/admin/dashboard/stats` - KPI 통계
- `GET /api/admin/dashboard/sales-by-category` - 카테고리별 판매
- `GET /api/admin/dashboard/top-products` - 인기 상품
- `GET /api/admin/dashboard/recent-orders` - 최근 주문

### 6.2 Order API
- `GET /api/admin/orders/stats` - 주문 통계
- `GET /api/admin/orders` - 주문 목록
- `GET /api/admin/orders/:id` - 주문 상세
- `PUT /api/admin/orders/:id` - 주문 수정
- `POST /api/admin/orders` - 주문 추가 (필요시)

### 6.3 Inventory API
- `GET /api/admin/inventory/stats` - 재고 통계
- `GET /api/admin/inventory/products` - 상품 재고 목록
- `PUT /api/admin/inventory/products/:id` - 재고 수정
- `POST /api/admin/inventory/export` - 재고 내보내기

### 6.4 Customers API
- `GET /api/admin/customers/stats` - 고객 통계
- `GET /api/admin/customers/growth-trends` - 성장 추세
- `GET /api/admin/customers/purchase-frequency` - 구매 빈도
- `GET /api/admin/customers/age-distribution` - 연령대 분포
- `GET /api/admin/customers/category-preferences` - 카테고리 선호도
- `GET /api/admin/customers` - 고객 목록

### 6.5 Report & Analytics API
- `GET /api/admin/analytics/sales-stats` - 판매 통계
- `GET /api/admin/analytics/sales-performance` - 판매 성과
- `GET /api/admin/analytics/top-selling-products` - 인기 판매 상품
- `GET /api/admin/analytics/sales-by-category` - 카테고리별 판매
- `GET /api/admin/analytics/hourly-sales-pattern` - 시간대별 패턴
- `POST /api/admin/analytics/export` - 리포트 내보내기

### 6.6 Inquiries API
- `GET /api/admin/inquiries/stats` - 문의 통계 (선택사항)
- `GET /api/admin/inquiries/one-on-one` - 1:1 문의 목록 (기존)
- `GET /api/admin/inquiries/product` - 상품 문의 목록 (기존)
- `POST /api/admin/inquiries/:id/answer` - 문의 답변 (기존)

---

## 7. 기능 요구사항

### 7.1 공통 기능
- [ O ] 사이드바 네비게이션 (기존 구현됨)
- [ O ] 헤더 검색 기능 (기존 구현됨)
- [ O ] 사용자 프로필 표시 (기존 구현됨)
- [ O ] 알림 기능 (기존 구현됨)
- [ ] 반응형 디자인 (개선 필요)
- [ O ] 페이지네이션 (기존 구현됨)
- [ O ] 필터링 (기존 구현됨)
- [ O ] 정렬 (기존 구현됨)
- [ O ] 검색 (기존 구현됨)

### 7.2 Dashboard 기능
- [ ] KPI 카드 표시 (4개)
- [ ] KPI 카드 작은 라인 그래프
- [ ] Sales By Category 라인 그래프
- [ ] Sales By Category 도넛 차트
- [ ] Top Products 리스트
- [ ] Recent Orders 테이블
- [ ] 기간 선택 (Weekly, Monthly)

### 7.3 Order 기능
- [ ] 주문 통계 카드 (4개) - 새로 구현 필요
- [ O ] 주문 목록 테이블 (기존 구현됨, UI 개선 필요)
- [ O ] 상태별 필터링 (기존 구현됨, 탭 형식으로 개선 필요)
- [ O ] 주문 검색 (기존 구현됨)
- [ O ] 주문 정렬 (기존 구현됨)
- [ O ] 주문 상세 보기 (기존 구현됨)
- [ O ] 주문 수정 (기존 구현됨)
- [ ] 주문 삭제 (구현 필요)
- [ ] 주문 추가 (필요시)
- [ O ] Slack 알림 기능 유지 (기존 구현됨)

### 7.4 Inventory 기능
- [ ] 재고 통계 카드 (4개)
- [ ] 상품 재고 테이블
- [ ] 상태별 필터링 (All, In Stock, Low Stock, Out of Stock)
- [ ] 재고 검색
- [ ] 재고 정렬
- [ ] 재고 수정
- [ ] 재고 진행 바 표시
- [ ] 재고 내보내기 (CSV/Excel)

### 7.5 Customers 기능
- [ ] 고객 통계 카드 (4개)
- [ ] Customer Growth Trends 라인 그래프
- [ ] Purchase Frequency 바 차트
- [ ] Age Distribution 도넛 차트
- [ ] Category Preferences 가로 바 차트
- [ ] 고객 목록 테이블
- [ ] 고객 상세 정보
- [ ] 고객 세그먼트 분류 (New, Pro, Star)

### 7.6 Report & Analytics 기능
- [ ] 판매 통계 카드 (4개)
- [ ] Sales Performance Overview 라인 그래프
- [ ] Top Selling Products 리스트 및 바 차트
- [ ] Sales by Category 가로 바 차트
- [ ] Hourly Sales Pattern 라인 그래프
- [ ] 기간 선택 (Weekly, Monthly)
- [ ] 리포트 내보내기 (PDF/Excel)

### 7.7 Inquiries 기능
- [ O ] 1:1 문의 목록 (기존 구현됨, UI 개선 필요)
- [ O ] 상품 문의 목록 (기존 구현됨, UI 개선 필요)
- [ O ] 문의 상세 보기 (기존 구현됨, UI 개선 필요)
- [ O ] 문의 답변 작성 (기존 구현됨)
- [ O ] 문의 상태 필터링 (기존 구현됨)
- [ O ] 문의 검색 (기존 구현됨)
- [ ] 문의 통계 카드 (선택사항, 새로 구현)

---

## 8. 기술 스택

### 8.1 프론트엔드
- React
- Lucide React (아이콘)
- Recharts (차트 라이브러리)
- CSS Modules 또는 Styled Components

### 8.2 백엔드
- Node.js
- Express
- MongoDB
- Mongoose

### 8.3 차트 라이브러리
- Recharts (Line Chart, Bar Chart, Pie Chart, Donut Chart)

---

## 9. 구현 우선순위

### Phase 1: 기본 구조
1. [ ] 사이드바 재구성
2. [ ] 헤더 재구성
3. [ ] 공통 스타일 시스템 구축
4. [ ] 메뉴 라우팅 설정

### Phase 2: Dashboard 페이지
1. [ ] KPI 카드 컴포넌트
2. [ ] 차트 컴포넌트 (Line, Donut)
3. [ ] Top Products 리스트
4. [ ] Recent Orders 테이블
5. [ ] Dashboard API 연동

### Phase 3: Order 페이지
1. [ ] 주문 통계 카드
2. [ ] 주문 목록 테이블
3. [ ] 필터링, 검색, 정렬 기능
4. [ ] 주문 상세 모달
5. [ ] Order API 연동

### Phase 4: Inventory 페이지
1. [ ] 재고 통계 카드
2. [ ] 상품 재고 테이블
3. [ ] 재고 진행 바
4. [ ] 필터링, 검색, 정렬 기능
5. [ ] 재고 수정 기능
6. [ ] Inventory API 연동

### Phase 5: Customers 페이지
1. [ ] 고객 통계 카드
2. [ ] Customer Growth Trends 차트
3. [ ] Purchase Frequency 차트
4. [ ] Age Distribution 차트
5. [ ] Category Preferences 차트
6. [ ] 고객 목록 테이블
7. [ ] Customers API 연동

### Phase 6: Report & Analytics 페이지
1. [ ] 판매 통계 카드
2. [ ] Sales Performance Overview 차트
3. [ ] Top Selling Products 차트
4. [ ] Sales by Category 차트
5. [ ] Hourly Sales Pattern 차트
6. [ ] 리포트 내보내기 기능
7. [ ] Analytics API 연동

### Phase 7: Inquiries 페이지
1. [ ] 문의 통계 카드 (선택사항)
2. [ ] 1:1 문의 목록 (기존 개선)
3. [ ] 상품 문의 목록 (기존 개선)
4. [ ] 문의 상세 모달 (기존 개선)
5. [ ] 스타일 통일

### Phase 8: 최종 정리
1. [ ] 전체 스타일 통일 (흑백 계열)
2. [ ] 반응형 디자인 적용
3. [ ] 성능 최적화
4. [ ] 테스트 및 버그 수정

---

## 10. 디자인 가이드라인

### 10.1 색상 팔레트
- **주요 색상**: 
  - 배경: #FFFFFF (흰색)
  - 텍스트: #111827 (거의 검은색)
  - 보조 텍스트: #6b7280 (회색)
  - 테두리: #e5e7eb (연한 회색)
  - 카드 배경: #FFFFFF (흰색)
  - 카드 그림자: rgba(0, 0, 0, 0.1)

- **상태 색상**:
  - 성공/완료: #374151 (진한 회색)
  - 대기/경고: #9ca3af (중간 회색)
  - 오류/거부: #1f2937 (거의 검은색)
  - 정보: #6b7280 (회색)

### 10.2 타이포그래피
- **제목**: 2rem, font-weight: 700
- **부제목**: 1rem, color: #6b7280
- **본문**: 0.9375rem, color: #111827
- **보조 텍스트**: 0.8125rem, color: #6b7280

### 10.3 간격
- **카드 간격**: 1.5rem
- **섹션 간격**: 2rem
- **내부 패딩**: 1.5rem ~ 2rem

### 10.4 컴포넌트 스타일
- **카드**: 
  - 배경: #FFFFFF
  - 둥근 모서리: 12px
  - 그림자: 0 1px 3px rgba(0, 0, 0, 0.1)
  - 패딩: 1.5rem

- **버튼**:
  - 기본: #111827 배경, #FFFFFF 텍스트
  - 보조: #FFFFFF 배경, #111827 텍스트, 테두리
  - 둥근 모서리: 6px
  - 패딩: 0.75rem 1.5rem

- **배지**:
  - 둥근 모서리: 4px
  - 패딩: 0.25rem 0.75rem
  - 폰트 크기: 0.8125rem

- **테이블**:
  - 헤더 배경: #f9fafb
  - 행 호버: #f9fafb
  - 테두리: #e5e7eb

---

## 11. 체크리스트

### 11.1 기획 및 설계
- [ O ] 기획서 작성 완료
- [ ] 디자인 시스템 정의
- [ ] 컴포넌트 구조 설계
- [ ] API 스펙 정의

### 11.2 공통 컴포넌트
- [ ] 사이드바 컴포넌트
- [ ] 헤더 컴포넌트
- [ ] KPI 카드 컴포넌트
- [ ] 통계 카드 컴포넌트
- [ ] 테이블 컴포넌트
- [ ] 차트 컴포넌트 (Line, Bar, Donut)
- [ ] 모달 컴포넌트
- [ ] 페이지네이션 컴포넌트
- [ ] 필터 컴포넌트
- [ ] 검색 컴포넌트

### 11.3 Dashboard 페이지
- [ ] 레이아웃 구성
- [ ] KPI 카드 4개 구현
- [ ] Sales By Category 라인 그래프
- [ ] Sales By Category 도넛 차트
- [ ] Top Products 리스트
- [ ] Recent Orders 테이블
- [ ] API 연동
- [ ] 데이터 로딩 상태 처리
- [ ] 에러 처리

### 11.4 Order 페이지
- [ ] 레이아웃 구성
- [ ] 주문 통계 카드 4개
- [ ] 주문 목록 테이블
- [ ] 상태별 필터링
- [ ] 검색 기능
- [ ] 정렬 기능
- [ ] 주문 상세 모달
- [ ] 주문 수정 기능
- [ ] 페이지네이션
- [ ] API 연동
- [ O ] Slack 알림 기능 유지

### 11.5 Inventory 페이지
- [ ] 레이아웃 구성
- [ ] 재고 통계 카드 4개
- [ ] 상품 재고 테이블
- [ ] 재고 진행 바
- [ ] 상태별 필터링
- [ ] 검색 기능
- [ ] 정렬 기능
- [ ] 재고 수정 기능
- [ ] 재고 내보내기 기능
- [ ] 페이지네이션
- [ ] API 연동

### 11.6 Customers 페이지
- [ ] 레이아웃 구성
- [ ] 고객 통계 카드 4개
- [ ] Customer Growth Trends 차트
- [ ] Purchase Frequency 차트
- [ ] Age Distribution 차트
- [ ] Category Preferences 차트
- [ ] 고객 목록 테이블
- [ ] 고객 상세 정보
- [ ] 고객 세그먼트 분류
- [ ] API 연동

### 11.7 Report & Analytics 페이지
- [ ] 레이아웃 구성
- [ ] 판매 통계 카드 4개
- [ ] Sales Performance Overview 차트
- [ ] Top Selling Products 차트
- [ ] Sales by Category 차트
- [ ] Hourly Sales Pattern 차트
- [ ] 리포트 내보내기 기능
- [ ] API 연동

### 11.8 Inquiries 페이지
- [ O ] 레이아웃 구성 (기존 구현됨, 스타일 개선 필요)
- [ ] 문의 통계 카드 (선택사항, 새로 구현)
- [ O ] 1:1 문의 목록 스타일 개선 (기존 구현됨, 새 스타일 적용 필요)
- [ O ] 상품 문의 목록 스타일 개선 (기존 구현됨, 새 스타일 적용 필요)
- [ O ] 문의 상세 모달 스타일 개선 (기존 구현됨, 새 스타일 적용 필요)
- [ ] 스타일 통일 (흑백 계열로 통일 필요)

### 11.9 스타일링
- [ ] 흑백 색상 팔레트 적용
- [ ] 공통 스타일 시스템 구축
- [ ] 카드 스타일 통일
- [ ] 버튼 스타일 통일
- [ ] 배지 스타일 통일
- [ ] 테이블 스타일 통일
- [ ] 차트 스타일 통일
- [ ] 반응형 디자인 적용

### 11.10 API 및 백엔드
- [ ] Dashboard API 구현
- [ ] Order API 개선/확장
- [ ] Inventory API 구현
- [ ] Customers API 구현
- [ ] Analytics API 구현
- [ ] Inquiries API 유지/개선
- [ ] 에러 처리
- [ ] 데이터 검증

### 11.11 테스트 및 최적화
- [ ] 기능 테스트
- [ ] UI 테스트
- [ ] 성능 최적화
- [ ] 버그 수정
- [ ] 코드 리뷰

---

## 12. 참고사항

### 12.1 기존 기능 유지
- Slack 주문 알림 기능은 그대로 유지
- 기존 데이터 구조 최대한 활용
- 기존 API 엔드포인트 재사용 가능한 것은 재사용

### 12.2 확장 가능성
- 향후 추가 메뉴 확장 가능하도록 구조 설계
- 차트 라이브러리는 교체 가능하도록 추상화
- API는 확장 가능하도록 설계

### 12.3 성능 고려사항
- 대량 데이터 처리를 위한 페이지네이션
- 차트 데이터 캐싱 고려
- 실시간 업데이트는 필요시에만 구현

---

## 13. 예상 작업 시간

- **Phase 1 (기본 구조)**: 2-3일
- **Phase 2 (Dashboard)**: 3-4일
- **Phase 3 (Order)**: 3-4일
- **Phase 4 (Inventory)**: 2-3일
- **Phase 5 (Customers)**: 3-4일
- **Phase 6 (Report & Analytics)**: 3-4일
- **Phase 7 (Inquiries)**: 1-2일
- **Phase 8 (최종 정리)**: 2-3일

**총 예상 시간**: 19-27일

---

## 14. 리스크 및 대응 방안

### 14.1 리스크
1. **데이터 부족**: 일부 통계 데이터가 부족할 수 있음
   - 대응: 기본값 설정 또는 "데이터 없음" 표시

2. **성능 이슈**: 대량 데이터 처리 시 성능 저하
   - 대응: 페이지네이션, 캐싱, 인덱싱

3. **차트 라이브러리 호환성**: Recharts와 기존 코드 충돌
   - 대응: 별도 컴포넌트로 분리, 점진적 마이그레이션

### 14.2 대응 방안
- 단계적 구현 및 테스트
- 기존 기능과 병행 개발
- 충분한 테스트 기간 확보

---

## 15. 완료 기준

### 15.1 기능 완료 기준
- 모든 메뉴 페이지 구현 완료
- 모든 차트 및 통계 표시 정상 작동
- 필터링, 검색, 정렬 기능 정상 작동
- 페이지네이션 정상 작동
- 반응형 디자인 적용 완료

### 15.2 품질 완료 기준
- 코드 리뷰 완료
- 버그 수정 완료
- 성능 최적화 완료
- 사용자 테스트 완료

---

## 16. 부록

### 16.1 참고 이미지 분석 요약

#### Dashboard Overview
- 4개 KPI 카드 (Total Revenue, Total Orders, Total Product, Active Customers)
- 2개 차트 (Sales By Category - Line, Sales By Category - Donut)
- 2개 리스트 (Top Products, Recent Order)

#### Order Management
- 4개 통계 카드 (Total New Orders, Total Orders Pending, Total Orders Completed, Total Orders Canceled)
- 주문 목록 테이블 (Product Name, Customer Name, Order Id, Amount, Status, Action)
- 상태별 필터링 탭
- 검색, 필터, 정렬 기능

#### Inventory Management
- 4개 요약 카드 (Total Products, Low Stock, Out Of Stock, Top Category)
- 상품 재고 테이블 (Product Name, Category, Stock Level, Amount, Supplier, Status, Action)
- 재고 진행 바
- 상태별 필터링 탭

#### Customer Insights
- 4개 인사이트 카드 (Total Customer, New Customer, Avg. Rating, Repeat Customers)
- 4개 차트 (Customer Growth Trends, Purchase Frequency, Age Distribution, Category Preferences)

#### Reports & Analytics
- 4개 KPI 카드 (Total Sales, Avg. Order Value, Total Transactions, Growth Rate)
- 4개 차트 (Sales Performance Overview, Top Selling Products, Sales by Category, Hourly Sales Pattern)

#### Inquiries
- 기존 구성 유지하되 스타일 통일

### 16.2 아이콘 매핑
- Dashboard: Grid (LayoutGrid)
- Order: ShoppingCart
- Inventory: Package
- Customers: Users
- Report & Analytics: BarChart3
- Inquiries: MessageCircle
- Settings: Settings
- Help/Support: HelpCircle
- Logout: LogOut

---

**작성일**: 2025-02-01
**버전**: 1.0
**작성자**: AI Assistant

