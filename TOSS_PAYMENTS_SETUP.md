# 토스페이먼츠 결제 연동 가이드

이 문서는 토스페이먼츠 결제 위젯 연동 및 테스트 결제 설정 방법을 안내합니다.

## 환경 변수 설정

### 클라이언트 (client/.env)

```bash
VITE_TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
```

**테스트 키 (기본값):**
- `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm` (문서용 테스트 키)

**실제 사용 시:**
1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com)에 접속
2. 로그인 후 "내 상점" → "API 키" 메뉴로 이동
3. "API 개별 연동 키" 탭에서 Client Key 확인
4. `test_ck_...` (테스트) 또는 `live_ck_...` (운영) 키를 사용

### 서버 (server/.env)

```bash
TOSS_PAYMENTS_SECRET_KEY=test_sk_docs_OaPz8L5KdmQXkzR7y47BMw6
```

**테스트 키 (기본값):**
- `test_sk_docs_OaPz8L5KdmQXkzR7y47BMw6` (문서용 테스트 키)

**실제 사용 시:**
1. 토스페이먼츠 개발자센터에서 Secret Key 확인
2. `test_sk_...` (테스트) 또는 `live_sk_...` (운영) 키를 사용

## 결제 흐름

1. **주문 페이지 (OrderPage)**
   - 사용자가 주문 정보 입력
   - 토스페이먼츠 결제 위젯 표시
   - 결제 버튼 클릭 시 주문 정보를 sessionStorage에 저장

2. **결제 위젯 (TossPaymentWidget)**
   - 결제 수단 선택 및 결제 요청
   - 성공 시: `?view=payment-success&orderId=...&amount=...`로 리다이렉트
   - 실패 시: `?view=payment-fail&orderId=...`로 리다이렉트

3. **결제 성공 페이지 (PaymentSuccessPage)**
   - URL에서 `paymentKey`, `orderId`, `amount` 추출
   - 서버에 결제 승인 API 호출 (`/api/toss-payments/confirm`)
   - 결제 승인 성공 후 주문 생성
   - 주문 완료 화면 표시

4. **결제 실패 페이지 (PaymentFailPage)**
   - 에러 코드 및 메시지 표시
   - 홈으로 돌아가기 버튼 제공

## 테스트 결제 방법

### 1. 샌드박스 환경 사용

토스페이먼츠 샌드박스 환경에서 테스트 결제를 진행할 수 있습니다.

**테스트 카드 정보:**
- 카드번호: `1234-5678-9012-3456`
- 유효기간: `12/34`
- CVC: `123`
- 비밀번호: `123456`

### 2. 결제 테스트 시나리오

1. 장바구니에 상품 추가
2. 주문 페이지로 이동
3. 배송 정보 입력
4. 토스페이먼츠 결제 위젯에서 결제 수단 선택
5. "결제하기" 버튼 클릭
6. 테스트 카드 정보 입력
7. 결제 완료 후 성공 페이지 확인

### 3. API 엔드포인트

**결제 승인 API:**
```
POST /api/toss-payments/confirm
Content-Type: application/json

{
  "paymentKey": "tgen_20260131011657wgtS6",
  "orderId": "MC4wNDAyNDU1OTM0MDIw",
  "amount": 50000
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "paymentKey": "tgen_20260131011657wgtS6",
    "orderId": "MC4wNDAyNDU1OTM0MDIw",
    "amount": 50000,
    "method": "카드",
    "status": "DONE",
    "approvedAt": "2026-01-31T01:16:57+09:00"
  }
}
```

## 문제 해결

### 결제 위젯이 표시되지 않는 경우

1. `VITE_TOSS_CLIENT_KEY` 환경 변수 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. 네트워크 탭에서 토스페이먼츠 API 호출 확인

### 결제 승인 실패 시

1. 서버의 `TOSS_PAYMENTS_SECRET_KEY` 환경 변수 확인
2. 서버 로그에서 에러 메시지 확인
3. 결제 금액이 일치하는지 확인

### 주문 생성 실패 시

1. sessionStorage에 `pendingOrder` 데이터가 있는지 확인
2. 주문 정보 형식이 올바른지 확인
3. 서버 로그에서 에러 메시지 확인

## 참고 자료

- [토스페이먼츠 결제 위젯 가이드](https://docs.tosspayments.com/guides/v2/payment-widget/integration)
- [토스페이먼츠 개발자센터](https://developers.tosspayments.com)
- [토스페이먼츠 샌드박스](https://developers.tosspayments.com/sandbox)

