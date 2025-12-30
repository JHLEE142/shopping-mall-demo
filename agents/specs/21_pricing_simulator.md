# 21_pricing_simulator.md

---

## Role

Pricing Simulator는 가격 변경 시 수익 변화를 시뮬레이션합니다. 시나리오 비교 구조를 적용하고, 기준선(baseline)을 명시하며, 잘못된 수학적 추론을 방지합니다.

## Goals

1. 가격 변경 시나리오를 정확히 시뮬레이션
2. 기준선(baseline)과 변경 시나리오를 명확히 비교
3. 수익 변화를 정확히 계산
4. 잘못된 수학적 추론 방지
5. 시나리오별 결과를 사용자에게 이해하기 쉽게 제시

## Inputs

- `product_id`: 상품 ID (string, required)
- `current_price`: 현재 가격 (number, required)
- `scenarios`: 가격 변경 시나리오 배열 (array of objects, required)
  - `new_price`: number
  - `expected_demand_change`: number (예상 수요 변화율, %, optional)
- `product_info`: 상품 정보 (object, optional)
  - `cost`: number (원가)
  - `current_demand`: number (현재 수요, 판매량)
  - `price_elasticity`: number (가격 탄력성, optional)

## Outputs

- `baseline`: 기준선 정보 (object, required)
  - `price`: number
  - `demand`: number (수요)
  - `revenue`: number (매출)
  - `cost`: number (원가)
  - `profit`: number (수익)
  - `margin_rate`: number (마진률, %)
- `scenario_results`: 시나리오별 결과 배열 (array of objects, required)
  - `scenario_id`: string
  - `new_price`: number
  - `expected_demand`: number (예상 수요)
  - `expected_revenue`: number (예상 매출)
  - `expected_profit`: number (예상 수익)
  - `revenue_change`: number (매출 변화)
  - `profit_change`: number (수익 변화)
  - `margin_rate`: number (마진률, %)
- `best_scenario`: 최적 시나리오 ID (string, optional)
- `simulation_summary`: 시뮬레이션 요약 (string, required)
- `warnings`: 경고 사항 (array of strings, optional)

## Guardrails

1. **시나리오 비교 구조**
   - 항상 기준선(baseline) 먼저 제시
   - 각 시나리오를 기준선과 비교
   - 비교 항목: 가격, 수요, 매출, 수익, 마진률
   - 변화율을 명확히 표시 (증가/감소, %)

2. **기준선(baseline) 명시 규칙**
   - 현재 가격과 현재 수요를 기준선으로 설정
   - 기준선의 매출, 수익, 마진률 계산
   - 모든 시나리오는 기준선과 비교

3. **잘못된 수학적 추론 방지 원칙**
   - 가격 증가 ≠ 수익 증가 (수요 감소 고려)
   - 매출 증가 ≠ 수익 증가 (원가 고려)
   - 가격 탄력성 고려: 가격 10% 증가 시 수요 감소율 계산
   - 기본 가격 탄력성: -1.5 (가격 10% 증가 시 수요 15% 감소 가정, 없으면)

4. **수요 변화 계산**
   - expected_demand_change가 있으면 사용
   - 없으면 price_elasticity 기반 계산:
     - demand_change = price_change * price_elasticity
     - 예: 가격 10% 증가, 탄력성 -1.5 → 수요 15% 감소
   - 수요는 0 이상으로 제한

5. **수익 계산 정확성**
   - 매출 = 가격 × 수요
   - 수익 = 매출 - (원가 × 수요)
   - 마진률 = (수익 / 매출) × 100
   - 원가는 변하지 않는다고 가정 (단기 시뮬레이션)

6. **최적 시나리오 선택**
   - 수익이 가장 높은 시나리오 선택
   - 동일 수익 시 마진률이 높은 시나리오 선택
   - 수익이 기준선보다 낮으면 best_scenario = null

7. **경고 생성**
   - 가격이 원가보다 낮으면 경고
   - 수요가 0이 되면 경고
   - 수익이 기준선보다 크게 감소하면 경고

## Procedure

1. **기준선 계산**
   - current_price, current_demand로 기준선 설정
   - baseline의 revenue, profit, margin_rate 계산

2. **시나리오별 계산**
   각 시나리오에 대해:
   a. **수요 계산**
      - expected_demand_change가 있으면 사용
      - 없으면 price_elasticity 기반 계산
      - 수요 = current_demand × (1 + demand_change/100)
      - 수요는 0 이상으로 제한
   
   b. **매출 계산**
      - expected_revenue = new_price × expected_demand
   
   c. **수익 계산**
      - expected_profit = expected_revenue - (cost × expected_demand)
   
   d. **마진률 계산**
      - margin_rate = (expected_profit / expected_revenue) × 100
   
   e. **변화 계산**
      - revenue_change = expected_revenue - baseline.revenue
      - profit_change = expected_profit - baseline.profit

3. **최적 시나리오 선택**
   - 수익이 가장 높은 시나리오 선택
   - best_scenario 설정

4. **경고 생성**
   - 가격 < 원가: "가격이 원가보다 낮습니다"
   - 수요 = 0: "수요가 0이 되어 판매 불가능합니다"
   - 수익 감소 > 20%: "수익이 기준선 대비 20% 이상 감소합니다"

5. **시뮬레이션 요약 생성**
   - 기준선 정보 요약
   - 각 시나리오 결과 요약
   - 최적 시나리오 언급 (있는 경우)
   - 주요 인사이트 제시

6. **최종 출력**
   - baseline, scenario_results 반환
   - best_scenario, simulation_summary, warnings 포함

## Examples

### Example 1: 기본 시뮬레이션

**Input:**
```json
{
  "product_id": "prod_123",
  "current_price": 100000,
  "current_demand": 100,
  "cost": 60000,
  "scenarios": [
    {"new_price": 110000},
    {"new_price": 90000}
  ]
}
```

**Output:**
```json
{
  "baseline": {
    "price": 100000,
    "demand": 100,
    "revenue": 10000000,
    "cost": 6000000,
    "profit": 4000000,
    "margin_rate": 40.0
  },
  "scenario_results": [
    {
      "scenario_id": "scenario_1",
      "new_price": 110000,
      "expected_demand": 85,
      "expected_revenue": 9350000,
      "expected_profit": 3650000,
      "revenue_change": -650000,
      "profit_change": -350000,
      "margin_rate": 39.0
    },
    {
      "scenario_id": "scenario_2",
      "new_price": 90000,
      "expected_demand": 115,
      "expected_revenue": 10350000,
      "expected_profit": 3450000,
      "revenue_change": 350000,
      "profit_change": -550000,
      "margin_rate": 33.3
    }
  ],
  "best_scenario": null,
  "simulation_summary": "기준선: 가격 10만원, 수요 100개, 수익 400만원(마진률 40%). 시나리오 1(가격 11만원): 수익 365만원(-35만원, -8.75%). 시나리오 2(가격 9만원): 수익 345만원(-55만원, -13.75%). 두 시나리오 모두 기준선보다 수익이 감소합니다.",
  "warnings": [
    "시나리오 2는 수익이 기준선 대비 13.75% 감소합니다."
  ]
}
```

### Example 2: 수요 변화율 명시

**Input:**
```json
{
  "product_id": "prod_123",
  "current_price": 100000,
  "current_demand": 100,
  "cost": 60000,
  "scenarios": [
    {"new_price": 110000, "expected_demand_change": -10},
    {"new_price": 90000, "expected_demand_change": 20}
  ]
}
```

**Output:**
```json
{
  "baseline": {...},
  "scenario_results": [
    {
      "scenario_id": "scenario_1",
      "new_price": 110000,
      "expected_demand": 90,
      "expected_revenue": 9900000,
      "expected_profit": 4500000,
      "revenue_change": -100000,
      "profit_change": 500000,
      "margin_rate": 45.5
    },
    {
      "scenario_id": "scenario_2",
      "new_price": 90000,
      "expected_demand": 120,
      "expected_revenue": 10800000,
      "expected_profit": 3600000,
      "revenue_change": 800000,
      "profit_change": -400000,
      "margin_rate": 33.3
    }
  ],
  "best_scenario": "scenario_1",
  "simulation_summary": "기준선: 가격 10만원, 수요 100개, 수익 400만원. 시나리오 1(가격 11만원, 수요 -10%): 수익 450만원(+50만원, +12.5%) - 최적. 시나리오 2(가격 9만원, 수요 +20%): 수익 360만원(-40만원, -10%)."
}
```

### Example 3: 가격이 원가보다 낮은 경우

**Input:**
```json
{
  "product_id": "prod_123",
  "current_price": 100000,
  "current_demand": 100,
  "cost": 60000,
  "scenarios": [
    {"new_price": 50000}
  ]
}
```

**Output:**
```json
{
  "baseline": {...},
  "scenario_results": [
    {
      "scenario_id": "scenario_1",
      "new_price": 50000,
      "expected_demand": 175,
      "expected_revenue": 8750000,
      "expected_profit": -1750000,
      "revenue_change": -1250000,
      "profit_change": -5750000,
      "margin_rate": -20.0
    }
  ],
  "best_scenario": null,
  "simulation_summary": "시나리오 1(가격 5만원): 가격이 원가(6만원)보다 낮아 수익이 -175만원으로 손실이 발생합니다.",
  "warnings": [
    "가격이 원가보다 낮습니다. 손실이 발생합니다."
  ]
}
```

## Failure Tags

- `PRODUCT_NOT_FOUND`: 상품 정보를 찾을 수 없음
- `INVALID_PRICE`: 가격이 유효하지 않음 (0 이하)
- `INVALID_DEMAND`: 수요가 유효하지 않음
- `COST_NOT_PROVIDED`: 원가 정보 없음
- `CALCULATION_ERROR`: 계산 오류
- `NEGATIVE_PROFIT`: 수익이 음수 (손실)

---

