# MongoDB Atlas Search 설정 가이드

이 가이드는 MongoDB Atlas Search를 설정하여 쇼핑몰 검색 기능을 향상시키는 방법을 설명합니다.

## 1. Atlas Search Index 생성

### Atlas 콘솔에서 인덱스 생성

1. **MongoDB Atlas 콘솔**에 로그인
2. 프로젝트 선택 → 클러스터 선택
3. 왼쪽 메뉴에서 **"Search"** 클릭
4. **"Create Search Index"** 버튼 클릭
5. **"JSON Editor"** 선택
6. 다음 JSON 설정을 입력:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": {
        "type": "autocomplete",
        "tokenization": "edgeGram",
        "minGrams": 2,
        "maxGrams": 15,
        "foldDiacritics": false
      },
      "description": {
        "type": "string",
        "analyzer": "lucene.korean",
        "searchAnalyzer": "lucene.korean"
      },
      "category": {
        "type": "string",
        "analyzer": "lucene.korean",
        "searchAnalyzer": "lucene.korean"
      },
      "categoryMain": {
        "type": "string"
      },
      "categoryMid": {
        "type": "string"
      },
      "categorySub": {
        "type": "string"
      },
      "price": {
        "type": "number"
      },
      "priceSale": {
        "type": "number"
      }
    }
  }
}
```

7. **Database**: `shopping-mall-demo` (또는 사용 중인 데이터베이스 이름)
8. **Collection**: `products`
9. **Index Name**: `product-search-index` (또는 원하는 이름)
10. **"Next"** → **"Create Search Index"** 클릭

### 인덱스 생성 완료 대기

- 인덱스 생성에는 몇 분이 소요될 수 있습니다
- 상태가 **"Active"**가 되면 사용 가능합니다

## 2. 환경 변수 설정

`.env` 파일에 다음 변수를 추가:

```env
# MongoDB Atlas Search Index 이름
ATLAS_SEARCH_INDEX_NAME=product-search-index
```

## 3. 검색 기능 확인

서버를 재시작한 후, 다음을 테스트하세요:

1. **AI 쇼핑 비서**에서 상품 검색
2. **홈페이지 검색** 기능 사용
3. **관리자 대시보드**에서 상품 검색

## 4. 검색 기능 개선 사항

Atlas Search를 사용하면:

- ✅ **오타 허용**: 최대 2글자 오타까지 허용
- ✅ **부분 일치**: 검색어의 일부만 포함되어도 검색
- ✅ **가중치**: 상품명 > 카테고리 > 설명 순으로 가중치 적용
- ✅ **자동완성**: 상품명 자동완성 지원
- ✅ **한글 분석**: 한국어 형태소 분석 지원

## 5. 문제 해결

### 인덱스가 없다는 오류가 발생하는 경우

1. Atlas 콘솔에서 인덱스가 생성되었는지 확인
2. 인덱스 상태가 "Active"인지 확인
3. 데이터베이스 이름과 컬렉션 이름이 올바른지 확인
4. `.env` 파일의 `ATLAS_SEARCH_INDEX_NAME` 값 확인

### 검색 결과가 없는 경우

1. 인덱스가 제대로 생성되었는지 확인
2. 상품 데이터가 인덱싱되었는지 확인 (몇 분 소요될 수 있음)
3. 검색 쿼리가 올바른지 확인

## 6. 고급 설정

### 더 정교한 검색을 원하는 경우

`server/src/utils/atlasSearch.js` 파일에서 다음을 조정할 수 있습니다:

- **fuzzy.maxEdits**: 오타 허용 범위 (기본값: 2)
- **fuzzy.prefixLength**: 오타 허용 시작 길이 (기본값: 2)
- **boost 값**: 필드별 가중치 조정

### 필터 추가

가격 범위, 카테고리 등으로 필터링하려면 `atlasSearch` 함수의 `options` 파라미터를 사용하세요.

