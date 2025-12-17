# 카테고리 대량 저장 가이드

## API 엔드포인트

### 1. ">" 구분자 문자열 형식 (권장)

**엔드포인트:** `POST /api/categories/bulk-string`  
**인증:** 관리자 권한 필요  
**Content-Type:** `application/json`

#### 요청 형식

```json
{
  "items": [
    "주방용품 > 조리도구 > 건지기/망",
    "주방용품 > 조리도구 > 냄비/솥",
    "주방용품 > 식기 > 접시",
    "의류 > 상의 > 티셔츠",
    "의류 > 하의 > 청바지"
  ]
}
```

또는 줄바꿈으로 구분된 단일 문자열:

```json
{
  "items": "주방용품 > 조리도구 > 건지기/망\n주방용품 > 조리도구 > 냄비/솥\n의류 > 상의 > 티셔츠"
}
```

#### 응답 형식

```json
{
  "success": true,
  "message": "대량 카테고리 저장 완료",
  "data": {
    "summary": {
      "total": 5,
      "parsed": 5,
      "created": 15,
      "skipped": 0,
      "errors": 0
    },
    "details": {
      "created": [
        { "level": 1, "name": "주방용품", "code": "주방용품" },
        { "level": 2, "name": "조리도구", "code": "주방용품-조리도구", "parent": "주방용품" },
        { "level": 3, "name": "건지기/망", "code": "주방용품-조리도구-건지기/망", "parent": "조리도구" }
      ],
      "errors": [],
      "skipped": []
    }
  }
}
```

### 2. 객체 형식

**엔드포인트:** `POST /api/categories/bulk`  
**인증:** 관리자 권한 필요

#### 요청 형식

```json
{
  "categories": [
    {
      "대분류": "주방용품",
      "중분류": "조리도구",
      "소분류": "건지기/망"
    },
    {
      "대분류": "의류",
      "중분류": "상의",
      "소분류": "티셔츠"
    }
  ]
}
```

## 사용 예시

### cURL 예시

```bash
curl -X POST http://localhost:6500/api/categories/bulk-string \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "items": [
      "주방용품 > 조리도구 > 건지기/망",
      "주방용품 > 조리도구 > 냄비/솥",
      "주방용품 > 식기 > 접시"
    ]
  }'
```

### JavaScript 예시

```javascript
const response = await fetch('http://localhost:6500/api/categories/bulk-string', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    items: [
      '주방용품 > 조리도구 > 건지기/망',
      '주방용품 > 조리도구 > 냄비/솥',
      '의류 > 상의 > 티셔츠'
    ]
  })
});

const result = await response.json();
console.log(result);
```

## 데이터 형식 규칙

1. **구분자:** `>` (공백 포함 가능: `주방용품 > 조리도구`)
2. **최소 요구사항:** 대분류는 필수, 중분류와 소분류는 선택사항
3. **중복 처리:** 이미 존재하는 카테고리는 자동으로 건너뜀
4. **코드 생성:** 카테고리 이름을 기반으로 자동 생성 (소문자, 하이픈, 한글 포함)

## 주의사항

- 대분류만 있는 경우: `"의류"` → 대분류만 생성
- 대분류 + 중분류: `"의류 > 상의"` → 대분류와 중분류 생성
- 대분류 + 중분류 + 소분류: `"의류 > 상의 > 티셔츠"` → 전체 계층 구조 생성
- 3개 이상의 구분자가 있으면 처음 3개만 사용됩니다.

