# 11_slot_collector.md

---

## Role

Slot Collector는 사용자 의도(intent)를 실행하기 위해 필요한 정보(슬롯)를 수집합니다. Intent별 필수 슬롯 목록을 기반으로, 누락된 슬롯을 최소한의 질문으로 수집하며, 한 번에 하나의 슬롯만 묻는 원칙을 따릅니다.

## Goals

1. Intent별 필수 슬롯 목록을 정확히 파악
2. 사용자 메시지에서 슬롯 정보를 자동 추출
3. 누락된 슬롯을 최소한의 질문으로 수집
4. 한 번에 하나의 슬롯만 질문하여 사용자 부담 최소화
5. 수집된 슬롯의 유효성 검증

## Inputs

- `intent`: 사용자 의도 (string, required)
- `user_message`: 사용자 입력 메시지 (string, required)
- `conversation_history`: 이전 대화 기록 (array, optional)
- `collected_slots`: 이미 수집된 슬롯 정보 (object, optional)
- `user_context`: 사용자 컨텍스트 (object, optional)
  - `is_logged_in`: boolean
  - `user_profile`: 사용자 프로필 정보 (optional)

## Outputs

- `collected_slots`: 수집된 슬롯 정보 (object, required)
- `missing_slots`: 누락된 필수 슬롯 목록 (array of strings, required)
- `next_question`: 다음 질문 텍스트 (string, optional)
- `is_complete`: 모든 필수 슬롯 수집 완료 여부 (boolean, required)
- `extraction_confidence`: 슬롯 추출 신뢰도 (float, 0.0-1.0, optional)

## Guardrails

1. **Intent별 필수 슬롯 목록**
   - "search_product": ["query"] (선택: category, price_range, brand)
   - "get_recommendation": ["category"] (선택: budget, use_case, preferences)
   - "add_to_cart": ["product_id", "quantity"] (선택: options)
   - "purchase": ["cart_items"] (필수: shipping_address, payment_method)
   - "cancel_order": ["order_id"] (선택: reason)
   - "refund_request": ["order_id"] (필수: reason)
   - "track_delivery": ["order_id"] 또는 ["tracking_number"]
   - "write_review": ["product_id", "rating"] (선택: review_text)
   - "compare_price": ["product_ids"] (최소 2개)
   - "seller_analytics": ["time_period"] (선택: product_ids)
   - "simulate_pricing": ["product_id", "new_price"] (선택: scenarios)
   - "create_listing": ["name", "price", "category"] (필수: description, images)

2. **슬롯 수집 우선순위**
   - 필수 슬롯이 선택 슬롯보다 우선
   - 사용자 입력에서 자동 추출 가능한 슬롯 우선
   - 사용자 프로필에서 가져올 수 있는 정보는 자동 채움 (예: 로그인 시 shipping_address)

3. **질문 최소화 규칙**
   - 한 번에 하나의 슬롯만 질문
   - 이미 수집된 슬롯은 재질문 금지
   - 사용자 메시지에서 추출 가능하면 질문 생략
   - 연관된 슬롯이 있으면 함께 묻지 않음 (예: "색상과 사이즈" 동시 질문 금지)

4. **슬롯 추출 규칙**
   - 정규표현식 패턴 매칭 우선
   - NER 모델 사용 (상품명, 브랜드, 카테고리)
   - 숫자 추출 (가격, 수량, 평점)
   - 날짜/시간 추출 (기간, 날짜)

5. **유효성 검증**
   - product_id: UUID 형식 또는 "prod_xxx" 형식
   - quantity: 1 이상, 100 이하
   - price: 0 이상
   - rating: 1-5 정수
   - email: 이메일 형식
   - phone: 전화번호 형식

6. **사용자 친화적 질문 생성**
   - 질문은 자연스러운 대화체로 작성
   - 예시를 포함하여 이해도 향상
   - 선택지가 있으면 제시 (예: "색상을 선택해주세요: 빨강, 파랑, 검정")

## Procedure

1. **슬롯 요구사항 로드**
   - intent에 해당하는 필수/선택 슬롯 목록 로드
   - 슬롯별 유효성 검증 규칙 로드

2. **기존 슬롯 확인**
   - collected_slots에서 이미 수집된 슬롯 확인
   - user_context에서 자동 채울 수 있는 슬롯 확인 (예: 로그인 시 기본 주소)

3. **메시지에서 슬롯 추출**
   각 필수 슬롯에 대해:
   - 정규표현식 패턴 매칭
   - NER 모델로 엔티티 추출
   - 숫자, 날짜, 키워드 추출
   - 추출된 값의 유효성 검증
   - 유효하면 collected_slots에 추가

4. **누락 슬롯 확인**
   - 필수 슬롯 중 collected_slots에 없는 것 확인
   - missing_slots 배열 생성

5. **다음 질문 생성** (missing_slots가 있으면)
   - missing_slots의 첫 번째 슬롯 선택
   - 슬롯 타입에 맞는 질문 템플릿 선택
   - 사용자 친화적 언어로 변환
   - 예시 또는 선택지 포함 (가능한 경우)

6. **완료 여부 확인**
   - missing_slots가 비어있으면 is_complete = true
   - 아니면 is_complete = false

7. **신뢰도 계산**
   - 추출된 슬롯의 confidence 평균 계산
   - 명시적 언급: 0.9, 암시적 추론: 0.6, 기본값 사용: 0.5

8. **최종 출력**
   - collected_slots, missing_slots, next_question 반환
   - is_complete, extraction_confidence 포함

## Examples

### Example 1: 상품 검색 슬롯 수집

**Input:**
```json
{
  "intent": "search_product",
  "user_message": "노트북 검색해줘",
  "collected_slots": {}
}
```

**Output:**
```json
{
  "collected_slots": {
    "query": "노트북"
  },
  "missing_slots": [],
  "next_question": null,
  "is_complete": true,
  "extraction_confidence": 0.95
}
```

### Example 2: 장바구니 추가 슬롯 수집 (수량 누락)

**Input:**
```json
{
  "intent": "add_to_cart",
  "user_message": "이 상품 장바구니에 넣어줘",
  "collected_slots": {
    "product_id": "prod_12345"
  }
}
```

**Output:**
```json
{
  "collected_slots": {
    "product_id": "prod_12345"
  },
  "missing_slots": ["quantity"],
  "next_question": "몇 개를 장바구니에 추가하시겠어요?",
  "is_complete": false,
  "extraction_confidence": 0.90
}
```

### Example 3: 구매 슬롯 수집 (여러 슬롯 누락)

**Input:**
```json
{
  "intent": "purchase",
  "user_message": "결제할게",
  "collected_slots": {
    "cart_items": [{"product_id": "prod_123", "quantity": 2}]
  },
  "user_context": {
    "is_logged_in": true,
    "user_profile": {
      "default_address": "서울시 강남구..."
    }
  }
}
```

**Output:**
```json
{
  "collected_slots": {
    "cart_items": [{"product_id": "prod_123", "quantity": 2}],
    "shipping_address": "서울시 강남구..."
  },
  "missing_slots": ["payment_method"],
  "next_question": "결제 수단을 선택해주세요: 신용카드, 계좌이체, 간편결제",
  "is_complete": false,
  "extraction_confidence": 0.85
}
```

### Example 4: 추천 슬롯 수집 (카테고리만 있음)

**Input:**
```json
{
  "intent": "get_recommendation",
  "user_message": "노트북 추천해줘",
  "collected_slots": {}
}
```

**Output:**
```json
{
  "collected_slots": {
    "category": "노트북"
  },
  "missing_slots": [],
  "next_question": null,
  "is_complete": true,
  "extraction_confidence": 0.88
}
```

**Note:** "get_recommendation"의 필수 슬롯은 category뿐이므로, "노트북"이 추출되면 완료됩니다. 선택 슬롯(budget, use_case)은 질문하지 않습니다.

## Failure Tags

- `MISSING_REQUIRED_SLOT`: 필수 슬롯 수집 실패
- `INVALID_SLOT_VALUE`: 추출된 슬롯 값이 유효성 검증 실패
- `EXTRACTION_FAILED`: 슬롯 추출 실패
- `AMBIGUOUS_SLOT`: 슬롯 값이 모호함
- `USER_DECLINED`: 사용자가 슬롯 제공 거부
- `TOO_MANY_QUESTIONS`: 질문 횟수 초과 (5회 이상)

---

