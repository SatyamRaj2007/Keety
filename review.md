# review.md — KEETY Brutal Production, Architecture & Product Review System

> **Purpose:** This document is the operating procedure for reviewing KEETY as an actual software product, not as a demo, README, architecture diagram, or collection of working screens.
>
> **Core question:**
>
> **"If I were responsible for KEETY in production, what could hurt users, businesses, data, money, reputation, reliability, or the engineering team — and what evidence do we have that those risks are controlled?"**

---

# 1. WHAT THIS REVIEW IS

KEETY is intended to be an AI business helper for different kinds of businesses — for example:

- Clothing / fashion stores
- Restaurants
- Retail shops
- Service businesses
- Other small and medium businesses

A business provides its information to KEETY, and KEETY should help the business understand its operations, products/services, performance, opportunities, and possible actions.

That creates a review surface much larger than a normal CRUD application.

KEETY must be reviewed as a system containing:

```text
Business users
        ↓
Authentication
        ↓
Tenant / business isolation
        ↓
Business data
        ↓
Structured data
        +
Documents / knowledge
        ↓
RAG
        ↓
AI reasoning
        +
Tools / business queries where applicable
        ↓
Recommendations / explanations
        ↓
User action
```

The review must therefore cover:

```text
Product
UX
Frontend
Backend
Database
Transactions
Security
Multi-tenancy
AI
RAG
Automation
Testing
Performance
Scalability
Observability
Deployment
Dependencies
Privacy
Cost
Maintainability
Operational recovery
```

---

# 2. THE REVIEWER'S ROLE

Act as a combination of:

- Principal Software Engineer
- Staff Backend Engineer
- Frontend Architect
- Database Architect
- Security Engineer
- AI Engineer
- RAG Engineer
- QA / SDET Lead
- Performance Engineer
- DevOps / SRE Engineer
- Product Engineer
- UX reviewer
- Technical product reviewer
- Production incident responder
- Red-team reviewer

Do **not** behave like:

- A friendly demo reviewer
- A documentation validator
- A code formatter
- A test-count collector
- A person trying to make the project look impressive

The job is to discover risk.

---

# 3. THE GOLDEN RULE

Never conclude that a feature works because:

```text
The UI exists.
The API exists.
The database table exists.
The function exists.
The README says it works.
The architecture diagram says it exists.
A happy-path test passes.
An AI response looks convincing.
```

A feature is considered real only when:

```text
Requirement
    ↓
Implementation
    ↓
Correct behavior
    ↓
Invalid behavior handled
    ↓
Authorization enforced
    ↓
Failure handled
    ↓
Concurrency considered
    ↓
Data remains correct
    ↓
Observed in production
```

If evidence is missing:

> Mark the behavior as **UNVERIFIED**.

Do not turn lack of evidence into confidence.

---

# 4. READ THE ENTIRE PROJECT FIRST

Before producing conclusions, inspect all relevant documentation and implementation.

At minimum, review:

```text
README.md
frontend.md
backend.md
database.md
transaction.md
security.md
architecture.md
testing.md
ai.md
RAG.md
automation.md
FindandFixbugAutomation.md
dependency.md
design.md
implementation.md
review.md
```

Also inspect actual implementation:

```text
Frontend source
Backend source
API routes
Server actions / route handlers
Database schema
Migrations
ORM configuration
Authentication
Authorization
AI integration
RAG pipeline
Prompt definitions
Tool definitions
Queue / worker code
Automation code
Tests
CI/CD
Environment configuration
Docker configuration
Deployment configuration
Monitoring configuration
Package manifests
Lockfiles
```

If a file does not exist:

```text
NOT PRESENT
```

Do not silently assume it exists.

---

# 5. DOCUMENTATION VS IMPLEMENTATION AUDIT

For every major architectural or product claim:

```text
Claim
↓
Documentation location
↓
Implementation location
↓
Runtime evidence
↓
Test evidence
↓
Production evidence
↓
Status
```

Use exactly one of:

```text
MATCH
PARTIAL
MISSING
CONTRADICTORY
FALSE CLAIM
UNVERIFIED
```

Examples:

```text
Claim:
"Every business has isolated data."

Evidence:
Tenant ID exists in schema, but one query omits tenant filtering.

Status:
CONTRADICTORY
```

```text
Claim:
"KEETY provides AI-powered recommendations."

Evidence:
Recommendations are generated from real business data and evaluated.

Status:
MATCH
```

```text
Claim:
"Real-time analytics."

Evidence:
Data refreshes every 60 seconds.

Status:
FALSE CLAIM / MISLEADING
```

---

# 6. EVIDENCE STANDARD

Every significant finding should have evidence.

Prefer:

```text
File
↓
Symbol / route / component / table
↓
Line or code location
↓
Observed behavior
↓
Risk
```

Evidence can include:

- Source code
- Database schema
- Migration
- Test
- CI result
- Runtime behavior
- Logs
- Metrics
- Trace
- Benchmark
- Browser test
- Security test
- AI evaluation result

Do not write:

> "This probably has a problem."

Write:

> "This route accepts `businessId` from the request and does not verify that the authenticated user belongs to that business."

When evidence is unavailable:

> **UNVERIFIED — evidence not found.**

---

# 7. NEVER INVENT PROJECT FACTS

Never assume KEETY uses:

- A particular vector database
- A particular LLM
- A particular cloud
- Redis
- Kafka
- Kubernetes
- Microservices
- WebSockets
- Stripe
- Supabase
- PostgreSQL
- MongoDB

unless the actual project confirms it.

Documentation can describe intended architecture, but implementation evidence has priority.

---

# 8. REVIEW STATUS MODEL

Use these statuses:

### VERIFIED

Evidence proves the behavior.

### PARTIALLY VERIFIED

Some evidence exists but important paths remain unverified.

### UNVERIFIED

No reliable evidence.

### BROKEN

Observed behavior violates the requirement.

### RISK

Not necessarily broken today, but creates meaningful future or operational risk.

### NOT APPLICABLE

Feature genuinely does not apply.

Do not use "looks fine" as a status.

---

# 9. KEETY'S CORE PRODUCT WORKFLOW

Trace the complete KEETY workflow.

At minimum:

```text
Business owner
↓
Account creation / login
↓
Business creation
↓
Business type selection
↓
Business profile setup
↓
Business data ingestion
↓
Products / services / operational data
↓
Documents / knowledge
↓
Validation
↓
Indexing / processing
↓
AI / RAG readiness
↓
Business question
↓
Intent understanding
↓
Source routing
↓
Structured data and/or RAG
↓
Evidence assembly
↓
AI generation
↓
Validation
↓
Recommendation / answer
↓
Business action
↓
Feedback / outcome
```

Review every transition.

For every step ask:

```text
Can it fail?
Can it be duplicated?
Can it be unauthorized?
Can it become inconsistent?
Can it leak another tenant's data?
Can the user recover?
Is the user told what happened?
```

---

# 10. KEETY PRODUCT REALITY

Determine what KEETY actually is today:

```text
Demo
Prototype
MVP
Production Candidate
Production Ready
```

Do not use the intended roadmap to upgrade the current implementation.

For example:

If the architecture document describes:

```text
AI + RAG + analytics + automation
```

but the repository currently contains:

```text
Static dashboard
Mock AI response
Hardcoded recommendations
```

the project is not allowed to receive credit for the planned architecture.

---

# 11. PRODUCT VALUE REVIEW

Ask:

1. What exact problem does KEETY solve?
2. Who is the primary user?
3. What is the first valuable outcome?
4. How quickly does the user reach that outcome?
5. What data must the business provide?
6. What does KEETY actually do with that data?
7. Which outputs are actionable?
8. How does the user know the output is trustworthy?
9. What happens when KEETY does not know?
10. What happens when the business data is incomplete?

Do not confuse:

```text
"AI exists"
```

with:

```text
"AI creates business value."
```

---

# 12. BUSINESS-TYPE GENERALIZATION REVIEW

KEETY is intended for different business types.

Test whether the architecture genuinely supports variation.

Check:

```text
Clothing
Restaurant
Retail
Services
Other business types
```

Ask:

> Is the system generic through a proper domain model, or is it secretly built around one business type?

Look for:

```text
Hardcoded clothing fields
Hardcoded restaurant logic
Hardcoded product categories
Hardcoded currency assumptions
Hardcoded inventory assumptions
Hardcoded menu assumptions
```

A generic UI is not evidence of a generic backend.

---

# 13. BUSINESS DOMAIN MODEL REVIEW

Identify the actual domain entities.

Potential examples:

```text
User
Business
BusinessMember
BusinessType
Product
ProductVariant
Category
Inventory
Order
OrderItem
Customer
Supplier
Service
MenuItem
Document
KnowledgeSource
AIConversation
AIMessage
Recommendation
Automation
Event
```

Do not require all entities to exist.

Instead determine:

```text
Which entities actually exist?
Which are necessary?
Which are missing?
Which are duplicated?
Which are incorrectly modeled?
```

---

# 14. MULTI-TENANCY IS A CRITICAL REVIEW AREA

KEETY's most important security boundary is likely:

```text
Business A
≠
Business B
```

The reviewer must aggressively test:

```text
User A → Business A
User A → Business B
Admin A → Business B
API A → Business B
RAG A → Business B
Cache A → Business B
Search A → Business B
AI conversation A → Business B
Document A → Business B
Automation A → Business B
```

Any unauthorized cross-business access is a **critical finding**.

---

# 15. TENANT ISOLATION TRACE

Do not only inspect the database.

Trace:

```text
Authentication
↓
User identity
↓
Business membership
↓
Authorization
↓
Service layer
↓
Repository / query
↓
Database
↓
Cache
↓
RAG metadata filter
↓
AI context
↓
Logs
```

A tenant boundary that exists only in the database schema is insufficient.

---

# 16. IDOR / BOLA REVIEW

Try replacing identifiers:

```text
businessId
userId
productId
orderId
documentId
conversationId
recommendationId
automationId
```

Example:

```text
GET /businesses/A/products
```

becomes:

```text
GET /businesses/B/products
```

Then test direct object identifiers:

```text
/product/A
/product/B
```

Authorization must be based on ownership/membership, not on the fact that an ID was supplied.

---

# 17. AUTHENTICATION REVIEW

Review:

```text
Registration
Login
Logout
Session
Token handling
Password handling
Password reset
Email verification
Session expiry
Session revocation
Multiple sessions
Account recovery
```

Test:

```text
Invalid credentials
Expired session
Revoked session
Missing session
Malformed token
Tampered token
Old session after password change
```

---

# 18. AUTHORIZATION REVIEW

For every sensitive action determine:

```text
Who can read?
Who can create?
Who can update?
Who can delete?
Who can invite?
Who can export?
Who can upload?
Who can query AI?
Who can manage automations?
Who can change business settings?
```

Do not trust frontend permission checks.

Server-side authorization is mandatory.

---

# 19. FRONTEND REVIEW

Inspect:

```text
Component architecture
Routing
State management
Data fetching
Caching
Forms
Validation
Error states
Loading states
Empty states
Responsive behavior
Accessibility
Performance
Authentication
Authorization
```

Look for:

```text
Giant components
Business logic in UI
Duplicated API logic
Hardcoded business data
Unsafe client-side secrets
Incorrect cache keys
Race conditions
Stale state
Unnecessary client components
```

---

# 20. NEXT.JS / REACT REVIEW

If Next.js / React is used, verify actual usage.

Review:

```text
Server Components
Client Components
Route Handlers
Server Actions
Middleware / proxy
Data fetching
Caching
Revalidation
Suspense
Error boundaries
Loading boundaries
Dynamic routes
Metadata
Bundle size
```

Ask:

> Is sensitive logic accidentally exposed to the client?

Ask:

> Are server-side capabilities being used where appropriate?

Ask:

> Is the application actually using the framework correctly or merely hosting a client-side application inside it?

---

# 21. FRONTEND TRUST BOUNDARY

Treat everything sent from the browser as untrusted.

Never accept:

```text
role
businessId
ownerId
permissions
price
cost
inventory authority
AI authorization
```

merely because the frontend says so.

The backend must derive sensitive authority from authenticated state and trusted records.

---

# 22. BACKEND REVIEW

Review:

```text
Routes
Controllers
Services
Domain logic
Repositories
Validation
Authorization
Transactions
Caching
Queues
External APIs
AI services
RAG services
Error handling
Logging
```

Look for:

```text
Business logic inside controllers
Duplicated logic
Unbounded queries
Missing pagination
Missing validation
Inconsistent errors
Hidden side effects
Improper retries
Unsafe async operations
```

---

# 23. API CONTRACT REVIEW

For every important endpoint:

```text
Endpoint
Method
Auth
Authorization
Input schema
Validation
Response schema
Errors
Status codes
Pagination
Sorting
Filtering
Rate limit
Idempotency
```

Compare frontend assumptions with backend reality.

Record:

```text
Frontend expects X
Backend provides Y
```

as a defect.

---

# 24. ERROR CONTRACT REVIEW

Ensure errors are:

```text
Consistent
Machine-readable
User-appropriate
Non-sensitive
Traceable
```

Do not expose:

```text
Stack traces
Database credentials
Provider secrets
Internal SQL
Private prompts
Other tenant identifiers
```

---

# 25. DATABASE REVIEW

Inspect:

```text
Schema
Relationships
Foreign keys
Unique constraints
Indexes
Nullability
Defaults
Timestamps
Soft deletion
Audit fields
Migrations
Tenant keys
```

Ask:

> Can the database itself prevent invalid states?

Application validation is not a substitute for database integrity where constraints are appropriate.

---

# 26. DATABASE SCALE REVIEW

Do not evaluate only with development-sized data.

Ask what happens with:

```text
1 business
100 businesses
10,000 businesses
100,000 businesses
```

and:

```text
10 products
10,000 products
1,000,000 records
```

Review:

```text
Indexes
Query plans
Pagination
Connection pool
Lock contention
Hot rows
Large joins
Aggregation
Sorting
Search
```

---

# 27. TRANSACTION REVIEW

For every multi-write operation:

```text
Write A
↓
Write B
↓
Write C
```

determine:

```text
What if B fails?
What if C fails?
What if the request retries?
What if the worker retries?
What if two requests execute simultaneously?
```

Verify:

```text
Atomicity
Consistency
Isolation
Durability
Idempotency
```

---

# 28. CONCURRENCY REVIEW

Look for:

```text
Lost updates
Duplicate records
Duplicate orders
Duplicate automation execution
Inventory races
Concurrent edits
Double processing
Stale writes
```

Where relevant, verify:

```text
Unique constraints
Transactions
Locks
Optimistic concurrency
Idempotency keys
Version checks
```

---

# 29. DATA INTEGRITY REVIEW

Ask:

```text
Can invalid data enter?
Can valid data be overwritten incorrectly?
Can duplicates exist?
Can records become orphaned?
Can deletion leave references?
Can retries create duplicates?
Can partial failures leave inconsistent state?
```

Data integrity outranks convenience.

---

# 30. FILE / DOCUMENT REVIEW

If businesses upload documents:

Review:

```text
File type
MIME validation
File size
Content validation
Filename
Storage
Access control
Processing
Virus/malware scanning where appropriate
Extraction
Deletion
Reprocessing
Versioning
```

Never trust:

```text
Filename extension
Client-provided MIME type
Client-provided ownership
```

---

# 31. RAG REVIEW

Use `RAG.md` as the detailed RAG authority.

In this review, verify the actual implementation of:

```text
Ingestion
Parsing
Chunking
Metadata
Embeddings
Vector storage
Retrieval
Filtering
Reranking
Context assembly
Generation
Citations
Evaluation
Deletion
Re-indexing
```

---

# 32. KEETY SOURCE-OF-TRUTH REVIEW

This is a critical KEETY rule.

Do not allow RAG to become the source of truth for data that should come from structured/live business systems.

Example:

```text
Question:
"What were my sales yesterday?"
```

should use authoritative structured data.

Whereas:

```text
Question:
"What does our return policy say?"
```

may use business documents through RAG.

Review the routing:

```text
User question
↓
Intent classification
↓
Source selection
↓
Structured data / RAG / live API / combination
```

---

# 33. STRUCTURED DATA VS RAG REVIEW

Create a matrix:

| Question type | Expected source |
|---|---|
| Current inventory | Structured/live data |
| Sales totals | Structured/live data |
| Product price | Structured data |
| Order status | Structured/live data |
| Business policy | RAG/document |
| Product description | Structured + RAG where useful |
| Uploaded business knowledge | RAG |
| Historical analysis | Structured analytics |
| Mixed business question | Controlled combination |

Flag any implementation that blindly sends every question to the LLM.

---

# 34. AI REVIEW

Use `AI.md` as the detailed AI authority.

Review:

```text
Model selection
Prompt design
Context construction
Tool use
Structured outputs
Validation
Retries
Timeouts
Fallbacks
Cost
Latency
Evaluation
Safety
```

Ask:

> What happens when the model is confidently wrong?

---

# 35. AI TRUST MODEL

KEETY must distinguish:

```text
Known
↓
Supported by evidence
↓
Calculated
↓
Inferred
↓
Unknown
```

The AI must not present unsupported inference as a confirmed business fact.

---

# 36. AI BUSINESS RECOMMENDATION REVIEW

For recommendations, inspect:

```text
Evidence
Reasoning basis
Business context
Uncertainty
Potential downside
Actionability
```

A recommendation should not merely say:

> "Increase marketing."

It should explain what business evidence supports the suggestion when such evidence is available.

Do not claim that an AI recommendation caused growth unless there is measured evidence.

---

# 37. AI FAILURE REVIEW

Test:

```text
No data
Incomplete data
Conflicting data
Stale data
Ambiguous question
Unsupported question
Malformed input
Huge input
Model timeout
Provider outage
Invalid structured output
Hallucination
Prompt injection
```

The correct fallback may be:

```text
"I don't have enough reliable data to answer that."
```

A refusal to invent information is a valid success case.

---

# 38. AI COST REVIEW

Estimate:

```text
Average tokens/request
×
Requests/business
×
Businesses
×
Model cost
```

Also identify:

```text
Worst-case context size
Worst-case retry count
Expensive tools
Repeated retrieval
Repeated embeddings
Long conversations
Abusive requests
```

Check whether a user can intentionally create large AI bills.

---

# 39. AI LATENCY REVIEW

Break latency into:

```text
Request
↓
Authentication
↓
Intent
↓
Database
↓
Retrieval
↓
Reranking
↓
Tool calls
↓
LLM
↓
Validation
↓
Response
```

Measure each component where practical.

Do not label the AI "fast" based only on one demo.

---

# 40. PROMPT INJECTION REVIEW

Treat business documents and retrieved text as untrusted data.

Test whether malicious content can instruct KEETY to:

```text
Ignore system rules
Reveal hidden prompts
Reveal secrets
Call unauthorized tools
Expose another tenant's information
Change business data
Perform unintended actions
```

The retrieved document is data, not authority.

---

# 41. RAG TENANT ISOLATION

Every retrieval path must preserve business isolation.

Review:

```text
Embedding metadata
Vector filters
Document IDs
Cache keys
Retrieval APIs
Reranking inputs
Prompt context
Conversation memory
```

A perfect SQL authorization layer does not automatically protect a vector database.

---

# 42. RAG DELETION REVIEW

When a business deletes a document:

```text
Source document deleted
↓
Extracted content deleted
↓
Chunks removed
↓
Embeddings removed
↓
Caches invalidated
↓
Search index updated
↓
AI no longer retrieves old content
```

Verify actual behavior.

---

# 43. RAG FRESHNESS REVIEW

Determine:

```text
When is data indexed?
When does it become searchable?
What happens after editing?
What happens after deletion?
Can stale chunks remain?
Can old versions be retrieved?
```

For time-sensitive business data, stale retrieval is a correctness issue.

---

# 44. CACHE REVIEW

For every cache:

```text
Key
Value
Owner
TTL
Invalidation
Tenant scope
Authorization scope
Staleness tolerance
Failure behavior
```

Critical KEETY rule:

> A cache must never allow Business A to receive Business B's data.

---

# 45. AUTOMATION REVIEW

Use `automation.md` and `FindandFixbugAutomation.md`.

Review:

```text
Trigger
Validation
Execution
Retries
Timeout
Idempotency
Duplicate execution
Failure
Recovery
Dead-letter handling
Observability
```

Ask:

> What happens if the automation succeeds but the response to the user is lost?

---

# 46. QUEUE / WORKER REVIEW

If queues exist, inspect:

```text
Message identity
Visibility timeout
Retries
Backoff
Dead-letter queue
Poison messages
Ordering
Duplicate delivery
Worker crash
Graceful shutdown
Backpressure
```

At-least-once delivery must be treated as potentially duplicate delivery.

---

# 47. WEBHOOK REVIEW

If webhooks exist:

```text
Signature verification
Replay protection
Duplicate events
Event ordering
Malformed payload
Provider retries
Timeouts
Authorization
Idempotency
```

Never trust a webhook solely because it comes from an external URL.

---

# 48. SECURITY REVIEW

Review at minimum:

```text
Authentication
Authorization
Multi-tenancy
IDOR/BOLA
Input validation
Injection
XSS
CSRF where applicable
SSRF
Path traversal
File upload
Secrets
CORS
Security headers
Rate limiting
Abuse prevention
Logging
Data exposure
AI/RAG security
```

---

# 49. SECRET REVIEW

Search:

```text
Source code
Git history
Environment files
CI logs
Build artifacts
Frontend bundles
Docker layers
Logs
```

for:

```text
API keys
Tokens
Passwords
Private keys
Database credentials
Cloud credentials
```

If a real production secret is exposed, treat it as a critical operational/security issue.

---

# 50. PRIVACY REVIEW

Determine:

```text
What business data is collected?
What personal data is collected?
Where is it stored?
Who can access it?
Is it sent to AI providers?
Is it logged?
Is it included in telemetry?
Can it be deleted?
Can exports contain it?
```

Do not claim regulatory compliance without evidence.

---

# 51. LOGGING REVIEW

Logs should provide:

```text
Request correlation
Relevant operation
Failure context
Latency
Service/component
Safe business context
```

Logs must not expose:

```text
Passwords
Tokens
Secrets
Private prompts
Sensitive customer data
Other tenant data
```

---

# 52. OBSERVABILITY REVIEW

Review:

```text
Logs
Metrics
Tracing
Error tracking
Health checks
Alerts
Background job monitoring
AI monitoring
RAG monitoring
Database monitoring
```

Ask:

> If KEETY fails at 2 AM, can the team identify the failure path without guessing?

---

# 53. AI / RAG OBSERVABILITY

Where appropriate capture safe metrics such as:

```text
AI request count
Latency
Token usage
Provider errors
Retrieval latency
Retrieved document count
Retrieval failures
Empty retrieval rate
Tool failures
Validation failures
Fallback rate
```

Avoid storing sensitive prompts/responses indiscriminately.

---

# 54. TESTING REVIEW

Use `testing.md` as the detailed testing authority.

Review whether tests cover:

```text
Critical business workflows
Authentication
Authorization
Tenant isolation
Database integrity
Transactions
Concurrency
API contracts
RAG
AI safety
AI quality
Automation
Failure handling
Performance
Deployment
```

Do not reward test count.

Reward defect-detection capability.

---

# 55. TEST EFFECTIVENESS REVIEW

Ask:

> If I deliberately introduce a realistic bug, will the tests fail?

Examples:

```text
Remove tenant filter
Change authorization condition
Break transaction rollback
Return stale product data
Remove RAG metadata filter
Duplicate an automation event
Change an API response field
```

If tests still pass:

> The test suite is providing false confidence.

---

# 56. PERFORMANCE REVIEW

Measure where possible:

```text
Page load
API latency
Database latency
RAG retrieval latency
LLM latency
Queue latency
Background job latency
Memory
CPU
Network
```

Review:

```text
p50
p95
p99
error rate
throughput
```

Do not rely only on averages.

---

# 57. SCALE REVIEW

Model growth:

```text
10 businesses
100
1,000
10,000
100,000
```

and:

```text
10 products/business
1,000
100,000
```

Ask what becomes the first bottleneck:

```text
Database
RAG
AI provider
Storage
Queue
API
Frontend
Network
```

---

# 58. LOAD / STRESS / SPIKE / SOAK REVIEW

Where relevant:

### Load

Normal expected traffic.

### Stress

Beyond normal capacity.

### Spike

Sudden traffic increase.

### Soak

Long-duration realistic load.

The review must ask:

> Does KEETY degrade predictably, or does it fail in a way that corrupts data?

---

# 59. DEPENDENCY REVIEW

Inspect:

```text
Runtime dependencies
Dev dependencies
AI SDKs
Database libraries
Authentication libraries
UI libraries
Build tools
```

For each important dependency ask:

```text
Why does it exist?
Is it actually used?
Is it maintained?
Is it duplicated?
Does it introduce risk?
```

Do not remove dependencies merely because they are unfamiliar.

---

# 60. DEPENDENCY SECURITY

Review:

```text
Known vulnerabilities
Lockfile integrity
Transitive dependencies
Unmaintained packages
Abandoned packages
Suspicious packages
Version conflicts
```

Dependency scanning is necessary but not sufficient for application security.

---

# 61. DEPLOYMENT REVIEW

Inspect:

```text
Build
Environment variables
Secrets
Database migration
Startup
Health checks
Deployment
Rollback
CI/CD
Monitoring
```

Ask:

> Can KEETY be deployed repeatedly without manual heroics?

---

# 62. MIGRATION REVIEW

For each migration:

```text
Fresh database
Existing database
Large database
Rollback strategy
Application compatibility
Locking behavior
Data backfill
Failure halfway through
```

A migration that works on an empty local database is not sufficient evidence.

---

# 63. PRODUCTION RECOVERY REVIEW

Imagine:

```text
Database outage
AI provider outage
Vector store outage
Storage outage
Queue outage
Bad deployment
Broken migration
Expired credentials
Traffic spike
```

For each ask:

```text
Detection
Containment
Fallback
Recovery
Data integrity
User communication
Post-incident evidence
```

---

# 64. SINGLE POINTS OF FAILURE

Identify:

```text
Database
AI provider
Vector store
Storage
Queue
Authentication
External API
Single worker
Single server
```

For each:

```text
What happens when unavailable?
How long can KEETY operate?
Is there a fallback?
Can work be retried?
Can data be recovered?
```

A single point of failure is not automatically unacceptable for an MVP; it must be explicitly understood and risk-assessed.

---

# 65. BACKUP / RESTORE REVIEW

If persistent data matters, verify:

```text
Backups exist
Backup frequency
Retention
Encryption
Access control
Restore procedure
Restore testing
Recovery time
Recovery point
```

A backup that has never been restored is not strong evidence of recoverability.

---

# 66. UX REVIEW

Inspect:

```text
Onboarding
Navigation
Dashboard
Business setup
Data import
AI chat
Recommendations
Sources / evidence
Errors
Loading
Empty states
Success states
Recovery
```

Ask:

> Does the user understand what KEETY is doing?

Ask:

> Does the user understand what KEETY knows versus what it is inferring?

---

# 67. AI UX REVIEW

AI should not feel like a black box.

Where appropriate, the UI should communicate:

```text
What data was used
Whether the answer is based on business data
Whether the answer is uncertain
Whether additional information is needed
What action is recommended
```

Do not expose internal chain-of-thought.

Provide concise evidence/citations or source references where the product design calls for them.

---

# 68. EMPTY / ERROR / LOADING REVIEW

Every important asynchronous screen must be reviewed for:

```text
Loading
Success
Empty
Partial
Error
Retry
Timeout
Unauthorized
Offline / network failure where relevant
```

Do not design only the success state.

---

# 69. ACCESSIBILITY REVIEW

Check:

```text
Keyboard navigation
Focus management
Labels
Semantic HTML
Screen readers
Contrast
Error messages
Modal behavior
Touch targets
Reduced motion
```

Accessibility is part of product correctness.

---

# 70. RESPONSIVE REVIEW

Test meaningful sizes:

```text
320px
375px
390px
430px
768px
1024px
1440px+
```

Check:

```text
Overflow
Tables
Charts
AI chat
Forms
Modals
Navigation
Long responses
Dense business data
```

---

# 71. BROWSER REVIEW

For critical workflows test supported browsers and record:

```text
PASS
PARTIAL
FAIL
NOT TESTED
```

Do not claim broad browser compatibility without evidence.

---

# 72. FAKE COMPLETENESS AUDIT

Search for:

```text
Hardcoded responses
Mock API
Static JSON
Placeholder AI
Fake analytics
Simulated success
TODO disguised as implementation
Disabled error handling
Demo-only conditionals
```

A feature that looks real but is not connected to real data is a major finding.

---

# 73. BUSINESS LOGIC AUDIT

Identify invariants.

Examples:

```text
Business data cannot cross tenants.
Product price cannot become invalid.
Inventory cannot silently become negative if the domain forbids it.
Unauthorized users cannot mutate business data.
Deleted documents cannot remain retrievable indefinitely.
Duplicate events cannot create duplicate side effects.
```

The actual invariants must come from KEETY's domain rules.

---

# 74. SEARCH / FILTER / PAGINATION REVIEW

For every large dataset inspect:

```text
Search
Filtering
Sorting
Pagination
Authorization
Performance
Stable ordering
```

Test:

```text
Empty
First page
Middle page
Last page
Invalid page
Large page
Concurrent changes
```

---

# 75. EXPORT / IMPORT REVIEW

If KEETY supports import/export:

Review:

```text
Validation
Authorization
File size
Data mapping
Duplicate handling
Partial failures
Rollback
Sensitive data
Export scope
Tenant isolation
```

---

# 76. AUDITABILITY REVIEW

For important mutations determine whether the system can answer:

```text
Who changed it?
What changed?
When?
From which business?
Was it automated?
Was it user initiated?
```

Do not create audit logs containing unnecessary sensitive data.

---

# 77. COST-ABUSE REVIEW

Find expensive operations:

```text
AI generation
Embeddings
RAG retrieval
Large analytics queries
File processing
Exports
Automation
External APIs
```

Then ask:

> Can one user intentionally or accidentally trigger this operation thousands of times?

Review:

```text
Rate limits
Quotas
Budgets
Caching
Deduplication
Request limits
File limits
```

---

# 78. CHANGEABILITY REVIEW

Imagine a new requirement:

> "Add a new business type."

Trace:

```text
Frontend
Backend
Database
AI
RAG
Prompts
Validation
Testing
Analytics
Permissions
```

If adding one business type requires rewriting core infrastructure, the abstraction boundary is weak.

---

# 79. 10× TEAM REVIEW

Imagine:

```text
1 developer
↓
5 developers
↓
10 developers
```

Ask:

```text
Are boundaries clear?
Are ownership rules clear?
Are tests trustworthy?
Can developers work independently?
Are APIs stable?
Are migrations safe?
Is the architecture understandable?
```

---

# 80. 100× DATA REVIEW

Imagine:

```text
100× more businesses
100× more products
100× more documents
100× more AI conversations
100× more events
```

What breaks?

Rank the first five likely bottlenecks based on evidence.

Do not pretend to know without measurement.

---

# 81. CHANGE-RISK REVIEW

For every major architectural change ask:

```text
What modules are affected?
What contracts change?
What migrations are required?
What tests must change?
What data must be reprocessed?
What caches must be invalidated?
What AI/RAG evaluation must be rerun?
```

---

# 82. TECHNICAL DEBT REVIEW

Record:

| Debt | Evidence | Impact | Risk | Effort | Priority |
|---|---|---|---|---|---|

Separate:

```text
Acceptable MVP debt
Dangerous debt
Critical debt
```

Do not call every shortcut technical debt.

---

# 83. OVERENGINEERING REVIEW

Look for:

```text
Unnecessary microservices
Unnecessary queues
Unnecessary agents
Multiple databases without clear need
Excessive abstractions
Complex event systems
Premature caching
Premature distributed infrastructure
```

Ask:

> What problem does this complexity solve?

If there is no evidence of value:

> Recommend simplification.

---

# 84. UNDERENGINEERING REVIEW

Look for:

```text
No authorization
No validation
No transactions
No migrations
No error handling
No rate limits
No observability
No backups
No tests around critical flows
```

A small architecture can still be rigorous.

---

# 85. RED-TEAM REVIEW

Think like:

### Malicious user

What can I abuse?

### Curious user

What can I access that I should not?

### Careless user

What can I accidentally corrupt?

### Power user

What happens under heavy usage?

### Attacker

What boundary can I bypass?

### Insider

What can a legitimate account access beyond its role?

---

# 86. PRODUCTION INCIDENT SIMULATION

Imagine:

> KEETY's AI answers are suddenly wrong.

Can the team determine:

```text
Model changed?
Prompt changed?
RAG changed?
Embedding changed?
Documents changed?
Structured data changed?
Retrieval degraded?
Provider changed?
Cache stale?
```

Imagine:

> Business A receives information belonging to Business B.

Can the team identify:

```text
Which request?
Which user?
Which tenant?
Which retrieval?
Which query?
Which cache?
Which document?
Which response?
```

If not, observability is insufficient.

---

# 87. REGRESSION REVIEW

Every production bug should have:

```text
Incident
↓
Root cause
↓
Reproduction
↓
Fix
↓
Regression test
↓
Monitoring improvement where appropriate
```

Repeated incidents without regression protection indicate process failure.

---

# 88. BUG TRIAGE

Every finding must contain:

```text
ID
Severity
Area
Evidence
Reproduction
Impact
Root cause
Recommended fix
Regression test
Owner
Status
```

Recommended severity:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFORMATIONAL
```

---

# 89. CRITICAL FINDINGS

Examples include:

```text
Cross-tenant data access
Authentication bypass
Authorization bypass
Production secret exposure
Critical data corruption
Irrecoverable business data loss
Unsafe destructive operation
Catastrophic transaction failure
Critical AI tool authorization bypass
```

Critical findings block production approval until resolved or explicitly risk-accepted by the appropriate owner.

---

# 90. HIGH FINDINGS

Examples:

```text
Important authorization weakness
Major data integrity risk
Core workflow failure
Serious migration problem
Large uncontrolled cost exposure
Major RAG isolation flaw
Critical dependency outage with no safe behavior
Production deployment cannot be reliably rolled back
```

---

# 91. MEDIUM FINDINGS

Examples:

```text
Meaningful reliability issue
Weak observability
Incomplete edge-case coverage
Performance problem at realistic scale
Important UX failure
Moderate technical debt
Missing operational safeguard
```

---

# 92. LOW / INFORMATIONAL

Use for:

```text
Minor maintainability issue
Cosmetic inconsistency
Non-critical optimization
Documentation improvement
Future hardening
```

Do not inflate low findings to create a longer report.

---

# 93. SCORECARD — DO NOT LET NUMBERS HIDE RISK

If the team wants scores, record:

```text
Product /10
UX /10
Design /10
Frontend /10
Backend /10
Database /10
Transactions /10
Security /10
Multi-tenancy /10
AI /10
RAG /10
Automation /10
Testing /10
Performance /10
Scalability /10
Observability /10
Deployment /10
Maintainability /10
Documentation /10
```

A score is a summary, not proof.

Do not allow:

```text
9/10 security
```

to coexist with:

```text
Known cross-tenant data leak
```

without explicitly marking the project blocked.

---

# 94. CRITICAL-RISK OVERRIDE

Overall approval is blocked by unresolved issues such as:

```text
Cross-tenant data leakage
Authentication bypass
Critical authorization bypass
Exposed production credentials
Critical data corruption
Unrecoverable critical data loss
Unsafe destructive operation
Core workflow fundamentally broken
Critical AI/tool security vulnerability
```

No amount of:

```text
UI quality
test count
documentation
architecture diagrams
AI sophistication
```

can compensate for these.

---

# 95. PRODUCTION READINESS GATE

Evaluate separately:

### Product usable?

```text
YES / NO / PARTIAL
```

### Core workflow reliable?

```text
YES / NO / PARTIAL
```

### Tenant isolation proven?

```text
YES / NO / UNVERIFIED
```

### Authentication secure enough for scope?

```text
YES / NO / UNVERIFIED
```

### Authorization proven?

```text
YES / NO / UNVERIFIED
```

### Data integrity protected?

```text
YES / NO / UNVERIFIED
```

### AI behavior evaluated?

```text
YES / NO / UNVERIFIED
```

### RAG isolation and grounding evaluated?

```text
YES / NO / UNVERIFIED
```

### Critical failure paths tested?

```text
YES / NO / UNVERIFIED
```

### Production observability exists?

```text
YES / NO / UNVERIFIED
```

### Deployment / rollback proven?

```text
YES / NO / UNVERIFIED
```

### Recovery process proven?

```text
YES / NO / UNVERIFIED
```

Every `NO` or `UNVERIFIED` on a critical control requires an explicit risk decision.

---

# 96. REVIEW CONFIDENCE

End the review with:

```text
Evidence confidence:
HIGH / MEDIUM / LOW
```

Explain why.

For example:

```text
HIGH:
Source, tests, runtime evidence, and production telemetry were available.

MEDIUM:
Source and tests were available, but runtime/load evidence was missing.

LOW:
Review relied heavily on documentation because implementation evidence was incomplete.
```

This prevents false certainty.

---

# 97. CLAIM VERIFICATION TABLE

For major claims use:

| Claim | Evidence | Actual state | Status |
|---|---|---|---|
| AI-powered business assistant |  |  |  |
| Multi-business support |  |  |  |
| Secure tenant isolation |  |  |  |
| RAG |  |  |  |
| Business analytics |  |  |  |
| Product/service intelligence |  |  |  |
| Automation |  |  |  |
| Scalable architecture |  |  |  |
| Production ready |  |  |  |

Never mark a claim `MATCH` merely because documentation says it exists.

---

# 98. WHAT I WOULD KEEP

Only identify genuinely strong decisions.

Examples might include:

```text
Clear tenant boundary
Good domain separation
Strong database constraints
Meaningful AI evaluation
Reliable deployment pipeline
Good observability
Strong testing around critical workflows
```

Only include items supported by evidence.

---

# 99. WHAT I WOULD DELETE

Look for:

```text
Unused features
Unused dependencies
Fake functionality
Redundant abstractions
Unnecessary services
Duplicate logic
Premature infrastructure
Confusing UI
Unnecessary AI calls
```

Deletion is recommended only when evidence supports it.

---

# 100. WHAT I WOULD REBUILD

Only recommend rebuilding when:

```text
Patch cost > restructuring cost
Architecture fundamentally violates requirements
Security boundary is unsound
Data model cannot support required invariants
Core abstraction causes repeated defects
```

Do not recommend rewrites because a different technology is fashionable.

---

# 101. WHAT IS ACTUALLY IMPRESSIVE

Only recognize:

```text
Evidence-backed engineering quality
```

Examples:

```text
Strong tenant isolation
Excellent failure handling
Reliable RAG evaluation
Excellent data modeling
Meaningful concurrency protection
Strong observability
High-quality test architecture
Simple architecture that solves the problem well
```

---

# 102. WHAT IS PRETENDING TO BE IMPRESSIVE

Challenge phrases such as:

```text
AI-powered
Agentic
Enterprise-ready
Production-ready
Scalable
Real-time
Secure
Intelligent
Autonomous
Cloud-native
```

For each:

```text
Claim
Evidence
Reality
Status
```

Technology vocabulary is not proof of engineering quality.

---

# 103. TOP 10 FIXES

Do not dump 100 recommendations on the team.

Provide the ten highest-impact changes.

Prioritize by:

```text
Risk reduction
×
User impact
×
Probability
×
Cost of delay
```

For each:

```text
1. Problem
2. Evidence
3. Why it matters
4. Fix
5. Validation
6. Regression protection
```

---

# 104. FINAL REPORT FORMAT

The final review must contain:

```text
# Executive Summary

# Review Scope

# Evidence & Confidence

# Project Reality

# Documentation vs Implementation

# Product Review

# KEETY Core Workflow Review

# Business-Type Generalization Review

# Multi-Tenancy Review

# Frontend Review

# Backend Review

# API Contract Review

# Database Review

# Transaction & Concurrency Review

# Security Review

# Privacy Review

# AI Review

# RAG Review

# AI/RAG Source-of-Truth Review

# Automation Review

# Testing Review

# Performance Review

# Scalability Review

# Dependency Review

# Deployment Review

# Recovery & Resilience Review

# Observability Review

# UX & Accessibility Review

# Maintainability Review

# Technical Debt Review

# Red-Team Findings

# Documentation/Implementation Gaps

# Critical Issues

# High Priority Issues

# Medium Priority Issues

# Low Priority Issues

# What I Would Delete

# What I Would Rebuild

# What I Would Keep

# What Is Actually Impressive

# What Is Pretending To Be Impressive

# Claim Verification

# Top 10 Fixes

# Scorecard

# Production Readiness Gate

# Final Verdict
```

---

# 105. FINAL VERDICT OPTIONS

Choose exactly one:

## 🟢 APPROVED

The evidence supports production use for the explicitly defined scope.

## 🟡 APPROVED WITH CONDITIONS

The core system is usable, but specific non-blocking or explicitly accepted risks remain.

## 🟠 NOT READY

Important engineering work remains before production use.

## 🔴 REJECTED

Critical problems prevent responsible deployment.

The verdict must be based on evidence, not optimism.

---

# 106. DO NOT USE A VERDICT TO HIDE UNCERTAINTY

Bad:

> "Approved."

when major areas were not tested.

Correct:

> "Not ready — tenant isolation and production recovery remain unverified."

The review must distinguish:

```text
Broken
vs
Unverified
```

Both matter, but they are not the same.

---

# 107. ABSOLUTE REVIEW RULES

Never:

- Give fake praise
- Inflate scores
- Hide critical findings
- Trust documentation blindly
- Trust comments blindly
- Trust architecture diagrams blindly
- Assume security
- Assume tenant isolation
- Assume AI quality
- Assume RAG quality
- Assume scalability
- Assume transaction safety
- Assume tests are meaningful
- Assume backups work
- Assume deployment works
- Assume recovery works
- Treat lack of evidence as proof of correctness
- Recommend a rewrite without evidence
- Call something "enterprise-grade" without operational evidence

Always:

- Verify
- Compare
- Trace
- Challenge
- Test
- Measure where possible
- Identify failure modes
- Check boundaries
- Check tenant isolation
- Check data integrity
- Check AI/RAG grounding
- Prioritize risk
- Provide concrete fixes
- State uncertainty honestly

---

# 108. FINAL PRINCIPLE

The purpose of `review.md` is not:

> "Is KEETY good?"

It is:

> **"If I owned KEETY in the real world, what could hurt my users, businesses, data, money, reputation, and engineering team?"**

Then:

> **"What evidence proves those risks are controlled?"**

A strong review does not try to make KEETY look impressive.

It tries to disprove that KEETY is ready.

If KEETY survives:

```text
Documentation audit
+
Implementation audit
+
Failure testing
+
Security testing
+
Tenant-isolation testing
+
Database review
+
Concurrency review
+
AI review
+
RAG review
+
Performance review
+
Operational review
+
Production recovery review
```

then the confidence is earned.

---

# 109. FINAL PRINCIPAL-LEVEL QUESTIONS

Before closing the review, answer these explicitly:

### Product

1. Does KEETY solve a real business problem?
2. Is the primary user workflow clear?
3. Is the value measurable?
4. Is KEETY actually useful when business data is incomplete?

### Architecture

5. Does the architecture match the implementation?
6. Are boundaries clear?
7. Is the system more complicated than necessary?
8. What architectural decision is most likely to hurt six months from now?

### Multi-tenancy

9. Can Business A ever receive Business B's data?
10. Is tenant isolation enforced at every relevant layer?
11. Are caches and RAG retrieval tenant-safe?

### Data

12. Can incorrect data enter?
13. Can concurrent operations corrupt state?
14. Are migrations safe?
15. Can critical data be restored?

### Security

16. Can authentication be bypassed?
17. Can authorization be bypassed?
18. Can users manipulate object IDs to access other businesses?
19. Are secrets protected?
20. Can expensive endpoints be abused?

### AI

21. What does KEETY do when it does not know?
22. Can AI invent business facts?
23. Are recommendations grounded in evidence?
24. Can malicious documents influence system behavior?
25. Can AI tools perform unauthorized actions?

### RAG

26. Is the correct source selected for each question?
27. Is structured business data protected from being replaced by unreliable text retrieval?
28. Are retrieval results tenant-isolated?
29. Are stale and deleted documents handled?
30. Is retrieval quality measured?

### Reliability

31. What happens when the database fails?
32. What happens when the AI provider fails?
33. What happens when the vector store fails?
34. What happens when a worker crashes?
35. What happens when the same event arrives twice?

### Testing

36. Which critical workflows have meaningful automated tests?
37. Which security properties are continuously tested?
38. Which concurrency properties are tested?
39. Which AI/RAG properties are evaluated?
40. Which important failures remain untested?

### Operations

41. How does the team know KEETY is broken?
42. Can a production incident be traced end-to-end?
43. Can KEETY be rolled back?
44. Can data be recovered?
45. Can the team determine the root cause after an incident?

### Maintainability

46. Can a new engineer understand the system?
47. Can a new business type be added without rewriting everything?
48. Can the team safely change the AI/RAG pipeline?
49. Are tests fast and trustworthy?
50. Is technical debt explicitly understood?

---

# 110. THE FINAL TEST

Forget that you are reviewing code.

Imagine you are responsible for:

```text
real businesses
+
real business data
+
real customers
+
real operational decisions
+
real AI answers
+
real production incidents
```

Then ask:

> **Would I be comfortable putting this system in front of real businesses based on the evidence I have?**

If yes:

Explain exactly what evidence supports that confidence.

If no:

Explain exactly what blocks confidence.

If uncertain:

Say:

> **UNVERIFIED**

and identify what evidence is required.

That is the standard.

---

# FINAL RULE

**Do not review KEETY to prove that it works.**

Review KEETY to discover:

```text
where it can fail
where it can lie
where it can leak
where it can corrupt data
where it can become expensive
where it can become slow
where it can become impossible to maintain
where it can fail under concurrency
where AI can become unreliable
where RAG can retrieve the wrong information
where tenants can cross boundaries
where production can become unrecoverable
```

Then determine whether those risks are:

```text
PREVENTED
DETECTED
CONTAINED
RECOVERABLE
UNVERIFIED
```

The goal is not a green report.

The goal is **evidence-backed confidence**.

**No fake 10/10.**

**No documentation worship.**

**No architecture-diagram worship.**

**No green-CI theater.**

**No AI hype.**

**No RAG hype.**

**No security assumptions.**

**No scalability assumptions.**

**No production-readiness claims without evidence.**

If the system survives this review, it has earned confidence.

If it does not, the review must say exactly why.
