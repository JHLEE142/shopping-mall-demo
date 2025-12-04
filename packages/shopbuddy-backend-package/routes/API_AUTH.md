# 인증 API 문서

## 개요

사용자 인증 관련 API 엔드포인트입니다.

**Base URL**: `/api/auth`

---

## 1. 회원가입

**POST** `/api/auth/register`

새로운 사용자 계정을 생성합니다.

### Request Body

```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password123",
  "phone": "010-1234-5678",
  "role": "buyer",
  "address": {
    "address1": "서울시 강남구 테헤란로 123",
    "address2": "101호",
    "postalCode": "06234",
    "city": "서울",
    "country": "KR"
  }
}
```

#### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | String | ✅ | 사용자 이름 |
| `email` | String | ✅ | 이메일 주소 (고유) |
| `password` | String | ✅ | 비밀번호 (최소 6자) |
| `phone` | String | ❌ | 전화번호 |
| `role` | String | ❌ | 회원 유형 ('buyer', 'seller', 'admin', 기본값: 'buyer') |
| `address` | Object/String | ❌ | 주소 (객체 또는 문자열) |

### Response (성공)

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "홍길동",
      "email": "user@example.com",
      "role": "buyer",
      "phone": "010-1234-5678",
      "address": {
        "address1": "서울시 강남구 테헤란로 123",
        "address2": "101호",
        "postalCode": "06234",
        "city": "서울",
        "country": "KR"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response (에러)

**Status Code**: `400 Bad Request`

```json
{
  "success": false,
  "message": "이미 등록된 이메일입니다.",
  "error": "이미 등록된 이메일입니다."
}
```

### 에러 케이스

- `400`: 필수 필드 누락, 이메일 형식 오류, 비밀번호 길이 부족, 이메일 중복
- `500`: 서버 오류

---

## 2. 로그인

**POST** `/api/auth/login`

사용자 로그인을 처리합니다.

### Request Body

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | String | ✅ | 이메일 주소 |
| `password` | String | ✅ | 비밀번호 |

### Response (성공)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "홍길동",
      "email": "user@example.com",
      "role": "buyer",
      "phone": "010-1234-5678",
      "address": {
        "address1": "서울시 강남구 테헤란로 123",
        "address2": "101호",
        "postalCode": "06234",
        "city": "서울",
        "country": "KR"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response (에러)

**Status Code**: `401 Unauthorized`

```json
{
  "success": false,
  "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "error": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

### 에러 케이스

- `400`: 필수 필드 누락
- `401`: 이메일 또는 비밀번호 불일치
- `403`: 비활성화된 계정
- `500`: 서버 오류

---

## 3. 로그아웃

**POST** `/api/auth/logout`

사용자 로그아웃을 처리합니다. (클라이언트에서 토큰 삭제)

### Headers

```
Authorization: Bearer <token>
```

### Response (성공)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "로그아웃되었습니다.",
  "data": null
}
```

---

## 4. 토큰 갱신

**POST** `/api/auth/refresh`

JWT 토큰을 갱신합니다.

### Headers

```
Authorization: Bearer <token>
```

### Response (성공)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "토큰이 갱신되었습니다.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 5. 현재 사용자 정보

**GET** `/api/auth/me`

현재 로그인한 사용자의 정보를 조회합니다.

### Headers

```
Authorization: Bearer <token>
```

### Response (성공)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "사용자 정보 조회 성공",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "홍길동",
      "email": "user@example.com",
      "role": "buyer",
      "phone": "010-1234-5678",
      "address": {
        "address1": "서울시 강남구 테헤란로 123",
        "address2": "101호",
        "postalCode": "06234",
        "city": "서울",
        "country": "KR"
      },
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## JWT 토큰 사용법

### 토큰 저장

로그인/회원가입 성공 시 받은 `token`을 저장하세요:

```javascript
// 로그인 상태 유지 (localStorage)
localStorage.setItem('token', token);

// 세션만 유지 (sessionStorage)
sessionStorage.setItem('token', token);
```

### API 요청 시 토큰 포함

인증이 필요한 API 요청 시 헤더에 토큰을 포함하세요:

```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 토큰 만료

토큰이 만료되면 `401 Unauthorized` 응답을 받게 됩니다. 이 경우:
1. `/api/auth/refresh`로 토큰 갱신 시도
2. 실패 시 다시 로그인

---

## 프론트엔드 연동 예시

### React에서 사용

```javascript
import api from '../utils/api';

// 회원가입
const register = async (formData) => {
  try {
    const response = await api.post('/auth/register', formData);
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, user };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || '회원가입에 실패했습니다.'
    };
  }
};

// 로그인
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, user };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || '로그인에 실패했습니다.'
    };
  }
};

// 로그아웃
const logout = async () => {
  try {
    await api.post('/auth/logout', {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    // 에러가 있어도 로컬 스토리지는 정리
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  }
};

// 현재 사용자 정보 조회
const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  } catch (error) {
    return null;
  }
};
```

---

## 보안 고려사항

1. **비밀번호**: 최소 6자 이상 (권장: 8자 이상, 영문/숫자/특수문자 조합)
2. **토큰**: HTTPS를 통해서만 전송
3. **토큰 만료**: 기본 7일 (환경 변수로 설정 가능)
4. **비밀번호 해싱**: bcrypt 사용 (salt rounds: 10)

---

## 환경 변수

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

