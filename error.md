# KEETY — Error Log

> Running log of every error encountered during development, diagnosis, fix status, and resolution.
> Updated in real-time alongside the work session.

---

## Format

Each entry follows:

```
### ERROR-NNN — Short title
- **When:** date / session context
- **Where:** file or endpoint
- **Symptom:** what was observed
- **Root cause:** why it happened
- **Fix:** what was changed
- **Status:** FIXED | OPEN | KNOWN / WORKAROUND
```

---

## Errors

---

### ERROR-001 — `req.body` TypeError crash in `business.middleware.js`
- **When:** Discovered during test session (bug hunt phase)
- **Where:** `backend/src/middleware/business.middleware.js` line 9
- **Symptom:** GET and DELETE requests from multi-business users with no `x-business-id` header returned HTTP 500 `INTERNAL_SERVER_ERROR` instead of 400 `BUSINESS_REQUIRED`
- **Root cause:** `requireBusiness` read `req.body.businessId` unconditionally. `express.json()` only sets `req.body` when the request carries a JSON `Content-Type`. GET/DELETE requests arrive with `req.body === undefined`, causing a `TypeError: Cannot read properties of undefined (reading 'businessId')`
- **Fix:** Changed `req.body.businessId` → `req.body?.businessId` (optional chaining)
- **Status:** ✅ FIXED — regression test `BUG-001` added in `tests/unit/bugs.regression.test.js`

---

### ERROR-002 — Double DB query in `getBusiness` controller
- **When:** Discovered during audit phase
- **Where:** `backend/src/modules/business/business.controller.js` — `getBusiness` function
- **Symptom:** Every `GET /api/business/:id` ran `Business.findOne` twice — once in `requireBusinessFromRouteParam` middleware (result stored in `req.business`) and again inside the controller via `businessService.getBusiness(req.params.id, req.user._id)`
- **Root cause:** Controller was not using `req.business` already set by the middleware; it re-fetched the same document
- **Fix:** Changed `getBusiness` controller to return `req.business` directly instead of calling the service
- **Status:** ✅ FIXED — regression test `BUG-002` added confirming `Business.findOne` called exactly once

---

### ERROR-003 — Failed Gemini calls never persisted in `AILog`
- **When:** Discovered during audit phase
- **Where:** `backend/src/modules/ai/ai.service.js` — `generateBusinessResponse` catch block
- **Symptom:** Every Gemini timeout, rate-limit error, or provider outage was silently lost with no `AILog` record, making AI failures invisible to monitoring and debugging
- **Root cause:** The catch block re-threw a new `ApiError(503)` without first writing an `AILog` with `status: 'FAILED'`
- **Fix:** Added `AILog.create({ ..., status: 'FAILED' })` in the catch block, wrapped in its own try/catch so a log-write failure cannot mask the original error
- **Status:** ✅ FIXED — regression tests `BUG-003` (×2) added

---

### ERROR-004 — AI test isolation assertion used wrong payload path
- **When:** After refactoring `ai.service.js` to use `buildUserMessage`
- **Where:** `backend/tests/api/ai.test.js` — `POST /ai/ask — AI context includes only the requesting business's data` test
- **Symptom:** Test failed with `TypeError: Cannot read properties of undefined (reading 'name')` at assertion line
- **Root cause:** The refactored `buildUserMessage` wraps the payload as `{ businessContext, userRequest }`. The test was asserting `capturedPayload.business.name` but the correct path is now `capturedPayload.businessContext.business.name`
- **Fix:** Updated three assertions in the test to use `capturedPayload.businessContext.business.name` and `capturedPayload.businessContext?.analytics?.revenue`
- **Status:** ✅ FIXED — test now passes, 257/257 suite green

---

### ERROR-005 — MongoDB Atlas TLS handshake failure on startup (Node.js 24)
- **When:** During live e2e server startup
- **Where:** `backend/src/config/db.js` → `mongoose.connect()` → Atlas cluster `cgc.btx3ggy.mongodb.net`
- **Symptom:** Server failed to start with `KEETY API failed to start: SSL routines ssl3_read_bytes tlsv1 alert internal error SSL alert number 80`. Happened on first connection attempt consistently with Node.js v24.13.0
- **Root cause:** Node.js 24 TLS 1.3 session resumption behaviour causes the first TCP+TLS handshake to Atlas to be rejected by the server with SSL alert 80 (`internal_error`). Subsequent attempts succeed. The `compressors=zlib` query param in the connection string also aggravated this — removed it as a precaution
- **Fix:**
  1. Removed `compressors=zlib` from `MONGODB_URI` in `.env`
  2. Rewrote `connectDatabase` in `db.js` with a retry loop (up to 3 attempts, 2 s delay between retries, retries only on SSL/TLS errors)
- **Status:** ✅ FIXED — server now starts after 1–2 retries with log `[db] Connection attempt N failed (TLS), retrying…`

---

### ERROR-006 — `Invoke-RestMethod` PowerShell prompt blocking e2e test commands
- **When:** During live e2e testing from PowerShell
- **Where:** PowerShell `Invoke-WebRequest` without `-UseBasicParsing`
- **Symptom:** Commands hung waiting for interactive `[Y/N]` confirmation prompt ("Script code in the web page might be run when the page is parsed")
- **Root cause:** PowerShell's `Invoke-WebRequest` prompts for confirmation when parsing JSON responses without `-UseBasicParsing` flag
- **Fix:** Added `-UseBasicParsing` to all `Invoke-WebRequest` calls in e2e test scripts
- **Status:** ✅ FIXED (workaround applied in scripts)

---

### ERROR-007 — `Invoke-WebRequest` e2e command timed out (Exit Code -1)
- **When:** During live e2e testing — `POST /ai/ask` call
- **Where:** PowerShell terminal executing the AI endpoint test
- **Symptom:** Command returned Exit Code -1 with no output — likely Gemini API call timeout or Atlas pool-reset interfering mid-request
- **Root cause:** Under investigation — could be (a) Gemini API key format issue (`***REMOVED***` contains a `.` after `AIzaSy` which is unusual), (b) intermittent Atlas `MongoNetworkError` during analytics fetch mid-request, or (c) PowerShell command timeout on a long-running request
- **Fix:** Investigating — see next steps below
- **Status:** 🔍 INVESTIGATING

### ERROR-008 — Gemini credential rejected during live generation
- **When:** During direct REST and SDK `generateContent` verification
- **Where:** `backend/.env` → `GEMINI_API_KEY` → `backend/src/modules/ai/ai.service.js`
- **Symptom:** Direct REST returned HTTP 401; the SDK also returned 401. Ask KEETY and Growth Plan therefore receive the backend's safe AI-unavailable response rather than a generated result.
- **Root cause:** Gemini returned `UNAUTHENTICATED` with reason `ACCESS_TOKEN_TYPE_UNSUPPORTED`. The configured value is not accepted as a Gemini API key. The provider request reached Gemini, so this is not a Docker DNS/HTTPS, model-name, or JSON-body failure.
- **Fix:** The rejected value was removed from this working copy. A valid Gemini API key must be created and stored in the ignored local `backend/.env`; do not commit or share it.
- **Status:** ⚠️ BLOCKED — generation remains unverified until a valid key is configured. The original note claimed the value was exposed in Git history; a `git log --all` path check found no committed `.env` files in the available refs.

