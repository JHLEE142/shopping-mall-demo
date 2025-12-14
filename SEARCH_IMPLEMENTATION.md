# 🔍 Hybrid 검색 기능 구현 가이드

## 📋 개요

한국어 검색어로 영어 상품명까지 매칭되는 고급 검색 기능을 구현했습니다.

## 🚀 설치 방법

### 1. 필요한 패키지 설치

```bash
cd server
npm install
```

설치되는 주요 패키지:
- `g2pk`: 한국어를 phoneme으로 변환
- `@xenova/transformers`: Embedding 모델 (HuggingFace)
- `node-cache`: 메모리 캐싱

### 2. 기존 상품 데이터 업데이트

기존 상품들의 `phoneme_name`과 `embedding` 필드를 생성하려면:

```bash
node src/scripts/updateProductEmbeddings.js
```

이 스크립트는:
- 모든 상품의 이름을 phoneme으로 변환
- 모든 상품의 이름을 embedding 벡터로 변환
- MongoDB에 저장

## 📁 변경된 파일 목록

### 백엔드

1. **`server/package.json`**
   - 새로운 패키지 추가

2. **`server/src/models/product.js`**
   - `phoneme_name` 필드 추가
   - `embedding` 필드 추가

3. **`server/src/utils/phonemeConverter.js`** (신규)
   - 한국어 → phoneme 변환
   - 영어 → phoneme 변환
   - 문자열 유사도 계산

4. **`server/src/utils/embeddingService.js`** (신규)
   - 텍스트 → embedding 벡터 변환
   - Cosine similarity 계산

5. **`server/src/utils/cacheService.js`** (신규)
   - 메모리 캐싱 서비스

6. **`server/src/controllers/searchController.js`** (신규)
   - Hybrid 검색 로직
   - Phoneme 검색
   - Embedding 검색

7. **`server/src/routes/search.js`** (신규)
   - 검색 API 엔드포인트

8. **`server/src/routes/index.js`**
   - 검색 라우터 추가

9. **`server/src/scripts/updateProductEmbeddings.js`** (신규)
   - 기존 상품 데이터 업데이트 스크립트

### 프론트엔드

1. **`client/src/services/productService.js`**
   - `searchProducts` 함수 추가

2. **`client/src/components/HomeHero.jsx`**
   - Hybrid 검색 API 연동

## 🔧 API 사용법

### 검색 API

```
GET /api/search?q={검색어}&limit={결과수}&phonemeWeight={가중치}&embeddingWeight={가중치}
```

#### 파라미터

- `q` (필수): 검색 쿼리
- `limit` (선택): 반환할 결과 수 (기본값: 20)
- `phonemeWeight` (선택): Phoneme 검색 가중치 (기본값: 0.4)
- `embeddingWeight` (선택): Embedding 검색 가중치 (기본값: 0.6)

#### 예제

```bash
# 기본 검색
curl "http://localhost:6500/api/search?q=크롬"

# 결과 수 제한
curl "http://localhost:6500/api/search?q=크롬&limit=10"

# 가중치 조정
curl "http://localhost:6500/api/search?q=크롬&phonemeWeight=0.6&embeddingWeight=0.4"
```

#### 응답 형식

```json
{
  "query": "크롬",
  "results": [
    {
      "_id": "...",
      "name": "Chrome Hearts 멀티십자 오버핏 후드 집업",
      "price": 1000,
      "category": "의류",
      "phoneme_name": "keurom heoseu",
      "embedding": [0.123, 0.456, ...],
      ...
    }
  ],
  "total": 5,
  "cached": false
}
```

## 🎯 작동 원리

### 1. Phoneme 기반 검색

- 한국어 검색어를 phoneme으로 변환 (예: "크롬" → "keurom")
- 영어 상품명도 phoneme으로 변환하여 저장
- 문자열 유사도로 매칭

### 2. Embedding 기반 검색

- 검색어와 상품명을 embedding 벡터로 변환
- Cosine similarity로 의미적 유사도 계산
- 한국어와 영어 모두 지원 (multilingual 모델)

### 3. Hybrid 검색

- Phoneme 검색 점수 × 가중치 + Embedding 검색 점수 × 가중치
- 두 결과를 통합하여 최종 점수 계산
- 상위 N개 상품 반환

## 💾 데이터베이스 스키마

### Product Collection

```javascript
{
  _id: ObjectId,
  name: String,              // 원본 상품명
  phoneme_name: String,      // Phoneme 변환된 이름 (인덱스)
  embedding: [Number],       // Embedding 벡터
  price: Number,
  category: String,
  description: String,
  ...
}
```

## ⚡ 성능 최적화

### 캐싱 전략

1. **검색 결과 캐싱**: 30분 TTL
2. **Embedding 캐싱**: 1시간 TTL
3. **Phoneme 변환 캐싱**: 1시간 TTL

### 모델 로딩

- Embedding 모델은 첫 사용 시 로드 후 메모리에 캐싱
- Quantized 모델 사용으로 메모리 사용량 감소

## 🔍 검색 예제

### 한국어로 영어 상품 검색

```
검색어: "크롬"
→ "Chrome Hearts" 상품 매칭
→ "Chrome" 관련 상품 매칭
```

### 의미 기반 검색

```
검색어: "운동화"
→ "Sneakers" 상품 매칭
→ "Athletic Shoes" 상품 매칭
```

## 🐛 문제 해결

### Embedding 모델 로딩 실패

- 인터넷 연결 확인 (첫 로드 시 모델 다운로드)
- 디스크 공간 확인

### 검색 결과가 없음

- 상품 데이터에 `phoneme_name`과 `embedding` 필드가 있는지 확인
- `updateProductEmbeddings.js` 스크립트 실행

### 성능이 느림

- 캐싱이 작동하는지 확인
- `limit` 파라미터로 결과 수 제한

## 📝 추가 개선 사항

1. **Redis 캐싱**: 메모리 캐시 대신 Redis 사용
2. **벡터 DB**: MongoDB 대신 전문 벡터 DB (Pinecone, Weaviate 등) 사용
3. **실시간 업데이트**: 새 상품 등록 시 자동으로 phoneme/embedding 생성
4. **검색 히스토리**: 사용자 검색 기록 저장 및 분석

