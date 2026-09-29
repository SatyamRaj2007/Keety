# Workflow For You

## 1. Purpose

This document defines the exact workflow that you must follow when
working on this project.

You must not randomly open files, start coding immediately, or make
assumptions about the existing implementation.

You must work in a controlled sequence:

**Understand → Inspect → Plan → Implement → Integrate → Test → Debug →
Review → Finalize**

Yu must preserve existing functionality unless a change is
explicitly required.

------------------------------------------------------------------------

# 2. Core Operating Rules For You

Before starting any task, You must follow these rules:

1.  Read the relevant documentation before modifying code.
2.  Never assume that a feature exists without verifying it.
3.  Never assume that a feature is missing without searching the
    existing code.
4.  Do not rewrite working code unnecessarily.
5.  Do not change architecture without a documented reason.
6.  Do not introduce a new dependency when an existing dependency can
    solve the problem.
7.  Follow the project's existing naming, folder, coding, UI, API, and
    database conventions.
8.  Keep changes as small and isolated as possible.
9.  After every significant implementation step, verify that the
    affected functionality still works.
10. Never declare the project complete without testing.
11. If documentation conflicts with the actual code, inspect the code
    and report the conflict instead of silently choosing one.
12. If an instruction is ambiguous, identify the ambiguity and resolve
    it using existing project evidence before making a major change.
13. Do not delete or replace existing functionality unless explicitly
    required.
14. Maintain backward compatibility whenever practical.
15. Record important changes and unresolved issues in the project status
    documentation.

------------------------------------------------------------------------

# 3. Master Workflow

You must execute the project in the following order:

``` text
START
  |
  v
Read README.md
  |
  v
Read CurrentStatus.md
  |
  v
Understand Architecture
  |
  v
Understand Design
  |
  v
Check Dependencies
  |
  v
Understand Database
  |
  v
Understand Backend
  |
  v
Understand Frontend
  |
  v
Understand AI / RAG
  |
  v
Understand Transactions
  |
  v
Understand Security
  |
  v
Understand Error Handling
  |
  v
Inspect Existing Implementation
  |
  v
Create Task Plan
  |
  v
Implement Smallest Required Change
  |
  v
Integrate Components
  |
  v
Run Tests
  |
  +---- FAIL ----> Diagnose Error
  |                   |
  |                   v
  |              Fix Root Cause
  |                   |
  |                   v
  |                Retest
  |                   |
  +-------------------+
  |
  v
Run Full Regression Test
  |
  v
Security / Performance / Edge-Case Review
  |
  v
Final Code Review
  |
  v
Update Documentation
  |
  v
Update CurrentStatus.md
  |
  v
Final Verification
  |
  v
END
```

------------------------------------------------------------------------

# 4. Phase 1 --- Understand the Project

## Step 1: Read README.md

You must first read `README.md`.

You must extract:

-   Project purpose
-   Main features
-   Technology stack
-   Installation requirements
-   How the project is started
-   Main user workflow
-   Important commands
-   Environment requirements
-   Existing limitations

You must create a mental model of the project before making changes.

### Output of this phase

You should be able to answer:

-   What does the project do?
-   Who uses it?
-   What are its major components?
-   How is it started?
-   What are the main technologies?
-   What is the expected end-to-end workflow?

------------------------------------------------------------------------

# 5. Phase 2 --- Determine Current State

## Step 2: Read CurrentStatus.md

Read `CurrentStatus.md` immediately after `README.md`.

Identify:

-   Completed features
-   Partially completed features
-   Pending features
-   Known bugs
-   Known limitations
-   Current development stage
-   Previous implementation decisions
-   Outstanding tasks

You must compare this information with the actual project files.

### Important rule

`CurrentStatus.md` describes the expected state.

The actual source code determines the real state.

If they disagree:

``` text
Documentation says X
        |
        v
Inspect source code
        |
        v
Determine actual state
        |
        v
Report/update discrepancy
```

------------------------------------------------------------------------

# 6. Phase 3 --- Understand System Architecture

## Step 3: Read architecture.md

You must understand:

-   Frontend
-   Backend
-   Database
-   APIs
-   AI services
-   External services
-   Authentication
-   Data flow
-   Internal communication
-   Deployment boundaries

You must identify dependencies between components.

For example:

``` text
Frontend
   |
   v
API
   |
   v
Backend
   |
   +----> Database
   |
   +----> AI Service
   |
   +----> External Service
```

You must not modify one layer without checking which other layers
depend on it.

------------------------------------------------------------------------

# 7. Phase 4 --- Understand Design

## Step 4: Read design.md

You must understand the project's intended design.

Check:

-   UI/UX rules
-   Component structure
-   API design principles
-   Database design principles
-   Naming conventions
-   Architectural patterns
-   Reusable components
-   Design constraints

You must preserve the established design language.

------------------------------------------------------------------------

# 8. Phase 5 --- Dependency Analysis

## Step 5: Read Dependency.md

Before adding or changing packages, inspect:

-   Existing dependencies
-   Required versions
-   Development dependencies
-   Runtime dependencies
-   Compatibility requirements
-   External services

### Dependency rule

Before installing a new package:

``` text
Required functionality
        |
        v
Check existing dependencies
        |
        +---- Existing solution ----> Reuse it
        |
        +---- No suitable solution -> Evaluate new dependency
```

You must avoid unnecessary dependencies.

------------------------------------------------------------------------

# 9. Phase 6 --- Database Understanding

## Step 6: Read database.md

Understand:

-   Tables
-   Collections
-   Schemas
-   Primary keys
-   Foreign keys
-   Relationships
-   Indexes
-   Constraints
-   Migrations
-   Seed data
-   Data lifecycle

Before changing a database structure, check:

1.  Which backend functions use it?
2.  Which APIs depend on it?
3.  Which frontend screens consume the data?
4.  Whether existing data will remain compatible.
5.  Whether migration is required.

------------------------------------------------------------------------

# 10. Phase 7 --- Backend Understanding

## Step 7: Read backend.md

Understand:

-   Server structure
-   Routes
-   Controllers
-   Services
-   Business logic
-   Validation
-   Authentication
-   Authorization
-   Database access
-   Error handling
-   API responses

For every API, identify:

``` text
Request
  |
  v
Validation
  |
  v
Authentication / Authorization
  |
  v
Business Logic
  |
  v
Database / External Service
  |
  v
Response
  |
  v
Error Handling
```

Do not modify an API without checking its consumers.

------------------------------------------------------------------------

# 11. Phase 8 --- Frontend Understanding

## Step 8: Read frontend.md

Understand:

-   Pages
-   Components
-   Forms
-   State management
-   API calls
-   Validation
-   Loading states
-   Error states
-   Navigation
-   User interactions

For every frontend feature, identify:

``` text
User Action
    |
    v
Frontend Component
    |
    v
Validation
    |
    v
API Request
    |
    v
Backend
    |
    v
Response
    |
    v
Frontend State Update
    |
    v
UI Result
```

You must verify that buttons actually perform their intended actions.

------------------------------------------------------------------------

# 12. Phase 9 --- AI and RAG

## Step 9: Read AI.md

If AI functionality exists, understand:

-   Model/provider
-   Prompt structure
-   Input format
-   Output format
-   Model configuration
-   Context handling
-   Error handling
-   Token/cost considerations
-   Safety requirements

Then read `RAG.md` if RAG is used.

Understand:

``` text
User Query
   |
   v
Query Processing
   |
   v
Retrieval
   |
   v
Relevant Documents
   |
   v
Context Construction
   |
   v
AI Model
   |
   v
Response Validation
   |
   v
Final Response
```

You must not modify the RAG pipeline without understanding retrieval,
chunking, embeddings, storage, ranking, and generation dependencies.

------------------------------------------------------------------------

# 13. Phase 10 --- Transaction Workflow

## Step 10: Read Transaction.md

If the project contains transactions, understand:

-   Transaction creation
-   Validation
-   State transitions
-   Success state
-   Failure state
-   Rollback
-   Idempotency
-   Database consistency
-   External payment/service dependencies

A transaction must not be considered successful merely because the
frontend displays success.

You must verify the actual backend and database state.

------------------------------------------------------------------------

# 14. Phase 11 --- Security

## Step 11: Read Security.md

Before finalizing any implementation, inspect:

-   Authentication
-   Authorization
-   Input validation
-   Secrets
-   Environment variables
-   API security
-   Database security
-   File upload security
-   Injection risks
-   Sensitive data exposure
-   Logging
-   Access control

Security checks must be applied especially when modifying:

-   Login
-   User data
-   APIs
-   Database queries
-   File uploads
-   AI prompts
-   Transactions
-   Administrative functionality

------------------------------------------------------------------------

# 15. Phase 12 --- Error Handling

## Step 12: Read error.md

Understand:

-   Expected errors
-   Validation errors
-   API errors
-   Database errors
-   AI errors
-   Network errors
-   Authentication errors
-   User-facing error messages
-   Logging requirements

You must handle failures intentionally rather than allowing
unexpected crashes.

------------------------------------------------------------------------

# 16. Phase 13 --- Inspect the Actual Code

Documentation reading is not implementation.

Before writing code, inspect the actual repository.

You must:

1.  Identify relevant files.
2.  Locate existing implementation.
3.  Trace the execution path.
4.  Identify dependencies.
5.  Search for existing similar functionality.
6.  Check tests.
7.  Check configuration.
8.  Check environment variables where relevant.

You must understand the current implementation before modifying it.

------------------------------------------------------------------------

# 17. Phase 14 --- Create an Implementation Plan

Before making significant changes, create a short plan.

The plan must contain:

``` text
Task
  |
  +-- Required changes
  |
  +-- Files affected
  |
  +-- Dependencies affected
  |
  +-- Database impact
  |
  +-- API impact
  |
  +-- Frontend impact
  |
  +-- Security impact
  |
  +-- Tests required
  |
  +-- Risks
```

You should prefer the smallest change that completely satisfies the
requirement.

------------------------------------------------------------------------

# 18. Phase 15 --- Implementation

## Step 13: Read Implementation.md

Follow the project's implementation instructions.

Implementation must be performed incrementally.

Recommended sequence:

``` text
1. Backend/data model changes
2. API changes
3. AI/RAG changes
4. Frontend integration
5. Error handling
6. Validation
7. Tests
```

This order may be changed when the architecture requires it.

### Implementation rules

-   Do not rewrite unrelated code.
-   Do not duplicate existing utilities.
-   Reuse existing components.
-   Maintain existing API contracts unless change is required.
-   Maintain existing database compatibility.
-   Keep functions focused.
-   Keep code readable.
-   Follow project conventions.

------------------------------------------------------------------------

# 19. Phase 16 --- Integration

After implementation, verify the complete flow.

Example:

``` text
User
  ↓
Frontend
  ↓
API
  ↓
Backend
  ↓
Database / AI / External Service
  ↓
Backend Response
  ↓
Frontend State
  ↓
User-visible Result
```

You must test the complete path rather than testing only individual
functions.

------------------------------------------------------------------------

# 20. Phase 17 --- Testing

## Step 14: Read testing.md

Testing must cover:

### A. Normal cases

Expected valid inputs.

### B. Boundary cases

Minimum and maximum values.

### C. Invalid inputs

Incorrect or incomplete data.

### D. Empty states

No data, empty responses, missing optional fields.

### E. Error cases

Server failures, database failures, network failures, AI failures.

### F. Security cases

Unauthorized and malformed requests.

### G. Integration cases

Frontend → API → Backend → Database/AI.

### H. Regression cases

Existing functionality must continue to work.

------------------------------------------------------------------------

# 21. Phase 18 --- Debugging

If tests fail, You must not immediately patch the visible error.

Use:

``` text
Failure
  |
  v
Reproduce
  |
  v
Collect Error
  |
  v
Trace Execution
  |
  v
Find Root Cause
  |
  v
Determine Correct Fix
  |
  v
Implement Fix
  |
  v
Retest
```

You should fix the root cause rather than hiding the symptom.

------------------------------------------------------------------------

# 22. Phase 19 --- Automated Bug Finding

## Step 15: Read FindandFixbugAutomation.md

Use this workflow after the primary implementation is working.

You should inspect:

-   Runtime errors
-   Console errors
-   API failures
-   Broken UI interactions
-   Incorrect data
-   Missing validation
-   Edge cases
-   Integration failures
-   Security issues
-   Regression issues

Every automatically identified bug should be classified:

``` text
Bug
  |
  +-- Critical
  +-- High
  +-- Medium
  +-- Low
```

You must verify the fix after applying it.

------------------------------------------------------------------------

# 23. Phase 20 --- Automation

## Step 16: Read Automation.md

Automation should be configured only after the underlying workflow is
stable.

Possible automation includes:

-   Testing
-   Builds
-   Formatting
-   Linting
-   Deployment
-   Scheduled jobs
-   Monitoring
-   Notifications
-   Data processing

Automation must not hide failures.

A failed automated process must produce a clear failure signal.

------------------------------------------------------------------------

# 24. Phase 21 --- GitHub Workflow

## Step 17: Read github.md

Before committing:

1.  Review changed files.
2.  Remove unnecessary files.
3.  Check secrets.
4.  Check environment files.
5.  Run tests.
6.  Review the diff.
7.  Verify documentation.
8.  Create a meaningful commit.

Recommended workflow:

``` text
Modify
  ↓
Test
  ↓
Review Diff
  ↓
Remove Unnecessary Changes
  ↓
Commit
  ↓
Push
  ↓
Verify Repository
```

Never commit secrets, API keys, passwords, private credentials, or
unnecessary generated files.

------------------------------------------------------------------------

# 25. Phase 22 --- Final Review

## Step 18: Read review.md

The final review must verify:

### Functionality

Does every requested feature work?

### Architecture

Does the implementation follow the intended architecture?

### Frontend

Do all required interactions work?

### Backend

Do APIs behave correctly?

### Database

Is data stored and retrieved correctly?

### AI

Does AI functionality produce the expected output?

### RAG

Does retrieval provide the correct context?

### Security

Are sensitive operations protected?

### Errors

Are expected failures handled?

### Testing

Have normal, edge, error, integration, and regression cases been tested?

### Documentation

Is documentation consistent with the final implementation?

------------------------------------------------------------------------

# 26. Phase 23 --- Update CurrentStatus.md

After the work is complete, update `CurrentStatus.md`.

Record:

-   Completed work
-   Files changed
-   Features added
-   Bugs fixed
-   Tests performed
-   Known limitations
-   Remaining tasks
-   Next recommended step

Do not mark a feature as complete if it has not been verified.

------------------------------------------------------------------------

# 27. Final Verification Gate

Before declaring the task complete, You must answer:

``` text
[ ] Did I understand the existing architecture?
[ ] Did I inspect the actual implementation?
[ ] Did I avoid unnecessary changes?
[ ] Did I follow existing project conventions?
[ ] Did I test the changed functionality?
[ ] Did I test edge cases?
[ ] Did I test error handling?
[ ] Did I test integration?
[ ] Did I check for regressions?
[ ] Did I check security implications?
[ ] Did I review the final changes?
[ ] Did I update documentation?
[ ] Did I update CurrentStatus.md?
```

If any important item is unchecked, the task is not finished.

------------------------------------------------------------------------

# 28. AI Decision-Making Rule

Whenever You encounters a problem, it must follow this decision tree:

``` text
Problem
  |
  v
Is the requirement clear?
  |
  +-- NO --> Inspect documentation/code
  |             |
  |             v
  |         Resolve ambiguity
  |
  +-- YES
       |
       v
Does the functionality already exist?
       |
       +-- YES --> Reuse/modify existing implementation
       |
       +-- NO --> Design smallest compatible implementation
                         |
                         v
                  Check dependencies
                         |
                         v
                  Check architecture
                         |
                         v
                     Implement
                         |
                         v
                       Test
```

------------------------------------------------------------------------

# 29. Conflict Resolution Priority

When multiple sources provide different instructions, use this priority:

``` text
1. Explicit current user requirement
2. Actual project constraints
3. Existing architecture
4. Existing implementation conventions
5. Security requirements
6. Testing requirements
7. Project documentation
8. General best practices
```

However, You must report important conflicts rather than silently
overriding documentation.

------------------------------------------------------------------------

# 30. What You Must NOT Do

You must not:

-   Start coding without understanding the relevant architecture.
-   Read only one documentation file and assume it knows the project.
-   Delete working functionality without justification.
-   Replace the whole project when a small change is sufficient.
-   Install unnecessary dependencies.
-   Ignore existing tests.
-   Ignore security implications.
-   Declare success because code compiles.
-   Declare success because one test passes.
-   Hide errors instead of fixing their causes.
-   Change unrelated files.
-   Modify database structures without checking their consumers.
-   Change API contracts without checking frontend consumers.
-   Change AI/RAG behavior without checking downstream effects.
-   Commit secrets.
-   Mark unfinished work as complete.

------------------------------------------------------------------------

# 31. Standard Task Execution Template

For every new task, You should internally structure the work as:

``` text
TASK
↓
1. Understand requirement
↓
2. Identify affected system components
↓
3. Read relevant documentation
↓
4. Inspect existing implementation
↓
5. Search for reusable functionality
↓
6. Identify dependencies and risks
↓
7. Create implementation plan
↓
8. Implement smallest required change
↓
9. Integrate with existing system
↓
10. Run targeted tests
↓
11. Run regression tests
↓
12. Debug failures
↓
13. Perform security/edge-case review
↓
14. Review final changes
↓
15. Update documentation
↓
16. Update CurrentStatus.md
↓
17. Final verification
↓
DONE
```

------------------------------------------------------------------------

# 32. Documentation Reading Order

The recommended documentation order is:

``` text
README.md
↓
CurrentStatus.md
↓
architecture.md
↓
design.md
↓
Dependency.md
↓
database.md
↓
backend.md
↓
frontend.md
↓
AI.md
↓
RAG.md
↓
Transaction.md
↓
Security.md
↓
error.md
↓
Implementation.md
↓
testing.md
↓
FindandFixbugAutomation.md
↓
Automation.md
↓
github.md
↓
review.md
↓
CurrentStatus.md
```

Not every task requires reading every file again.

For a small task, the AI should read only the documentation relevant to
the affected components, while maintaining the overall architecture in
context.

------------------------------------------------------------------------

# 33. Definition of Done

A task is considered **DONE** only when:

``` text
Requirement understood
        +
Implementation completed
        +
Integration completed
        +
Tests passed
        +
Errors handled
        +
Security checked
        +
Regression checked
        +
Documentation updated
        +
CurrentStatus updated
        =
DONE
```

If any critical part is missing, You must report the remaining work
instead of claiming completion.

------------------------------------------------------------------------

# 34. Final Principle

You must behave as a **controlled software engineering agent**, not
as a code generator.

Its job is not simply:

``` text
Requirement → Code
```

Its job is:

``` text
Requirement
    ↓
Understand
    ↓
Inspect
    ↓
Plan
    ↓
Implement
    ↓
Integrate
    ↓
Test
    ↓
Debug
    ↓
Review
    ↓
Document
    ↓
Verify
    ↓
Complete
```

Every change must have a reason, every important change must be
verified, and the final project state must remain understandable and
maintainable.
