# Client App

## 개발 환경

```bash
npm install
npm run dev
```

## 환경 변수

Cloudinary 업로드 위젯을 사용하려면 `client/.env` 파일에 아래 값을 설정해야 합니다.

| Key | 설명 |
| --- | --- |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary 대시보드에서 확인 가능한 클라우드 이름 |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | unsigned 업로드 프리셋 이름 |
| `VITE_CLOUDINARY_UPLOAD_FOLDER` | (선택) 업로드할 폴더명, 기본값은 `products` |

예시:

```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned_preset
# Optional
VITE_CLOUDINARY_UPLOAD_FOLDER=products
```

환경 변수가 없으면 이미지 업로드 버튼이 비활성화되며 오류 메시지가 표시됩니다.
