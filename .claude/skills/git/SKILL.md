---
name: git
description: Git expert for mau-mau. Natural language git operations with project safety rules enforced. Use for commits, branches, merges, pushes, undo, sync, and any git task.
argument-hint: "<natural language command>"
disable-model-invocation: false
---

# git

Git expert for the mau-mau project. Parse `$ARGUMENTS` using the intent table below and execute immediately — no unnecessary confirmation steps.

**IMPORTANT — Bash execution:** Always run git commands using the Bash tool's `cwd` parameter set to the project root. Never use `cd "/path" && git ...` compound commands — run each git command directly (e.g. `git status --porcelain`) with `cwd` pointing to the project directory. This ensures permission rules like `Bash(git status*)` match correctly.

---

## Intent Table — map input to action

| User says | Action |
|-----------|--------|
| "commit" / "committe" | → COMMIT workflow |
| "commit -patch" / "commit -minor" / "commit -major" | → VERSION BUMP, then COMMIT workflow |
| "branch <name>" / "erstelle branch <name>" / "neuer branch <name>" | → BRANCH workflow |
| "merge <source>" / "merge <source> into <target>" | → MERGE workflow |
| "push" / "pushe" / "push to <branch>" | → PUSH workflow |
| "undo" / "rückgängig" / "letzten commit rückgängig" / "undo last commit" | → UNDO workflow |
| "sync" / "aktualisieren" / "rebase" | → SYNC workflow |
| "status" / "zeig status" / "was ist der status" | → STATUS workflow |
| "log" / "history" / "verlauf" | → LOG workflow |
| anything else | → interpret as natural language git request, map to nearest workflow or execute directly |

---

## PROJECT RULES — always enforced, no exceptions

1. **NEVER force-push** to any branch
2. **NEVER push directly to `main`** — `main` is PR-only. If current branch is `main` and user requests push: stop, output "main is PR-only — open a PR on GitHub instead."
3. **New branches** are created from the currently checked-out branch
4. **Version bump** is required before every push (except to `main`) and before every merge
5. **Undo** always uses `git reset HEAD~1` (soft) — never `--hard` without double confirmation
6. **Destructive operations** (hard reset, `branch -D`, `push --force`, `clean -f`): briefly explain what will be lost, ask "Fortfahren? (ja/nein)", wait for explicit "ja" before proceeding

---

## VERSION BUMP sub-routine

Call this sub-routine whenever triggered (see each workflow).

1. Run `git branch --show-current` to know the current branch name
2. Read `package.json` — extract the `"version"` field (e.g. `"0.5.1"`)
3. Ask user: "Version bump — patch, minor oder major?" (skip this question if the flag `-patch`, `-minor`, or `-major` was already provided in `$ARGUMENTS`)
4. Calculate new version:
   - `-patch`: increment last number (0.5.1 → 0.5.2)
   - `-minor`: increment middle, reset last (0.5.1 → 0.6.0)
   - `-major`: increment first, reset others (0.5.1 → 1.0.0)
5. Edit `package.json`: update `"version"` field to new version string
6. Edit `src/app/app.html`: find `<footer class="version">v…</footer>` and replace with `v<new-version>`
7. Stage both: `git add package.json src/app/app.html`
8. Commit: `git commit -m "chore: Bump version to <new-version>"`

---

## COMMIT workflow

1. Run `git status --porcelain` — if no staged files (no lines where first char is not space or `?`): output "Keine gestagten Files gefunden." and stop
2. Run `git diff --cached` to review all staged changes
3. Write a concise imperative English commit message using conventional commits:
   - `feat:` new user-facing feature
   - `fix:` bug fix
   - `chore:` tooling, maintenance
   - `refactor:` restructure without behaviour change
   - `style:` formatting/visual/CSS only
   - `test:` test additions or changes
   - `docs:` documentation only
   - Subject: max 72 chars, imperative mood, no trailing period
   - Add body only if the change is complex
   - Do NOT append Co-Authored-By
4. Run: `git commit -m "$(cat <<'EOF'\n<message>\nEOF\n)"`
5. Run `git status` and report result
6. Ask: "Soll ich auch pushen? (ja/nein)"
   - ja → execute PUSH workflow
   - nein → done

---

## BRANCH workflow

1. Run `git branch --show-current` — note current branch
2. Parse branch name from `$ARGUMENTS`; if none found ask: "Wie soll der Branch heissen?"
3. Run `git checkout -b <name>`
4. Output: "Branch `<name>` erstellt von `<current-branch>` und ausgecheckt."

---

## MERGE workflow

1. Parse source branch and optional target from `$ARGUMENTS`
   - If no target given: target = current branch (`git branch --show-current`)
2. **Safety: target is `main`** → stop: "Direktes Mergen nach `main` ist nicht erlaubt. Öffne einen PR auf GitHub."
3. Run `git status --porcelain` — if uncommitted changes: stop: "Es gibt uncommittete Änderungen. Erst committen oder stashen."
4. Run `git fetch origin`
5. Run `git checkout <target>` then `git pull origin <target>`
6. **VERSION BUMP sub-routine** (ask for patch/minor/major)
7. Run `git merge --no-ff <source> -m "Merge branch '<source>' into <target>"`
8. If merge conflicts: list conflicting files, output "Bitte Konflikte lösen, dann `git merge --continue` ausführen." and stop
9. Report success

---

## PUSH workflow

1. Run `git branch --show-current`
2. **Safety: branch is `main`** → stop: "main ist PR-only — öffne einen PR auf GitHub statt direkt zu pushen."
3. Run `git status --porcelain` — if uncommitted changes: warn "Es gibt uncommittete Änderungen die nicht gepusht werden."
4. Run `git log origin/<branch>..HEAD --oneline 2>/dev/null || git log HEAD --oneline -5` — if nothing to push: output "Nichts zu pushen." and stop
5. **VERSION BUMP sub-routine** (ask for patch/minor/major)
6. Run `git push origin <branch>` (add `-u` if no upstream set)
7. If push rejected: output "Push abgelehnt. Führe `/git sync` aus und versuche es erneut." and stop
8. Report success

---

## UNDO workflow

1. Run `git log --oneline -3` — show last 3 commits
2. Output: "Dies macht den Commit `<HEAD subject>` rückgängig und behält die Änderungen gestaged. Fortfahren? (ja/nein)"
3. Wait for explicit "ja"
4. Run `git reset HEAD~1`
5. Run `git status` and report staged files
6. Output: "Commit rückgängig gemacht. Änderungen sind noch gestaged."

If user explicitly requests `--hard` reset: explain "Ein hard reset löscht alle uncommitteten Änderungen permanent. Das kann nicht rückgängig gemacht werden. Wirklich fortfahren? (ja/nein)" — require "ja" twice before proceeding.

---

## SYNC workflow

1. Run `git branch --show-current`
2. If branch is `main` or `development`: run `git pull origin <branch>`, report and stop
3. Run `git status --porcelain` — if uncommitted changes: stop: "Stash oder commit deine Änderungen bevor du syncst."
4. Run `git fetch origin`
5. Run `git rebase origin/development`
6. If conflicts: list files, output "Konflikte lösen, dann `git rebase --continue` ausführen."
7. If success: output "Branch `<name>` ist jetzt auf dem Stand von `origin/development`."

---

## STATUS workflow

1. Run `git branch --show-current`
2. Run `git status --short`
3. Run `git log origin/<branch>..HEAD --oneline 2>/dev/null` to count unpushed commits (handle missing upstream gracefully)
4. Output structured summary:

```
Branch: <name>
Unpushed commits: N

Staged:
  <list or "–">

Unstaged:
  <list or "–">

Untracked:
  <list or "–">
```

---

## LOG workflow

Run: `git log --oneline --decorate --graph -20`

Present output as-is.

---

## Unknown / natural language fallback

1. Interpret intent from `$ARGUMENTS`
2. Map to nearest workflow above and execute, noting any assumption made
3. If genuinely ambiguous: ask one clarifying question
4. For raw git operations not covered above (stash, cherry-pick, tag, etc.): execute directly via `Bash(git:*)` while still enforcing PROJECT RULES
5. For any destructive operation: follow PROJECT RULE #6 (warn + confirm)
