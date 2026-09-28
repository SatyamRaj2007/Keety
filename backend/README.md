# KEETY Backend

Node.js and Express REST API for KEETY. The implementation follows the root `architecture.md`, `backend.md`, and `database.md` specifications.

## Requirements

- Node.js 20 or newer
- MongoDB Atlas connection string (or a local MongoDB instance)

Sale creation uses MongoDB transactions to keep sales and tracked inventory consistent. A local MongoDB deployment must therefore run as a replica set.

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Set `MONGODB_URI` and a `JWT_SECRET` of at least 32 characters in `.env` before starting the server.

```powershell
npm run dev
```

The API listens on `http://localhost:5000` by default. `GET /api/health` checks that the HTTP process is running; MongoDB connection failures prevent the server from starting.

## Tests

```powershell
npm test
```

## API conventions

- JSON responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code": ..., "message": ... } }`.
- Protected routes use `Authorization: Bearer <token>`.
- Business-scoped routes resolve an owned business on the server and never trust a client-supplied business ID as authorization.