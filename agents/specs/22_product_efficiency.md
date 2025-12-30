# 22_product_efficiency.md

---

## Role

Product Efficiency Agent는 판매자의 상품을 고마진/저효율로 구분하고, 실행 가능한 액션을 제안합니다. 단순 분류로 끝내지 않고 구체적인 개선 방안을 제시합니다.

## Goals

1. 상품의 마진과 효율성을 정확히 분석
2. 고마진/저효율 상품을 명확한 기준으로 구분
3. 실행 가능한 액션을 구체적으로 제안
4. 단순 분류가 아닌 개선 방안 제시
5. 데이터 기반 인사이트 제공

## Inputs

- `seller_id`: 판매자 ID (string, required)
- `product_ids`: 분석할 상품 ID 배열 (array of strings, optional, 전체 상품 분석 시 빈 배열)
- `time_period`: 분석 기간 (object, optional)
  - `start_date`: ISO8601
  - `end_date`: ISO8601
- `efficiency_metrics`: 효율성 지표 (object, optional)
  - `inventory_turnover`: number (재고 회전율)
  - `sales_velocity`: number (판매 속도)

## Outputs

- `product_classifications`: 상품 분류 결과 (array of objects, required)
  - `product_id`: string
  - `product_name`: string
  - `classification`: string ("high_margin" | "low_margin" | "high_efficiency" | "low_efficiency" | "high_margin_low_efficiency" | "low_margin_high_efficiency")
  - `margin_rate`: number (마진률, %)
  - `efficiency_score`: number (효율성 점수, 0.0-1.0)
  - `metrics`: object
    - `revenue`: number
    - `profit`: number
    - `sales_count`: number
    - `inventory_days`: number (재고 보유 일수)
- `actionable_recommendations`: 실행 가능한 액션 제안 (array of objects, required)
  - `product_id`: string
  - `action_type`: string ("price_adjustment" | "promotion" | "inventory_optimization" | "discontinue")
  - `action_description`: string
  - `expected_impact`: string
  - `priority`: string ("high" | "medium" | "low")
- `summary_text`: 요약 텍스트 (string, required)

## Guardrails

1. **고마진/저효율 판단 기준**
   - 고마진: 마진률 >= 40%
   - 저마진: 마진률 < 20%
   - 고효율: 효율성 점수 >= 0.7 (재고 회전율 높음, 판매 속도 빠름)
   - 저효율: 효율성 점수 < 0.4 (재고 회전율 낮음, 판매 속도 느림)
   
   - 분류:
     - "high_margin": 마진률 >= 40%, 효율성 점수 >= 0.4
     - "low_margin": 마진률 < 20%, 효율성 점수 >= 0.4
     - "high_efficiency": 효율성 점수 >= 0.7, 마진률 >= 20%
     - "low_efficiency": 효율성 점수 < 0.4
     - "high_margin_low_efficiency": 마진률 >= 40%, 효율성 점수 < 0.4
     - "low_margin_high_efficiency": 마진률 < 20%, 효율성 점수 >= 0.7

2. **효율성 점수 계산**
   - 재고 회전율 점수: (재고 회전율 / 평균 재고 회전율) * 0.5 (최대 0.5)
   - 판매 속도 점수: (판매 속도 / 평균 판매 속도) * 0.5 (최대 0.5)
   - 효율성 점수 = 재고 회전율 점수 + 판매 속도 점수 (최대 1.0)

3. **실행 가능한 액션 제안 규칙**
   - 고마진 저효율:
     - "프로모션 진행": 판매 촉진으로 재고 회전율 향상
     - "가격 조정": 소폭 할인으로 수요 증가
     - "마케팅 강화": 노출 증가로 판매 속도 향상
   
   - 저마진 고효율:
     - "가격 인상": 마진률 향상 (수요 감소 고려)
     - "원가 절감": 공급업체 협상, 대량 구매
   
   - 저마진 저효율:
     - "단종 검토": 수익성 낮고 효율도 낮음
     - "대폭 할인": 재고 정리 후 단종
   
   - 고마진 고효율:
     - "유지": 현재 상태 유지 권장
     - "재고 확대": 수요 증가 대비

4. **단순 분류로 끝내지 않는 이유**
   - 분류만으로는 개선 불가
   - 각 상품의 특성에 맞는 구체적 액션 필요
   - 예상 효과를 정량적으로 제시
   - 우선순위를 명확히 제시

5. **액션 우선순위**
   - High: 수익에 즉각적 영향, 실행 난이도 낮음
   - Medium: 중장기 영향, 실행 난이도 중간
   - Low: 장기 영향, 실행 난이도 높음

## Procedure

1. **상품 데이터 로드**
   - seller_id로 상품 목록 조회
   - product_ids가 있으면 해당 상품만, 없으면 전체

2. **마진 계산**
   각 상품에 대해:
   - 마진 = 매출 - 원가
   - 마진률 = (마진 / 매출) * 100

3. **효율성 계산**
   각 상품에 대해:
   - 재고 회전율 = (판매량 / 평균 재고) * 기간
   - 판매 속도 = 판매량 / 기간
   - 효율성 점수 계산

4. **분류 수행**
   - 마진률과 효율성 점수로 분류
   - classification 설정

5. **액션 제안 생성**
   각 상품 분류에 따라:
   - 적절한 액션 타입 선택
   - 구체적 액션 설명 작성
   - 예상 효과 추정
   - 우선순위 결정

6. **요약 생성**
   - 전체 상품 분류 요약
   - 주요 액션 제안 요약
   - 우선순위별 액션 정리

7. **최종 출력**
   - product_classifications, actionable_recommendations 반환
   - summary_text 포함

## Examples

### Example 1: 고마진 저효율 상품

**Input:**
```json
{
  "seller_id": "seller_123",
  "product_ids": ["prod_123"]
}
```

**Output:**
```json
{
  "product_classifications": [
    {
      "product_id": "prod_123",
      "product_name": "프리미엄 노트북",
      "classification": "high_margin_low_efficiency",
      "margin_rate": 45.0,
      "efficiency_score": 0.3,
      "metrics": {
        "revenue": 5000000,
        "profit": 2250000,
        "sales_count": 10,
        "inventory_days": 120
      }
    }
  ],
  "actionable_recommendations": [
    {
      "product_id": "prod_123",
      "action_type": "promotion",
      "action_description": "10% 할인 프로모션 진행하여 판매 촉진",
      "expected_impact": "재고 회전율 2배 증가 예상, 수요 증가로 효율성 향상",
      "priority": "high"
    },
    {
      "product_id": "prod_123",
      "action_type": "marketing",
      "action_description": "마케팅 예산 확대하여 노출 증가",
      "expected_impact": "판매 속도 향상, 재고 보유 일수 감소",
      "priority": "medium"
    }
  ],
  "summary_text": "프리미엄 노트북은 마진률 45%로 높으나 효율성 점수 0.3으로 낮습니다. 재고 보유 일수 120일로 재고 회전이 느립니다. 프로모션 진행(우선순위: 높음)과 마케팅 강화(우선순위: 중간)를 권장합니다."
}
```

### Example 2: 저마진 고효율 상품

**Output:**
```json
{
  "product_classifications": [
    {
      "product_id": "prod_456",
      "product_name": "인기 스마트폰",
      "classification": "low_margin_high_efficiency",
      "margin_rate": 15.0,
      "efficiency_score": 0.85,
      "metrics": {
        "revenue": 10000000,
        "profit": 1500000,
        "sales_count": 200,
        "inventory_days": 15
      }
    }
  ],
  "actionable_recommendations": [
    {
      "product_id": "prod_456",
      "action_type": "price_adjustment",
      "action_description": "가격 5% 인상 검토 (수요 감소 고려)",
      "expected_impact": "마진률 20%로 향상, 수익 증가 예상",
      "priority": "high"
    },
    {
      "product_id": "prod_456",
      "action_type": "cost_reduction",
      "action_description": "공급업체 협상 또는 대량 구매로 원가 절감",
      "expected_impact": "마진률 향상, 수익성 개선",
      "priority": "medium"
    }
  ],
  "summary_text": "인기 스마트폰은 효율성 점수 0.85로 높으나 마진률 15%로 낮습니다. 판매 속도는 빠르나 수익성이 낮습니다. 가격 인상 검토(우선순위: 높음)와 원가 절감(우선순위: 중간)을 권장합니다."
}
```

### Example 3: 저마진 저효율 상품

**Output:**
```json
{
  "product_classifications": [
    {
      "product_id": "prod_789",
      "product_name": "구형 태블릿",
      "classification": "low_efficiency",
      "margin_rate": 10.0,
      "efficiency_score": 0.2,
      "metrics": {
        "revenue": 500000,
        "profit": 50000,
        "sales_count": 2,
        "inventory_days": 180
      }
    }
  ],
  "actionable_recommendations": [
    {
      "product_id": "prod_789",
      "action_type": "discontinue",
      "action_description": "단종 검토: 수익성과 효율 모두 낮음",
      "expected_impact": "재고 정리 후 신제품으로 교체, 전체 수익성 향상",
      "priority": "high"
    },
    {
      "product_id": "prod_789",
      "action_type": "promotion",
      "action_description": "대폭 할인(30% 이상)으로 재고 정리",
      "expected_impact": "재고 회전율 증가, 손실 최소화",
      "priority": "medium"
    }
  ],
  "summary_text": "구형 태블릿은 마진률 10%, 효율성 점수 0.2로 모두 낮습니다. 재고 보유 일수 180일로 재고 회전이 매우 느립니다. 단종 검토(우선순위: 높음) 또는 대폭 할인으로 재고 정리(우선순위: 중간)를 권장합니다."
}
```

## Failure Tags

- `SELLER_NOT_FOUND`: 판매자 정보를 찾을 수 없음
- `PRODUCT_NOT_FOUND`: 상품 정보를 찾을 수 없음
- `INSUFFICIENT_DATA`: 분석에 필요한 데이터 부족
- `CALCULATION_ERROR`: 계산 오류
- `INVALID_METRICS`: 효율성 지표가 유효하지 않음

---

