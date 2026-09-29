# FindandFixbugAutomation.md — KEETY Bug Detection, Diagnosis & Safe Fix Automation

> **Purpose:** Define how KEETY detects software defects, gathers evidence, reproduces failures, diagnoses root causes, proposes fixes, verifies those fixes, and safely delivers them.
>
> **Core workflow:** Detect → Triage → Reproduce → Diagnose → Patch → Test → Review → Release → Verify.
>
> This document is an engineering specification, not a claim that KEETY already implements these capabilities. Requirements must be implemented and verified against the actual repository.

---

## 1. Goals

KEETY is a multi-business AI platform. Bug automation must cover the full system:

- Frontend and user workflows
- Backend services and APIs
- Authentication, authorization, and tenant isolation
- Database schema, queries, migrations, and transactions
- Business analytics and reporting
- AI answers, tools, retrieval-augmented generation (RAG), and evaluations
- File ingestion, indexing, and storage
- Integrations, webhooks, queues, scheduled jobs, and retries
- Performance, reliability, deployment, and observability

The objective is **not** to maximize the number of automatically changed files. It is to reduce time to diagnosis while preserving correctness, security, data integrity, and engineering accountability.

## 2. Non-negotiable principles

1. Evidence before assumptions.
2. Reproduce before patching whenever practical.
3. Fix the root cause, not just the visible symptom.
4. Add a meaningful regression test for confirmed defects.
5. Prefer the smallest safe change.
6. Never weaken tests or security controls to make CI green.
7. Treat AI-generated diagnoses as hypotheses until verified.
8. Run changes in an isolated workspace with least privilege.
9. Require human approval for high-risk changes.
10. Do not declare a fix complete until the relevant behavior is verified.
11. Preserve an auditable record of the diagnosis, patch, tests, review, and release.
12. Stop and escalate when evidence is insufficient or the repair loop reaches its limit.

## 3. Scope and operating modes

### Mode A — Detect and report
Collect evidence, group related failures, classify risk, and create an issue. No source files are modified.

### Mode B — Diagnose and reproduce
Generate a reproduction, inspect relevant code and recent changes, and propose likely root causes. No patch is merged.

### Mode C — Prepare a patch
Create an isolated branch, add a regression test, generate a minimal patch, and run checks. A pull request is opened for review.

### Mode D — Controlled delivery
After approval, release through the normal CI/CD process, run smoke tests, monitor outcomes, and roll back when predefined conditions are met.

**Default policy:** Start in Mode A or B. Patch generation may be enabled for low-risk defects, but direct production changes and unrestricted autonomous deployment are prohibited by default.

## 4. Canonical workflow

```text
Failure signal
  ↓
Collect and sanitize evidence
  ↓
Deduplicate and classify
  ↓
Assess impact and severity
  ↓
Reproduce in an isolated environment
  ↓
Identify root cause and test gap
  ↓
Add a regression test that fails before the fix
  ↓
Generate the smallest safe patch
  ↓
Run targeted tests and static checks
  ↓
Run risk-based regression/security checks
  ↓
Review patch and evidence
  ↓
Merge through repository policy
  ↓
Deploy to staging / controlled release
  ↓
Smoke test and monitor
  ↓
Confirm original failure is gone
  ↓
Close or roll back; record lessons learned
```

Every stage must record its result. A skipped stage must be marked as skipped with a reason, not silently treated as passed.

## 5. Failure sources

The system may ingest signals from:

- Lint, type-check, compiler, build, and test failures
- API contract and integration tests
- Runtime exceptions, frontend crashes, and HTTP 5xx responses
- Latency, error-rate, queue-depth, and resource alerts
- Database constraint violations, slow queries, and migration failures
- Security scanners and authorized security tests
- AI evaluation regressions, invalid structured output, tool failures, and RAG retrieval defects
- Failed background jobs, webhooks, scheduled tasks, and external integrations
- Deployment health checks and synthetic monitoring
- User-reported issues and support tickets

A metric anomaly is a signal to investigate, not proof of a software defect.

## 6. Bug classification

Each issue should have one primary category and optional secondary tags.

Primary categories:

- Functional
- Data integrity
- Authentication / authorization
- Tenant isolation
- API / contract
- Database / migration
- Concurrency / idempotency
- Performance / scalability
- Reliability / recovery
- AI / prompt / tool use
- RAG / indexing / retrieval
- Integration / queue / webhook
- Frontend / accessibility
- Deployment / configuration
- Dependency / supply chain
- Observability

Possible classifications:

- Confirmed product defect
- Regression
- Test defect
- Environment/configuration issue
- External dependency incident
- Expected behavior
- Duplicate
- Not reproduced
- Insufficient evidence

Do not label an issue a confirmed product bug solely because an AI model says it is one.

## 7. Severity and response

Severity is based on actual or plausible impact, affected scope, exploitability, and data sensitivity.

| Severity | Meaning | Examples | Required response |
|---|---|---|---|
| P0 Critical | Active major security, data integrity, or platform emergency | Cross-business data exposure, destructive corruption, widespread outage | Immediate incident response; stop risky automation; human-led mitigation |
| P1 High | Major workflow or important security/reliability failure | Core business workflow unavailable, significant incorrect analytics | Prioritized investigation and human review |
| P2 Medium | Material but bounded feature defect | Partial workflow failure with workaround | Normal prioritized engineering workflow |
| P3 Low | Minor or cosmetic issue | Non-blocking display defect | Backlog and scheduled repair |

Severity must not be inferred from stack-trace length or generated-model confidence. Security incidents follow the security incident process.

## 8. Evidence collection

Capture only the information needed to diagnose the issue:

- Issue/incident ID and timestamps
- Environment, service, release version, and commit SHA
- Request ID, trace ID, endpoint, and operation
- Sanitized error message and stack trace
- Relevant logs, metrics, and traces
- Test name, input fixture, expected behavior, and actual behavior
- Relevant recent deployments or code changes
- Dependency/provider status
- Database operation or query fingerprint, where appropriate
- Reproduction steps and frequency
- Business impact and affected feature
- AI prompt/model/retrieval metadata when relevant

Never put passwords, API keys, access tokens, session cookies, private keys, or unnecessary customer data in tickets, logs, traces, prompts, or generated pull requests. Redact before sending evidence to an external AI provider.

## 9. Reproduction policy

Prioritize a deterministic reproduction in a safe environment.

Record reproduction status as one of:

- **Confirmed:** Repeatable reproduction exists.
- **Intermittent:** Reproduced, but not on every attempt.
- **Likely:** Evidence supports the defect, but reproduction is incomplete.
- **Not reproduced:** Attempts did not reproduce it.
- **Insufficient evidence:** More information is needed.

A non-reproduced bug must not trigger speculative, broad code changes. For intermittent failures, preserve timestamps, random seeds, request IDs, execution order, concurrency level, and relevant environment details.

Use sanitized fixtures and dedicated test accounts. Never reproduce by experimenting destructively on customer production data.

## 10. Root-cause analysis

A diagnosis must distinguish observed facts from hypotheses.

Required report:

```text
Observed symptom:
Expected behavior:
Actual behavior:
Reproduction:
Evidence:
Immediate cause:
Underlying cause:
Alternative hypotheses:
Why existing tests missed it:
Proposed correction:
Regression test:
Risks and unknowns:
```

Where useful, apply a Five Whys analysis. Do not confuse the line that throws an exception with the deeper reason the system entered an invalid state.

Recent commits and deployments can guide investigation, but timing correlation is not proof of causation.

## 11. Regression test requirements

For a confirmed defect, create or improve a test at the lowest layer that reliably captures the behavior:

- Unit test for isolated logic
- Integration test for service boundaries
- API/contract test for request-response behavior
- Database test for constraints, queries, and transactions
- End-to-end test for a complete user workflow
- Security test for access-control boundaries
- Concurrency test for races or simultaneous updates
- AI evaluation case for model, prompt, retrieval, or tool behavior

**Required proof where practical:**

```text
Original implementation + regression test → FAIL
Patched implementation + same test → PASS
```

If the test passes before the patch, it has not demonstrated that it captures the defect. If the bug cannot be reproduced on the old version, document the limitation rather than claiming proof.

Assertions must encode the actual requirement. `toBeDefined()` or `toBeTruthy()` is not sufficient when the defect concerns a specific value, tenant, permission, state transition, or invariant.

## 12. Patch generation

A candidate patch must include:

- Summary of the defect
- Evidence supporting the root-cause hypothesis
- Files and behavior affected
- Minimal proposed change
- Regression test
- Tests and checks executed
- Potential side effects
- Security and tenant-isolation impact
- Migration/data impact
- Rollback or mitigation plan

Prefer small, focused patches. Do not combine an emergency bug fix with unrelated refactoring, dependency upgrades, formatting churn, or feature work unless the larger change is necessary and explicitly reviewed.

## 13. Anti-fix protections

The automation must flag patches that:

- Delete, skip, disable, or quarantine a failing test without approved rationale
- Weaken assertions or change expected results without requirement evidence
- Remove authorization checks, tenant filters, validation, rate limits, or security middleware
- Swallow exceptions or return fake success
- Hardcode test-specific or customer-specific outputs
- Add unlimited retries or excessive timeouts to hide failures
- Disable linting, type checking, security scanning, or CI checks
- Log sensitive data to make debugging easier
- Change production data directly
- Modify unrelated files without explanation
- Update snapshots blindly without reviewing the behavioral change

A test may be quarantined only under an explicit policy, with an owner, reason, issue link, expiration/review date, and a separate visible signal that the suite is degraded. Quarantine is not a fix.

## 14. Validation gates

Run checks based on the affected area and risk.

| Gate | Requirement |
|---|---|
| Reproduction test | Required for confirmed, reproducible bugs |
| Regression test | Required for confirmed defects unless technically infeasible; explain exceptions |
| Formatter / lint / type-check | Run applicable repository checks |
| Unit tests | Run relevant tests |
| Integration/API/contract tests | Run when boundaries or API behavior are affected |
| Database/migration tests | Run for schema, query, transaction, or data changes |
| Security tests | Required for security-sensitive changes |
| Tenant-isolation tests | Required when business-scoped data or authorization is involved |
| AI/RAG evaluation | Required when AI, prompts, retrieval, tools, or output validation change |
| Concurrency tests | Required when races, duplicate processing, or shared state are involved |
| Build | Must pass for the affected deployable application |
| Staging smoke tests | Required before production release |
| Production verification | Required after deployment |

A check that was not run is **NOT RUN**, not PASS. A test failure must not be omitted from the final report.

## 15. KEETY tenant-isolation safety gate

KEETY serves multiple businesses. Every query and operation involving business-owned data must enforce server-side tenant scope.

For affected changes, test:

```text
Business A user → Business A resource → allowed when authorized
Business A user → Business B resource → denied
Business B user → Business B resource → allowed when authorized
Unauthenticated user → protected resource → denied
```

Cover relevant paths such as:

- Products, inventory, orders, sales, and analytics
- Dashboards, exports, reports, and search
- Documents, embeddings, vector retrieval, and RAG context
- AI chat history, conversation memory, caches, and tool calls
- Background jobs, scheduled reports, and integrations
- File URLs and object storage references

Never trust a tenant ID supplied by the client without server-side authorization. Ensure tenant scope is enforced in the service/data-access boundary and cannot be omitted accidentally. Cache keys and vector-search filters must include the correct tenant scope where applicable.

Any confirmed cross-business data exposure is P0 by default and requires immediate security incident handling.

## 16. Authentication and authorization fixes

For changes involving identity or access control, test:

- Missing, malformed, expired, and invalid credentials
- Correct user access to their own permitted resources
- Horizontal access attempts using another user's/business's object IDs
- Vertical privilege escalation
- Admin-only actions by lower-privilege users
- Session invalidation and role changes
- Direct API access independent of frontend visibility
- Resource access through exports, caches, background jobs, and AI tools

Frontend hiding is not authorization. The server must enforce permissions on every relevant operation.

## 17. Database and data-integrity fixes

For database-related defects, verify:

- Constraints and foreign keys
- Unique constraints and duplicate behavior
- Null, empty, and boundary values
- Transaction commit and rollback
- Concurrent updates and lost-update protection
- Query filters and tenant scope
- Pagination and deterministic ordering
- Aggregation, currency precision, and rounding
- Time zones and date boundaries
- Indexes and query performance
- Migration behavior on both fresh and existing schemas
- Compatibility between application versions during rollout

Use representative synthetic data volumes. Never assume an ORM makes the database behavior correct. Avoid destructive migration steps without a reviewed recovery strategy.

## 18. Idempotency, retries, and concurrency

For operations that may be retried or processed more than once, test duplicate and simultaneous execution.

Relevant KEETY examples include:

- Order or transaction ingestion
- Inventory changes
- Import jobs
- Webhooks
- Scheduled analytics refreshes
- Document ingestion and indexing
- AI task queues
- External integration syncs

Verify that retries do not duplicate side effects, invalid state transitions, records, notifications, or charges. Test at-least-once delivery assumptions, idempotency keys, unique constraints, atomic updates, and retry limits as applicable.

For concurrency defects, test the invariant under parallel execution. A sequential unit test alone is insufficient when the defect depends on a race.

## 19. AI and RAG bug automation

AI bugs require tracing the full path rather than changing the prompt immediately.

Capture, with sensitive content redacted:

```text
User question
→ Authenticated identity and tenant scope
→ Intent / routing
→ Deterministic data query or tool call
→ Retrieved records and documents
→ Prompt and model version
→ Model output
→ Schema / policy validation
→ Final response
```

Classify the failure as one or more of:

- Incorrect or stale source data
- Wrong time range, aggregation, or business scope
- Retrieval/indexing/chunking/embedding failure
- Incorrect tenant filter
- Prompt or context construction defect
- Model hallucination or reasoning error
- Unauthorized or failed tool call
- Invalid structured output
- Cache staleness
- Response formatting or frontend display defect

For RAG, inspect parsing, chunking, indexing, retrieval, reranking, context assembly, generation, and citation/evidence validation separately. Fix the earliest broken stage rather than masking it downstream.

Every meaningful AI fix should add an evaluation case to a stable benchmark. Evaluate groundedness, correctness, tenant isolation, refusal/uncertainty behavior, structured-output validity, latency, and cost where relevant. A model or prompt change must not be declared better based on a few cherry-picked examples.

## 20. AI safety and tool permissions

If a bug involves prompt injection, malicious documents, data extraction, or tool misuse:

- Treat retrieved text and uploaded documents as untrusted data, not instructions.
- Enforce authorization in the tool/service, not in the model prompt alone.
- Give tools the least privilege required.
- Validate tool arguments against strict schemas and business rules.
- Require confirmation for consequential or irreversible actions.
- Prevent cross-tenant retrieval and tool execution.
- Test direct and indirect prompt-injection cases.
- Never expose secrets or hidden system instructions as a debugging shortcut.

AI output must not be treated as the source of truth for financial or operational facts when deterministic business data is available.

## 21. External dependencies and integrations

For provider-related bugs, test relevant failure modes:

- Timeout and connection reset
- 429 rate limit
- 5xx response
- Invalid or unexpected schema
- Authentication failure
- Slow response
- Partial response
- Duplicate or out-of-order webhook
- Retry exhaustion
- Provider outage

Distinguish application defects from provider incidents and configuration errors. Use controlled integration tests where safe; mocks alone cannot prove real provider compatibility. Retries must be bounded, observable, and safe for non-idempotent operations.

## 22. Flaky-test investigation

Do not simply retry a failing test until it turns green.

Record:

- Failure frequency and history
- Random seed and test order
- Parallelism and shared state
- Clock/time-zone dependency
- Network/provider dependency
- Database cleanup and isolation
- Race conditions and timing assumptions
- Environment and resource contention

Classify the cause as product defect, test defect, environment issue, race, external dependency, or unknown. Retries can gather diagnostic evidence but must not erase the original failure.

## 23. Runtime error grouping and anomaly detection

Normalize similar stack traces and group failures by stable fingerprints, such as service, error type, normalized stack, endpoint, and release version. Do not include raw secrets or customer content in fingerprints.

Monitor relevant signals:

- Error rate and latency
- Frontend crashes
- Database errors and connection-pool pressure
- Queue depth and job failures
- Integration failures
- AI failure/evaluation rate
- Token usage and cost
- Authorization denials and suspicious access patterns
- Business invariants and data freshness

An anomaly should trigger evidence collection and triage. It must not automatically trigger a source-code patch without diagnosis.

## 24. Isolation and least privilege

Run coding automation in an isolated, disposable workspace with:

- Restricted credentials
- No production database access by default
- No production secrets by default
- Controlled network access
- Sanitized test fixtures
- Resource and runtime limits
- Reproducible dependency installation
- Branch protection and normal CI checks

Use read-only repository access for diagnosis where possible. Grant write access only to the isolated branch/workspace. Do not give an AI agent unrestricted shell, deployment, secret, or production access just to make the workflow convenient.

## 25. Bounded repair loop

Set explicit limits for:

- Diagnosis attempts
- Patch iterations
- Total runtime
- Test retries
- Files changed
- Token/cost budget
- Tool calls

Example:

```text
Reproduce → Hypothesis → Patch 1 → Validate
                         ↓ failure
                   Reassess evidence
                         ↓
                    Patch 2 → Validate
                         ↓ failure
                    Stop and escalate
```

Do not let an agent repeatedly make unrelated edits in response to cascading test failures. Each iteration must state what new evidence justifies the next change.

## 26. Human review and auto-merge policy

Human review is mandatory for changes involving:

- Authentication, authorization, or tenant isolation
- Production data migrations or destructive operations
- Financial or other consequential business operations
- Secrets, cryptography, or security controls
- Infrastructure, deployment, or access policies
- AI tool permissions or sensitive-data handling
- P0/P1 incidents
- Broad refactoring or uncertain root cause
- Tests that remain flaky or failures that cannot be reproduced

Auto-merge may be considered only for narrowly scoped, low-risk changes when repository policy explicitly permits it, required checks pass, a meaningful regression test exists, and no security boundary, migration, or consequential behavior is changed. Passing CI alone is not sufficient.

## 27. Pull request template

Every generated bug-fix PR should include:

```markdown
## Bug
What failed, and what should have happened?

## Impact and severity
Affected feature, users/businesses, and severity rationale.

## Reproduction
Steps, fixture, environment, and reproduction status.

## Evidence and root cause
Observed facts, root-cause explanation, and remaining uncertainty.

## Fix
Minimal behavior change and files affected.

## Regression test
Which test fails before the fix and passes after it?

## Validation
Commands/checks run and exact results; list NOT RUN checks.

## Security and tenant isolation
Access-control implications and tests.

## Data / migration impact
Schema changes, backfill, compatibility, and recovery plan.

## Risks and rollback
Remaining risks, monitoring, and rollback/mitigation steps.
```

## 28. Machine-readable fix report

Each fix should produce a record that distinguishes evidence from assumptions. Example:

```yaml
bug_id: KEETY-123
severity: P1
status: awaiting_review
classification: authorization

reproduction:
  status: confirmed
  artifact: tests/security/cross-tenant-access.test.ts

root_cause:
  summary: "Business scope was not enforced by the document lookup."
  evidence:
    - "Regression test reproduced cross-business access before the patch."
  uncertainty:
    - "Production exposure scope requires incident investigation."

patch:
  branch: "fix/KEETY-123"
  files_changed:
    - "src/documents/service.ts"
    - "tests/security/cross-tenant-access.test.ts"

validation:
  regression_test: PASS
  unit_tests: PASS
  integration_tests: PASS
  security_tests: PASS
  build: PASS
  production_verification: NOT_RUN

risk:
  security_boundary_changed: true
  migration_required: false
  human_review_required: true
```

Use actual outcomes only. Never fill `PASS` based on an assumption or model-generated summary.

## 29. Release, monitoring, and rollback

After approval, use the normal deployment process.

1. Deploy to a test/staging environment.
2. Run health checks and relevant smoke tests.
3. Release progressively when the platform supports canary or staged rollout.
4. Compare errors, latency, data invariants, and business metrics with the baseline.
5. Verify the original defect is no longer observable.
6. Check for new regressions.
7. Roll back or disable the feature when predefined safety thresholds are crossed.
8. Record the final outcome.

Rollback rules must be deterministic and tested. Database changes may not be safely reversible; define a forward-fix or recovery plan when needed. Never run destructive synthetic tests against customer data.

## 30. Production verification

A fix is not fully verified merely because the pull request passed CI.

Production verification should use safe telemetry or dedicated synthetic accounts and check:

- Original symptom is absent
- Expected behavior is restored
- No new critical errors appear
- Tenant/security boundaries remain intact
- Relevant business metrics are plausible
- Background jobs and integrations recover normally
- AI/RAG behavior meets the applicable evaluation and freshness requirements

If production verification is unavailable, leave the issue in a state such as `deployed_unverified` rather than `closed`.

## 31. Bug lifecycle and statuses

Recommended lifecycle:

```text
Detected
→ Triaged
→ Reproducing
→ Confirmed
→ Root Cause Identified
→ Fix In Progress
→ Regression Added
→ Validated
→ Awaiting Review
→ Approved
→ Deployed
→ Production Verified
→ Closed
```

Alternative statuses include `Duplicate`, `Expected Behavior`, `Not Reproduced`, `Blocked`, `Deferred`, `Rejected`, and `Rolled Back`.

Every active issue should have an owner, severity, affected service, next action, and review date. Avoid creating large volumes of unowned duplicate tickets.

## 32. Audit trail and privacy

Retain a trace of:

- Detection source and time
- Evidence collected and redactions applied
- Reproduction artifacts
- Diagnosis and alternative hypotheses
- Patch diff and commit SHA
- Tests/checks and their results
- Human approvals
- Deployment version
- Production verification
- Rollback or incident follow-up

Limit retention and access according to KEETY's data policies. Avoid storing raw customer prompts, documents, or business data unless necessary and authorized. Protect audit records from unauthorized modification.

## 33. Metrics that matter

Track quality, not just automation volume.

### Detection and diagnosis
- Mean time to detect
- Mean time to reproduce
- Mean time to diagnose
- Confirmed-defect rate
- False-positive rate

### Fix quality
- Regression-test effectiveness
- Patch acceptance/rejection rate
- False-fix rate
- Reopened defect rate
- Regression rate
- Rollback rate

### Reliability
- Escaped defects
- Mean time to recover
- Flaky-test rate
- Time spent on test failures
- Percentage of critical paths with meaningful automated tests

### Automation
- Issues diagnosed without patching
- Candidate patches reviewed
- Candidate patches accepted
- Automated fixes that pass independent verification
- Cost and runtime per issue

Do not optimize for number of patches generated or percentage of tests passed without considering whether real defects are detected and corrected.

## 34. KEETY high-priority defect patterns

Treat these as important patterns for detection and regression prevention:

1. Cross-business data leakage
2. Authentication bypass and broken object-level authorization
3. Incorrect revenue, inventory, order, or other business analytics
4. Data corruption and invalid state transitions
5. Duplicate processing and unsafe retries
6. Race conditions in shared business state
7. AI presenting unsupported claims as verified business facts
8. RAG retrieving stale, deleted, or another tenant's information
9. Prompt injection leading to unsafe or unauthorized tool use
10. Background-job or webhook duplication
11. Migration failure or old/new application incompatibility
12. Secret or personal/business data exposure
13. Severe latency or cost regression
14. Integration/provider failures without safe recovery
15. Broken access control in exports, caches, search, or file URLs

## 35. Example: cross-business data leakage

**Symptom:** A user from Business A receives analytics belonging to Business B.

The automation should:

1. Treat the event as a potential security incident.
2. Preserve and sanitize relevant evidence.
3. Stop autonomous patching and alert the responsible team.
4. Reproduce using two isolated test businesses.
5. Identify where tenant scope is lost.
6. Add a regression test that proves the old behavior leaks and the corrected behavior denies access.
7. Patch the service/data-access boundary.
8. Run API, analytics, cache, search, AI/RAG, and authorization tests relevant to the affected path.
9. Require human security review.
10. Follow incident response, controlled deployment, and post-deployment verification.

Do not merely change the displayed number or hide the affected UI.

## 36. Example: incorrect AI business answer

**Symptom:** KEETY claims sales increased by 30%, while the trusted analytics result shows a decrease.

Investigate the complete chain:

```text
Question → Tenant and time range → Analytics query
→ Deterministic result → Prompt context → Model output
→ Output validation → Final UI
```

Possible causes include wrong source data, wrong date range, wrong tenant, stale cache, missing context, model hallucination, or a formatting/transformation defect. Add an evaluation case with the correct expected calculation and evidence. Do not alter the prompt until the failing layer is identified.

## 37. Example: stale RAG information

**Symptom:** A product price changes from 20 to 25, but KEETY still answers 20.

Inspect:

```text
Source database
→ Change event / ingestion
→ Parser and chunker
→ Index and embeddings
→ Retrieval filters
→ Retrieved context
→ Cache
→ Generated answer
```

The regression should assert the documented data-freshness guarantee and verify that deleted or superseded values are not returned after the allowed update window.

## 38. Example: concurrent inventory updates

**Symptom:** Two simultaneous requests produce a negative stock count.

1. Create a parallel reproduction with isolated test data.
2. Define the invariant, such as `stock >= 0`.
3. Inspect transaction isolation, atomic updates, constraints, and locking.
4. Add a repeatable concurrency regression test.
5. Apply the smallest correct fix.
6. Run repeated concurrent tests and database integration tests.
7. Verify that the invariant holds under the expected request pattern.

A sequential test alone does not prove the race has been fixed.

## 39. Example: intermittent test failure

**Symptom:** A test fails occasionally but passes on retry.

Do not close it as harmless. Capture failure frequency, random seed, order, timing, shared state, network dependency, database cleanup, and parallelism. Determine whether the failure reveals a product race, a flawed test, or an unstable environment. If temporarily quarantined, assign an owner and expiration/review date.

## 40. Production-readiness checklist

- [ ] Failure sources are defined and observable.
- [ ] Evidence is collected with sensitive data redacted.
- [ ] Similar errors are deduplicated.
- [ ] Severity and ownership are assigned.
- [ ] Reproduction status is explicit.
- [ ] Root-cause facts are separated from hypotheses.
- [ ] Confirmed defects have meaningful regression tests.
- [ ] Regression tests are shown to capture the old behavior where practical.
- [ ] Patches are small, isolated, and traceable.
- [ ] Test suppression and assertion weakening are detected.
- [ ] Relevant unit, integration, API, database, and security checks run.
- [ ] Tenant isolation is tested when business data is involved.
- [ ] AI/RAG changes are evaluated against stable cases.
- [ ] Concurrency and duplicate processing are tested when relevant.
- [ ] Repair loops and resource usage are bounded.
- [ ] High-risk changes require human approval.
- [ ] Secrets and production data are not exposed to coding agents.
- [ ] CI/CD and deployment controls remain in force.
- [ ] Smoke tests and production verification are defined.
- [ ] Rollback/recovery strategy is documented.
- [ ] Audit trail and outcome metrics are retained.
- [ ] Escaped defects produce test or monitoring improvements.

## 41. Final operating rule

KEETY's bug automation must never report **“fixed”** just because it generated code or a test suite turned green.

A trustworthy fix means:

> The defect was investigated with evidence, reproduced where practical, traced to a supported root cause, corrected with a minimal change, covered by a meaningful regression test, validated against relevant risks, reviewed at the required level, and verified after release.

**No blind auto-fixing. No fake root-cause certainty. No weakened tests. No security bypass. No cross-tenant leakage. No unlimited patch loops. No secret exposure. No unverified production fixes.**

Find the real failure. Reproduce it. Understand it. Fix the cause. Prove the fix. Protect against recurrence. Then ship it safely.
