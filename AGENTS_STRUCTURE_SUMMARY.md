# Agents 폴더 구조 정리 완료

## 📁 변경된 디렉토리 트리

```
agents/
├── specs/                          # SSoT: 24개 에이전트 스펙 파일 (기존 유지)
│   ├── 00_orchestrator.md
│   ├── 01_policy_safety.md
│   ├── ... (22개 더)
│   └── 43_finetune_packager.md
├── schemas/                        # ✨ 새로 생성
│   ├── action_schema.json         # Tool/action 호출 스키마
│   ├── response_schema.json       # AI 응답 포맷 스키마
│   └── intent_schema.json         # Intent taxonomy 및 agent mapping
├── prompts/                       # ✨ 새로 생성
│   ├── agent_md_generator.md      # 에이전트 스펙 생성 메타 프롬프트
│   ├── jsonl_generator.md         # Fine-tuning 데이터 생성 프롬프트
│   ├── action_schema_gen.md        # Action 스키마 업데이트 프롬프트
│   └── eval_prompt.md             # 평가 프롬프트
├── datasets/                       # ✨ 새로 생성 (gitignored)
│   ├── raw/                       # 원시 대화 데이터
│   ├── silver/                    # 처리된 데이터 (검토 필요)
│   ├── gold/                      # 고품질 데이터 (학습 준비)
│   └── eval/                      # 평가 데이터셋
├── models/                         # ✨ 새로 생성 (gitignored)
│   ├── base/                      # 베이스 모델
│   ├── finetuned/                 # Fine-tuned 모델
│   ├── adapters/                  # LoRA/Adapter 가중치
│   └── README.md                  # 모델 저장 규칙
├── docs/                           # ✨ 새로 생성
│   ├── AI_RUNTIME_IMPLEMENTATION.md # 런타임 구현 상세 (이동됨)
│   └── AI_RUNTIME_TESTING.md      # 테스트 가이드 (이동됨)
└── README.md                       # ✏️ 업데이트됨

server/src/ai_runtime/
├── mdLoader.js                     # ✏️ 경로 해결 로직 개선
├── schemas.js                      # ✏️ JSON 스키마와 일치하도록 업데이트 + guard 추가
└── ... (기타 파일들)

.gitignore                          # ✏️ 모델/데이터셋 파일 추가
```

## ✅ 수정/생성된 파일 목록

### 새로 생성된 파일
- [x] `agents/schemas/action_schema.json` - Tool/action 호출 스키마
- [x] `agents/schemas/response_schema.json` - AI 응답 포맷 스키마
- [x] `agents/schemas/intent_schema.json` - Intent taxonomy 및 agent mapping
- [x] `agents/prompts/agent_md_generator.md` - 에이전트 스펙 생성 메타 프롬프트
- [x] `agents/prompts/jsonl_generator.md` - Fine-tuning 데이터 생성 프롬프트
- [x] `agents/prompts/action_schema_gen.md` - Action 스키마 업데이트 프롬프트
- [x] `agents/prompts/eval_prompt.md` - 평가 프롬프트
- [x] `agents/models/README.md` - 모델 저장 규칙
- [x] `agents/datasets/` (디렉토리 구조)
- [x] `agents/models/` (디렉토리 구조)

### 수정된 파일
- [x] `agents/README.md` - SSoT 명시, Runtime 경로 링크, 구조 업데이트
- [x] `server/src/ai_runtime/mdLoader.js` - 안전한 경로 해결 로직 추가
- [x] `server/src/ai_runtime/schemas.js` - JSON 스키마와 일치하도록 업데이트, guard 함수 추가
- [x] `.gitignore` - 모델/데이터셋 파일 패턴 추가
- [x] `agents/docs/AI_RUNTIME_IMPLEMENTATION.md` - 루트에서 이동
- [x] `agents/docs/AI_RUNTIME_TESTING.md` - 루트에서 이동

## 🔧 주요 변경 사항

### 1. 폴더 구조 확장
- `agents/schemas/` - JSON 스키마 파일 (운영 기준)
- `agents/prompts/` - 메타 프롬프트 보관
- `agents/datasets/` - Fine-tuning 데이터셋 (gitignored)
- `agents/models/` - AI 모델 파일 (gitignored)
- `agents/docs/` - 문서 통합

### 2. 스키마 일관성 보장
- JSON 스키마 (`agents/schemas/*.json`) = 운영 기준
- Zod 스키마 (`server/src/ai_runtime/schemas.js`) = 런타임 검증
- Guard 함수로 일관성 검증 (개발 환경)

### 3. 경로 안정성
- `mdLoader.js`가 `process.cwd()` 기준으로 안전하게 경로 해결
- 여러 실행 컨텍스트에서도 동작 보장

### 4. Git 관리
- 모델 파일 (`.safetensors`, `.gguf`, `.bin` 등) gitignored
- 데이터셋 파일 gitignored
- 문서 파일은 추적 유지

## 🚀 다음 해야할 일 TOP 5

### 1. LLM 통합 (우선순위: 높음)
- `server/src/ai_runtime/orchestrator.js`에 OpenAI/LLM API 연결
- Agent 스펙 기반 시스템 프롬프트 생성
- LLM 응답을 표준 포맷으로 파싱
- **예상 시간**: 4-6시간

### 2. Schema Validation 테스트 (우선순위: 높음)
- JSON 스키마와 Zod 스키마 일치성 검증 테스트 작성
- Guard 함수 동작 확인
- 스키마 불일치 시 에러 발생 확인
- **예상 시간**: 2-3시간

### 3. Intent Router 개선 (우선순위: 중간)
- 키워드 기반 → ML 모델 기반으로 전환
- Confidence 점수 계산 로직 구현
- Multi-intent 시나리오 처리
- **예상 시간**: 6-8시간

### 4. UI 컴포넌트 개발 (우선순위: 중간)
- `BRIEFING_WITH_PRODUCTS` 응답 타입용 React 컴포넌트
- Briefing 카드 컴포넌트
- 상품 카드 가로 스크롤 리스트
- 클릭 핸들러 및 네비게이션
- **예상 시간**: 4-6시간

### 5. Fine-tuning 파이프라인 구축 (우선순위: 낮음)
- `agents/datasets/raw/` 데이터 수집
- `40_data_curator.md` 스펙 기반 데이터 큐레이션
- `43_finetune_packager.md` 스펙 기반 패키징
- Gold 데이터셋 생성 프로세스
- **예상 시간**: 8-12시간

## 📝 참고 사항

- 모든 응답은 **English**로 출력 (요구사항)
- MongoDB **Read-only** + user/seller scope 강제
- 모든 상태 변경은 **Tool Call**로만 수행
- `agents/specs/`가 **Single Source of Truth**
- Runtime은 `/server/src/ai_runtime/`에 위치

---
**작업 완료 시간**: 2024-12-30
