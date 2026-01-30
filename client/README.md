# Client App

## 개발 환경

```bash
npm install
npm run dev
```

## 환경 변수

`client/.env` 파일을 생성하여 필요한 환경변수를 설정하세요:

```bash
cp .env.example .env
```

### 필수 환경 변수

| Key | 설명 | 비고 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 백엔드 서버 주소 | 기본값: `http://localhost:6500` |
| `VITE_TOSS_CLIENT_KEY` | 토스페이먼츠 Client Key | 토스페이먼츠 결제 연동 필수 |

### 선택 환경 변수

| Key | 설명 | 비고 |
| --- | --- | --- |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드 이름 | 이미지 업로드 기능 사용 시 |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary 업로드 프리셋 | 이미지 업로드 기능 사용 시 |
| `VITE_CLOUDINARY_UPLOAD_FOLDER` | Cloudinary 업로드 폴더 | 기본값: `products` |

### 환경 변수 설정 예시

```bash
# 필수
VITE_API_BASE_URL=http://localhost:6500
VITE_TOSS_CLIENT_KEY=test_ck_50WRapdA8dvz2Gm72XIBVo1zEqZK

# 선택 (Cloudinary 사용 시)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned_preset
VITE_CLOUDINARY_UPLOAD_FOLDER=products
```

### 토스페이먼츠 키 발급 방법

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com)에 접속
2. 로그인 후 "내 상점" → "API 키" 메뉴로 이동
3. "API 개별 연동 키" 탭에서 Client Key와 Secret Key 확인
   - **Client Key** (`test_ck_...` 또는 `live_ck_...`): 클라이언트 `.env`의 `VITE_TOSS_CLIENT_KEY`에 설정
   - **Secret Key** (`test_sk_...` 또는 `live_sk_...`): 서버 `.env`의 `TOSS_PAYMENTS_SECRET_KEY`에 설정

**참고:**
- 테스트 환경: `test_ck_`, `test_sk_`로 시작하는 키 사용
- 운영 환경: `live_ck_`, `live_sk_`로 시작하는 키 사용
- 환경 변수가 없으면 이미지 업로드 버튼이 비활성화되며 오류 메시지가 표시됩니다.
