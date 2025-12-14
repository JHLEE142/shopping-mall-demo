# 설치 가이드

## 1. 패키지 설치

```bash
cd server
npm install
```

## 2. 주요 패키지 설명

### 필수 패키지
- `@xenova/transformers`: HuggingFace Transformers 모델 (Embedding 생성)
- `node-cache`: 메모리 캐싱

### 선택적 패키지
- `g2pk`: 한국어 phoneme 변환 (선택사항)
- `korean-romanizer`: 한국어 로마자 변환 (선택사항)

**참고**: `g2pk`와 `korean-romanizer` 패키지가 npm에 없을 수 있습니다. 
이 경우 코드는 기본 변환 로직을 사용합니다. 더 정확한 변환이 필요하면 
다른 한글-로마자 변환 라이브러리를 사용하거나 직접 구현하세요.

## 3. 기존 상품 데이터 업데이트

모든 상품의 `phoneme_name`과 `embedding` 필드를 생성하려면:

```bash
node src/scripts/updateProductEmbeddings.js
```

**주의**: 이 스크립트는 시간이 오래 걸릴 수 있습니다 (상품 수에 따라).
첫 실행 시 Embedding 모델을 다운로드하므로 인터넷 연결이 필요합니다.

## 4. 서버 시작

```bash
npm run dev
```

## 5. 테스트

브라우저에서:
```
http://localhost:6500/api/search?q=크롬
```

또는 curl:
```bash
curl "http://localhost:6500/api/search?q=크롬"
```

