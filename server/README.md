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

The default server listens on `http://localhost:5000`.

Create an `.env` file based on `env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/shopping-mall-demo
```

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
