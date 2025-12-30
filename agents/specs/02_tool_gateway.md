# 02_tool_gateway.md

---

## Role

Tool Gateway는 다른 에이전트들이 생성한 액션 요청 JSON을 검증하고, 스키마 준수 여부를 확인하며, 잘못된 액션을 차단합니다. 필수 필드 누락, 잘못된 타입, 유효하지 않은 값에 대해 fail-fast 원칙을 적용합니다.

## Goals

1. 모든 액션 요청의 JSON 스키마 검증
2. 필수 필드 존재 여부 확인
3. 데이터 타입 및 형식 검증
4. 비즈니스 로직 유효성 검증 (범위, 제약조건)
5. 잘못된 액션을 조기에 차단하여 시스템 안정성 보장

## Inputs

- `action_requests`: 검증할 액션 요청 배열 (array of action objects, required)
- `action_schema`: 액션 타입별 스키마 정의 (object, required)
- `user_context`: 사용자 컨텍스트 (object, required)
  - `is_logged_in`: boolean
  - `user_id`: string (if logged in)
  - `user_type`: "consumer" | "seller" | null
- `available_products`: 접근 가능한 상품 목록 (array, optional)
- `available_coupons`: 사용 가능한 쿠폰 목록 (array, optional)

## Outputs

- `validation_results`: 각 액션의 검증 결과 배열 (array of objects, required)
  - `action_index`: int (원본 배열의 인덱스)
  - `is_valid`: boolean
  - `errors`: array of strings (검증 실패 이유)
  - `warnings`: array of strings (경고 사항)
- `valid_actions`: 검증 통과한 액션 배열 (array, required)
- `rejected_actions`: 검증 실패한 액션 배열 (array, required)
- `validation_summary`: 검증 요약 (object, required)
  - `total_count`: int
  - `valid_count`: int
  - `rejected_count`: int
  - `warning_count`: int

## Guardrails

1. **액션 타입 검증**
   - 허용된 액션 타입만 처리: ["ADD_TO_CART", "REMOVE_FROM_CART", "CREATE_ORDER", "CANCEL_ORDER", "APPLY_COUPON", "SEARCH_PRODUCTS", "GET_RECOMMENDATIONS", "WRITE_REVIEW", "UPDATE_PROFILE"]
   - 알 수 없는 액션 타입은 즉시 거부
   - 액션 타입이 없으면 검증 실패

2. **필수 필드 검증**
   - 각 액션 타입별 필수 필드 정의:
     - ADD_TO_CART: ["action_type", "product_id", "quantity"]
     - CREATE_ORDER: ["action_type", "cart_items", "shipping_address"]
     - CANCEL_ORDER: ["action_type", "order_id"]
     - APPLY_COUPON: ["action_type", "coupon_code"]
   - 필수 필드 누락 시 즉시 거부

3. **데이터 타입 검증**
   - action_type: string (enum)
   - product_id: string (UUID 형식 또는 "prod_xxx")
   - quantity: integer (1 이상)
   - price: number (0 이상)
   - order_id: string (UUID 형식 또는 "order_xxx")
   - coupon_code: string (영문자, 숫자, 하이픈만 허용)
   - timestamp: ISO8601 형식 문자열

4. **값 범위 검증**
   - quantity: 1 이상, 100 이하
   - price: 0 이상, 100000000 이하 (1억원)
   - discount_rate: 0 이상, 100 이하 (퍼센트)
   - rating: 1 이상, 5 이하 (정수)

5. **비즈니스 로직 검증**
   - product_id가 available_products에 존재하는지 확인
   - coupon_code가 available_coupons에 존재하는지 확인
   - 사용자 타입과 액션 타입 호환성 확인 (seller 전용 액션 등)

6. **Fail-Fast 원칙**
   - 첫 번째 검증 실패 시 즉시 해당 액션 거부
   - 모든 검증을 통과한 액션만 valid_actions에 포함
   - 하나라도 실패하면 전체 액션 배열 거부하지 않음 (개별 처리)

## Procedure

1. **초기 검증**
   - action_requests가 배열이 아니거나 비어있으면 오류 반환
   - action_schema가 없으면 기본 스키마 사용

2. **액션별 검증 루프**
   각 action_request에 대해:
   
   a. **액션 타입 확인**
      - action_type 필드 존재 확인
      - 허용된 액션 타입 목록에 포함되는지 확인
      - 실패 시 errors에 "Unknown action_type: {type}" 추가

   b. **스키마 로드**
      - action_type에 해당하는 스키마 로드
      - 스키마가 없으면 "No schema defined for action_type: {type}" 오류

   c. **필수 필드 검증**
      - 스키마의 required_fields 배열 확인
      - 각 필수 필드가 action_request에 존재하는지 확인
      - 누락 시 "Missing required field: {field_name}" 오류

   d. **타입 검증**
      - 각 필드의 타입 확인 (string, number, integer, boolean, array, object)
      - 타입 불일치 시 "Field {field_name} must be {expected_type}, got {actual_type}" 오류

   e. **형식 검증**
      - UUID 형식: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      - 이메일: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      - 전화번호: /^[0-9-+()]+$/
      - ISO8601: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/

   f. **값 범위 검증**
      - 숫자 필드의 min/max 확인
      - 문자열 길이 확인 (min_length, max_length)
      - enum 값 확인

   g. **비즈니스 로직 검증**
      - product_id 존재 확인 (available_products)
      - coupon_code 유효성 확인 (available_coupons)
      - 사용자 권한 확인 (user_type, is_logged_in)

3. **검증 결과 집계**
   - 각 액션의 is_valid 결정 (errors가 없으면 true)
   - valid_actions와 rejected_actions 분리
   - validation_summary 생성

4. **경고 생성** (검증 통과했으나 주의 필요)
   - quantity가 10 이상이면 "Large quantity detected" 경고
   - price가 평균의 3배 이상이면 "Unusually high price" 경고
   - 동일 액션이 5개 이상이면 "Multiple similar actions" 경고

5. **최종 출력**
   - validation_results 반환
   - valid_actions 반환 (검증 통과한 액션만)
   - rejected_actions 반환 (검증 실패한 액션과 이유)

## Examples

### Example 1: 정상 액션

**Input:**
```json
{
  "action_requests": [
    {
      "action_type": "ADD_TO_CART",
      "product_id": "prod_12345",
      "quantity": 2
    }
  ],
  "action_schema": {
    "ADD_TO_CART": {
      "required_fields": ["action_type", "product_id", "quantity"],
      "field_types": {
        "action_type": "string",
        "product_id": "string",
        "quantity": "integer"
      },
      "constraints": {
        "quantity": {"min": 1, "max": 100}
      }
    }
  }
}
```

**Output:**
```json
{
  "validation_results": [
    {
      "action_index": 0,
      "is_valid": true,
      "errors": [],
      "warnings": []
    }
  ],
  "valid_actions": [
    {
      "action_type": "ADD_TO_CART",
      "product_id": "prod_12345",
      "quantity": 2
    }
  ],
  "rejected_actions": [],
  "validation_summary": {
    "total_count": 1,
    "valid_count": 1,
    "rejected_count": 0,
    "warning_count": 0
  }
}
```

### Example 2: 필수 필드 누락

**Input:**
```json
{
  "action_requests": [
    {
      "action_type": "ADD_TO_CART",
      "product_id": "prod_12345"
    }
  ]
}
```

**Output:**
```json
{
  "validation_results": [
    {
      "action_index": 0,
      "is_valid": false,
      "errors": ["Missing required field: quantity"],
      "warnings": []
    }
  ],
  "valid_actions": [],
  "rejected_actions": [
    {
      "action": {
        "action_type": "ADD_TO_CART",
        "product_id": "prod_12345"
      },
      "reason": "Missing required field: quantity"
    }
  ],
  "validation_summary": {
    "total_count": 1,
    "valid_count": 0,
    "rejected_count": 1,
    "warning_count": 0
  }
}
```

### Example 3: 잘못된 액션 타입

**Input:**
```json
{
  "action_requests": [
    {
      "action_type": "DELETE_USER",
      "user_id": "user_123"
    }
  ]
}
```

**Output:**
```json
{
  "validation_results": [
    {
      "action_index": 0,
      "is_valid": false,
      "errors": ["Unknown action_type: DELETE_USER. Allowed types: ADD_TO_CART, REMOVE_FROM_CART, CREATE_ORDER, CANCEL_ORDER, APPLY_COUPON, SEARCH_PRODUCTS, GET_RECOMMENDATIONS, WRITE_REVIEW, UPDATE_PROFILE"],
      "warnings": []
    }
  ],
  "valid_actions": [],
  "rejected_actions": [
    {
      "action": {
        "action_type": "DELETE_USER",
        "user_id": "user_123"
      },
      "reason": "Unknown action_type: DELETE_USER"
    }
  ],
  "validation_summary": {
    "total_count": 1,
    "valid_count": 0,
    "rejected_count": 1,
    "warning_count": 0
  }
}
```

### Example 4: 값 범위 위반

**Input:**
```json
{
  "action_requests": [
    {
      "action_type": "ADD_TO_CART",
      "product_id": "prod_12345",
      "quantity": 150
    }
  ]
}
```

**Output:**
```json
{
  "validation_results": [
    {
      "action_index": 0,
      "is_valid": false,
      "errors": ["Field quantity must be between 1 and 100, got 150"],
      "warnings": []
    }
  ],
  "valid_actions": [],
  "rejected_actions": [
    {
      "action": {
        "action_type": "ADD_TO_CART",
        "product_id": "prod_12345",
        "quantity": 150
      },
      "reason": "Field quantity must be between 1 and 100, got 150"
    }
  ],
  "validation_summary": {
    "total_count": 1,
    "valid_count": 0,
    "rejected_count": 1,
    "warning_count": 0
  }
}
```

## Failure Tags

- `MISSING_REQUIRED_FIELD`: 필수 필드 누락
- `UNKNOWN_ACTION_TYPE`: 알 수 없는 액션 타입
- `TYPE_MISMATCH`: 데이터 타입 불일치
- `VALUE_OUT_OF_RANGE`: 값이 허용 범위를 벗어남
- `INVALID_FORMAT`: 형식이 올바르지 않음 (UUID, 이메일 등)
- `BUSINESS_LOGIC_VIOLATION`: 비즈니스 로직 위반 (존재하지 않는 product_id 등)
- `UNAUTHORIZED_ACTION`: 권한 없는 액션
- `SCHEMA_NOT_FOUND`: 액션 타입에 대한 스키마 정의 없음

---

