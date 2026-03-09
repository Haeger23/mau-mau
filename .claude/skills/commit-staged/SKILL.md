---
name: commit-staged
description: Commit all staged files with an auto-generated English commit message. Supports optional version bumping with -patch, -minor, or -major.
argument-hint: "[-patch|-minor|-major]"
disable-model-invocation: true
allowed-tools: Bash(git:*), Read, Edit, Glob
---

# commit-staged

Commit staged files with an auto-generated message. Optionally bump the project version.

## Step 1: Check for staged files

Run `git status --porcelain` and look for lines where the first character is not a space or `?` — these are staged changes.

If **no staged files** are found: inform the user that nothing is staged and stop. Do not proceed.

## Step 2: Version bump (conditional)

Only perform this step if `$ARGUMENTS` contains `-patch`, `-minor`, or `-major`.

1. Read the current version from `package.json` (field `"version"`).
2. Calculate the new version using semver:
   - `-patch` → increment PATCH (e.g. `0.4.2` → `0.4.3`)
   - `-minor` → increment MINOR, reset PATCH to 0 (e.g. `0.4.2` → `0.5.0`)
   - `-major` → increment MAJOR, reset MINOR and PATCH to 0 (e.g. `0.4.2` → `1.0.0`)
3. Update `package.json`: change the `"version"` field to the new version string.
4. Update `src/app/app.html`: find `<footer class="version">v…</footer>` and replace the version with `v<new-version>`.
5. Stage both files: `git add package.json src/app/app.html`

If `$ARGUMENTS` is empty or does not contain a version flag, skip this step entirely.

## Step 3: Analyse the staged diff

Run `git diff --cached` to review all staged changes.

## Step 4: Write the commit message

Write a **concise, imperative commit message in English** using conventional commits:

- `feat:` — new user-facing feature
- `fix:` — bug fix
- `chore:` — tooling, version bumps, maintenance
- `refactor:` — restructuring without behaviour change
- `style:` — formatting / visual / CSS only
- `test:` — test additions or changes
- `docs:` — documentation only

Rules:
- Subject line: max 72 characters, imperative mood, no trailing period
- Add a body only if the change is complex enough to need explanation
- If a version bump was performed, the first line must be `chore: Bump version to <new-version>` followed by a blank line and then the change description
- Do not append a "Co-Authored-By" hint at the end

## Step 5: Commit

```bash
git commit -m "$(cat <<'EOF'
<commit message>
EOF
)"
```

After committing, run `git status` and report the result to the user.