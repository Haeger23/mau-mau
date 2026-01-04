# Versioning Guide

This project follows [Semantic Versioning 2.0.0](https://semver.org/).

## Current Version

**0.1.0**

## Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.X.0): New features, backwards-compatible functionality
- **PATCH** (0.0.X): Bug fixes, backwards-compatible fixes

## How to Update Version

### Before Every Push to `development`:

1. **Determine the type of change:**
   - Bug fix? → Increment PATCH (0.1.0 → 0.1.1)
   - New feature? → Increment MINOR (0.1.0 → 0.2.0)
   - Breaking change? → Increment MAJOR (0.1.0 → 1.0.0)

2. **Update version in TWO places:**

   **A) `package.json`:**
   ```json
   {
     "name": "mau-mau",
     "version": "0.2.0",  // ← Update here
     ...
   }
   ```

   **B) `src/app/app.html`:**
   ```html
   <footer class="version">v0.2.0</footer>  // ← Update here
   ```

3. **Commit with version in message:**
   ```bash
   git add package.json src/app/app.html
   git commit -m "chore: Bump version to 0.2.0"
   git push
   ```

## Version History

| Version | Date       | Changes |
|---------|------------|---------|
| 0.1.0   | 2026-01-04 | Initial version with testing infrastructure, Swiss Mau-Mau rules, GitHub Pages deployment |

## Notes

- Version number is displayed in the bottom-right corner of the application
- Always keep `package.json` and `app.html` versions in sync
- Use conventional commit messages: `feat:`, `fix:`, `chore:`, `docs:`, etc.
