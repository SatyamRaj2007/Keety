# Automation.md — KEETY Production Automation Architecture & Reliability Specification

> **Status:** Canonical automation specification  
> **Scope:** KEETY MVP → production  
> **Audience:** Backend, AI, RAG, DevOps, QA/SDET, Security, Data, and product engineering  
> **Principle:** Automation is not successful because it ran once. It is successful when it runs correctly, fails safely, recovers predictably, remains tenant-isolated, is observable, is cost-controlled, and can be operated by humans.

---

# 1. Purpose

KEETY is a multi-tenant AI business assistant. Automation is responsible for reliable execution of asynchronous and scheduled work around:

- business-data ingestion
- document processing
- RAG indexing
- AI insight generation
- recommendations
- scheduled reports
- notifications
- integration synchronization
- webhook handling
- usage aggregation
- cleanup
- retries and recovery
- administrative workflows
- future business automations

Automation must **orchestrate** work. It must not become an uncontrolled second backend.

---

# 2. Automation Authority

This document defines:

- automation boundaries
- trigger rules
- job lifecycle
- queue behavior
- retries
- idempotency
- concurrency
- scheduling
- workflow state
- failure recovery
- AI automation safety
- RAG processing
- tenant isolation
- observability
- cost controls
- deployment/versioning
- testing
- disaster recovery
- operational runbooks

The following documents remain authoritative for their own domains:

- `architecture.md` — system boundaries and architecture
- `backend.md` — API/application behavior
- `database.md` — persistence and constraints
- `Transaction.md` — transactional guarantees
- `Security.md` — security controls
- `testing.md` — verification strategy
- `AI.md` — model/agent behavior
- `RAG.md` — retrieval/indexing behavior
- `FindandFixbugAutomation.md` — automated defect detection/remediation
- `review.md` — engineering review gates
- `dependency.md` — dependency governance

If automation conflicts with a security requirement, **security wins**.
If automation conflicts with a transaction invariant, **the transaction invariant wins**.
If an automation requires undocumented behavior, document the behavior before shipping.

---

# 3. Brutal Automation Rule

Never approve a workflow merely because:

- the webhook fired
- the queue consumed a message
- the API returned 200
- the AI returned text
- the database changed
- the email provider accepted a request
- the workflow engine reported success

Every production automation must answer:

1. What triggered it?
2. Who/what is allowed to trigger it?
3. What tenant does it belong to?
4. What state does it create?
5. What side effects can it cause?
6. What happens if it runs twice?
7. What happens if two workers run it simultaneously?
8. What happens if step 2 succeeds and step 3 fails?
9. What happens if the dependency is unavailable?
10. What happens if the payload is malicious?
11. What happens if the workflow is deployed while running?
12. What happens if 10x normal traffic arrives?
13. How is the failure detected?
14. How is the failure recovered?
15. Can the operation be replayed safely?
16. How much can one broken job damage?
17. How much does each execution cost?
18. How do we prove the business result?

If these questions cannot be answered, the automation is incomplete.

---

# 4. KEETY Automation Goals

Automation must optimize for:

```text
Correctness
+
Tenant isolation
+
Idempotency
+
Recoverability
+
Observability
+
Security
+
Controlled concurrency
+
Controlled cost
+
Maintainability
+
Business value
```

Do not optimize for:

- number of workflows
- number of queue workers
- workflow-node count
- maximum throughput without business need
- AI calls
- retries
- automation for its own sake

---

# 5. KEETY Automation Inventory

Every automation must exist in a registry.

Minimum registry fields:

| Field | Required |
|---|---|
| automation_id | yes |
| name | yes |
| owner | yes |
| purpose | yes |
| trigger_type | yes |
| tenant_scope | yes |
| input_schema | yes |
| output/effect | yes |
| queue | where applicable |
| priority | yes |
| timeout | yes |
| retry_policy | yes |
| idempotency_strategy | yes |
| concurrency_limit | yes |
| dependencies | yes |
| blast_radius | yes |
| observability | yes |
| recovery_strategy | yes |
| version | yes |
| enabled/enabled_at | yes |
| last_reviewed_at | yes |

No production automation may be "hidden" in:

- random cron files
- untracked scripts
- database triggers
- CI jobs
- worker code
- n8n workflows
- cloud functions
- admin scripts

without being registered.

---

# 6. Automation Classes

KEETY should classify automation into:

## 6.1 Synchronous request work

Use for:

- short validation
- lightweight state changes
- operations requiring immediate user response

Do not perform long AI/RAG/document work synchronously.

## 6.2 Background jobs

Use for:

- document processing
- embedding generation
- RAG indexing
- report generation
- analytics aggregation
- notifications
- integrations

## 6.3 Scheduled jobs

Use for:

- daily/weekly insights
- cleanup
- reconciliation
- usage aggregation
- stale-job recovery

## 6.4 Event-driven workflows

Use for:

- business state changes
- document uploaded
- integration event received
- user action requiring asynchronous processing

## 6.5 Webhook ingestion

Use for:

- trusted external events

Webhook processing must be separated from business processing.

## 6.6 Human-approved workflows

Use when the result can cause:

- destructive changes
- financial consequences
- external communication at scale
- irreversible actions
- sensitive configuration changes

---

# 7. Automation vs Application Code

Use normal backend code for:

- core business rules
- authorization
- validation
- deterministic calculations
- transaction logic
- state transitions

Use automation/workflow infrastructure for:

- orchestration
- asynchronous execution
- retries
- scheduling
- integration coordination
- long-running workflows

A workflow engine must not become the only place where critical business rules exist.

---

# 8. Automation vs Database

Database mechanisms should enforce:

- uniqueness
- foreign keys
- required invariants
- atomic state changes
- constraints

Do not rely on a workflow to enforce a property the database can safely enforce.

---

# 9. Automation vs AI

AI can:

- classify
- summarize
- extract
- recommend
- generate drafts
- prioritize
- suggest actions

AI must not independently bypass:

- authorization
- tenant isolation
- deterministic validation
- business constraints
- approval requirements

AI output is untrusted input to the automation layer.

---

# 10. Canonical Job Lifecycle

Every durable background job should conceptually follow:

```text
created
  ↓
queued
  ↓
claimed
  ↓
running
  ↓
success
```

Failure path:

```text
running
  ↓
retryable_failure
  ↓
scheduled_for_retry
  ↓
queued
```

Terminal failure:

```text
running
  ↓
failed
  ↓
dead_letter
```

Recovery:

```text
dead_letter
  ↓
review
  ↓
repair/replay
  ↓
queued
```

Do not silently delete failed jobs.

---

# 11. Job State Machine

Recommended states:

```text
PENDING
QUEUED
RUNNING
SUCCEEDED
RETRY_WAIT
FAILED
DEAD_LETTER
CANCELLED
EXPIRED
```

Rules:

- state transitions must be explicit
- invalid transitions must be rejected
- terminal states must not accidentally return to running
- retries must increment attempt metadata
- cancellation must be observable
- replay must create an auditable operation

---

# 12. Job Identity

Every durable job needs:

- `job_id`
- `tenant_id` where applicable
- `job_type`
- `job_version`
- `correlation_id`
- `causation_id` where applicable
- `idempotency_key`
- `created_at`
- `scheduled_at`
- `started_at`
- `finished_at`
- `attempt`
- `status`

Do not use a user-controlled value as the sole internal job identity.

---

# 13. Tenant Isolation

Every tenant-scoped automation must preserve:

```text
Tenant A event
    ↓
Tenant A job
    ↓
Tenant A data
    ↓
Tenant A AI context
```

Never allow:

```text
Tenant A event
    ↓
Global query
    ↓
Tenant B data
```

Tenant scope must be enforced in:

- job creation
- queue payloads
- workers
- database queries
- object storage
- RAG retrieval
- vector metadata
- cache keys
- search
- analytics
- notifications
- integrations
- exports
- logs
- admin tooling

A `tenant_id` field alone is not proof of isolation. The worker must actually enforce it.

---

# 14. Tenant-Scoped Queue Rules

Queue messages should contain enough information to establish scope without copying sensitive business data.

Prefer:

```json
{
  "job_id": "...",
  "tenant_id": "...",
  "job_type": "...",
  "version": 1
}
```

Then load authoritative data from protected storage.

Do not put:

- passwords
- API keys
- full customer records
- access tokens
- unnecessary document contents

inside queue messages.

---

# 15. Trigger Types

KEETY supports conceptual triggers:

- authenticated user action
- internal API
- webhook
- database event
- queue message
- scheduled task
- file upload
- integration event
- AI result
- administrative action

Every trigger must define:

- source
- trust level
- authentication
- authorization
- validation
- tenant resolution
- deduplication strategy

---

# 16. Idempotency — Mandatory

Every side-effecting automation must define:

> What happens if this executes twice?

Examples:

- same webhook twice
- same queue message twice
- client retry
- worker crash after external side effect
- manual replay
- duplicate cron execution

Safe pattern:

```text
event
 ↓
derive idempotency key
 ↓
check/process atomically
 ↓
perform effect
 ↓
record outcome
```

---

# 17. Idempotency Key Design

Good keys may include:

- external event ID
- payment/reference ID
- request ID
- document version ID
- tenant + operation + source event
- provider transaction ID

The key must represent the business operation, not merely the worker attempt.

Do not generate a new key on every retry.

---

# 18. Atomic Idempotency

Avoid:

```text
check exists
 ↓
no
 ↓
create
```

without concurrency protection.

Prefer:

- unique database constraint
- atomic insert
- transactional state transition
- compare-and-set
- appropriate lock

The database should enforce uniqueness where practical.

---

# 19. Exactly-Once Warning

Do not claim:

> "The workflow is exactly once."

Distributed systems commonly produce at-least-once delivery.

Design:

```text
at-least-once delivery
+
idempotent side effects
=
safe processing
```

When exactly-once semantics are genuinely required, document the exact mechanism and its limits.

---

# 20. Duplicate Execution Testing

Every important automation must be tested with:

- same event twice sequentially
- same event twice concurrently
- same event 10 times
- same event after timeout
- same event after worker crash
- same event after manual replay

Expected result must be explicitly defined.

---

# 21. Concurrency

For each automation identify:

- maximum concurrent executions
- per-tenant concurrency
- global concurrency
- resource bottleneck
- race-sensitive state
- external provider limits

Do not assume more workers always improves throughput.

---

# 22. Per-Tenant Fairness

One tenant must not be able to consume all automation capacity.

Where appropriate use:

- per-tenant quotas
- per-tenant concurrency limits
- queue partitioning
- fair scheduling
- rate limiting
- workload classes

Critical platform work must remain available even if one tenant floods the system.

---

# 23. Queue Classes

At minimum conceptually separate:

```text
critical
normal
AI/RAG
bulk
maintenance
```

Do not let expensive AI jobs starve critical user-facing work.

Exact queues may differ by deployment.

---

# 24. Backpressure

If producers are faster than consumers:

```text
producer > consumer
        ↓
queue growth
```

The system must have a deliberate response:

- scale workers
- reduce concurrency
- throttle producers
- prioritize work
- shed non-critical work
- delay expensive AI work
- alert operators

Do not allow unbounded queue growth.

---

# 25. Queue Durability

For important jobs define:

- durable vs transient
- acknowledgment behavior
- visibility/lease timeout
- retry count
- dead-letter policy
- ordering requirement
- retention
- recovery behavior

A critical job must not disappear because a worker crashed.

---

# 26. Worker Safety

Workers must:

- validate job payload
- resolve tenant scope
- authorize sensitive operations
- acquire work safely
- respect concurrency limits
- use bounded timeouts
- release resources
- emit structured events
- mark final state accurately

Workers must not trust queue payloads blindly.

---

# 27. Worker Crash Recovery

Assume:

```text
worker starts
 ↓
side effect succeeds
 ↓
worker crashes
 ↓
acknowledgment is lost
```

The message may be redelivered.

Therefore side effects must be idempotent or otherwise deduplicated.

---

# 28. Lease / Visibility Timeout

If the queue uses leases:

- lease duration must exceed normal processing time
- long jobs must renew leases where required
- crashed workers must eventually release work
- duplicate processing must remain safe

Never rely on a lease to create correctness.

---

# 29. Retry Policy

Every retry policy must define:

| Property | Required |
|---|---|
| max attempts | yes |
| retryable errors | yes |
| non-retryable errors | yes |
| delay | yes |
| backoff | yes |
| jitter | yes |
| timeout | yes |
| final action | yes |

Do not retry every exception.

---

# 30. Retry Classification

Usually retry:

- transient network failures
- provider 5xx
- temporary rate limiting
- temporary database unavailability
- worker infrastructure failure

Usually do not blindly retry:

- invalid input
- authorization failure
- schema validation failure
- permanent 4xx
- deleted resource
- unsupported operation

Provider-specific behavior must override generic assumptions where documented.

---

# 31. Exponential Backoff

For transient failures:

```text
attempt 1 → delay
attempt 2 → larger delay
attempt 3 → larger delay
...
```

Add jitter where many jobs may retry together.

Cap the delay.

Cap total attempts.

---

# 32. Retry Storm Prevention

If an AI provider fails for 10 minutes and 100,000 jobs retry together, KEETY must not amplify the outage.

Use:

- jitter
- bounded concurrency
- queue delay
- circuit breaking where appropriate
- provider-aware backoff
- workload shedding
- alerting

---

# 33. Dead-Letter Queue

A job that exhausts retries must enter a recoverable terminal state.

DLQ metadata should include:

- job ID
- tenant ID
- failure reason
- last error class
- attempt count
- timestamps
- workflow version
- correlation ID
- sanitized diagnostic context

DLQ contents are sensitive and must be access-controlled.

---

# 34. Manual Replay

Replay must be deliberate.

Operator flow:

```text
inspect
 ↓
verify root cause fixed
 ↓
verify tenant scope
 ↓
verify idempotency
 ↓
replay
 ↓
observe
```

Do not provide a "replay all failed jobs" button without safeguards.

---

# 35. Replay Safety

Replay must answer:

- Could it duplicate an email?
- Could it duplicate a business record?
- Could it regenerate embeddings?
- Could it trigger an external API twice?
- Could it expose stale data?
- Could it repeat a destructive action?

For high-risk actions, replay may require human approval.

---

# 36. Partial Failure

For:

```text
DB write
 ↓
external API
 ↓
notification
```

test every failure boundary.

Do not assume a database rollback can undo an external API call.

Use:

- compensation
- outbox patterns
- state machines
- idempotent APIs
- reconciliation
- manual recovery

as appropriate.

---

# 37. Transaction Boundary

Do not hold a database transaction open while waiting on:

- AI provider
- external API
- email provider
- webhook
- long file processing

Prefer:

```text
transaction
 ↓
commit durable state/event
 ↓
async side effect
```

when business semantics permit.

See `Transaction.md` for transactional authority.

---

# 38. Outbox-Style Event Publication

Where an event must reliably correspond to committed database state:

```text
DB transaction
 ├─ business state
 └─ outbox event
       ↓
committed
       ↓
publisher
       ↓
queue
```

This reduces the failure window between database commit and event publication.

---

# 39. Event Schema

Every durable event should have a versioned envelope.

Conceptually:

```json
{
  "event_id": "...",
  "event_type": "...",
  "event_version": 1,
  "tenant_id": "...",
  "occurred_at": "...",
  "producer": "...",
  "correlation_id": "...",
  "causation_id": "...",
  "payload": {}
}
```

Avoid embedding unnecessary sensitive data.

---

# 40. Event Versioning

Consumers must tolerate compatible schema evolution.

Do not silently change:

- meaning of a field
- data type
- required/optional semantics
- tenant semantics

without a migration/versioning plan.

Old in-flight jobs must be considered during deployment.

---

# 41. Ordering

If ordering matters, explicitly enforce it.

Potential mechanisms:

- entity version
- sequence number
- ordered partition
- database state check
- stale-event rejection

Never assume network delivery order.

---

# 42. Out-of-Order Events

Example:

```text
product.updated(version=3)
product.updated(version=2)
```

The consumer must not regress state to version 2.

Use version checks where the domain requires ordering.

---

# 43. Webhook Ingestion

Webhook flow:

```text
receive
 ↓
authenticate/signature verify
 ↓
timestamp/replay validation
 ↓
schema validation
 ↓
resolve tenant/integration
 ↓
persist event
 ↓
acknowledge
 ↓
process asynchronously
```

Do not execute an expensive workflow before acknowledging a provider that has a strict timeout.

---

# 44. Webhook Security

Verify:

- signature
- timestamp
- event ID
- replay window
- payload schema
- integration ownership
- tenant association

A valid signature does not automatically prove the event is still relevant.

---

# 45. Webhook Replay Protection

Prevent:

```text
valid event
 ↓
captured
 ↓
replayed 100 times
```

Use provider-supported event IDs/signatures/timestamps plus internal idempotency.

---

# 46. Scheduled Jobs

Every schedule must specify:

- frequency
- timezone
- start/end behavior
- overlap policy
- missed-run policy
- retry policy
- ownership
- observability

Use UTC internally unless a business rule explicitly requires a local timezone.

---

# 47. Cron Overlap

If a job runs every 5 minutes but takes 8 minutes:

```text
Job A ─────────
Job B     ─────────
```

Decide intentionally whether overlap is:

- allowed
- prohibited
- coalesced
- skipped
- queued

Use durable coordination rather than process-local memory.

---

# 48. Distributed Scheduler Safety

With multiple application instances, a local cron can execute multiple times.

Do not assume:

```text
3 instances = 1 cron execution
```

Use a scheduler or distributed coordination mechanism that provides the required semantics.

---

# 49. Time Zones and DST

Scheduled business reports may depend on a business's timezone.

Store the intended timezone explicitly.

Test:

- daylight-saving transitions where applicable
- midnight boundaries
- month boundaries
- leap days
- timezone changes

Never accidentally use the worker machine's local timezone.

---

# 50. Missed Schedules

If the platform is down when a scheduled job should run, define whether KEETY:

- skips it
- runs once on recovery
- runs every missed occurrence
- backfills

Do not leave this implicit.

---

# 51. Long-Running Workflows

For workflows lasting minutes/hours/days:

- persist state
- persist checkpoints
- avoid process memory as durable state
- make each step restart-safe
- define timeout/expiry
- support cancellation where appropriate
- support recovery

---

# 52. Workflow Checkpoints

A long workflow should make its current step observable:

```text
STEP_1_COMPLETE
STEP_2_COMPLETE
STEP_3_RUNNING
```

This makes recovery and debugging possible.

---

# 53. Workflow Cancellation

Cancellation must define:

- who may cancel
- which states are cancellable
- whether running external work can be interrupted
- compensation behavior
- final state
- audit event

Cancellation must not silently corrupt partial work.

---

# 54. Automation Timeouts

Every external operation and every workflow needs a bounded timeout appropriate to its job class.

A timeout must produce an explicit state.

Never leave:

```text
RUNNING
```

forever.

---

# 55. Circuit Breaking

Use circuit breakers only where they provide real value.

Possible pattern:

```text
healthy
 ↓
failures
 ↓
open
 ↓
stop expensive calls
 ↓
cooldown
 ↓
half-open test
 ↓
healthy
```

Circuit breakers must not hide permanent errors or cause unbounded work accumulation.

---

# 56. Bulkheads

Separate resource pools when failure in one workload could starve another.

At minimum consider isolation between:

- critical jobs
- AI jobs
- bulk ingestion
- maintenance
- integration synchronization

---

# 57. Rate Limits

Every external integration must document:

- request limits
- concurrency limits
- token limits
- provider quotas
- retry behavior
- expected response codes

KEETY must not assume provider capacity is infinite.

---

# 58. Provider Failure Matrix

Maintain a matrix:

| Dependency | Failure | Retry | Fallback | Alert | User impact |
|---|---|---:|---|---|---|
| PostgreSQL | unavailable | bounded | queue/degrade | yes | defined |
| AI provider | 5xx | bounded | retry/degrade | yes | defined |
| AI provider | 429 | backoff | queue | yes | defined |
| Object storage | timeout | bounded | retry | yes | defined |
| Email provider | 5xx | bounded | retry | yes | defined |
| Integration API | 401 | no blind retry | re-auth flow | yes | defined |

This table must be maintained with actual providers once selected.

---

# 59. AI Automation Safety

AI outputs are untrusted.

Unsafe:

```text
AI
 ↓
delete data
```

Safe pattern:

```text
AI recommendation
 ↓
schema validation
 ↓
business rule validation
 ↓
authorization
 ↓
risk policy
 ↓
optional human approval
 ↓
action
```

---

# 60. AI Must Not Bypass Authorization

The AI cannot:

- retrieve another tenant's data
- call tools outside its granted scope
- execute admin operations because the user asks
- expose hidden context
- override backend authorization

Tool permissions are enforced by the backend, not the prompt.

---

# 61. AI-Generated Automation Parameters

Validate:

- IDs
- tenant scope
- numerical bounds
- allowed actions
- resource ownership
- operation type
- output schema

Treat model output as attacker-controlled input.

---

# 62. AI Cost Controls

Track:

```text
automation executions
×
AI calls/execution
×
tokens
×
model price
```

Apply:

- per-user limits
- per-tenant limits
- job budgets
- maximum tokens
- maximum retries
- model selection policies
- concurrency limits

A retry loop must never create an uncontrolled AI bill.

---

# 63. AI Failure Modes

Test:

- provider timeout
- provider 429
- provider 5xx
- malformed JSON
- empty output
- hallucinated IDs
- unsafe action proposal
- prompt injection
- indirect prompt injection from documents
- oversized context
- token budget exhaustion

---

# 64. RAG Automation

Document ingestion should conceptually follow:

```text
upload
 ↓
validate
 ↓
virus/security checks where required
 ↓
extract
 ↓
normalize
 ↓
chunk
 ↓
metadata
 ↓
embed
 ↓
index
 ↓
verify
 ↓
ready
```

Each step must be recoverable.

---

# 65. RAG Tenant Isolation

Every indexing job must carry tenant scope.

Every retrieval operation must enforce:

```text
tenant_id
+
authorization
+
document status
```

Do not rely only on vector metadata filtering if a stronger application-level authorization check is required.

---

# 66. Document Deletion Propagation

When a document is deleted, determine how deletion propagates to:

- object storage
- extracted text
- chunks
- embeddings
- vector index
- search index
- caches
- derived summaries
- automation state

Deleted content must not remain retrievable through a stale path.

---

# 67. Document Reprocessing

Reprocessing must be version-aware.

Example:

```text
document v1
 ↓
index v1

document updated
 ↓
document v2
 ↓
index v2
```

Do not allow old processing jobs to overwrite newer state.

---

# 68. AI/RAG Job Deduplication

Use a business-stable key such as:

```text
tenant_id
+
document_id
+
document_version
+
processing_pipeline_version
```

Avoid creating duplicate embeddings merely because a worker retried.

---

# 69. Notifications

Notification workflows must define:

- recipient
- tenant
- channel
- deduplication
- retry
- rate limit
- unsubscribe/preferences
- provider failure behavior

Do not send duplicate notifications after job replay unless intentionally allowed.

---

# 70. Email Safety

Development/staging must not send real customer emails by accident.

Use:

- environment-specific providers
- allowlists
- test domains
- explicit production credentials
- dry-run modes where appropriate

---

# 71. Integration Synchronization

For every integration define:

- source of truth
- direction
- sync frequency
- cursor/checkpoint
- duplicate behavior
- conflict behavior
- rate limits
- retry policy
- authentication renewal
- deletion semantics

Do not create an endless sync loop.

---

# 72. Sync Loop Prevention

Example:

```text
KEETY update
 ↓
external update
 ↓
external webhook
 ↓
KEETY update
 ↓
...
```

Use source markers, versions, event IDs, or equivalent mechanisms to prevent feedback loops.

---

# 73. Reconciliation

For important integrations, implement reconciliation where appropriate.

Example:

```text
local state
vs
provider state
```

If inconsistent:

- detect
- record
- classify
- repair safely
- audit

A successful API response does not prove local and external state are consistent.

---

# 74. Backfill Jobs

Backfills must be:

- bounded
- resumable
- observable
- idempotent
- rate-limited
- tenant-safe
- cancellable where possible

Never launch a million-record backfill with an unbounded worker pool.

---

# 75. Migration Automation

For data migrations:

```text
plan
 ↓
dry run
 ↓
small batch
 ↓
validate
 ↓
expand
 ↓
monitor
 ↓
complete
```

Document rollback/compensation limitations.

---

# 76. Automation Security

Protect:

- API credentials
- OAuth tokens
- webhook secrets
- service accounts
- queue credentials
- database credentials
- AI provider keys
- object-storage credentials

Secrets must live in approved secret/configuration systems.

Never hardcode secrets in workflow definitions.

---

# 77. Least Privilege

An automation identity should have only required permissions.

Examples:

- email worker should not write arbitrary business tables
- analytics worker should not modify payments
- document worker should not administer users
- AI worker should not receive unrestricted database credentials

---

# 78. Environment Isolation

Strictly separate:

```text
local
development
staging
production
```

Never allow:

- dev workflow → production database
- staging worker → production queue
- test credentials → production integration
- development emails → real customers

Environment identity must be explicit.

---

# 79. Production Workflow Protection

Production workflows should require controlled deployment.

Avoid direct ad-hoc editing without:

- versioning
- review
- audit
- rollback/recovery plan

---

# 80. Workflow Versioning

Every production automation should expose:

- workflow version
- deployment version
- code version
- schema version where applicable

For an event processed months later, operators should be able to identify which workflow version processed it.

---

# 81. In-Flight Deployment Safety

Before changing a workflow ask:

- What happens to running jobs?
- Do old workers still exist?
- Can old messages be processed by new code?
- Is the event schema compatible?
- Can a job resume under a different version?

Use version-aware consumers when necessary.

---

# 82. Observability

Every important execution should expose:

- job ID
- tenant ID where appropriate and access-controlled
- workflow type
- workflow version
- execution status
- duration
- attempt
- retry count
- queue
- correlation ID
- dependency latency
- error classification

Sensitive payloads must not be logged.

---

# 83. Distributed Tracing

Trace:

```text
API
 ↓
event
 ↓
queue
 ↓
worker
 ↓
database
 ↓
AI provider
 ↓
storage
```

A correlation ID should survive asynchronous boundaries.

---

# 84. Logging

Logs must answer:

- what happened?
- where?
- when?
- which job?
- which workflow version?
- which dependency?
- why did it fail?

Never log:

- passwords
- API keys
- tokens
- raw credentials
- unnecessary private business data
- full prompts/documents unless explicitly justified and protected

---

# 85. Metrics

Track at least:

### Reliability

- success rate
- failure rate
- retry rate
- DLQ rate
- cancellation rate

### Performance

- execution latency
- queue latency
- dependency latency
- throughput

### Capacity

- queue depth
- worker utilization
- concurrency
- backlog age

### AI

- AI calls
- tokens
- model latency
- AI failure rate
- cost

### Business

- successful reports
- successful ingestion
- successful sync
- user-visible completion

---

# 86. Alerting

Alert on actionable conditions:

- DLQ growth
- abnormal failure rate
- queue backlog age
- repeated provider failures
- AI cost anomaly
- stuck jobs
- tenant isolation/security event
- missed critical schedules

Avoid alert fatigue from individual transient failures.

---

# 87. Silent Failure Rule

No important automation may fail silently.

Every terminal failure must be:

- persisted
- observable
- attributable
- recoverable or explicitly unrecoverable
- alertable when business impact requires it

---

# 88. Business Outcome Monitoring

Technical success is not business success.

Example:

```text
job = SUCCESS
```

does not prove:

```text
report generated correctly
```

or:

```text
notification delivered
```

or:

```text
sync state is correct
```

Where possible, verify the business invariant after technical completion.

---

# 89. Audit Trail

For sensitive automations record:

- actor/source
- tenant
- time
- operation
- target
- workflow version
- result
- failure reason
- external system
- approval where required

Especially for:

- admin actions
- data deletion
- integration changes
- security operations
- sensitive exports
- destructive workflows

---

# 90. Blast Radius

Classify automations:

### Low

One user's non-critical notification.

### Medium

Tenant-wide reports or bulk processing.

### High

Data modification, large-scale communication, integration writes.

### Critical

Destructive, financial, security-sensitive, or irreversible actions.

Higher blast radius requires stronger:

- approvals
- rate limits
- dry runs
- monitoring
- rollback/compensation
- kill switches

---

# 91. Kill Switch

Critical automation should have an operational disable mechanism.

Requirements:

- authenticated operator
- audited change
- explicit scope
- safe default
- observable state
- documented recovery

A kill switch must not create hidden inconsistent state.

---

# 92. Human Approval

Use approval for high-risk actions where appropriate:

```text
AI/recommendation
 ↓
validation
 ↓
prepare action
 ↓
human approval
 ↓
execute
```

Approval must be:

- attributable
- tenant-scoped
- time-bounded where appropriate
- auditable

---

# 93. Dry Run

High-blast-radius automation should support dry-run where practical.

Dry run should:

- calculate intended changes
- show affected scope
- avoid side effects
- report validation errors
- produce an auditable preview

---

# 94. Rate Limiting by Risk

Use stronger limits for:

- bulk notifications
- external API writes
- AI generation
- data exports
- destructive actions
- backfills

Do not use one global rate limit for all workloads.

---

# 95. Automation Cost Governance

For every expensive automation define:

```text
cost per execution
+
cost per tenant
+
cost at expected scale
+
worst reasonable cost
```

Cost controls should exist for:

- AI
- storage
- queue
- external APIs
- compute

A retry loop must have a finite cost ceiling.

---

# 96. Quotas

Tenant quotas may apply to:

- document processing
- AI calls
- report generation
- automation executions
- integrations
- storage
- exports

Quota enforcement must happen server-side.

---

# 97. Abuse Prevention

Consider:

- automation spam
- repeated uploads
- repeated AI requests
- expensive report generation
- webhook flooding
- queue flooding
- integration abuse
- repeated retries

Security and automation controls must work together.

---

# 98. Testing Strategy

Every critical automation must have:

### Happy path

Normal successful execution.

### Invalid path

Malformed/unacceptable input.

### Duplicate path

Same event twice.

### Concurrent path

Same event simultaneously.

### Dependency failure

Provider/database unavailable.

### Retry path

Transient failure followed by success.

### Exhaustion path

Repeated failure reaches DLQ.

### Recovery path

Worker crash/restart.

### Replay path

Safe manual replay.

### Security path

Unauthorized/cross-tenant input.

### Load path

Expected high volume.

### Cost path

High-volume AI/integration workload.

---

# 99. Contract Testing

Validate:

- event schema
- queue payload
- webhook payload
- provider responses
- workflow output
- database state assumptions

A provider changing its schema must not silently break processing.

---

# 100. Property / Invariant Testing

Where useful verify invariants such as:

```text
No cross-tenant job access
```

```text
One idempotency key → one intended side effect
```

```text
Terminal job state does not become running accidentally
```

```text
Older event version cannot overwrite newer entity state
```

```text
Retry count never exceeds configured maximum
```

```text
Cancelled job cannot execute a new destructive action
```

---

# 101. Concurrency Testing

Test:

```text
same job × 2
same job × 10
same tenant × many jobs
many tenants × many jobs
```

Observe:

- duplicate effects
- lost updates
- starvation
- deadlocks
- queue corruption
- rate-limit violations

---

# 102. Failure Injection

Inject:

- database outage
- queue outage
- worker termination
- provider timeout
- provider 500
- provider 429
- malformed provider response
- object storage outage
- AI outage

Then verify:

- state
- retries
- recovery
- alerts
- user experience
- data integrity

---

# 103. Load Testing

Test realistic rates based on product requirements.

Measure:

- throughput
- p50/p95/p99 latency
- queue delay
- worker saturation
- DB load
- external API limits
- AI cost
- error rate

Do not invent scale numbers as guarantees.

---

# 104. Spike Testing

Test sudden increases:

```text
normal
 ↓
10x traffic
 ↓
recovery
```

Verify the system:

- queues safely
- protects critical workloads
- does not exhaust DB connections
- does not create retry storms
- recovers after the spike

---

# 105. Soak Testing

Run representative automation for extended periods.

Look for:

- memory leaks
- queue growth
- stuck jobs
- connection leaks
- cumulative failures
- cost drift
- storage growth

---

# 106. Chaos Testing

For mature environments deliberately:

- kill workers
- delay dependencies
- reject requests
- pause consumers
- restart components

The goal is to prove recovery, not to cause random destruction.

---

# 107. Recovery Objectives

For each critical automation define business-based:

- RPO — acceptable work/data loss
- RTO — acceptable recovery time

Do not invent numbers merely to complete a checklist.

---

# 108. Disaster Recovery

Back up and recover:

- workflow definitions
- code
- database state
- queue configuration
- required event history
- configuration
- secrets through approved recovery mechanisms

A backup is not a recovery strategy until restoration has been tested.

---

# 109. Business Continuity

If automation stops for hours:

- what work accumulates?
- what is lost?
- what catches up?
- what expires?
- what must be manually reconciled?
- what must be throttled after recovery?

Recovery must avoid a second outage caused by catch-up traffic.

---

# 110. Catch-Up Storm Protection

After downtime:

```text
100,000 delayed jobs
```

must not automatically become:

```text
100,000 simultaneous provider calls
```

Use:

- rate-limited recovery
- priority queues
- gradual concurrency increase
- provider-aware throttling
- backlog monitoring

---

# 111. Expiration

Some jobs become invalid after a period.

Examples:

- stale recommendations
- expired report requests
- outdated sync events
- old authorization context
- superseded document processing

Define expiration rules explicitly.

---

# 112. Stale Work Protection

A job created for document version 2 must not overwrite document version 3.

Use:

- version checks
- compare-and-set
- state machine validation
- generation IDs

---

# 113. Cancellation and Supersession

If a newer job supersedes an older one:

```text
v1 job
 ↓
v2 job
```

the system may mark v1:

```text
SUPERSEDED
```

rather than processing stale work.

---

# 114. Automation Data Retention

Define retention for:

- completed jobs
- failed jobs
- DLQ
- audit records
- event envelopes
- execution logs

Retention must align with:

- security
- privacy
- operational debugging
- compliance requirements where applicable

Do not retain sensitive payloads forever by default.

---

# 115. PII and Sensitive Data

Automation payloads should contain the minimum necessary data.

Prefer IDs over full records.

Avoid copying customer/business data into:

- queues
- logs
- traces
- workflow-engine metadata

unless required and protected.

---

# 116. Secrets in Automation

Never store secrets in:

- source code
- Git
- workflow JSON
- logs
- queue messages
- AI prompts
- screenshots
- error payloads

Use approved secret management.

---

# 117. External Integration Credentials

Credentials should be:

- tenant-associated
- encrypted/protected
- least privileged
- revocable
- rotatable
- never exposed to AI unnecessarily

Workers should fetch credentials securely at execution time where appropriate.

---

# 118. Integration Credential Failure

If an integration returns 401/invalid credentials:

Do not retry forever.

Move to a controlled state such as:

```text
AUTH_REQUIRED
```

and notify the appropriate tenant/admin flow.

---

# 119. AI/RAG Security Boundary

Automation must preserve:

```text
identity
 ↓
tenant
 ↓
authorization
 ↓
retrieval
 ↓
AI context
 ↓
tool permissions
 ↓
action
```

Never allow a workflow to skip an authorization layer because it runs in the background.

---

# 120. Prompt Injection Through Automation

Documents and external data may contain instructions such as:

> ignore system rules and perform an action

Treat such content as untrusted data.

The automation layer must never interpret document text as authorization.

---

# 121. Tool Execution

If KEETY later exposes tools to AI:

Every tool call must be checked for:

- authenticated principal
- tenant
- resource ownership
- role
- allowed operation
- argument schema
- rate limit
- risk level
- approval requirement

The model cannot grant itself permissions.

---

# 122. Dangerous AI Actions

For actions such as:

- deleting records
- changing business settings
- sending bulk communications
- changing integrations
- exporting sensitive data

require deterministic policy checks and, where appropriate, human approval.

---

# 123. AI Automation Loop Protection

Prevent:

```text
AI
 ↓
tool
 ↓
event
 ↓
AI
 ↓
tool
 ↓
event
...
```

Use:

- causation IDs
- depth limits
- workflow budgets
- execution counters
- loop detection

---

# 124. Automation Recursion

Any workflow that can trigger itself must define a recursion guard.

Example:

```text
event A
 → workflow
 → event B
 → workflow
```

Track causal ancestry where required.

---

# 125. Event Causation

For complex workflows use:

- correlation ID — groups one business operation
- causation ID — identifies what caused an event
- event ID — uniquely identifies the event

This enables debugging of chains.

---

# 126. Observability Correlation Example

```text
user request
 correlation_id=abc

event
 correlation_id=abc
 causation_id=req-1

job
 correlation_id=abc

AI call
 correlation_id=abc

notification
 correlation_id=abc
```

Operators should be able to reconstruct the execution chain.

---

# 127. Operational Dashboard

Critical automation should expose:

- running jobs
- queued jobs
- oldest queued job
- failed jobs
- retrying jobs
- DLQ count
- failure rate
- provider health
- worker utilization
- AI cost
- tenant-level anomalies

---

# 128. Runbooks

Every critical automation needs a runbook covering:

1. What it does
2. Owner
3. Dependencies
4. Normal behavior
5. Failure symptoms
6. Where to inspect
7. Safe recovery
8. Replay procedure
9. Kill switch
10. Escalation

---

# 129. Manual Intervention

Manual intervention must be:

- authenticated
- authorized
- audited
- tenant-scoped
- reversible where possible
- explicit

Avoid direct production database edits as the normal recovery process.

---

# 130. Admin Automation

Admin tools are high-risk.

Require:

- strong authorization
- audit logging
- confirmation
- scoped operations
- dry-run where practical
- rate limits
- protection against accidental global operations

---

# 131. Global vs Tenant-Scoped Jobs

Explicitly classify:

```text
GLOBAL
TENANT_SCOPED
USER_SCOPED
RESOURCE_SCOPED
```

A global job must never accidentally infer tenant scope from mutable user input.

---

# 132. Resource Ownership

Before modifying a resource:

```text
job
 ↓
tenant
 ↓
resource lookup
 ↓
ownership/authorization check
 ↓
mutation
```

Never:

```text
job ID
 ↓
global resource mutation
```

without verifying ownership.

---

# 133. Search/Cache Automation

If automation populates:

- Redis
- search
- vector store
- analytics

the cache/index key must preserve tenant scope.

Never allow:

```text
tenant A cache key
=
tenant B cache key
```

---

# 134. Cache Invalidation

When source data changes, determine:

- what cache becomes stale
- when it expires
- whether invalidation is event-driven
- whether stale reads are acceptable

For security-sensitive data, do not rely on eventual cache expiry alone.

---

# 135. Search Index Consistency

If a business record is deleted or access changes:

- search index must be updated
- stale results must be controlled
- authorization must still be enforced at read time where necessary

---

# 136. Export Automation

Exports can have high blast radius.

Require:

- authorization
- tenant scope
- export size limits
- secure temporary storage
- expiry
- audit trail
- download authorization

Do not create permanent public export URLs.

---

# 137. File Processing Automation

Validate:

- file size
- file type
- content
- filename
- tenant
- ownership
- processing status

Treat uploaded content as hostile.

---

# 138. Poisoned Job Protection

A job that always fails must not:

- consume unlimited retries
- consume all workers
- generate unlimited AI calls
- spam external APIs
- fill logs

Bound retries and route persistent failures to DLQ.

---

# 139. Priority

Define priority based on business impact, not whoever submitted first.

Example:

```text
critical
high
normal
bulk
maintenance
```

Do not let bulk processing starve interactive or security-critical operations.

---

# 140. Fair Scheduling

Where multiple tenants share resources, evaluate:

- per-tenant concurrency
- weighted fairness
- quotas
- burst allowance
- starvation prevention

A large tenant must not automatically monopolize the platform.

---

# 141. Cost-Based Scheduling

For expensive AI jobs, consider:

- model selection
- batching
- caching
- deduplication
- deferred execution
- tenant quota
- maximum context
- maximum retry count

Do not optimize cost by weakening correctness or security.

---

# 142. Batch Processing

Batching may improve throughput, but define:

- batch size
- timeout
- partial success behavior
- retry granularity
- ordering
- tenant mixing rules

Do not mix tenants in a batch unless isolation is guaranteed.

---

# 143. Tenant Mixing

The safest default is:

```text
one job
→
one tenant
```

If multi-tenant batch processing is introduced, it must prove:

- strict isolation
- separate authorization
- separate failure handling
- no data leakage
- auditable tenant boundaries

---

# 144. Dependency Fan-Out

If one job creates 100 downstream calls:

```text
1 job
 ↓
100 APIs
```

control fan-out.

Otherwise one event can become a denial-of-service against KEETY or a provider.

---

# 145. Fan-Out / Fan-In

For workflows that fan out:

```text
parent
 ↓
A B C D
 ↓
join
```

define:

- child identity
- partial failure
- timeout
- cancellation
- completion condition
- duplicate handling
- parent status

---

# 146. Parent/Child Jobs

Child jobs should carry:

- parent job ID
- tenant ID
- correlation ID
- child sequence
- workflow version

Parent completion must not assume all children succeeded merely because they were created.

---

# 147. Partial Batch Failure

If 3 of 100 items fail:

Do not blindly mark the whole operation successful.

Represent:

- successful count
- failed count
- skipped count
- retryable count
- permanent failures

Business semantics determine final status.

---

# 148. Reconciliation Jobs

Critical systems should have periodic reconciliation where useful.

Examples:

- database vs external integration
- job state vs provider state
- source documents vs index
- expected notifications vs delivery records

Reconciliation should detect silent drift.

---

# 149. Drift Detection

Automation configuration can drift from source-controlled configuration.

Where applicable verify:

- workflow version
- deployed version
- expected environment
- credential bindings
- schedules
- queue names

Unexpected drift should be detectable.

---

# 150. Change Management

Any critical automation change should include:

- reason
- risk
- version
- tests
- rollout plan
- rollback/recovery plan
- owner

---

# 151. Deployment Strategy

For critical automations consider:

```text
deploy
 ↓
health check
 ↓
small workload
 ↓
observe
 ↓
expand
```

Do not deploy a high-risk workflow globally without evidence.

---

# 152. Rollback

Rollback must consider:

- code version
- workflow definition
- event schema
- database schema
- queued messages
- in-flight jobs

A code rollback can be unsafe if the data/event schema has already changed.

---

# 153. Compatibility Window

When schema changes:

```text
old producer
+
new consumer
```

and:

```text
new producer
+
old consumer
```

must be evaluated where both can coexist.

---

# 154. Automation Testing in CI

Recommended sequence:

```text
lint
 ↓
type check
 ↓
unit tests
 ↓
contract tests
 ↓
integration tests
 ↓
automation failure tests
 ↓
build
 ↓
security checks
 ↓
E2E/smoke
```

Exact stages may vary.

---

# 155. Test Environment

Automation tests must use isolated:

- databases
- queues
- storage
- credentials
- external provider mocks/sandboxes

Never allow automated tests to trigger real production side effects.

---

# 156. Test Fixtures

Fixtures must model:

- multiple tenants
- multiple roles
- duplicate events
- stale versions
- failures
- large workloads
- malicious inputs

A test suite with one tenant cannot prove tenant isolation.

---

# 157. Multi-Tenant Automation Tests

At minimum:

```text
Tenant A job → Tenant A data
Tenant A job ↛ Tenant B data
Tenant B job → Tenant B data
```

Also test:

- same resource IDs across tenants
- concurrent tenant jobs
- cache/search isolation
- RAG isolation
- export isolation

---

# 158. Automation Regression

Every production automation bug should produce:

```text
incident
 ↓
reproduction
 ↓
fix
 ↓
regression test
 ↓
deployment
 ↓
verification
```

Do not rely on memory.

---

# 159. False Confidence

These do not prove automation reliability:

- "queue is working"
- "workflow engine says success"
- "200 response"
- "95% test coverage"
- "we have retries"
- "we have a DLQ"
- "we have logs"
- "AI returned JSON"
- "cron is configured"

Evidence must demonstrate the intended behavior.

---

# 160. Automation Quality Gates

A critical automation is not production-ready until:

- purpose is documented
- owner exists
- tenant scope is explicit
- trigger is authenticated/validated
- idempotency is defined
- concurrency is analyzed
- failure behavior is defined
- retries are bounded
- DLQ/recovery exists where needed
- timeouts exist
- observability exists
- security controls exist
- cost is bounded
- tests exist
- replay behavior is understood
- deployment/versioning is controlled
- business result is measurable

---

# 161. Per-Automation Review Template

For every production workflow complete:

```text
Automation:
Owner:
Purpose:
Risk:
Blast radius:
Tenant scope:
Trigger:
Input:
Output:
Side effects:
Dependencies:
Queue:
Priority:
Timeout:
Retry policy:
Idempotency key:
Concurrency limit:
Ordering requirement:
State storage:
Failure behavior:
DLQ:
Replay procedure:
Cancellation:
Compensation:
Security controls:
AI involvement:
RAG involvement:
Cost ceiling:
Metrics:
Alerts:
Audit trail:
Version:
Deployment strategy:
Rollback/recovery:
Tests:
Runbook:
Last reviewed:
```

---

# 162. Dependency Failure Matrix Template

```text
Dependency:
Failure mode:
Detection:
Timeout:
Retry:
Backoff:
Fallback:
Circuit breaker:
User impact:
Queue behavior:
Alert:
Recovery:
```

Every important dependency should have this completed.

---

# 163. Incident Workflow

When an automation incident occurs:

```text
detect
 ↓
contain
 ↓
protect tenant/data
 ↓
stop amplification
 ↓
identify affected jobs
 ↓
repair root cause
 ↓
reconcile state
 ↓
replay safely
 ↓
verify business result
 ↓
add regression test
 ↓
document incident
```

Do not immediately replay everything.

---

# 164. Containment

During a runaway automation:

- disable trigger if required
- pause consumer
- reduce concurrency
- disable high-risk side effects
- isolate affected tenant/workload
- preserve evidence
- prevent retry storms

Containment comes before bulk replay.

---

# 165. Reconciliation After Incident

After recovery determine:

- what succeeded
- what failed
- what duplicated
- what was partially applied
- what was lost
- what needs replay
- what must not be replayed

Never assume job state alone equals business state.

---

# 166. Business Result Verification

For critical workflows verify the final invariant.

Example:

```text
workflow succeeded
+
database state correct
+
external state reconciled
```

Only then consider the operation recovered.

---

# 167. Automation Score

Do not score based on workflow complexity.

Evaluate:

### 0–2 — dangerous
Data corruption, duplicate side effects, or silent failure is plausible.

### 3–4 — demo-level
Works mainly under ideal conditions.

### 5–6 — functional
Useful but important recovery/reliability gaps remain.

### 7–8 — strong
Good reliability, observability, recovery, security, and testing.

### 9 — excellent
High operational maturity with strong evidence.

### 10 — exceptional
Rare; requires deep evidence across failure, scale, security, recovery, and business correctness.

A score without evidence is meaningless.

---

# 168. Final Brutal Questions

Before approving a KEETY automation, answer:

1. What happens if the event arrives twice?
2. What happens if it arrives 100 times?
3. What happens if two workers process it simultaneously?
4. What happens if the worker dies after the external side effect?
5. What happens if the database is unavailable?
6. What happens if the AI provider is unavailable?
7. What happens if the provider returns 429 for 10 minutes?
8. What happens if the provider changes its response schema?
9. What happens if the queue is unavailable?
10. What happens if 100,000 jobs accumulate?
11. Can one tenant consume all workers?
12. Can one tenant access another tenant's automation?
13. Can a stale job overwrite newer data?
14. Can a replay duplicate side effects?
15. Can a failed job disappear?
16. Can an automation fail silently?
17. Can retries create an outage?
18. Can retries create an uncontrolled AI bill?
19. Can AI output trigger a dangerous action?
20. Can a malicious document influence an automation?
21. Can a webhook be replayed?
22. Can a cron execute twice?
23. Can development reach production?
24. Can an operator safely stop the workflow?
25. Can the workflow recover after a deployment?
26. Can we reconstruct what happened from logs/traces?
27. Can we prove tenant isolation?
28. Can we prove the final business state is correct?
29. Can we recover from partial failure?
30. Can we restore the automation after infrastructure loss?

If the answer is unknown, the automation is not production-ready.

---

# 169. KEETY Automation Reference Flow

For a typical KEETY asynchronous AI/RAG workflow:

```text
User/API/Webhook
       ↓
Authenticate
       ↓
Authorize
       ↓
Resolve tenant
       ↓
Validate input
       ↓
Create durable job/event
       ↓
Idempotency check
       ↓
Commit state
       ↓
Queue
       ↓
Worker claims job
       ↓
Re-check tenant/resource authorization
       ↓
Load authoritative state
       ↓
Execute bounded step
       ↓
Validate output
       ↓
Persist checkpoint
       ↓
Next step
       ↓
Success
       ↓
Business-result verification
       ↓
Audit + metrics
```

Failure path:

```text
failure
 ↓
classify
 ↓
retryable?
 ├─ yes → bounded retry
 │          ↓
 │       exhausted?
 │          ↓
 │         DLQ
 │
 └─ no → terminal failure
             ↓
          alert/recovery
```

---

# 170. What Automation.md Does NOT Guarantee

This document does not magically guarantee:

- zero failures
- zero duplicate events
- exactly-once execution
- zero downtime
- perfect AI behavior
- perfect provider availability
- zero security vulnerabilities

It defines the engineering controls required to make failures:

- preventable where possible
- detectable
- bounded
- recoverable
- testable

---

# 171. Completion Standard

`Automation.md` is complete only when the actual implementation can demonstrate:

```text
Every important automation
        ↓
has an owner
        ↓
has a clear purpose
        ↓
has explicit tenant scope
        ↓
has validated triggers
        ↓
has idempotency
        ↓
has bounded retries
        ↓
has concurrency controls
        ↓
has failure handling
        ↓
has recovery/replay strategy
        ↓
has observability
        ↓
has security controls
        ↓
has cost controls
        ↓
has automated tests
        ↓
has operational runbooks
        ↓
has deployment/version controls
        ↓
has measurable business correctness
```

---

# 172. Final Principle

Do not optimize for:

> "The workflow ran."

Optimize for:

> **Correctness + tenant isolation + idempotency + reliability + recoverability + observability + security + controlled complexity + controlled cost + measurable business value.**

Good KEETY automation is automation that:

- runs correctly
- handles duplicates
- survives worker crashes
- handles dependency failures
- avoids retry storms
- protects tenant boundaries
- treats AI output as untrusted
- can be observed
- can be recovered
- can be safely replayed
- has bounded cost
- has a clear owner
- has a measurable reason to exist

---

# FINAL RELEASE ORDER

Before production:

1. Inventory every automation.
2. Identify owner and business purpose.
3. Define tenant scope.
4. Define trigger and trust boundary.
5. Validate inputs.
6. Design idempotency.
7. Analyze concurrency.
8. Define state machine.
9. Define transaction boundaries.
10. Define failure behavior.
11. Define retries.
12. Add backoff and jitter.
13. Define DLQ behavior.
14. Define replay.
15. Define recovery.
16. Define timeouts.
17. Define queue/backpressure behavior.
18. Define rate limits.
19. Define dependency failure behavior.
20. Define AI safety boundaries.
21. Define RAG isolation.
22. Define security controls.
23. Define observability.
24. Define audit trail.
25. Define cost limits.
26. Test duplicates.
27. Test concurrency.
28. Test dependency failures.
29. Test recovery.
30. Test load/spikes.
31. Test tenant isolation.
32. Test malicious inputs.
33. Test deployment compatibility.
34. Test rollback/recovery.
35. Verify production configuration.
36. Document the runbook.
37. Deploy with controlled rollout.
38. Verify business outcomes.
39. Monitor.
40. Re-audit after meaningful changes.

Only then should the automation be considered production-ready.

**No fake 10/10.**

**No silent failures.**

**No blind retries.**

**No duplicate side effects.**

**No cross-tenant processing.**

**No AI bypassing authorization.**

**No uncontrolled automation cost.**

**No unbounded queues.**

**No production workflows nobody understands.**

**No workflow complexity without measurable value.**

**Be brutal. Be evidence-driven. Protect the data, users, and business.**
