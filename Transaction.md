# Transaction.md — KEETY Transaction, Workflow & Data-Integrity Standard

> **Purpose:** Define how KEETY designs, reviews, implements, tests, observes, and recovers state-changing workflows.
>
> **Core principle:** A transaction is not merely `BEGIN → COMMIT`. In KEETY, correctness also depends on concurrency, idempotency, retries, tenant isolation, external systems, background jobs, AI/RAG pipelines, state transitions, recovery, observability, and security.

---

## 1. Scope

This document is the transaction and data-flow authority for KEETY.

It applies to every workflow that can:

- create, update, delete, or otherwise mutate data
- change business or tenant state
- enqueue work
- publish or consume events
- ingest or delete business knowledge
- update search/RAG indexes
- create AI jobs or persist AI-generated results
- call external services
- process files
- send notifications
- modify permissions or configuration
- perform administrative actions
- maintain counters, quotas, usage, limits, or billing-like records
- reconcile asynchronous state
- recover from failures

The objective is not to prove that a happy path works.

The objective is to establish that **important KEETY workflows preserve correctness under success, failure, retries, duplicates, concurrency, crashes, partial completion, and recovery.**

---

# 2. KEETY Transaction Model

KEETY is a business-assistance platform in which business data can drive product/business information, insights, recommendations, AI workflows, and RAG-powered behavior.

That creates several classes of transactional state:

```text
Tenant / Business State
        ↓
Business Data
        ↓
Documents / Files / Knowledge
        ↓
Ingestion / Processing
        ↓
Chunks / Embeddings / Indexes
        ↓
AI / RAG Retrieval
        ↓
Insights / Recommendations / Results
        ↓
Async Jobs / Events / Notifications
```

A single user request may therefore cross:

- application logic
- a relational database
- object/file storage
- vector/search infrastructure
- AI providers
- queues/workers
- notification providers
- authentication/authorization systems
- analytics or observability systems

These systems do **not** automatically share one transaction.

Every workflow must explicitly define its consistency model and recovery strategy.

---

# 3. Transaction Design Principles

KEETY transaction design MUST follow these principles:

1. **Database invariants are enforced by the database where practical.**
2. **Business authorization is evaluated before protected mutations.**
3. **Tenant boundaries are enforced server-side.**
4. **Critical multi-record state changes are atomic where required.**
5. **External calls are not assumed to participate in database rollback.**
6. **Retryable operations are idempotent where duplicate side effects would be harmful.**
7. **Concurrent requests are treated as normal production behavior.**
8. **State transitions are explicit and validated.**
9. **Long-running work is normally asynchronous rather than held inside a database transaction.**
10. **Events are not considered delivered merely because they were attempted.**
11. **Background jobs must tolerate duplicate delivery.**
12. **AI/RAG processing must expose recoverable processing states.**
13. **Deletion must propagate to every relevant derived representation.**
14. **Observability identifiers must connect related operations.**
15. **Recovery must be designed before declaring a workflow production-ready.**

---

# 4. First Step: Build the Complete KEETY Flow

Before changing a transaction, inspect the actual implementation.

Do not infer correctness from endpoint names or documentation.

For each workflow identify:

```text
Actor
  ↓
Authentication
  ↓
Tenant / Business Resolution
  ↓
Authorization
  ↓
Input Validation
  ↓
Business Rules
  ↓
Database Reads
  ↓
Database Transaction
  ↓
External / Async Boundary
  ↓
Database State
  ↓
Event / Job
  ↓
Worker
  ↓
Derived Data / AI / RAG
  ↓
Final State
```

Record every:

- database read
- database write
- unique constraint
- foreign-key dependency
- transaction
- lock
- external API call
- file operation
- queue publish
- queue consumption
- webhook
- AI request
- vector/index update
- cache mutation
- state transition
- retry
- timeout
- compensation
- audit event

Then identify every failure boundary.

---

# 5. Transaction Inventory

Maintain a transaction inventory for KEETY.

At minimum, review workflows such as:

| Workflow | Primary mutation | Async boundary | External system | Criticality |
|---|---|---|---|---|
| Tenant/business creation | tenant + business records | optional | auth/email if used | Critical |
| Business data update | business data | optional | none/AI | High |
| Product/service update | catalog/business records | optional | search/AI | High |
| Document upload | document metadata | yes | object storage | High |
| Document ingestion | processing state + derived data | yes | AI/vector/search | Critical |
| RAG indexing | chunks/embeddings/index state | yes | embedding/search provider | Critical |
| Knowledge deletion | source + derived representations | yes | storage/vector/search | Critical |
| AI insight generation | job/result state | yes | AI provider | High |
| Recommendation generation | job/result state | yes | AI provider | High |
| Notification | notification/job state | yes | provider | Medium |
| Webhook processing | event state | yes | third party | High |
| Usage/quota update | usage counters | optional | billing-like provider if applicable | Critical |
| Admin mutation | protected records | optional | audit | Critical |

This table is a starting inventory, not a claim that every listed workflow exists in the current implementation.

For each actual workflow, document:

- owner
- source of truth
- transaction boundary
- state machine
- idempotency strategy
- concurrency strategy
- retry strategy
- recovery strategy
- audit requirements
- tests
- observability

---

# 6. Transaction Classification

Classify each workflow before choosing a mechanism.

## 6.1 Local atomic transaction

Multiple database mutations must succeed or fail together.

```text
BEGIN
  mutation A
  mutation B
  mutation C
COMMIT
```

Use when the business invariant requires atomicity.

## 6.2 Database + asynchronous processing

A database mutation creates durable work for a worker.

```text
BEGIN
  update source state
  create job/outbox record
COMMIT

Worker
  ↓
process job
  ↓
update derived state
```

## 6.3 Database + external system

A database operation and external operation cannot normally share one ACID transaction.

Use explicit state, idempotency, reconciliation, or compensation.

## 6.4 Long-running workflow

Use a state machine/job workflow rather than keeping a database transaction open for the entire process.

## 6.5 Read-only workflow

No mutation means an ACID transaction may be unnecessary unless a consistent snapshot is explicitly required.

---

# 7. Transaction Boundary Rules

A transaction should contain the smallest set of database operations that genuinely require atomicity.

Do not automatically wrap an entire API request in a database transaction.

### Good boundary

```text
BEGIN

validate mutation prerequisites
write related database records
create durable job/outbox record

COMMIT
```

Then perform slow work asynchronously.

### Dangerous boundary

```text
BEGIN

database update
HTTP request to AI provider
HTTP request to storage provider
long computation
wait for webhook

COMMIT
```

This can create:

- long-held locks
- connection exhaustion
- deadlocks
- timeouts
- poor throughput
- difficult recovery

External calls should normally be outside short database transactions unless there is a documented reason otherwise.

---

# 8. Atomicity

For every multi-step mutation ask:

> Which operations must succeed together?

Example:

```text
Create business
+
Create initial business configuration
+
Create required ownership relationship
```

If those records represent one logical creation, partial persistence may violate the business invariant.

The implementation must explicitly choose one of:

- one database transaction
- intentionally independent operations
- a state machine
- asynchronous completion
- compensation/recovery

Never allow accidental partial state.

---

# 9. ACID Review

## Atomicity

Required mutations commit together or roll back together.

## Consistency

Database and business invariants remain valid.

## Isolation

Concurrent operations do not create invalid states.

## Durability

Committed state survives process/database failures according to the database's durability guarantees.

For each critical workflow document:

```text
Atomicity requirement:
Consistency invariants:
Isolation requirement:
Durability requirement:
```

Do not use stronger isolation merely because it sounds safer. Choose it based on the invariant being protected.

---

# 10. KEETY Multi-Tenant Transaction Isolation

Tenant isolation is a transaction concern, not only an authorization concern.

Every tenant-owned mutation must answer:

```text
Who owns this record?
Which business/tenant does it belong to?
Can this actor access it?
Can this mutation cross tenant boundaries?
Can a retry reuse an identifier from another tenant?
Can a background job process the wrong tenant?
Can a cache return another tenant's state?
```

### Required invariant

A request authenticated for tenant A must never mutate or read protected transaction state belonging to tenant B.

Do not rely on client-supplied:

```json
{
  "tenantId": "...",
  "businessId": "..."
}
```

as proof of ownership.

Resolve and authorize tenant scope server-side.

---

# 11. Tenant-Scoped Uniqueness

Uniqueness requirements must be modeled at the correct scope.

Some values may be globally unique.

Others may only need uniqueness within a business/tenant.

Examples:

```text
global:
  external_event_id

tenant-scoped:
  product_sku
  business_slug
  idempotency_key
  internal reference
```

Do not accidentally create global uniqueness where tenant-scoped uniqueness is intended.

Do not accidentally allow duplicate tenant-scoped records because the application performs only:

```text
if (!exists) create()
```

Use database constraints for critical uniqueness.

---

# 12. Data Integrity Rules

For every critical mutation identify:

- primary key constraints
- foreign keys
- unique constraints
- check constraints
- nullability
- valid state transitions
- ownership rules
- deletion rules
- version fields
- timestamps
- audit requirements

The database should reject impossible states whenever practical.

Application validation is necessary, but it is not a replacement for database integrity.

---

# 13. Race Conditions

Look for read-modify-write patterns:

```text
READ
 ↓
CHECK
 ↓
CALCULATE
 ↓
WRITE
```

These are dangerous when multiple requests can execute concurrently.

Typical KEETY risks include:

- usage counters
- quotas
- product quantities where applicable
- job claims
- document processing status
- retry counters
- versioned business data
- duplicate ingestion
- duplicate AI jobs
- webhook processing
- concurrent edits
- administrative mutations

Ask:

> What happens when two requests execute this exact code simultaneously?

If the answer depends on timing, the workflow needs deeper concurrency analysis.

---

# 14. Concurrency Strategies

Choose deliberately among:

- atomic SQL update
- unique constraint
- optimistic locking
- pessimistic locking
- serializable transaction
- queue serialization
- compare-and-swap
- state-transition constraint
- idempotency record

Do not use locks by default.

Do not use application-level checks as the only concurrency protection for critical invariants.

---

# 15. Optimistic Locking

Use optimistic concurrency control when silent overwrites would be harmful.

Example:

```text
record.version = 5

Client A reads version 5
Client B reads version 5

A updates where version = 5
→ version 6

B updates where version = 5
→ rejected as stale
```

The API should return a meaningful conflict outcome rather than silently overwriting newer state.

Suitable cases may include:

- business configuration editing
- important document metadata
- administrative configuration
- shared editable records

---

# 16. Pessimistic Locking

Use database locks only where required to protect a critical invariant.

Potential cases:

- scarce resources
- counters that cannot tolerate races
- serialized state transitions
- financial-like balances if present
- job claiming

When using locks:

- keep the transaction short
- lock rows in consistent order
- understand lock scope
- monitor contention
- define timeout behavior
- define retry behavior
- test deadlocks

---

# 17. Deadlocks

Assume deadlocks are possible whenever concurrent transactions acquire multiple locks.

Example:

```text
Transaction A:
  lock X
  wait for Y

Transaction B:
  lock Y
  wait for X
```

Reduce risk through:

- consistent lock ordering
- short transactions
- minimal locked rows
- appropriate indexes
- avoiding unnecessary locking
- bounded retries for transient deadlock errors

Never implement infinite automatic retries.

---

# 18. Idempotency

Every operation with potentially harmful duplicate side effects must have an explicit duplicate strategy.

Examples relevant to KEETY can include:

- document ingestion requests
- AI generation jobs
- recommendation jobs
- webhook events
- notifications
- external provider operations
- imports
- batch processing
- deletion requests
- usage recording

An idempotency key should be scoped correctly.

A useful model is:

```text
tenant_id
+
operation_type
+
idempotency_key
```

The exact key design must match the workflow.

---

# 19. Idempotency Semantics

An idempotent endpoint does not merely reject duplicates.

It should define what happens when the same operation is repeated.

Possible behavior:

```text
First request:
  execute
  persist result

Repeated request:
  return the same logical result
  or safely report current operation state
```

Also define:

- key expiration
- payload mismatch behavior
- tenant scope
- concurrent duplicate requests
- failed first attempt
- in-progress first attempt
- completed first attempt
- storage cleanup

Never reuse an idempotency key for a semantically different operation.

---

# 20. Retry Safety

Retries can turn successful operations into duplicates.

Classic failure:

```text
Client
  ↓
request
  ↓
server completes mutation
  ↓
network timeout
  ↓
client retries
  ↓
duplicate mutation
```

For every retryable operation document:

```text
Can retry?
What makes it safe?
What happens if first attempt actually completed?
How is duplicate detection performed?
What state is returned?
```

Retry only transient failures.

Do not retry validation failures or permanent authorization failures.

---

# 21. Retry Backoff

Where retries are appropriate:

- use bounded retry counts
- use backoff
- use jitter where appropriate
- respect provider rate limits
- distinguish transient from permanent errors
- avoid retry storms
- preserve operation identity

A retry system must not amplify an outage into a larger outage.

---

# 22. Unique Constraints as Concurrency Protection

Never depend exclusively on:

```text
if (!exists) {
  create()
}
```

Two concurrent requests can both observe absence.

Prefer:

```text
application check
+
database unique constraint
+
correct duplicate-error handling
```

The database remains the final enforcement layer for critical uniqueness.

---

# 23. State Machines

Any multi-stage KEETY workflow should have explicit states when the operation can outlive a request.

Example:

```text
PENDING
  ↓
PROCESSING
  ↓
COMPLETED
```

Failure:

```text
PROCESSING
  ↓
FAILED
```

Retry:

```text
FAILED
  ↓
RETRY_PENDING
  ↓
PROCESSING
```

Cancellation:

```text
PENDING / PROCESSING
  ↓
CANCELLED
```

Do not allow arbitrary state changes.

---

# 24. State Transition Matrix

For each important workflow create a transition matrix.

Example:

| Current | Event | Next | Allowed? |
|---|---|---|---|
| PENDING | start | PROCESSING | Yes |
| PROCESSING | success | COMPLETED | Yes |
| PROCESSING | failure | FAILED | Yes |
| FAILED | retry | RETRY_PENDING | Yes |
| COMPLETED | retry | PROCESSING | Usually no |
| COMPLETED | cancel | CANCELLED | Usually no |

The exact transitions must be defined by the workflow.

The API must not trust client-provided status.

---

# 25. Source of Truth

Every important state must have one authoritative source.

Examples:

```text
Database:
  tenant/business metadata
  workflow status
  job status
  ownership
  permissions

Object storage:
  original uploaded file

Vector/search system:
  derived retrieval representation

External provider:
  provider-side operation status

Database:
  application's interpretation of provider state
```

A derived system must not silently become the authoritative source for state that belongs to the primary database.

---

# 26. External API Boundary

A database transaction cannot automatically roll back an external service.

Never design:

```text
BEGIN
  database mutation
  external API call
  database mutation
COMMIT
```

as though the entire sequence were one atomic transaction.

Instead model:

```text
LOCAL STATE
    ↓
EXTERNAL OPERATION
    ↓
CONFIRMATION / CALLBACK / RECONCILIATION
    ↓
FINAL LOCAL STATE
```

Use idempotency and explicit state.

---

# 27. Distributed Workflow Patterns

When a workflow crosses systems, choose an explicit pattern:

### Pattern A — Transaction + durable job

```text
DB transaction
  ↓
create job/outbox
  ↓
commit
  ↓
worker
```

### Pattern B — Saga

```text
Step A
 ↓
Step B
 ↓
Step C

failure
 ↓
compensation
```

### Pattern C — Reconciliation

```text
local state
   ↕
external state

periodic reconciliation
```

### Pattern D — State machine

```text
PENDING
PROCESSING
WAITING_EXTERNAL
COMPLETED
FAILED
```

Use the simplest pattern that provides the required correctness.

---

# 28. Outbox Pattern

Use an outbox when KEETY requires reliable coordination between a database mutation and an event/message.

Example:

```text
BEGIN

update business state
create outbox event

COMMIT
```

Then:

```text
outbox worker
   ↓
publish event
   ↓
mark published
```

This prevents the classic failure:

```text
DB update succeeds
event publish fails
event is permanently lost
```

The outbox itself must be:

- durable
- tenant-aware
- idempotently published
- observable
- retryable
- safe under concurrent workers

Do not add an outbox solely because it is fashionable. Use it where the reliability requirement justifies it.

---

# 29. Queue Reliability

For every queue/job system review:

- enqueue durability
- duplicate delivery
- worker crash
- visibility timeout
- retry count
- backoff
- dead-letter handling
- poison messages
- ordering requirements
- idempotency
- job timeout
- cancellation
- stuck jobs
- tenant isolation
- observability

Assume at-least-once delivery unless the infrastructure and workflow explicitly provide stronger guarantees.

---

# 30. Worker Crash Scenario

Test:

```text
worker receives job
  ↓
performs side effect
  ↓
worker crashes
  ↓
message becomes available again
  ↓
job runs again
```

The second execution must not corrupt state.

Use:

- idempotency
- unique operation records
- state checks
- compare-and-set updates
- transactional job state
- safe external provider keys

where appropriate.

---

# 31. Webhook Reliability

If KEETY consumes webhooks, treat them as untrusted, duplicated, delayed, and potentially reordered messages.

Verify:

- signature
- source authenticity
- event ID
- timestamp/replay protection where supported
- tenant mapping
- payload validation
- idempotency
- ordering requirements
- retry behavior
- processing state

Never assume exactly-once webhook delivery.

---

# 32. File Upload and Processing Workflow

A typical KEETY file workflow may look like:

```text
Upload
  ↓
Create document metadata
  ↓
Persist storage reference
  ↓
PENDING
  ↓
INGESTING
  ↓
EXTRACTING
  ↓
CHUNKING
  ↓
EMBEDDING
  ↓
INDEXING
  ↓
READY
```

Failure should produce an explicit recoverable state:

```text
FAILED
```

Do not leave records permanently stuck in:

```text
PROCESSING
```

unless that state is intentionally resumable and monitored.

---

# 33. File Transaction Rules

Never assume database rollback deletes an uploaded object.

If:

```text
database record created
storage upload succeeds
database transaction later fails
```

the storage object may become orphaned.

Define cleanup or reconciliation.

Likewise, if:

```text
database deletion succeeds
storage deletion fails
```

the object may remain.

Deletion workflows need explicit recovery.

---

# 34. AI / RAG Transaction Model

KEETY AI/RAG workflows are distributed workflows, not one database transaction.

A typical flow:

```text
Source document
  ↓
Document metadata
  ↓
Extraction
  ↓
Normalization
  ↓
Chunking
  ↓
Embedding generation
  ↓
Vector/index write
  ↓
Index verification
  ↓
Document READY
```

Every boundary must have explicit state and recovery.

---

# 35. RAG Ingestion Atomicity

Do not mark a source `READY` merely because one processing step succeeded.

For example:

```text
80% embeddings created
worker crashes
```

The system must not report:

```text
READY
```

unless the workflow's readiness invariant is actually satisfied.

Use:

- counts
- checkpoints
- version identifiers
- processing state
- job state
- retry state
- reconciliation

as appropriate.

---

# 36. RAG Versioning

Derived knowledge should be associated with a source/version where necessary.

A useful conceptual model:

```text
source_document
    ↓
content_version
    ↓
chunks
    ↓
embeddings/index entries
```

When source content changes:

```text
old version
   ↓
new version
   ↓
re-index
```

Do not allow old and new knowledge versions to be mixed accidentally.

---

# 37. RAG Deletion Consistency

Deleting source knowledge is a distributed workflow.

Review:

```text
database source record
        ↓
object/file storage
        ↓
chunks
        ↓
embeddings
        ↓
vector/search index
        ↓
cache
        ↓
derived AI artifacts
```

The source must not appear deleted in the application while its old content remains retrievable through another path.

If deletion is asynchronous, expose a clear state such as:

```text
DELETE_PENDING
DELETING
DELETED
DELETE_FAILED
```

and reconcile failures.

---

# 38. AI Job Idempotency

AI generation can be expensive.

Duplicate execution may cause:

- unnecessary provider cost
- duplicate results
- conflicting writes
- inconsistent recommendations
- quota inflation
- repeated notifications

Every expensive AI workflow should define:

```text
operation identity
input identity
tenant identity
model/config identity where relevant
current state
result identity
retry policy
```

Do not assume an AI provider call is free to repeat.

---

# 39. AI Provider Failure

Possible outcomes include:

```text
provider rejects request
provider times out
provider returns an error
provider completes but response is lost
server crashes after provider completion
rate limit occurs
quota is exhausted
```

The workflow must distinguish:

```text
NOT_STARTED
IN_PROGRESS
SUCCEEDED
FAILED
UNKNOWN
```

where an `UNKNOWN` state is needed to represent uncertainty after an ambiguous external outcome.

Do not incorrectly mark an ambiguous external operation as definitely failed if the provider may have completed it.

---

# 40. AI/RAG Result Integrity

Persist enough metadata to understand how a result was produced where required.

Examples:

- source/version identity
- job/operation ID
- model/provider identifier
- prompt/config version
- retrieval/index version where relevant
- creation timestamp
- tenant/business identity
- status

Do not let a later retry overwrite a newer successful result without an explicit rule.

---

# 41. Business Data → AI Consistency

When business data changes, determine whether existing AI-derived results become stale.

Example:

```text
Business data updated
       ↓
old recommendation still exists
```

Decide whether the system should:

- invalidate it
- version it
- regenerate it
- mark it stale
- continue using it intentionally

The answer must be a documented business rule.

---

# 42. Cache Consistency

Caching creates another state copy.

For every cache affected by a transaction ask:

```text
When is cache updated?
When is cache invalidated?
What if invalidation fails?
Can one tenant receive another tenant's cached result?
Can stale data be served?
Can a failed mutation leave stale cache?
```

Never use a cache as the authoritative source for critical transactional state unless explicitly designed that way.

---

# 43. Authorization During Transactions

A valid transaction must also be an authorized transaction.

Verify:

- authenticated actor
- tenant/business scope
- resource ownership
- role/permission
- operation permission
- server-side state
- immutable identifiers
- administrative privileges

Never allow clients to directly set:

```text
status
owner
tenantId
approved
completed
verified
role
permissions
```

unless the specific field is intentionally client-controlled and validated.

---

# 44. IDOR / BOLA Transaction Review

Test:

```text
User A creates resource A
User B attempts to mutate resource A
```

Also test:

```text
same resource ID
different tenant
different business
different role
expired authorization
revoked authorization
```

The mutation must fail when scope is not authorized.

---

# 45. Audit Trail

For sensitive state changes, consider an audit record containing:

- actor identity
- tenant/business identity
- operation ID
- request ID
- resource identity
- previous state
- new state
- action
- timestamp
- relevant reason/context

Do not store unnecessary secrets, tokens, passwords, raw credentials, or sensitive payloads.

Audit logs must themselves respect tenant and privacy boundaries.

---

# 46. Transaction Observability

Important workflows should be traceable across synchronous and asynchronous boundaries.

Recommended correlation concepts:

```text
request_id
    ↓
operation_id
    ↓
transaction/database work
    ↓
job_id / event_id
    ↓
worker
    ↓
external provider request
    ↓
final state
```

Use stable identifiers rather than relying on log message text.

---

# 47. Error Taxonomy

Transaction code should distinguish at least:

```text
validation error
authorization error
conflict
duplicate/idempotency replay
not found
transient database error
deadlock
timeout
external provider error
permanent external error
worker failure
unknown external outcome
internal invariant violation
```

Do not convert every failure into a generic retry.

---

# 48. Rollback Is Not Compensation

Database rollback can undo database mutations.

It does not automatically undo:

- email
- AI provider calls
- object uploads
- webhook delivery
- external API operations
- already-published messages
- third-party mutations

For every external side effect ask:

> What compensates this action if the next step fails?

If there is no compensation, use a state/reconciliation design that prevents false success.

---

# 49. Saga / Compensation

For a workflow:

```text
Reserve
  ↓
Create
  ↓
External operation
  ↓
Finalize
```

define compensation where required:

```text
external failure
  ↓
cancel local operation
  ↓
release reservation
  ↓
mark workflow FAILED
```

Compensation itself can fail.

Therefore compensation must also be:

- retryable
- idempotent
- observable
- auditable

---

# 50. Recovery and Reconciliation

Every important asynchronous workflow should answer:

```text
How is stuck work detected?
How is it retried?
How is it manually recovered?
How is final state verified?
How are orphaned records detected?
How are orphaned files detected?
How are stale vector/index records detected?
```

A production system needs reconciliation, not only retries.

---

# 51. Stuck-State Detection

Define maximum expected processing duration for each long-running state.

Example:

```text
PROCESSING
expected: < 5 minutes
```

If it remains longer:

```text
PROCESSING
  ↓
stale detection
  ↓
retry / recover / investigate
```

Do not blindly reset every old job. Verify ownership and current execution state to avoid two workers processing the same operation.

---

# 52. Database Failure Scenarios

Test:

### Failure A

Database unavailable before transaction begins.

### Failure B

Database connection drops during transaction.

### Failure C

Commit response is lost.

### Failure D

Transaction times out.

### Failure E

Deadlock occurs.

### Failure F

Database restarts after commit.

For ambiguous commit outcomes, do not assume the operation definitely failed merely because the client did not receive the response.

Use operation identity and reconciliation.

---

# 53. Commit Ambiguity

One of the most dangerous distributed failure windows is:

```text
server
  ↓
COMMIT
  ↓
database commits
  ↓
network failure
  ↓
client receives timeout
```

The client may retry.

Therefore critical mutations need durable operation identity and safe retry semantics.

This is especially important for:

- expensive AI jobs
- imports
- document ingestion
- external operations
- usage/quota mutations
- notifications
- any non-repeatable side effect

---

# 54. Transaction Timeouts

Every transaction must have reasonable limits.

Long transactions can:

- hold locks
- consume connections
- increase contention
- increase deadlocks
- reduce throughput
- amplify failures

Never solve slow business processing by simply increasing transaction timeout.

First ask whether the workflow should be split.

---

# 55. Performance Review

Measure:

- transaction duration
- lock duration
- query count
- rows touched
- database round trips
- connection usage
- queue delay
- external API latency
- worker duration
- retry frequency
- contention
- payload size

Optimize correctness before micro-optimizing latency.

---

# 56. Transaction + Async Boundary

A common KEETY pattern should be:

```text
REQUEST
  ↓
validate
  ↓
authorize
  ↓
BEGIN
  ↓
write authoritative state
create durable job/event
  ↓
COMMIT
  ↓
return
  ↓
WORKER
  ↓
perform expensive work
  ↓
persist result
```

This is preferable to keeping a database transaction open while waiting for expensive AI or file processing.

---

# 57. Exactly-Once Is Usually an Application Property

Do not assume infrastructure magically provides exactly-once business effects.

Instead design:

```text
at-least-once delivery
+
idempotent consumer
+
unique operation identity
+
state checks
```

This is often more realistic and robust.

---

# 58. Ordering

If events can arrive out of order, define whether ordering matters.

Example:

```text
BusinessUpdated(version 7)
BusinessUpdated(version 8)
```

If version 8 arrives first, the consumer must not blindly apply version 7 afterward.

Possible strategies:

- version checks
- sequence numbers
- timestamps only when semantically safe
- partition ordering
- state comparison

Do not assume network or queue ordering unless guaranteed by the actual infrastructure.

---

# 59. Cancellation

Long-running jobs need explicit cancellation semantics when users can cancel them.

Define:

```text
PENDING → CANCELLED
PROCESSING → CANCELLATION_REQUESTED → CANCELLED
```

The worker must check cancellation at safe points.

Cancellation must not leave:

- half-written derived data
- incorrect final status
- orphaned resources
- misleading AI results

---

# 60. Deletion Workflows

Deletion is a transaction workflow, especially for tenant/business data.

Review:

```text
primary record
↓
child records
↓
files
↓
derived indexes
↓
embeddings
↓
caches
↓
jobs
↓
events
↓
audit/retention requirements
```

Define whether deletion is:

- synchronous
- asynchronous
- soft delete
- hard delete
- retention-based

Do not mix deletion semantics accidentally.

---

# 61. Tenant Deletion

For tenant/business deletion, explicitly define:

- authorization
- confirmation
- active jobs
- pending events
- documents
- vector data
- cached data
- derived AI artifacts
- external resources
- audit/retention obligations
- recovery window if any

A tenant deletion operation must not leave accessible data through a secondary system.

---

# 62. Import / Bulk Operations

Bulk imports require stronger transaction design than ordinary CRUD.

Consider:

```text
file
 ↓
validation
 ↓
staging
 ↓
validation summary
 ↓
commit
```

Avoid inserting millions of records directly into the authoritative dataset without a failure/recovery strategy.

Define:

- batch size
- partial failure semantics
- duplicate handling
- idempotency
- resume behavior
- rollback/compensation
- progress state
- tenant scope

---

# 63. Batch Job Atomicity

A large job does not necessarily need one giant transaction.

Prefer bounded batches when business rules allow:

```text
batch 1 → committed
batch 2 → committed
batch 3 → failed
```

Then define whether the business outcome is:

- partial success
- complete rollback
- resumable
- compensatable

Do not let implementation accidentally decide business semantics.

---

# 64. Usage and Quota Transactions

If KEETY tracks usage, quotas, credits, limits, or billing-like values, treat them as critical state.

Review:

- concurrent increments
- duplicate requests
- retries
- worker duplication
- negative values
- maximum limits
- tenant scope
- reset boundaries
- reconciliation
- auditability

Never trust a client-provided usage count.

---

# 65. Notification Transactions

Notifications are external side effects.

Do not assume:

```text
DB transaction rollback
```

will undo a sent notification.

Use durable notification state:

```text
PENDING
SENDING
SENT
FAILED
```

and idempotency where duplicate delivery is harmful.

---

# 66. Cache + Transaction Failure

Consider:

```text
DB commit succeeds
cache invalidation fails
```

The cache may be stale.

Or:

```text
cache invalidated
DB transaction fails
```

The cache may temporarily miss valid data.

The system should define acceptable consistency rather than relying on luck.

---

# 67. Transaction Security

Review every critical mutation for:

- authentication
- authorization
- tenant isolation
- input validation
- object ownership
- replay
- IDOR/BOLA
- mass assignment
- privilege escalation
- client-controlled state
- sensitive logging
- secret exposure

Security is part of transaction correctness.

---

# 68. Transaction Testing Strategy

Every critical transaction must be tested beyond the happy path.

Minimum scenarios:

1. normal success
2. invalid input
3. unauthorized actor
4. wrong tenant
5. duplicate request
6. concurrent request
7. stale version
8. database failure
9. timeout
10. deadlock
11. external failure
12. worker crash
13. retry
14. partial completion
15. recovery
16. cancellation where applicable
17. stale event
18. out-of-order event where applicable

---

# 69. Concurrency Testing

Do not test concurrency only with sequential unit tests.

For critical workflows execute:

```text
N identical requests
```

at the same time.

Check for:

- duplicate records
- lost updates
- invalid counters
- incorrect states
- unique constraint violations
- deadlocks
- lock contention
- duplicate jobs
- duplicate AI work
- cross-tenant effects

Use realistic concurrency levels for the workload.

---

# 70. Failure Injection

Where practical, inject failures at every boundary:

```text
before DB write
after DB write
before commit
after commit
before external call
after external call
before event publish
after event publish
before worker acknowledgement
after side effect
during file processing
during embedding generation
during index update
```

The purpose is to discover states that ordinary tests never reach.

---

# 71. Transaction Test Matrix

For each critical workflow:

| Scenario | Expected behavior |
|---|---|
| Normal request | Correct completion |
| Invalid input | Rejected without mutation |
| Unauthorized request | Rejected |
| Wrong tenant | Rejected |
| Duplicate request | No harmful duplicate |
| Concurrent request | Invariant preserved |
| Database failure | Safe rollback/recovery |
| Commit ambiguity | Safe reconciliation |
| External timeout | Correct uncertain/retry state |
| External success + local failure | Compensation/reconciliation |
| Worker crash | Safe retry |
| Duplicate job | Idempotent result |
| Partial processing | Not falsely marked complete |
| Stale update | Conflict/rejection |
| Invalid state transition | Rejected |
| Cancellation | Consistent terminal state |
| Recovery | Final state becomes correct |

---

# 72. Transaction Invariants

For every important workflow write explicit invariants.

Examples:

```text
A READY document has all required derived data.

A COMPLETED job has a valid result.

A tenant cannot access another tenant's transaction.

An idempotent operation cannot create two logical executions.

A stale version cannot overwrite a newer version.

A failed operation cannot be reported as successful.

A deleted knowledge source cannot remain retrievable through a supported RAG path.

A worker retry cannot create a second logical side effect.
```

Tests should verify these invariants directly.

---

# 73. Production Incident Questions

Review the system as if an incident occurred.

Ask:

> Can two requests corrupt the same state?

> Can the same operation execute twice?

> Can a commit succeed while the client sees a timeout?

> Can an external call succeed while local persistence fails?

> Can an event be lost after a database commit?

> Can a worker perform a side effect and crash before acknowledgement?

> Can a job remain stuck forever?

> Can stale AI/RAG data remain active after source data changes?

> Can deleted data remain accessible through a derived system?

> Can a tenant boundary be crossed through an asynchronous job?

> Can a client manipulate workflow status?

> Can recovery itself create duplicates?

Every “yes” or “unknown” requires investigation.

---

# 74. 10× / 100× / 1,000× Concurrency Review

Do not assume a workflow that works once will remain correct under concurrency.

Model:

```text
1 request
10 requests
100 requests
1,000 concurrent requests
```

Evaluate:

- database connections
- lock contention
- transaction latency
- queue depth
- duplicate work
- external provider limits
- rate limits
- retry storms
- memory pressure
- worker saturation

Correctness problems must be fixed before performance tuning.

---

# 75. Production Disaster Scenarios

At minimum simulate conceptually, and where feasible operationally:

### A — Database failure during mutation

Expected: no invalid partial state.

### B — External provider succeeds, server crashes

Expected: operation can be reconciled without harmful duplication.

### C — Client retries three times

Expected: duplicate side effects are prevented where required.

### D — Two users update the same resource

Expected: concurrency policy is enforced.

### E — Worker processes the same job twice

Expected: idempotent outcome.

### F — Network timeout after server completion

Expected: retry can safely discover existing operation state.

### G — Deployment occurs during processing

Expected: in-flight work is recoverable and migrations are compatible with active workers.

### H — Vector/index update fails after source update

Expected: source state does not falsely claim derived readiness.

### I — Tenant deletion occurs while a worker is processing

Expected: worker cannot recreate or leak deleted tenant state.

---

# 76. Deployment and Migration Safety

Transaction correctness includes deployment behavior.

Review:

- backward-compatible schema changes
- running workers using old code
- running requests using old code
- long migrations
- locks caused by migrations
- rollback strategy
- partial deployment
- queue compatibility
- event schema compatibility

Avoid deployments that require every worker and request to change atomically unless the platform actually guarantees that behavior.

---

# 77. Schema Migration Rules

For high-risk changes prefer an expand/contract strategy:

```text
1. Add compatible schema
2. Deploy code that can use old + new
3. Backfill safely
4. Switch reads/writes
5. Verify
6. Remove old structure later
```

Do not combine irreversible schema destruction with an unverified application deployment.

---

# 78. Transaction Observability Metrics

Monitor at least where relevant:

- transaction duration
- transaction failure rate
- deadlock rate
- lock wait time
- retry rate
- duplicate/idempotency hits
- job retry rate
- job age
- stuck-job count
- outbox backlog
- webhook duplicate rate
- external timeout rate
- AI job failure rate
- ingestion failure rate
- RAG indexing lag
- reconciliation failures
- tenant-isolation violations
- invariant violations

Metrics should lead to actionable investigation.

---

# 79. Logging Rules

Transaction logs should make it possible to answer:

```text
Who?
Which tenant?
Which operation?
Which resource?
Which attempt?
Which state?
Which dependency?
What failed?
Was it retried?
What was the final state?
```

Do not log secrets or unnecessary sensitive content.

Do not use raw AI prompts, uploaded documents, access tokens, or provider credentials as ordinary logs unless explicitly justified and protected.

---

# 80. Manual Recovery

Production systems need controlled recovery procedures.

For every critical workflow define whether operators can:

- retry
- cancel
- reconcile
- replay
- mark failed
- rebuild derived data
- re-index
- repair orphan records

Manual recovery must preserve:

- authorization
- tenant scope
- auditability
- idempotency
- state-transition rules

Never make production repair equivalent to directly editing arbitrary database fields.

---

# 81. Reconciliation Jobs

Where two systems can legitimately diverge, build reconciliation.

Examples:

```text
source database ↔ derived index
database ↔ object storage
database ↔ external provider
job state ↔ actual processing result
outbox state ↔ published events
```

A reconciliation job should:

1. identify divergence
2. classify it
3. repair only safe cases
4. record what happened
5. surface unresolved cases

---

# 82. Recovery Priority

When a failure occurs, recovery order should preserve the authoritative state.

Prefer:

```text
1. establish authoritative state
2. protect tenant isolation
3. prevent duplicate side effects
4. reconcile derived state
5. restore asynchronous processing
6. clean up orphaned resources
```

Do not repair derived data by corrupting authoritative state.

---

# 83. Transaction Review Checklist

For every critical workflow verify:

### Boundary

- [ ] Correct transaction start
- [ ] Correct transaction end
- [ ] No unnecessary external calls inside transaction
- [ ] Reasonable timeout

### Integrity

- [ ] Database constraints
- [ ] Foreign keys
- [ ] Unique constraints
- [ ] State-transition rules
- [ ] Tenant scope

### Concurrency

- [ ] Race conditions analyzed
- [ ] Locking strategy justified
- [ ] Optimistic concurrency where appropriate
- [ ] Deadlocks considered
- [ ] Concurrent tests exist

### Idempotency

- [ ] Duplicate request behavior defined
- [ ] Duplicate job behavior defined
- [ ] Retry behavior defined
- [ ] Operation identity persisted where necessary

### External systems

- [ ] External failure modeled
- [ ] Timeout modeled
- [ ] Ambiguous outcome modeled
- [ ] Compensation/reconciliation defined

### Async

- [ ] Job durability
- [ ] Worker retry
- [ ] Worker crash recovery
- [ ] Dead-letter handling
- [ ] Stuck-job detection

### AI/RAG

- [ ] Processing states
- [ ] Source/version tracking
- [ ] Partial indexing protection
- [ ] Deletion propagation
- [ ] Duplicate AI job protection
- [ ] Stale-result policy

### Security

- [ ] Authorization
- [ ] Tenant isolation
- [ ] IDOR/BOLA testing
- [ ] Client cannot forge protected state
- [ ] Sensitive data not leaked through logs

### Recovery

- [ ] Reconciliation
- [ ] Manual recovery path
- [ ] Audit trail
- [ ] Observability
- [ ] Disaster scenarios tested

---

# 84. Transaction Review Record

For each critical workflow, produce a short review record:

```text
Workflow:
Owner:
Tenant scope:
Authoritative source:
Trigger:
Transaction boundary:
State machine:
Critical invariants:

Database writes:
External calls:
Jobs/events:
Files:
AI/RAG dependencies:

Idempotency:
Concurrency strategy:
Isolation level:
Retry policy:
Timeout:
Compensation:
Reconciliation:

Failure states:
Recovery procedure:

Observability:
Audit requirements:

Tests:
Known limitations:
Open risks:
```

This prevents transaction decisions from remaining implicit.

---

# 85. Evidence Standard

Do not mark a transaction “safe” because:

- the code looks clean
- the endpoint works once
- tests are green
- coverage is high
- a framework provides transactions
- a queue claims reliability
- a provider claims idempotency
- a developer says duplicates cannot happen

A transaction is considered reviewed only when the relevant implementation, database constraints, asynchronous behavior, failure paths, and tests have been inspected.

Use statuses such as:

```text
VERIFIED
PARTIAL
UNVERIFIED
BROKEN
RISK
NOT APPLICABLE
```

Every `VERIFIED` claim should have evidence.

---

# 86. What Not To Do

Do not:

- wrap every request in a database transaction
- call slow external services while holding locks
- rely only on frontend state
- rely only on application-level uniqueness checks
- assume retries are safe
- assume queues deliver exactly once
- assume webhooks arrive once or in order
- assume rollback undoes external side effects
- mark asynchronous work complete too early
- silently overwrite concurrent changes
- ignore tenant scope in jobs
- treat vector indexes as automatically consistent
- treat AI results as transactional just because the result is stored in a database
- create distributed transactions without a real requirement
- add locks without understanding contention
- retry permanent failures forever
- hide stuck jobs by repeatedly changing timestamps
- delete source records without considering derived data
- call a workflow “atomic” when it crosses independent systems

---

# 87. KEETY Critical Invariants

The following principles should remain true unless a documented business requirement explicitly changes them:

1. **Tenant isolation is preserved across synchronous and asynchronous paths.**
2. **Critical database invariants are enforced at the database boundary.**
3. **A duplicate operation does not create an unintended duplicate side effect.**
4. **A retry cannot silently turn one logical operation into multiple logical operations.**
5. **Concurrent mutations cannot silently lose important updates.**
6. **Workflow states represent real processing state.**
7. **A workflow is not marked complete before its readiness invariant is satisfied.**
8. **External side effects have explicit recovery or reconciliation behavior.**
9. **Derived RAG/AI state cannot silently become authoritative over source business data.**
10. **Deletion does not leave supported retrieval paths serving deleted knowledge.**
11. **Background workers cannot cross tenant boundaries.**
12. **A crash does not permanently strand important work without detection.**
13. **Operators can determine what happened from logs, IDs, states, and audit records.**
14. **Recovery operations are themselves safe and idempotent where required.**

---

# 88. Final Transaction Quality Gate

Do not declare a critical KEETY workflow production-ready until:

- [ ] Workflow is identified
- [ ] Data flow is documented
- [ ] Tenant boundary is explicit
- [ ] Authorization is verified
- [ ] Source of truth is defined
- [ ] Transaction boundary is justified
- [ ] ACID requirements are documented
- [ ] Database constraints are reviewed
- [ ] Race conditions are analyzed
- [ ] Isolation strategy is justified
- [ ] Locking strategy is justified
- [ ] Deadlocks are considered
- [ ] Idempotency is defined where necessary
- [ ] Retry behavior is safe
- [ ] External failure behavior is defined
- [ ] Ambiguous outcomes are handled
- [ ] State transitions are controlled
- [ ] Queue semantics are understood
- [ ] Worker duplication is safe
- [ ] Webhook duplication is safe where applicable
- [ ] File recovery is defined
- [ ] AI/RAG recovery is defined
- [ ] Derived-data consistency is defined
- [ ] Deletion propagation is defined
- [ ] Cache consistency is understood
- [ ] Observability exists
- [ ] Audit requirements are satisfied
- [ ] Concurrency tests exist
- [ ] Failure tests exist
- [ ] Recovery tests exist
- [ ] Deployment/migration impact is reviewed
- [ ] Manual recovery is documented
- [ ] Reconciliation exists where required
- [ ] Known limitations are recorded

---

# 89. Final Senior Engineer Test

Stop thinking about the happy path.

Imagine KEETY receives:

```text
1,000 concurrent requests
+
duplicate requests
+
network timeouts
+
database failures
+
worker crashes
+
queue redelivery
+
external API failures
+
AI provider rate limits
+
partial RAG indexing
+
tenant deletion during background processing
+
deployment during active jobs
```

Then ask:

> Does the authoritative data remain correct?

> Can any tenant see or mutate another tenant's data?

> Can one logical operation create multiple harmful side effects?

> Can a successful external operation become permanently unknown?

> Can a job become permanently stuck?

> Can old RAG knowledge remain active after deletion?

> Can concurrent edits silently overwrite each other?

> Can recovery create a second failure?

> Can an operator prove what happened?

If the answer is **unknown**, the workflow is not fully reviewed.

If the answer is **no**, the workflow is not production-ready.

Investigate the exact failure mode, redesign the workflow, add a regression test, and review again.

---

# 90. Final Principle

KEETY transaction engineering is not:

```text
BEGIN
  UPDATE
  INSERT
COMMIT
```

It is:

```text
Correctness
+
Atomicity
+
Consistency
+
Concurrency safety
+
Tenant isolation
+
Idempotency
+
Retry safety
+
External-system recovery
+
State-machine correctness
+
Queue reliability
+
AI/RAG recoverability
+
Deletion consistency
+
Observability
+
Security
+
Testing
+
Reconciliation
```

The standard is not:

> “The request usually works.”

The standard is:

> **The logical operation remains correct under success, failure, duplication, concurrency, timeout, crash, retry, asynchronous execution, external-system uncertainty, and recovery.**

A transaction is complete only when its **state, invariants, side effects, failure modes, and recovery behavior** are understood and tested.

**Do not optimize for green tests alone. Optimize for durable correctness.**
