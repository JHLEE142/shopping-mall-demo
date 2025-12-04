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

Create an `.env` file based on `env.example`:
```env
PORT=6500
# MongoDB Atlas URL (우선 사용)
MONGODB_ATLAS_URL=your_atlas_connection_string
# MongoDB 로컬 URI (MONGODB_ATLAS_URL이 없을 때만 사용)
MONGODB_URI=mongodb://127.0.0.1:27017/shopping-mall-demo
JWT_SECRET=your_jwt_secret_here
```

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
  env.example       # Environment variable template
```
