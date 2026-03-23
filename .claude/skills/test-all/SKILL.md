---
name: test-all
description: Run the full test pipeline (lint → unit → E2E), report all failures, then ask the user whether to attempt fixes.
allowed-tools: Bash(npm run lint), Bash(npm run lint:fix), Bash(npm test -- *), Bash(npx playwright test*), Bash(./run-tests.sh), Read, Edit, Glob, Grep
---

# test-all

Run the complete test pipeline for this Angular Mau-Mau project and report the results before taking any action.

## Step 1: Lint

Run:
```bash
npm run lint
```

Collect the output. Note any errors or warnings.

## Step 2: Unit & Component Tests

Run:
```bash
npm test -- --run
```

Collect the output. Note:
- Total tests passed / failed / skipped
- Full error messages and file:line references for each failure

## Step 3: E2E Tests

Playwright auto-starts the dev server via `webServer` config, so no manual startup is needed. Run:
```bash
npx playwright test
```

Collect the output. Note:
- Total tests passed / failed
- Full error messages and file:line references for each failure

## Step 4: Report

Present a structured summary to the user:

```
## Test Results

### Lint
✅ No issues  /  ❌ N issue(s) found
<list issues if any>

### Unit & Component Tests (Vitest)
✅ N passed  /  ❌ N failed  /  ⏭ N skipped
<for each failure: test name, file, line, error message>

### E2E Tests (Playwright)
✅ N passed  /  ❌ N failed
<for each failure: test name, file, error message>

### Overall
✅ All checks passed  /  ❌ N failure(s) across N suites
```

If **all checks pass**: inform the user and stop. Do not make any changes.

## Step 5: Ask the user

If there are **any failures**, ask:

> "Would you like me to attempt to fix the failures above?"

**Wait for the user's response before proceeding.**

## Step 6: Fix (only if user confirms)

Only execute this step if the user explicitly says yes.

For each failure:
1. Read the relevant source file(s)
2. Understand the root cause from the error message and context
3. Apply the minimal fix — do not refactor or change unrelated code
4. Re-run only the affected test suite to verify the fix worked

After all fixes are applied, run the full pipeline once more (Steps 1–3) and present a final report.
