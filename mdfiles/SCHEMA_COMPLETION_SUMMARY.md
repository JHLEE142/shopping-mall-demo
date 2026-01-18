# 스키마 완성 및 런타임 강제 작업 완료

## ✅ 수정/생성된 파일 목록

### 새로 생성된 파일
- [x] `server/src/ai_runtime/schemaSyncCheck.js` - 스키마 일치성 검증 (fail-fast)
- [x] `server/src/ai_runtime/__tests__/schemaSync.test.js` - 스키마 동기화 테스트

### 수정된 파일
- [x] `agents/schemas/action_schema.json` - 운영 수준으로 완성
- [x] `agents/schemas/response_schema.json` - 운영 수준으로 완성
- [x] `agents/schemas/intent_schema.json` - 운영 수준으로 완성
- [x] `server/src/ai_runtime/schemas.js` - JSON 스키마와 1:1 일치하도록 업데이트
- [x] `server/src/server.js` - 서버 시작 시 스키마 검증 추가 (fail-fast)

## 📋 각 스키마 파일 핵심 내용 요약

### 1. action_schema.json

**Tool Enum (6개):**
- addToCart, toggleWishlist, goToCheckout, requestCancel, requestRefund, sellerProductRegister

**주요 변경사항:**
- `addToCart.quantity`: max 20 (기존 100에서 변경)
- `goToCheckout`: cartId(string optional) OR items(array optional) 중 하나 필수
- `requestRefund`: evidenceUrls(array<string>, max 5) 추가
- `sellerProductRegister`: sellerId(string), product(object with required fields) 명시
- 공통 메타: requestId(UUID), actorRole("consumer"|"seller"), timestamp(ISO 8601)
- Forbidden fields: sql, rawQuery, adminOverride

**필수 필드:**
- tool, payload, requestId, actorRole, timestamp

### 2. response_schema.json

**Response Types (5개):**
- ANSWER, BRIEFING_WITH_PRODUCTS, MONGO_QUERY, TOOL_CALL, NEED_MORE_INFO

**주요 변경사항:**
- 모든 타입에 `requestId` (UUID) 필수 추가
- `NEED_MORE_INFO`: missingSlots(array optional) 추가, questions max 3개
- `TOOL_CALL`: userFacingSummary(string, max 200) 필수 추가
- `MONGO_QUERY`: limit max 100 (기존 500에서 변경), default 20

**타입별 필수 필드:**
- ANSWER: type, content, requestId
- BRIEFING_WITH_PRODUCTS: type, briefing, products, requestId
- MONGO_QUERY: type, collection, query, purpose, requestId
- TOOL_CALL: type, tool, payload, userFacingSummary, requestId
- NEED_MORE_INFO: type, questions, requestId

### 3. intent_schema.json

**Consumer Intents (12개):**
- search_product, get_recommendation, compare_price, add_to_cart, purchase, track_delivery, cancel_order, refund_request, write_review, check_rewards, login_help, signup_help

**Seller Intents (4개):**
- seller_analytics, simulate_pricing, analyze_efficiency, create_listing

**Behavior Intents (2개):**
- spend_analysis, reflection

**각 Intent에 추가된 필드:**
- `requiredSlots`: 필수 슬롯 목록 (array)
- `responsePreference`: 선호 응답 타입 (enum)
- `toolCandidate`: 가능한 도구 (optional)

**필수 필드:**
- description, defaultAgent, requiredSlots, responsePreference

## 🔧 런타임 연결

### schemaSyncCheck.js
- 서버 시작 시 자동 실행 (server.js에서 호출)
- JSON 스키마와 Zod 스키마 일치성 검증
- 불일치 발견 시 Error throw로 서버 부팅 실패 (fail-fast)
- 검증 항목:
  - Tool enum 일치
  - Required fields 일치
  - Quantity max 값 (20)
  - Response type enum 일치
  - requestId 필수 여부
  - MONGO_QUERY limit max (100)
  - Intent 목록 및 필수 필드

### schemas.js 업데이트
- UUID 패턴으로 requestId 검증
- 모든 response 타입에 requestId 필수
- quantity max 20으로 변경
- goToCheckout: union 타입 (cartId OR items)
- requestRefund: evidenceUrls 추가
- sellerProductRegister: sellerId, product 구조 명시
- actorRole, timestamp 필수 추가

### 테스트 파일
- `schemaSync.test.js`: 10개 테스트 케이스
  1. Schema validation at startup
  2. Valid TOOL_CALL payload
  3. Invalid TOOL_CALL (quantity=0)
  4. Invalid TOOL_CALL (quantity>20)
  5. Response missing requestId
  6. Valid ANSWER response
  7. Valid BRIEFING_WITH_PRODUCTS response
  8. Valid NEED_MORE_INFO with missingSlots
  9. NEED_MORE_INFO with too many questions
  10. TOOL_CALL with/without userFacingSummary
  11. MONGO_QUERY limit validation

## 🚀 다음 해야 할 작업 TOP 3

### 1. LLM 통합 및 응답 생성 (우선순위: 높음)
- `orchestrator.js`에 OpenAI/LLM API 연결
- Agent 스펙 기반 시스템 프롬프트 생성
- LLM 응답을 표준 포맷(ANSWER, BRIEFING_WITH_PRODUCTS 등)으로 파싱
- requestId, userFacingSummary 자동 생성
- **예상 시간**: 4-6시간

### 2. Tool Gateway 실제 구현 (우선순위: 높음)
- `toolGateway.js`에서 실제 API 호출 구현
- addToCart, toggleWishlist 등 각 도구별 비즈니스 로직 연결
- 에러 처리 및 사용자 친화적 메시지 반환
- **예상 시간**: 3-4시간

### 3. Intent Router 개선 (우선순위: 중간)
- 키워드 기반 → ML 모델 기반으로 전환
- Confidence 점수 계산 로직 구현
- Multi-intent 시나리오 처리
- requiredSlots 기반 slot collector 연동
- **예상 시간**: 6-8시간

## 📝 참고 사항

- 모든 스키마는 `agents/schemas/*.json`이 Single Source of Truth
- Zod 스키마는 JSON 스키마와 1:1 일치해야 함
- 서버 시작 시 자동 검증 (fail-fast)
- 테스트는 `npm test` 또는 `jest`로 실행 가능
- UUID 형식: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`

---
**작업 완료 시간**: 2024-12-30
