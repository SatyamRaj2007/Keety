# GitHub Incremental Commit & Push Workflow

You are an experienced Git/GitHub engineer. Your task is to safely review the project and push the project to GitHub **incrementally, one logical group of files at a time**, using clean, professional commits.

## PRIMARY OBJECTIVE

Before pushing **ANY file**, strictly inspect and validate the project's `.gitignore`.

Do **NOT** immediately run `git add .`, `git commit`, or `git push`.

Follow the workflow below **in exactly this order**.

---

## PHASE 1 — STRICT `.gitignore` AUDIT

### Step 1: Locate `.gitignore`

First check whether the project contains:

* `.gitignore`
* nested `.gitignore` files
* global Git ignore rules if relevant
* existing tracked files that should actually be ignored

Read the `.gitignore` carefully before staging anything.

### Step 2: Understand the project stack

Identify the technologies/frameworks being used, for example:

* React
* Next.js
* Node.js
* JavaScript / TypeScript
* Python
* Java
* databases
* Docker
* environment variables
* IDE/editor configuration

Based on the actual project structure, determine what should and should not be committed.

### Step 3: Check for sensitive files

Before staging anything, specifically search for potentially sensitive information such as:

```text
.env
.env.local
.env.development
.env.production
.env.*
*.pem
*.key
credentials.*
secrets.*
service-account*.json
config files containing API keys
database credentials
private certificates
tokens
passwords
```

Do not expose or print secret values.

If secrets are discovered:

1. Do NOT stage them.
2. Add the appropriate patterns to `.gitignore`.
3. If a secret was already committed, explain that `.gitignore` alone does not remove it from Git history.
4. Stop and request confirmation before performing history rewriting or secret rotation.

---

# PHASE 2 — GIT REPOSITORY INSPECTION

Before staging files, inspect the current Git state.

Run/check:

```bash
git status
git branch --show-current
git remote -v
git log --oneline -10
```

Determine:

* Is Git already initialized?
* What branch is currently active?
* Is the repository already connected to GitHub?
* Are there existing commits?
* Are there already tracked files?
* Are there modified/deleted/untracked files?
* Is the working tree clean or dirty?

Do NOT overwrite existing Git history.

Do NOT change branches unless explicitly required.

Do NOT modify the remote URL unless explicitly authorized.

---

# PHASE 3 — `.gitignore` VALIDATION

After inspecting the project, verify that the ignore rules actually work.

Use appropriate Git commands such as:

```bash
git check-ignore -v <file>
```

and inspect:

```bash
git status --short
```

If necessary, test important generated/sensitive directories and files.

Typical things that should generally NOT be committed include:

```text
node_modules/
.next/
dist/
build/
coverage/
.env*
*.log
.DS_Store
.vscode/
.idea/
```

However, **do not blindly add these rules**.

Determine what is appropriate for THIS project's actual technology stack.

Important:

> Never modify `.gitignore` merely because a generic template says something should be ignored. First inspect the actual project.

---

# PHASE 4 — IDENTIFY LOGICAL FILE GROUPS

Do NOT push the entire project in one commit.

Analyze the project and divide files into logical groups.

For example:

### Group 1 — Project configuration

```text
package.json
package-lock.json
tsconfig.json
next.config.*
vite.config.*
eslint.config.*
.gitignore
README.md
```

### Group 2 — Application structure

```text
src/
app/
pages/
components/
layouts/
```

### Group 3 — Styling

```text
styles/
*.css
tailwind.config.*
postcss.config.*
```

### Group 4 — Backend/API

```text
server/
api/
routes/
controllers/
services/
```

### Group 5 — Database

```text
schema/
migrations/
database configuration
```

### Group 6 — Assets

```text
public/
images/
icons/
fonts/
```

### Group 7 — Documentation

```text
README.md
docs/
architecture/
```

These are examples only.

**Create groups according to the actual repository.**

---

# PHASE 5 — VERIFY EACH GROUP BEFORE STAGING

For every logical group:

1. List the files.
2. Inspect their purpose.
3. Check whether any file contains secrets.
4. Check whether generated files are included.
5. Check whether `.gitignore` is correctly excluding unnecessary files.
6. Review the exact diff before committing.

Use:

```bash
git status
git diff
```

For newly staged files:

```bash
git diff --cached
```

Never commit blindly.

---

# PHASE 6 — STAGE ONE LOGICAL GROUP

Stage ONLY the current group.

Prefer:

```bash
git add <specific-files>
```

or:

```bash
git add <specific-directory>
```

Avoid:

```bash
git add .
```

unless there is an explicit reason and the complete staging set has already been verified.

After staging:

```bash
git status
```

Then inspect:

```bash
git diff --cached
```

Confirm that:

* only intended files are staged
* no `.env` files are staged
* no secrets are staged
* no `node_modules` are staged
* no build/cache files are staged
* no unrelated modifications are staged

If anything unexpected appears:

STOP and fix the staging set before committing.

---

# PHASE 7 — CREATE A PROFESSIONAL COMMIT

Create a meaningful commit describing exactly what was added.

Use conventional commit style where appropriate:

```text
feat: add initial application structure
feat: add authentication module
feat: add database configuration
feat: add dashboard components
fix: resolve authentication validation issue
refactor: reorganize API services
docs: add project documentation
chore: configure project tooling
style: add global application styles
```

The commit message must:

* be concise
* describe the actual change
* avoid vague messages such as `update`, `changes`, `final`, `done`
* represent only the files included in that commit

Example:

```bash
git commit -m "feat: add initial frontend structure"
```

---

# PHASE 8 — VERIFY THE COMMIT

Immediately after committing, verify:

```bash
git status
```

and:

```bash
git log -1 --oneline
```

Make sure the commit succeeded.

Then inspect the remaining changes:

```bash
git status --short
```

Do not accidentally include files from the next group in the current commit.

---

# PHASE 9 — PUSH INCREMENTALLY

Only after the local commit has been successfully verified should you push it.

First determine the current branch:

```bash
git branch --show-current
```

Then push the appropriate branch.

For example:

```bash
git push origin main
```

or:

```bash
git push origin <current-branch>
```

Do NOT force push.

Never use:

```bash
git push --force
```

unless explicitly authorized.

After pushing, verify:

```bash
git status
```

The working tree should accurately reflect the repository state.

---

# PHASE 10 — REPEAT FOR THE NEXT GROUP

Repeat this cycle:

```text
SELECT GROUP
      ↓
INSPECT FILES
      ↓
CHECK FOR SECRETS
      ↓
STAGE ONLY THAT GROUP
      ↓
git diff --cached
      ↓
COMMIT
      ↓
VERIFY COMMIT
      ↓
PUSH
      ↓
VERIFY STATUS
      ↓
NEXT GROUP
```

Do not skip the verification stage.

---

# CRITICAL SAFETY RULES

## Rule 1 — Never blindly push everything

Never start with:

```bash
git add .
git commit -m "initial commit"
git push
```

without first auditing the repository.

---

## Rule 2 — `.gitignore` comes first

The first meaningful Git operation must be understanding and validating `.gitignore`.

If `.gitignore` is missing, create an appropriate one based on the project's actual stack before staging project files.

---

## Rule 3 — Never commit secrets

Never commit:

```text
API keys
passwords
tokens
private keys
database credentials
OAuth secrets
.env files containing secrets
cloud credentials
```

If a secret is found, stop the workflow and handle it safely.

---

## Rule 4 — Do not commit generated dependencies

Unless there is a project-specific reason, do not commit:

```text
node_modules/
build/
dist/
.next/
coverage/
.cache/
temporary files
IDE caches
```

Commit lockfiles such as:

```text
package-lock.json
yarn.lock
pnpm-lock.yaml
```

when they are part of the project's dependency management.

---

## Rule 5 — Do not alter unrelated work

The repository may contain changes that were made previously.

Do not:

* delete them
* overwrite them
* reset them
* stash them unnecessarily
* include them in your commit

unless explicitly instructed.

Only commit the files belonging to the current logical group.

---

## Rule 6 — Preserve Git history

Do not:

```bash
git reset --hard
git clean -fd
git push --force
```

unless explicitly authorized.

These commands can destroy user work or repository history.

---

# COMMIT QUALITY STANDARD

Commits should tell a clear development story.

Bad:

```text
update
changes
final
done
project
```

Good:

```text
chore: initialize project configuration
feat: add reusable UI components
feat: implement authentication flow
feat: add database models and schema
feat: implement API endpoints
docs: add setup and usage instructions
```

Each commit should represent one coherent change.

---

# FINAL VERIFICATION

After all logical groups have been pushed, perform a final audit.

Check:

```bash
git status
git log --oneline
git remote -v
```

Confirm:

* `.gitignore` is present and appropriate.
* No secrets were committed.
* No unnecessary generated files were committed.
* All intended source files are committed.
* Commits have meaningful messages.
* The correct branch was pushed.
* No force push was used.
* No unrelated user work was modified.
* The working tree is clean, unless there were pre-existing unrelated changes.

Finally, provide a concise report containing:

### Repository

* Current branch
* Remote repository
* Final Git status

### `.gitignore`

* Whether it existed
* Whether it required changes
* Important patterns added/verified

### Commits

For each commit:

```text
1. <commit hash> — <commit message>
2. <commit hash> — <commit message>
3. <commit hash> — <commit message>
```

### Security

State whether any sensitive files were detected and whether anything sensitive was prevented from being committed.

### Push Status

State which commits were successfully pushed.

---

# MOST IMPORTANT INSTRUCTION

**Do not rush to GitHub.**

The priority order is:

```text
.gitignore audit
      ↓
repository inspection
      ↓
security check
      ↓
file grouping
      ↓
staging verification
      ↓
commit
      ↓
commit verification
      ↓
push
      ↓
push verification
      ↓
next group
```

Follow this process strictly and sequentially.

If you encounter an unexpected state, authentication problem, merge conflict, secret, existing remote history, or potentially destructive operation, **STOP before taking the risky action and explain what was found.**
