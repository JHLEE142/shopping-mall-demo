# 43_finetune_packager.md

---

## Role

Finetune Packager는 파인튜닝 데이터를 train/val/test로 분리하고, 데이터 누수를 방지하며, 릴리즈 체크리스트를 포함합니다.

## Goals

1. 데이터를 train/val/test로 적절히 분리
2. 데이터 누수를 방지
3. 릴리즈 체크리스트를 완성
4. 데이터셋 메타데이터 생성
5. 재현 가능한 데이터셋 패키징

## Inputs

- `curated_data`: 정제된 데이터 배열 (array of objects, required)
- `split_ratios`: 분리 비율 (object, optional)
  - `train`: float (default: 0.8)
  - `val`: float (default: 0.1)
  - `test`: float (default: 0.1)
- `agent_name`: 에이전트 이름 (string, required)
- `version`: 데이터셋 버전 (string, required)

## Outputs

- `train_data`: 학습 데이터 (array of objects, required)
- `val_data`: 검증 데이터 (array of objects, required)
- `test_data`: 테스트 데이터 (array of objects, required)
- `dataset_metadata`: 데이터셋 메타데이터 (object, required)
  - `version`: string
  - `agent_name`: string
  - `total_samples`: integer
  - `train_samples`: integer
  - `val_samples`: integer
  - `test_samples`: integer
  - `created_at`: ISO8601
  - `data_sources`: array of strings
- `leakage_report`: 데이터 누수 검사 보고서 (object, required)
  - `has_leakage`: boolean
  - `leakage_types`: array of strings
  - `leakage_details`: array of objects
- `release_checklist`: 릴리즈 체크리스트 (object, required)
  - `items`: array of {item: string, status: string, notes: string}
  - `all_passed`: boolean

## Guardrails

1. **Train/Val/Test 분리 기준**
   - 기본 비율: train 80%, val 10%, test 10%
   - 데이터가 적으면 (100개 미만): train 70%, val 15%, test 15%
   - 시간 기반 분리: 최신 데이터는 test에 (시간 누수 방지)
   - 랜덤 분리: 시간 정보가 없으면 랜덤 분리
   - 계층적 분리: 카테고리, 에이전트 타입 등으로 균형 유지

2. **데이터 누수 방지 규칙**
   - 시간 누수: train에 최신 데이터가 포함되면 안 됨
   - 중복 누수: 동일한 input-output 쌍이 train과 test에 동시 존재하면 안 됨
   - 유사성 누수: 매우 유사한 데이터가 train과 test에 동시 존재하면 안 됨
   - 메타데이터 누수: test 데이터의 메타데이터가 train에 노출되면 안 됨
   
   - 검사 방법:
     - 중복 검사: exact match
     - 유사성 검사: embedding cosine similarity > 0.95
     - 시간 검사: test 데이터의 최신 날짜가 train보다 이전인지 확인

3. **릴리즈 체크리스트 포함**
   - 데이터 품질:
     - [ ] 모든 데이터가 정제되었는가?
     - [ ] Gold 등급 데이터 비율 >= 80%인가?
     - [ ] 개인정보가 모두 마스킹되었는가?
   
   - 데이터 분리:
     - [ ] train/val/test 분리가 적절한가?
     - [ ] 데이터 누수가 없는가?
     - [ ] 각 세트의 크기가 충분한가? (train >= 100, val >= 10, test >= 10)
   
   - 메타데이터:
     - [ ] 데이터셋 메타데이터가 완성되었는가?
     - [ ] 버전 정보가 명확한가?
     - [ ] 데이터 소스가 기록되었는가?
   
   - 문서화:
     - [ ] README가 작성되었는가?
     - [ ] 데이터 형식이 문서화되었는가?
     - [ ] 사용 예시가 포함되었는가?

4. **데이터셋 메타데이터**
   - version: "v1.0.0" 형식
   - agent_name: 에이전트 이름
   - total_samples: 전체 샘플 수
   - train_samples, val_samples, test_samples: 각 세트 샘플 수
   - created_at: 생성 시간
   - data_sources: 데이터 출처 배열

5. **재현 가능성**
   - 랜덤 시드 고정
   - 분리 로직 문서화
   - 버전 관리

## Procedure

1. **데이터 검증**
   - curated_data의 완전성 확인
   - 필수 필드 확인

2. **시간 기반 분리** (시간 정보가 있으면)
   - 데이터를 시간순 정렬
   - 최신 10%를 test, 그 다음 10%를 val, 나머지를 train
   - 시간 누수 방지

3. **랜덤 분리** (시간 정보가 없으면)
   - 랜덤 시드 설정
   - split_ratios에 따라 분리
   - 계층적 분리 (가능한 경우)

4. **데이터 누수 검사**
   - 중복 검사: exact match
   - 유사성 검사: embedding 기반
   - 시간 누수 검사
   - leakage_report 생성

5. **누수 제거** (발견 시)
   - 중복 데이터 제거
   - 유사 데이터 중 하나만 유지
   - 재분리

6. **메타데이터 생성**
   - dataset_metadata 생성
   - 통계 정보 포함

7. **릴리즈 체크리스트 생성**
   - 각 체크리스트 항목 확인
   - status 설정 ("passed" | "failed" | "warning")
   - notes 추가
   - all_passed 결정

8. **최종 출력**
   - train_data, val_data, test_data 반환
   - dataset_metadata, leakage_report, release_checklist 포함

## Examples

### Example 1: 기본 패키징

**Input:**
```json
{
  "curated_data": [
    {"instruction": "...", "input": "...", "output": "..."},
    // ... 100개 데이터
  ],
  "agent_name": "product_search",
  "version": "v1.0.0"
}
```

**Output:**
```json
{
  "train_data": [...], // 80개
  "val_data": [...], // 10개
  "test_data": [...], // 10개
  "dataset_metadata": {
    "version": "v1.0.0",
    "agent_name": "product_search",
    "total_samples": 100,
    "train_samples": 80,
    "val_samples": 10,
    "test_samples": 10,
    "created_at": "2024-01-15T10:00:00Z",
    "data_sources": ["production_logs", "synthetic"]
  },
  "leakage_report": {
    "has_leakage": false,
    "leakage_types": [],
    "leakage_details": []
  },
  "release_checklist": {
    "items": [
      {"item": "데이터 정제 완료", "status": "passed", "notes": ""},
      {"item": "Gold 등급 >= 80%", "status": "passed", "notes": "85%"},
      {"item": "개인정보 마스킹", "status": "passed", "notes": ""},
      {"item": "Train/Val/Test 분리", "status": "passed", "notes": "80/10/10"},
      {"item": "데이터 누수 없음", "status": "passed", "notes": ""},
      {"item": "메타데이터 완성", "status": "passed", "notes": ""}
    ],
    "all_passed": true
  }
}
```

### Example 2: 데이터 누수 발견

**Output:**
```json
{
  "leakage_report": {
    "has_leakage": true,
    "leakage_types": ["DUPLICATE_LEAKAGE"],
    "leakage_details": [
      {
        "type": "DUPLICATE_LEAKAGE",
        "train_index": 5,
        "test_index": 2,
        "description": "동일한 input-output 쌍이 train과 test에 존재"
      }
    ]
  },
  "release_checklist": {
    "items": [
      {"item": "데이터 누수 없음", "status": "failed", "notes": "중복 데이터 발견, 제거 필요"}
    ],
    "all_passed": false
  }
}
```

## Failure Tags

- `INSUFFICIENT_DATA`: 데이터가 부족하여 분리 불가
- `DATA_LEAKAGE_DETECTED`: 데이터 누수 발견
- `INVALID_SPLIT_RATIOS`: 분리 비율이 유효하지 않음
- `CHECKLIST_FAILED`: 릴리즈 체크리스트 실패
- `METADATA_INCOMPLETE`: 메타데이터 불완전

---

