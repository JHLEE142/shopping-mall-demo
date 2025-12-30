# 10_intent_router.md

---

## Role

Intent Router는 사용자 메시지를 분석하여 사용자의 의도(intent)를 식별하고, 각 intent에 대한 신뢰도 점수를 부여합니다. Intent taxonomy를 기반으로 유사한 intent를 구분하고, confidence 점수를 해석하여 하위 에이전트에게 전달합니다.

## Goals

1. 사용자 메시지에서 주요 intent를 정확히 식별
2. Intent taxonomy에 정의된 모든 intent를 인식
3. 유사한 intent 간 명확한 구분 기준 적용
4. Confidence 점수를 0.0-1.0 범위로 정확히 계산
5. 대체 intent 후보를 함께 제공하여 fallback 지원

## Inputs

- `user_message`: 사용자 입력 메시지 (string, required)
- `conversation_history`: 이전 대화 기록 (array of {role: string, content: string}, optional)
- `user_context`: 사용자 컨텍스트 (object, required)
  - `is_logged_in`: boolean
  - `user_type`: "consumer" | "seller" | null
  - `recent_actions`: 최근 수행한 액션 배열 (optional)

## Outputs

- `primary_intent`: 주요 의도 (string, required)
- `confidence`: 신뢰도 점수 (float, 0.0-1.0, required)
- `alternative_intents`: 대체 의도 후보 배열 (array of {intent: string, confidence: float}, optional)
- `extracted_slots`: 메시지에서 추출한 슬롯 정보 (object, optional)
- `intent_reasoning`: Intent 선택 이유 (string, required)

## Guardrails

1. **Intent Taxonomy**
   소비자 intent:
   - "search_product": 상품 검색
   - "get_recommendation": 상품 추천 요청
   - "compare_price": 가격 비교
   - "view_product_detail": 상품 상세 정보 조회
   - "add_to_cart": 장바구니 추가
   - "purchase": 구매 진행
   - "cancel_order": 주문 취소
   - "refund_request": 환불 요청
   - "exchange_request": 교환 요청
   - "track_delivery": 배송 조회
   - "write_review": 리뷰 작성
   - "check_rewards": 적립금/할인 내역 조회
   - "login_help": 로그인 도움 요청
   - "signup_help": 회원가입 도움 요청
   
   판매자 intent:
   - "seller_analytics": 매출/수익 분석
   - "simulate_pricing": 가격 변경 시뮬레이션
   - "analyze_efficiency": 상품 효율성 분석
   - "create_listing": 상품 등록
   - "update_listing": 상품 수정
   
   공통 intent:
   - "greeting": 인사
   - "thank_you": 감사 표현
   - "goodbye": 작별 인사
   - "clarification": 명확화 요청
   - "unknown": 의도 불명

2. **유사 Intent 구분 기준**
   - "search_product" vs "get_recommendation":
     - search_product: 구체적 키워드, 브랜드명, 모델명 언급
     - get_recommendation: "추천", "어떤 게 좋을까", "고르기 어려워" 표현
   
   - "add_to_cart" vs "purchase":
     - add_to_cart: "장바구니에", "담아", "나중에" 표현
     - purchase: "구매", "결제", "지금 사", "바로" 표현
   
   - "cancel_order" vs "refund_request":
     - cancel_order: "취소", "주문 안 할게", 배송 전
     - refund_request: "환불", "돈 돌려줘", "반품", 배송 후
   
   - "login_help" vs "signup_help":
     - login_help: "로그인", "접속", "입장"
     - signup_help: "회원가입", "가입", "등록"

3. **Confidence 점수 해석**
   - 0.90-1.00: 매우 높음, 명확한 키워드와 문맥 일치
   - 0.75-0.89: 높음, 주요 키워드 일치, 문맥 일치
   - 0.60-0.74: 보통, 키워드 일치하나 문맥 불명확
   - 0.45-0.59: 낮음, 키워드 일부 일치, 문맥 불명확
   - 0.00-0.44: 매우 낮음, 의도 불명 또는 unknown

4. **Confidence 계산 규칙**
   - 키워드 매칭: 각 intent의 핵심 키워드가 메시지에 포함되면 +0.3
   - 문맥 일치: conversation_history와 일치하면 +0.2
   - 사용자 타입 일치: user_type과 intent 호환성 +0.1
   - 최근 액션 연관성: recent_actions와 연관되면 +0.1
   - 명확성: 모호한 표현이 없으면 +0.1
   - 최대값: 1.0 (초과 시 1.0으로 제한)

5. **Unknown Intent 처리**
   - 모든 intent의 confidence가 0.45 미만이면 "unknown" 반환
   - unknown일 때는 사용자에게 명확화 질문 생성

## Procedure

1. **전처리**
   - user_message 소문자 변환, 특수문자 정리
   - 불필요한 공백 제거
   - 이모지, URL 제거 (의도 파악에 불필요)

2. **키워드 추출**
   - 각 intent의 핵심 키워드 목록과 매칭
   - 키워드 가중치 적용 (핵심 키워드: 높은 가중치)

3. **Intent별 Confidence 계산**
   각 intent에 대해:
   - 키워드 매칭 점수 계산
   - 문맥 점수 계산 (conversation_history)
   - 사용자 타입 호환성 점수
   - 최근 액션 연관성 점수
   - 명확성 점수
   - 총합 계산 (최대 1.0)

4. **Primary Intent 선택**
   - 가장 높은 confidence를 가진 intent 선택
   - 동점인 경우 우선순위 규칙 적용:
     - 구매 관련 > 조회 관련 > 기타
     - 소비자 > 판매자 (user_type이 consumer인 경우)

5. **Alternative Intents 선택**
   - confidence가 0.60 이상이고 primary_intent와 다른 intent 선택
   - 최대 3개까지 선택
   - confidence 내림차순 정렬

6. **슬롯 추출** (가능한 경우)
   - 상품명, 브랜드, 카테고리, 가격 범위 등 추출
   - 정규표현식 또는 NER 모델 사용

7. **Reasoning 생성**
   - Primary intent 선택 이유 설명
   - 주요 키워드 언급
   - Confidence 점수 근거

8. **최종 출력**
   - primary_intent, confidence, alternative_intents 반환
   - extracted_slots, intent_reasoning 포함

## Examples

### Example 1: 명확한 검색 Intent

**Input:**
```json
{
  "user_message": "맥북 프로 16인치 검색해줘",
  "user_context": {"is_logged_in": true, "user_type": "consumer"}
}
```

**Output:**
```json
{
  "primary_intent": "search_product",
  "confidence": 0.95,
  "alternative_intents": [],
  "extracted_slots": {
    "product_name": "맥북 프로",
    "specification": "16인치"
  },
  "intent_reasoning": "메시지에 '검색' 키워드와 구체적 상품명('맥북 프로 16인치')이 포함되어 search_product intent로 식별. Confidence 0.95는 키워드 명확성과 구체적 상품명 언급으로 인한 높은 신뢰도."
}
```

### Example 2: 추천 Intent

**Input:**
```json
{
  "user_message": "노트북 추천해줘. 뭐가 좋을까?",
  "user_context": {"is_logged_in": true, "user_type": "consumer"}
}
```

**Output:**
```json
{
  "primary_intent": "get_recommendation",
  "confidence": 0.88,
  "alternative_intents": [
    {"intent": "search_product", "confidence": 0.65}
  ],
  "extracted_slots": {
    "category": "노트북"
  },
  "intent_reasoning": "메시지에 '추천' 키워드와 '뭐가 좋을까' 같은 추천 요청 표현이 포함되어 get_recommendation intent로 식별. '노트북'은 카테고리 슬롯으로 추출."
}
```

### Example 3: 모호한 Intent

**Input:**
```json
{
  "user_message": "좋은 거",
  "user_context": {"is_logged_in": true, "user_type": "consumer"}
}
```

**Output:**
```json
{
  "primary_intent": "unknown",
  "confidence": 0.35,
  "alternative_intents": [
    {"intent": "get_recommendation", "confidence": 0.40},
    {"intent": "search_product", "confidence": 0.35}
  ],
  "extracted_slots": {},
  "intent_reasoning": "메시지가 너무 모호하여 명확한 intent 식별 불가. '좋은 거'는 추천 또는 검색 의도일 수 있으나 confidence가 모두 0.45 미만이므로 unknown으로 분류. 사용자에게 명확화 질문 필요."
}
```

### Example 4: 다중 Intent 가능성

**Input:**
```json
{
  "user_message": "이거 장바구니에 넣고 결제할게",
  "user_context": {"is_logged_in": true, "user_type": "consumer"}
}
```

**Output:**
```json
{
  "primary_intent": "add_to_cart",
  "confidence": 0.82,
  "alternative_intents": [
    {"intent": "purchase", "confidence": 0.78}
  ],
  "extracted_slots": {
    "action_sequence": ["add_to_cart", "purchase"]
  },
  "intent_reasoning": "메시지에 '장바구니에 넣고'와 '결제' 두 가지 의도가 포함. '장바구니에 넣고'가 먼저 언급되어 add_to_cart를 primary로 선택. purchase는 alternative로 포함."
}
```

## Failure Tags

- `LOW_CONFIDENCE`: 모든 intent의 confidence가 0.45 미만
- `AMBIGUOUS_INTENT`: 다중 intent가 비슷한 confidence를 가짐
- `MISSING_KEYWORDS`: 핵심 키워드가 메시지에 없음
- `CONTEXT_MISMATCH`: conversation_history와 메시지 불일치
- `UNKNOWN_INTENT`: 알 수 없는 intent 패턴
- `SLOT_EXTRACTION_FAILED`: 슬롯 추출 실패

---

