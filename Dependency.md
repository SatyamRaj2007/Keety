# Dependency.md — KEETY Dependency Architecture, Security & Supply-Chain Standard

> **Status:** Canonical engineering specification  
> **Scope:** KEETY frontend, backend, workers, AI/RAG, automation, data, CI/CD, Docker, and production runtime  
> **Goal:** Every dependency must be necessary, trusted, reproducible, supportable, observable, and appropriate for its execution context.

---

## 1. Purpose

KEETY is a multi-tenant AI business assistant. Its dependency graph is therefore part of the application's security boundary.

This document defines how KEETY evaluates, adds, upgrades, removes, monitors, and responds to dependencies.

The objective is **not** to minimize the package count.

The objective is:

> **The right dependency + the right version + the right execution boundary + controlled supply-chain risk + reproducible installation + predictable failure behavior.**

Every dependency is code KEETY chooses to trust.

---

# 2. Read the Architecture Before Reviewing Dependencies

Dependency review MUST be performed against the current:

- `architecture.md`
- `frontend.md`
- `backend.md`
- `database.md`
- `security.md`
- `transaction.md`
- `automation.md`
- `ai.md`
- `RAG.md`
- `testing.md`
- `review.md`
- deployment and CI/CD configuration

Do not approve or remove a package from its manifest entry alone.

First understand:

```text
User
 ↓
Frontend
 ↓
API / Auth
 ↓
Business services
 ↓
Database / Cache / Search
 ↓
Automation / Queue / Workers
 ↓
AI / RAG / External providers
```

A dependency's risk depends on where it sits in this system.

---

# 3. KEETY Dependency Principles

## 3.1 Necessity

Every direct dependency must have a documented reason.

## 3.2 Least privilege

A dependency must run with only the permissions and access it needs.

## 3.3 Reproducibility

Developer, CI, staging, and production installations must resolve from controlled manifests and lockfiles.

## 3.4 Minimal trust

Prefer smaller, mature, well-understood dependencies over unnecessary abstraction layers.

## 3.5 Isolation

Development-only tooling must not become part of the production runtime unless explicitly justified.

## 3.6 Upgradeability

A dependency must have a realistic upgrade path.

## 3.7 Observability

Critical dependency failures must be visible through logs, metrics, traces, health checks, or alerts.

## 3.8 Recoverability

KEETY must have a response plan when a critical dependency is vulnerable, unavailable, abandoned, or compromised.

---

# 4. Complete Dependency Inventory

Maintain an inventory covering:

### Direct dependencies

Declared explicitly by KEETY.

### Transitive dependencies

Pulled in by another dependency.

### Development dependencies

Testing, linting, formatting, local tooling, type checking, build tooling.

### Optional dependencies

Environment- or feature-specific packages.

### Build-time dependencies

Compilers, bundlers, code generators, CSS processors, framework plugins.

### Runtime dependencies

Packages loaded by production services.

### Worker dependencies

Packages used by asynchronous automation and background workers.

### AI/RAG dependencies

LLM SDKs, embeddings, parsers, retrieval, vector clients, tokenizers, document processing.

### Infrastructure dependencies

Cloud SDKs, database drivers, Redis clients, queue clients, storage SDKs.

The inventory should identify at minimum:

```text
Package
Version
Direct/Transitive
Runtime/Dev/Build
Service
Purpose
Owner
Criticality
License
Known vulnerabilities
Upgrade policy
```

---

# 5. Dependency-to-Service Mapping

A package is not fully understood until its execution context is known.

Map dependencies to:

- Web frontend
- Next.js server runtime
- API service
- Worker
- Scheduler
- AI service
- RAG ingestion
- RAG retrieval
- Database layer
- Cache layer
- Search layer
- Storage layer
- CI/CD
- Local development

Example:

```text
Package
 ↓
Service
 ↓
Execution context
 ↓
Permissions
 ↓
Data accessed
 ↓
Failure impact
```

This prevents a low-risk development package from being treated the same as an authentication, database, or AI-runtime dependency.

---

# 6. Dependency Purpose Test

For every direct dependency record:

```text
Package:
Purpose:
Used by:
Execution context:
Criticality:
Why this package:
Alternative considered:
Security considerations:
Performance considerations:
Upgrade considerations:
Owner:
```

Reject:

> "We might need it later."

Do not add speculative dependencies.

---

# 7. Usage Verification

Search actual code and configuration for:

- Static imports
- Dynamic imports
- CLI commands
- Build plugins
- Configuration references
- Scripts
- Generated code
- Server startup
- Worker startup
- Docker build steps
- CI workflows

Classify:

```text
Definitely used
Possibly used
Unused
Tooling-only
Generated/configuration-only
```

Do not remove a package until its transitive/tooling role has been checked.

---

# 8. Duplicate Functionality Review

Look for overlapping solutions:

```text
HTTP client + native fetch
Multiple validation libraries
Multiple date libraries
Multiple state managers
Multiple UI libraries
Multiple form libraries
Multiple ORM/database abstractions
Multiple logging libraries
Multiple queue clients
Multiple AI orchestration frameworks
Multiple vector clients
```

Duplication is not automatically bad.

Document why multiple solutions are necessary.

---

# 9. Native Platform Test

Before adding a small utility package ask whether KEETY can safely use:

- `fetch`
- `URL`
- `URLSearchParams`
- `FormData`
- `Map`
- `Set`
- `Promise`
- `Intl`
- Web APIs
- Node.js APIs
- React APIs
- Next.js APIs

Do not replace mature libraries merely to reduce package count.

---

# 10. Dependency Risk Classification

Classify dependencies:

### Critical

Failure or compromise could affect:

- Authentication
- Authorization
- Tenant isolation
- Database integrity
- Payments/billing if introduced
- Secrets
- AI/RAG data boundaries
- Production deployment

### High

Important application functionality depends on it.

### Medium

Useful application functionality but reasonably replaceable.

### Low

Development convenience or non-critical tooling.

Risk must consider both **failure impact** and **compromise impact**.

---

# 11. Security Vulnerability Management

Review:

- Direct vulnerabilities
- Transitive vulnerabilities
- Runtime vulnerabilities
- Development-only vulnerabilities
- Known exploited vulnerabilities
- Critical/high severity findings
- Vulnerabilities affecting reachable code

Do not blindly treat every scanner finding as equally exploitable.

For every important finding determine:

```text
Package
Advisory
Affected version
Fixed version
Reachability
Runtime exposure
Data exposure
Exploitability
Mitigation
Upgrade/remediation deadline
```

A vulnerable package used in authentication is materially different from an isolated build-time utility.

---

# 12. Vulnerability Severity Policy

Use severity as an input, not the entire decision.

Prioritize based on:

```text
Severity
×
Exploitability
×
Exposure
×
Reachability
×
Data sensitivity
×
Tenant impact
```

### Critical / actively exploited

Immediate triage and emergency remediation where applicable.

### High

Fast remediation with explicit owner and deadline.

### Medium

Scheduled remediation based on actual exposure.

### Low

Track and remediate through normal maintenance.

Document accepted risk rather than silently ignoring findings.

---

# 13. Exploitability and Reachability

A vulnerability review must ask:

> Can attacker-controlled input reach the vulnerable code path?

Also ask:

- Is the vulnerable feature enabled?
- Is the package server-side or client-side?
- Is it reachable from the internet?
- Does it process uploaded documents?
- Does it process untrusted HTML?
- Does it handle tenant data?
- Does it execute during installation?
- Does it run in CI with secrets?

This avoids both panic and false reassurance.

---

# 14. Authentication and Security-Critical Dependencies

Give deeper review to packages handling:

- Authentication
- Authorization
- Cryptography
- Sessions
- JWTs/tokens
- Password hashing
- File parsing
- HTML sanitization
- Serialization
- HTTP requests
- User input
- Code execution
- Cloud credentials
- Secrets

Never replace established cryptographic/authentication functionality with custom code merely to remove a dependency.

---

# 15. Lockfile Policy

KEETY MUST use the package manager and lockfile defined by the repository.

Requirements:

- Lockfile committed
- Manifest and lockfile synchronized
- CI uses frozen/immutable installation where supported
- Unexpected lockfile changes are reviewed
- Production installs resolve deterministically
- Dependency updates are traceable to a commit/PR

Do not maintain multiple package-manager lockfiles unless there is a documented reason.

---

# 16. Reproducible Builds

The goal is:

```text
Developer
   ↓
CI
   ↓
Staging
   ↓
Production
```

must use the same declared dependency resolution.

Pin:

- Runtime version
- Package-manager version where practical
- Dependency versions through lockfiles
- Container base image strategy
- Build tooling

Avoid floating production dependencies.

---

# 17. Container Dependency Control

Review:

- Base images
- OS packages
- Node/Python runtimes
- Global packages
- Build dependencies
- Runtime dependencies

Prefer:

```text
Build stage
   ↓
Minimal runtime stage
```

Do not ship compilers, test frameworks, package caches, or unnecessary build tools in the runtime image.

Scan container images for vulnerabilities.

---

# 18. Base Image Management

For every production image track:

```text
Base image
Version/digest
Runtime version
OS family
Last review
Known vulnerabilities
Upgrade owner
```

Where practical, pin production images by digest and update them deliberately.

---

# 19. Supply-Chain Threat Model

Assume:

> A legitimate dependency can become compromised.

Consider:

- Malicious release
- Maintainer account compromise
- Repository takeover
- Typosquatting
- Dependency confusion
- Malicious transitive package
- Compromised build script
- Registry compromise
- Package publication takeover
- Credential theft in CI

Reduce blast radius rather than assuming perfect prevention.

---

# 20. Install Script Review

Identify:

- `preinstall`
- `install`
- `postinstall`
- Other lifecycle scripts

For each important package determine:

```text
What executes?
When?
With what permissions?
Does it access network?
Does it access secrets?
Is it required?
```

Do not disable legitimate scripts blindly.

---

# 21. Dependency Confusion and Typosquatting

Before installing a package:

- Verify official package name.
- Verify official repository.
- Verify publisher/maintainer.
- Check package metadata.
- Check expected download source.
- Check whether a similarly named package exists.

Do not install based only on a search result or copied snippet.

---

# 22. Package Provenance

For critical dependencies, retain enough information to identify:

```text
Package name
Version
Registry
Resolved artifact
Integrity information
Lockfile entry
Source repository
Release/reference
```

Where supported by the ecosystem, use provenance/attestation information.

---

# 23. Integrity Verification

Use package-manager integrity mechanisms and lockfiles.

Unexpected integrity changes must be investigated.

Never normalize unexplained lockfile or checksum changes.

---

# 24. CI/CD Supply-Chain Security

CI is a privileged environment.

Review whether dependency installation can access:

- Cloud credentials
- Production secrets
- Signing keys
- Deployment tokens
- Repository write permissions

Prefer:

```text
Build with minimal secrets
 ↓
Test
 ↓
Produce artifact
 ↓
Deploy approved artifact
```

Do not expose production credentials merely because a package install script may execute code.

---

# 25. GitHub Actions / CI Dependency Controls

Review:

- Action versions
- Third-party actions
- Permissions
- Token scope
- Pull-request execution
- Fork behavior
- Dependency update bots
- Build caches

Pin sensitive third-party actions appropriately and review action changes.

---

# 26. SBOM

KEETY should be able to generate an SBOM for production artifacts.

The SBOM should identify:

- Direct dependencies
- Transitive dependencies
- Versions
- Package identifiers
- Runtime components
- Container components where applicable

Use the SBOM for incident response and vulnerability matching.

---

# 27. License Review

Inventory licenses including:

- MIT
- Apache-2.0
- BSD
- LGPL
- GPL
- AGPL
- Commercial
- Source-available
- Custom/restricted

Do not provide a legal conclusion from the dependency document.

Flag uncertain or restrictive cases for legal/compliance review.

---

# 28. Dependency Upgrade Policy

Do not blindly upgrade the entire dependency tree.

Classify updates:

### Security update

Prioritize based on exposure.

### Patch

Usually lower risk but still test.

### Minor

Review changelog and compatibility.

### Major

Requires migration review.

### Framework/runtime upgrade

Treat as an architectural change when appropriate.

---

# 29. Major Upgrade Procedure

Before a major upgrade:

1. Read release notes.
2. Read migration guide.
3. Identify deprecated APIs.
4. Identify peer dependency changes.
5. Review security changes.
6. Update code.
7. Run unit tests.
8. Run integration tests.
9. Run E2E tests.
10. Run build.
11. Run critical AI/RAG evaluations.
12. Run performance checks where relevant.
13. Verify deployment.
14. Verify rollback/recovery.

---

# 30. Dependency Removal Procedure

Before removal:

1. Confirm usage.
2. Search imports.
3. Search configuration.
4. Search scripts.
5. Search generated code.
6. Search Docker files.
7. Search CI.
8. Check transitive/tooling implications.
9. Remove.
10. Update lockfile.
11. Run tests.
12. Run build.
13. Run production-like smoke tests.

Never remove a package solely because a scanner labels it unused.

---

# 31. Framework Compatibility

For KEETY's web stack verify compatibility between:

- React
- Next.js
- Node.js
- TypeScript
- ESLint
- TypeScript ESLint
- UI libraries
- Build tools
- Testing tools

Check:

- Peer dependency conflicts
- Unsupported versions
- Experimental APIs
- Deprecated APIs
- Runtime incompatibilities

---

# 32. Next.js Server/Client Boundary

For every frontend dependency ask:

> Does this dependency force client-side execution?

Review:

- Client Components
- Server Components
- Route Handlers
- Server Actions
- Middleware/proxy
- Server-side data access

Do not allow a client dependency to accidentally expose:

- Secrets
- Database clients
- Internal APIs
- Server-only configuration
- Provider credentials

---

# 33. Frontend Bundle Impact

Measure meaningful impact from:

- Package size
- JavaScript shipped
- Tree-shaking
- Code splitting
- Client-side execution
- Browser compatibility

A large package can be justified.

The question is:

> Is the user-facing cost justified by the functionality?

---

# 34. Backend Runtime Impact

For server dependencies evaluate:

- Startup time
- Memory
- CPU
- Event-loop impact
- Connection management
- Serialization cost
- Logging overhead
- Bundle/build size

Avoid dependencies that materially increase runtime cost without corresponding value.

---

# 35. Database Dependencies

Review:

- PostgreSQL driver
- ORM/query builder
- Redis client
- Search client
- MongoDB client if actually used
- Migration tooling

Avoid unnecessary mixtures such as:

```text
ORM
+
multiple raw database clients
+
second ORM
```

unless architecture explicitly requires them.

Verify connection pooling, timeout behavior, retry behavior, and compatibility.

---

# 36. Redis / Cache Dependencies

For cache dependencies evaluate:

- Client maintenance
- Connection handling
- Serialization
- Retry behavior
- Timeout behavior
- Cluster compatibility if relevant
- Failure behavior

Caching libraries must never weaken tenant isolation.

---

# 37. Queue / Automation Dependencies

For queue and automation dependencies review:

- Duplicate delivery
- Retry behavior
- Dead-letter handling
- Serialization
- Visibility timeout
- Connection failures
- Graceful shutdown
- Version compatibility

The dependency must support KEETY's automation reliability requirements.

---

# 38. AI / LLM Dependency Governance

AI dependencies are high-impact because they can process business data.

Audit:

- LLM provider SDKs
- Embedding SDKs
- Tokenizers
- AI orchestration frameworks
- Tool-calling libraries
- Structured-output libraries
- Evaluation libraries
- Document processing libraries

For every AI dependency ask:

```text
What data does it receive?
Does it send data externally?
Does it require credentials?
Can it execute tools?
Can it introduce prompt injection risk?
What happens when the provider changes its API?
What is the fallback?
```

---

# 39. RAG Dependency Governance

Review the complete chain:

```text
Upload
 ↓
Parser
 ↓
Text extraction
 ↓
Chunking
 ↓
Metadata
 ↓
Embedding
 ↓
Vector storage
 ↓
Retrieval
 ↓
Reranking
 ↓
Context construction
 ↓
LLM
```

Every component must preserve:

- Tenant identity
- Document identity
- Access-control metadata
- Traceability
- Failure handling

A convenience RAG framework must not become an implicit security boundary.

---

# 40. Document Processing Dependencies

Because KEETY may ingest business documents, treat parsers as security-sensitive.

Test/review:

- PDF parsers
- Office document parsers
- CSV parsers
- Image/OCR libraries
- Archive handling
- MIME detection
- File-type detection

Consider:

- Malformed files
- Resource exhaustion
- Parser vulnerabilities
- Decompression bombs
- Embedded content
- Unexpected network access

---

# 41. AI Provider SDK Failure

Dependency review must include:

```text
Timeout
Rate limit
Provider outage
Invalid response
Schema change
Authentication failure
Model retirement
SDK breaking change
```

The application must fail safely.

---

# 42. AI Cost and Dependency Drift

AI dependencies can cause financial impact.

Monitor:

- Token usage
- Request volume
- Model changes
- Embedding volume
- Retry amplification
- Dependency-driven API behavior

A dependency upgrade must not silently multiply AI costs.

---

# 43. Authentication Dependency Governance

For authentication libraries verify:

- Supported runtime versions
- Security history
- Session behavior
- Cookie behavior
- Token behavior
- Cryptography
- Password handling
- Framework integration

Authentication dependencies receive higher review priority than ordinary UI packages.

---

# 44. Testing Dependencies

Separate:

- Unit framework
- Integration tools
- Browser automation
- Mocking
- Contract testing
- Load testing
- Security testing

Do not install multiple tools solving the same problem without a documented reason.

Testing dependencies should not leak into production runtime.

---

# 45. Lint / Format / Build Dependencies

Keep developer tooling understandable.

Review:

- ESLint
- Prettier
- TypeScript ESLint
- PostCSS
- Tailwind or equivalent
- Build plugins
- Code generators

Remove obsolete plugins after framework upgrades.

---

# 46. Dependency Failure Testing

For every critical dependency define expected behavior.

Example:

```text
Dependency unavailable
 ↓
Timeout / failure detected
 ↓
Application handles error
 ↓
No corrupted state
 ↓
No secret leakage
 ↓
Retry/fallback where appropriate
 ↓
Alert/metric emitted
```

---

# 47. Dependency Timeout Policy

Never allow external dependency calls to wait indefinitely.

Where applicable define:

- Connection timeout
- Request timeout
- Overall operation timeout
- Retry budget
- Backoff
- Circuit/failure handling

Timeouts must be tested.

---

# 48. Retry Amplification

Dependencies must not create retry storms.

Review:

```text
Application retry
+
SDK retry
+
Queue retry
+
Provider retry
```

Combined retries can multiply traffic dramatically.

Define ownership of retry behavior.

---

# 49. Dependency Failure and Transactions

A dependency failure must not leave critical business state half-completed.

For operations crossing:

```text
Database
+
Queue
+
AI provider
+
External API
```

define the transaction/recovery strategy.

Do not assume distributed operations are atomic.

---

# 50. Multi-Tenant Dependency Risk

KEETY is multi-tenant.

Dependency integrations must preserve tenant boundaries.

Review:

- Database clients
- Cache clients
- Search clients
- Vector stores
- Object storage
- Queue payloads
- AI providers
- Logs
- Metrics
- Analytics

A dependency that accidentally shares context between requests can become a cross-tenant data leak.

---

# 51. Tenant Context Propagation

Where dependencies process asynchronous work, tenant context must be explicit and validated.

Example:

```text
Request
 ↓
tenant_id
 ↓
job
 ↓
worker
 ↓
database
 ↓
RAG
 ↓
AI
```

Do not rely on mutable global state.

---

# 52. Secrets and Dependency Configuration

Never hardcode:

- API keys
- Database passwords
- Provider secrets
- Cloud credentials
- Private keys

Review whether dependency configuration can accidentally expose secrets through:

- Browser bundles
- Logs
- Error messages
- CI output
- Debugging
- Dependency diagnostics

---

# 53. Dependency Logging

Critical dependency errors should provide enough context for debugging without leaking:

- Secrets
- Tokens
- Full credentials
- Sensitive tenant data
- Uploaded documents
- Prompt contents where sensitive

---

# 54. Maintainer and Project Health

For critical dependencies review:

- Release activity
- Security response
- Maintainer activity
- Documentation
- Issue/PR activity
- Compatibility roadmap
- Deprecation status
- Ownership changes

Do not use popularity alone as proof of trust.

---

# 55. Abandoned Dependency Strategy

If a dependency appears abandoned:

1. Confirm actual maintenance status.
2. Check whether it remains secure.
3. Check whether the functionality is still needed.
4. Identify supported alternatives.
5. Estimate migration cost.
6. Create migration plan if risk justifies it.

Old does not automatically mean unsafe.

---

# 56. Dependency Decision Record

For every strategically important dependency record:

```text
Decision:
Problem solved:
Why chosen:
Alternatives:
Security risk:
Performance impact:
Operational impact:
License:
Upgrade path:
Exit strategy:
Owner:
Review date:
```

This prevents dependency decisions from becoming tribal knowledge.

---

# 57. Dependency Change Review

Every dependency addition/removal/upgrade should answer:

```text
Why is this change needed?
What functionality changes?
What security changes?
What transitive dependencies change?
What runtime changes?
What bundle changes?
What licenses change?
What tests are required?
What rollback exists?
```

---

# 58. Dependency Update Automation

Automated update tooling is useful, but updates must not be blindly merged.

Automation should:

- Open reviewable changes
- Show security information
- Run tests
- Run build
- Run relevant integration tests
- Run AI/RAG evaluations where affected
- Detect lockfile changes
- Respect version policy

High-risk upgrades require human review.

---

# 59. Patch Cadence

Maintain a regular dependency review cadence.

At minimum:

```text
Continuous
→ Critical security advisories

Regular
→ Dependency updates

Periodic
→ Full dependency architecture review
```

Do not wait for a production incident.

---

# 60. Emergency Vulnerability Procedure

When a critical dependency vulnerability is announced:

```text
Advisory
 ↓
Identify affected versions
 ↓
Determine KEETY exposure
 ↓
Identify reachable vulnerable code
 ↓
Choose upgrade/mitigation
 ↓
Test
 ↓
Deploy
 ↓
Verify
 ↓
Record incident
```

If immediate upgrade is impossible, document compensating controls.

---

# 61. Compromised Dependency Procedure

If a dependency may be compromised:

1. Stop automatic promotion of affected versions.
2. Identify affected builds.
3. Identify deployed versions.
4. Identify CI runs using the version.
5. Rotate exposed credentials where necessary.
6. Inspect artifacts and logs.
7. Rebuild from trusted versions.
8. Redeploy.
9. Investigate downstream impact.
10. Record the incident.

Treat CI compromise as potentially high impact because CI may hold deployment credentials.

---

# 62. Dependency Registry Outage

Plan for package registry unavailability.

Production deployment should not unexpectedly require fetching arbitrary new packages.

Use immutable build artifacts and controlled build pipelines where practical.

---

# 63. Dependency Cache Security

Caches can improve build speed but can also become a supply-chain risk.

Review:

- Cache keys
- Cache scope
- Pull-request behavior
- Cross-branch reuse
- Cross-project reuse
- Cache poisoning risk

Do not allow untrusted builds to poison privileged build caches.

---

# 64. Dependency Graph Monitoring

Monitor changes in:

- Direct packages
- Transitive packages
- Critical package versions
- License changes
- New install scripts
- New native binaries
- Unexpected dependency additions

Unexpected graph expansion should trigger review.

---

# 65. Bundle and Runtime Regression

Dependency upgrades must be checked for:

- Increased client bundle
- Increased server memory
- Increased startup time
- Increased build time
- Increased CPU
- Increased database calls
- Increased AI requests

Do not assume a semver-compatible upgrade has zero operational impact.

---

# 66. Dependency Performance Budget

For important frontend dependencies define acceptable budgets for:

- Added compressed JS
- Initial load impact
- Runtime execution
- Hydration impact

For backend dependencies monitor:

- Startup
- CPU
- Memory
- Throughput
- Latency

---

# 67. Dependency Compatibility Matrix

Maintain compatibility expectations for critical platform components:

```text
Node.js
React
Next.js
TypeScript
ORM/database client
Testing stack
AI SDK
Build tooling
```

A dependency upgrade is not complete until the relevant matrix remains valid.

---

# 68. Dependency Testing Matrix

Every meaningful dependency change should select tests based on affected surface.

### UI dependency

Run:

- Unit
- Component
- Visual
- Accessibility
- E2E where relevant

### Database dependency

Run:

- Integration
- Migration
- Transaction
- Concurrency
- Performance where relevant

### AI dependency

Run:

- AI benchmark
- RAG retrieval evaluation
- Grounding evaluation
- Schema validation
- Cost/latency checks
- Security tests

### Queue dependency

Run:

- Retry
- Duplicate
- Replay
- Failure
- Recovery
- Concurrency

---

# 69. Dependency Removal Test

A removed package must not cause hidden failures in:

- Build
- CI
- Runtime
- Workers
- Scripts
- Deployment
- Tests
- Generated files

Run the complete affected pipeline.

---

# 70. Dependency Rollback

For critical upgrades define:

```text
Previous known-good version
 ↓
Artifact
 ↓
Deployment rollback
 ↓
Database compatibility check
 ↓
Verification
```

Do not assume application rollback is safe if the dependency upgrade also changes persistent data or migrations.

---

# 71. Dependency and Database Compatibility

Database libraries can introduce:

- Query behavior changes
- Serialization changes
- Migration changes
- Connection-pool behavior
- Transaction changes

Test existing production-like schemas before rollout.

---

# 72. Dependency and API Compatibility

External SDK upgrades can change:

- Request format
- Response format
- Error format
- Authentication
- Retry behavior

Contract tests should protect important integrations.

---

# 73. Dependency and Automation Compatibility

Automation libraries can change:

- Job serialization
- Retry semantics
- Scheduling
- Worker compatibility
- Queue protocol

A worker upgrade must consider existing queued jobs.

---

# 74. Existing Job Compatibility

If a dependency affects job payloads or serialization:

```text
Old producer
+
New worker
```

and:

```text
New producer
+
Old worker
```

should be considered where rolling deployment makes this possible.

Avoid breaking already queued jobs.

---

# 75. AI/RAG Version Compatibility

Changes to:

- Embedding SDK
- Embedding model
- Tokenizer
- Chunking library
- Vector client
- Reranker
- LLM SDK

may alter existing RAG behavior.

Treat these as evaluation-triggering changes, not ordinary package bumps.

---

# 76. Dependency Review Checklist

Before approval:

- [ ] Purpose documented
- [ ] Actual usage verified
- [ ] Service mapped
- [ ] Runtime context identified
- [ ] Security reviewed
- [ ] License reviewed
- [ ] Version reviewed
- [ ] Lockfile updated
- [ ] Transitive changes reviewed
- [ ] Build passes
- [ ] Tests pass
- [ ] Relevant E2E passes
- [ ] Performance impact considered
- [ ] AI/RAG evaluation run if applicable
- [ ] Rollback identified
- [ ] Owner identified

---

# 77. Anti-Patterns

Reject:

### "Latest is always safest."

Latest can introduce breaking or immature behavior.

### "npm audit is enough."

Scanner output does not replace exploitability and architecture review.

### "Popular packages are automatically trustworthy."

Popularity is not a security guarantee.

### "The lockfile means we are safe."

Lockfiles improve reproducibility; they do not eliminate malicious or vulnerable packages.

### "Transitive dependencies do not matter."

Transitive packages execute in your application too.

### "Dev dependencies are irrelevant."

CI and build environments can contain secrets and privileged access.

### "We can upgrade everything together."

Large upgrade batches make failures harder to isolate.

### "Unused means delete immediately."

Configuration and tooling usage must be checked first.

---

# 78. What Dependency.md Does NOT Prove

Passing this document does **not** prove:

- The application is secure.
- Every vulnerability is known.
- Every dependency is trustworthy.
- AI outputs are correct.
- The application is performant.
- The system is bug-free.
- Production will never fail.

Dependency governance is one control within the broader KEETY engineering system.

---

# 79. Final Dependency Quality Gate

Do not consider the dependency architecture complete until:

- Every direct dependency has a purpose.
- Unused dependencies are identified.
- Duplicate functionality is reviewed.
- Direct and transitive dependencies are understood.
- Runtime/build/dev boundaries are clear.
- Lockfiles are correct.
- Installation is reproducible.
- Critical vulnerabilities are triaged.
- Reachability is considered.
- Critical packages receive deeper review.
- Maintainer health is considered.
- Deprecated packages are identified.
- Unsupported packages are identified.
- Node/React/Next.js/TypeScript compatibility is verified.
- Client/server boundaries are verified.
- Bundle/runtime impact is measured where relevant.
- AI/RAG dependencies are justified.
- Document-processing dependencies are reviewed.
- Database dependencies are justified.
- Authentication dependencies receive security review.
- Queue/automation dependencies are reviewed.
- License concerns are identified.
- CI/CD installation is protected.
- SBOM generation is available for production artifacts.
- Supply-chain compromise scenarios are considered.
- Dependency failure behavior is tested.
- Upgrade and rollback paths exist.
- Important decisions have owners.

---

# 80. Final Principal Architect Questions

Before approving KEETY's dependency architecture:

1. **If one dependency is compromised, what can it access?**
2. **Can an install script access production secrets?**
3. **Can a dependency leak one tenant's data into another tenant's context?**
4. **Which dependencies sit directly on authentication or authorization paths?**
5. **Which dependency has the largest blast radius?**
6. **Which dependency has no credible replacement or exit strategy?**
7. **Which dependency is likely to create the biggest performance regression?**
8. **Which dependency can multiply retries or external API costs?**
9. **Which AI/RAG dependency can change model behavior without an application code change?**
10. **Can old queued jobs survive a worker/dependency upgrade?**
11. **Can production be rebuilt reproducibly?**
12. **Can we identify every component in the deployed artifact?**
13. **Can we quickly determine whether a newly disclosed CVE affects KEETY?**
14. **Can we roll back a critical dependency upgrade safely?**
15. **Which dependency would be hardest to replace three years from now?**

If these questions cannot be answered, the dependency architecture is not finished.

---

# 81. Final Principle

Do not optimize for:

> "Latest packages."

Do not optimize for:

> "Fewest packages."

Do not optimize for:

> "Green dependency scanner."

Optimize for:

> **Necessary dependencies, controlled versions, reproducible builds, limited privileges, observable failures, manageable upgrades, defensible supply-chain risk, and a clear recovery path.**

Remember:

> **Every dependency is trusted code.**

Therefore, before adding or keeping one, ask:

**Do we need it?**

**Do we understand it?**

**Can we trust it?**

**Can we isolate it?**

**Can we upgrade it?**

**Can we replace it?**

**What happens if it fails?**

**What happens if it is compromised?**

Only then should KEETY accept the dependency.
