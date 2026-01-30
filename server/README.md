# Server

Express + MongoDB backend for the shopping mall demo.

## Requirements
- Node.js 18+
- MongoDB instance (local or remote)

## Getting Started
```bash
npm install
npm run dev
```

The default server listens on `http://localhost:6500`.

Create an `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

또는 직접 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
PORT=6500
# MongoDB Atlas URL (우선 사용)
MONGODB_ATLAS_URL=your_atlas_connection_string
# MongoDB 로컬 URI (MONGODB_ATLAS_URL이 없을 때만 사용)
MONGODB_URI=mongodb://127.0.0.1:27017/shopping-mall-demo
JWT_SECRET=your_jwt_secret_here

# 토스페이먼츠 결제 (필수)
# 토스페이먼츠 개발자센터(https://developers.tosspayments.com)에서 발급받은 Secret Key
# 테스트 환경: test_sk_로 시작하는 키
# 운영 환경: live_sk_로 시작하는 키
TOSS_PAYMENTS_SECRET_KEY=your_toss_secret_key_here

# Slack 알림 (선택사항)
SLACK_WEBHOOK_ORDER=https://hooks.slack.com/services/...
SLACK_WEBHOOK_ADMIN=https://hooks.slack.com/services/...
```

**중요:** 클라이언트 앱도 별도로 환경변수를 설정해야 합니다. `client/README.md`를 참고하세요.

**MongoDB 연결 우선순위:**
1. `MONGODB_ATLAS_URL` - MongoDB Atlas 연결 문자열 (우선 사용)
2. `MONGODB_URI` - 로컬 MongoDB URI (MONGODB_ATLAS_URL이 없을 때 사용)
3. 기본값: `mongodb://127.0.0.1:27017/shopping-mall-demo` (둘 다 없을 때)

## Available Scripts
- `npm run dev`: Start the server with hot reload via nodemon.
- `npm start`: Start the server in production mode.

## Project Structure
```
server/
  src/
    app.js          # Express app setup
    server.js       # Entry point
    config/
      database.js   # MongoDB connection helper
    routes/
      index.js      # Example routes
  .env.example      # Environment variable template
```
