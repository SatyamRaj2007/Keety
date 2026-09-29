# KEETY

**AI-powered business intelligence for small and medium businesses.**

KEETY helps business owners understand their own data. Add products, record sales, and ask KEETY questions about your business — and get grounded, evidence-based answers anchored in your actual metrics.

---

## What KEETY does

| Capability | Status |
|---|---|
| Business profile + multi-business support | ✅ |
| Product catalog management | ✅ |
| Sales recording with transactional inventory decrement | ✅ |
| Analytics (revenue, growth, top/slow products, low stock, expenses) | ✅ |
| Ask KEETY — natural-language business questions | ✅ |
| Growth strategy generation | ✅ |
| Product analysis | ✅ |
| Business period summaries (daily / weekly / monthly) | ✅ |
| AI request history with latency + token cost | ✅ |
| Business knowledge base (document upload / lifecycle) | ✅ |
| Document Q&A via RAG retrieval | 🔲 In progress |
| Customer management | 🔲 Coming |
| Expense management | 🔲 Coming |
| Inventory management | 🔲 Coming |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · React Router v7 · Tailwind CSS v4 · TypeScript · Vite |
| Backend | Node.js ≥ 20 · Express v5 · Mongoose v8 |
| Database | MongoDB Atlas (replica set — required for transactions) |
| AI | Google Gemini API (`gemini-2.0-flash` default) |
| Auth | JWT (Bearer tokens) · bcrypt |
| Validation | Zod v4 |
| Testing | Node built-in test runner · Supertest · MongoMemoryReplSet · Faker |

---

## Project structure

```
Keety/
├── backend/          Node.js + Express REST API
│   ├── src/
│   │   ├── config/   env.js, db.js (TLS-retry for MongoDB Atlas)
│   │   ├── middleware/  auth, business, error, validate
│   │   ├── models/   User, Business, Product, Sale, Customer,
│   │   │             Expense, Inventory, AILog, BusinessDocument, Report
│   │   ├── modules/  auth, business, products, sales, analytics, ai, rag
│   │   └── routes/   index.js (mounts all modules)
│   └── tests/
│       ├── api/      Integration tests for every endpoint
│       ├── unit/     Service + middleware unit tests
│       └── ai-eval/  AI golden evaluation dataset (10 cases)
│
└── frontend/         React SPA
    └── src/
        ├── api/      auth, business, products, sales, analytics, ai, rag
        ├── contexts/ AuthContext (session, business selection)
        ├── pages/    Dashboard, Products, Sales, Analytics,
        │             AskPage, GrowthPage, ProductAnalysisPage,
        │             BusinessSummaryPage, AIHistoryPage, KnowledgeBasePage,
        │             Settings, Onboarding
        └── components/ AppShell, ui.tsx (Button, Panel, Modal, Toast…)
```

---

## Getting started

### Prerequisites

- **Node.js ≥ 20**
- **MongoDB Atlas** connection string (or local MongoDB in replica-set mode)
- **Google Gemini API key** — get one at [aistudio.google.com](https://aistudio.google.com)

---

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` — the minimum required values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=<at-least-32-random-characters>
GEMINI_API_KEY=<your-gemini-api-key>
```

Full `.env` reference:

| Variable | Required | Default | Notes |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | Atlas or local replica-set URI |
| `JWT_SECRET` | ✅ | — | Min 32 chars |
| `GEMINI_API_KEY` | ✅ for AI | `""` | Empty string disables AI gracefully (503) |
| `GEMINI_MODEL` | | `gemini-2.5-flash` | Any Gemini model name |
| `PORT` | | `5000` | HTTP listen port |
| `JWT_EXPIRES_IN` | | `7d` | Token TTL |
| `NODE_ENV` | | `development` | `development` or `production` |
| `CLIENT_ORIGIN` | | `http://localhost:5173` | CORS allowed origin |

Start the dev server:

```bash
npm run dev        # nodemon — restarts on file changes
npm start          # production start
```

The API listens at `http://localhost:5000`.  
Health check: `GET http://localhost:5000/api/health`

> **Note:** MongoDB Atlas occasionally produces TLS handshake failures on the first connection attempt with Node.js 24. The server retries up to 3 times automatically — this is normal and logged as `[db] Connection attempt N failed (TLS), retrying…`.

---

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # sets VITE_API_URL=http://localhost:5000/api
npm run dev            # Vite dev server on http://localhost:5173
npm run build          # TypeScript check + production build
```

---

## API overview

All responses use the standard envelope:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account — returns `{ user, token }` |
| POST | `/api/auth/login` | Login — returns `{ user, token }` |
| GET | `/api/auth/me` | Current user (requires `Authorization: Bearer <token>`) |

### Business

All routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/business` | Create a business |
| GET | `/api/business/:id` | Get business |
| PATCH | `/api/business/:id` | Update business |

### Products, Sales, Analytics

All routes require `Authorization` + `x-business-id: <businessId>` header.

| Method | Endpoint | Description |
|---|---|---|
| POST / GET | `/api/products` | Create product / List with pagination + search |
| GET / PATCH / DELETE | `/api/products/:id` | Get / Update / Delete product |
| POST | `/api/sales` | Record a sale (transactional — decrements inventory) |
| GET | `/api/sales` | List sales with pagination |
| GET | `/api/sales/:id` | Get single sale |
| GET | `/api/analytics` | Analytics snapshot (`?period=daily\|weekly\|monthly` or `?startDate=&endDate=`) |

### AI endpoints

All routes require `Authorization` + `x-business-id`.  
**Rate limited:** 30 requests/15min per IP · 20 requests/15min per user.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/ai/ask` | `{ question, period? }` | Answer a business question |
| POST | `/api/ai/growth-strategy` | `{ goal, period? }` | Evidence-based growth plan |
| POST | `/api/ai/product-analysis` | `{ productId, question?, period? }` | Analyse a product |
| POST | `/api/ai/summary` | `{ period? }` | Business performance summary |
| GET | `/api/ai/history` | `?page&limit&status&type` | Paginated AI request log |

`period` accepts `daily`, `weekly`, or `monthly` (default `monthly`).

All four generation endpoints return:

```json
{
  "answer": "...",
  "insights": [{ "title": "...", "description": "...", "metric": "...", "value": 0 }],
  "recommendations": [{ "title": "...", "description": "...", "priority": "HIGH|MEDIUM|LOW", "evidence": "..." }],
  "limitations": ["..."],
  "dataSource": "..."
}
```

### RAG (Knowledge base)

All routes require `Authorization` + `x-business-id`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rag/documents` | Upload a text document |
| GET | `/api/rag/documents` | List documents (DELETED excluded) |
| GET | `/api/rag/documents/:id` | Get document with full text |
| PATCH | `/api/rag/documents/:id` | Update name / description |
| DELETE | `/api/rag/documents/:id` | Soft-delete (permanently removes from listing) |

---

## Running tests

```bash
cd backend

npm test             # 257 tests — api + unit suites (0 failures)
npm run test:unit    # unit tests only
npm run test:api     # API integration tests only
npm run test:coverage # with Node.js built-in coverage
```

### AI evaluation (requires Gemini API key)

The golden evaluation dataset runs **real Gemini calls** and is excluded from the standard `npm test` to avoid requiring an API key in CI.

```bash
GEMINI_API_KEY=<your-key> npm run test:eval
```

This runs 10 cases across 7 categories: business facts, missing data, sales analysis, recommendations, product intelligence, security (cross-tenant), prompt injection, and hallucination detection.

---

## Security model

- **Authentication:** JWT Bearer tokens; `requireAuth` middleware on every protected route.
- **Tenant isolation:** `requireBusiness` resolves `Business.findOne({ _id, ownerId: req.user._id })` — a user cannot access another user's business regardless of what IDs they supply.
- **IDOR protection:** Every `findOne` on business-owned data includes `{ businessId }` — confirmed by 24 dedicated isolation tests.
- **AI rate limiting:** Per-IP (30/15min) and per-authenticated-user (20/15min) limits on all AI generation endpoints, independent of the global API rate limit (300/15min).
- **No secrets in frontend:** Gemini API key is server-side only, read from environment variables.
- **Input validation:** Zod v4 strict schemas on all POST/PATCH bodies — extra fields rejected.

---

## Architecture

```
React SPA
    ↓  HTTP/REST
Express v5 API  ←→  MongoDB Atlas
    ↓
AI Module
    ↓  assembles deterministic analytics context
Analytics Service  ←→  MongoDB (7 parallel aggregations)
    ↓
Google Gemini API
    ↓  structured JSON output (validated server-side)
AILog (businessId, userId, period, tokens, cost, latency)
```

The AI never queries the database directly. It receives a pre-assembled context object containing only deterministic metrics from the analytics service. Gemini is instructed to use only the supplied data and acknowledge when information is missing.

---

## Key design decisions

**Transactions for sales:**  
`createSale` runs entirely within a Mongoose session transaction. Inventory is decremented atomically with an optimistic lock (`quantity >= requested`). Two simultaneous requests for the last unit of stock — exactly one succeeds.

**Structured AI output:**  
Every Gemini response is parsed and validated by `ai.output.js` before being stored or returned. If the model returns malformed JSON, the raw text is used as a fallback answer with an empty structured fields.

**Capability registry:**  
Before calling Gemini, the AI context includes a `capabilities` object (`HAS_SALES`, `HAS_PRODUCTS`, `HAS_INVENTORY`, etc.). The model is instructed not to answer questions about data that doesn't exist.

**RAG foundation:**  
Documents are ingested, cleaned, SHA-256 deduplicated, and stored with explicit lifecycle states (`UPLOADED → INDEXED`, or `FAILED`, or `DELETED`). Soft-delete ensures deleted documents are never returned. Vector embedding and retrieval are the next step.

---

## Deployment

**Frontend** — Vercel (`frontend/vercel.json` is configured).  
**Backend** — No CI/CD pipeline exists yet. Run `npm start` on any Node.js ≥ 20 host. Set all required environment variables; the server will refuse to start if `MONGODB_URI` or `JWT_SECRET` are missing.

---

## Development status

See [`CurrentStatus.md`](./CurrentStatus.md) for a full evidence-backed production readiness review.

**Summary:** Early MVP — core workflow (auth, products, sales, analytics, AI) is functional and tested. RAG document storage is implemented; vector retrieval is the next milestone. Customers, expenses, and inventory sections are not yet available. No CI/CD pipeline, no structured logging, no migration system.

Test suite: **257 tests, 0 failures.**
