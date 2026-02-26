# Branch Protection Guidelines

## Protected Branches

### `main` Branch

**Protection Rules:**
- ❌ **Direct pushes are FORBIDDEN**
- ✅ **Only Pull Requests allowed**
- ✅ Requires at least 1 approval
- ✅ Must pass all CI/CD checks (unit tests, build)
- ✅ Automatic deployment to production GitHub Pages

**How to contribute to `main`:**

1. Create a feature branch from `development`:
   ```bash
   git checkout development
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: Your feature description"
   ```

3. Push to your feature branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create Pull Request on GitHub:
   - Base: `main`
   - Compare: `feature/your-feature-name`
   - Add description and request review

5. Wait for:
   - ✅ CI/CD checks to pass
   - ✅ Code review approval
   - ✅ Merge via "Squash and merge"

### `development` Branch

**Protection Rules:**
- ✅ Direct pushes allowed for rapid development
- ✅ Manual deployment to GitHub Pages (workflow_dispatch)
- ⚠️ Testing ground - may be unstable

**Workflow:**
```
development → PR → main (production)
```

## Setting Up Branch Protection on GitHub

**To enable these rules, go to:**
`https://github.com/Haeger23/mau-mau/settings/branches`

### For `main` branch:

1. Click "Add rule" or edit existing rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
     - Select: `Unit & Component Tests`
     - Select: `Production Build`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings
4. Save changes

### Status Checks Required:
- `unit-tests` (from `.github/workflows/playwright.yml`)
- `build` (from `.github/workflows/playwright.yml`)

## Deployment Strategy

| Branch      | Deployment        | Trigger        | URL                              |
|-------------|-------------------|----------------|----------------------------------|
| `main`      | Production        | Automatic PR   | https://haeger23.github.io/mau-mau |
| `development` | Development     | Manual         | https://haeger23.github.io/mau-mau |

## Emergency Hotfixes

For critical production bugs:

1. Create hotfix branch from `main`:
   ```bash
   git checkout main
   git checkout -b hotfix/critical-bug
   ```

2. Fix, commit, push, and create PR to `main`

3. After merge to `main`, also merge back to `development`:
   ```bash
   git checkout development
   git merge main
   git push
   ```
