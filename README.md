# Semantic Release (Go Profile)

A plugin for running [semantic-release](https://github.com/semantic-release/semantic-release) with **Go-specific Conventional Commits rules**.  
It automates versioning and changelog generation while respecting Go module semantics:

- **Pre-1.0 (`v0.x.y`)**: breaking changes → minor bumps  
- **Post-1.0 (`v1.x.y` and higher)**: breaking changes → major bumps (new `/vN` module import path)  

This container works not only in Drone, but also in other CI/CD systems (GitHub Actions, GitLab CI, local Docker runs).

---

## Features

- Enforces a **Go-adapted Conventional Commits** profile
- Automatic **semantic versioning** aligned with Go modules
- Automatic **changelog generation** (grouped by Features, Fixes, Breaking Changes, etc.)
- Maintains a changelog file (default: `CHANGELOG.md`, configurable via `CHANGELOG_FILE`)
- Optional **VERSION file** support (set `VERSION_FILE=VERSION`)
- Built-in **release.config.js** with Go-specific rules
- Can override with a project-local `release.config.js`
- Handles **Go major version bumps** automatically:
  - Updates `go.mod` module path
  - Rewrites imports with `goimports`
  - Runs `go mod tidy`
  - Commits the updated files

---

## Usage in Drone

```yaml
kind: pipeline
type: docker
name: release

steps:
  - name: semantic-release
    image: your-dockerhub-namespace/semantic-release-go:latest
    environment:
      GITHUB_TOKEN:
        from_secret: github_token
      # Optional extras:
      # VERSION_FILE: VERSION
      # CHANGELOG_FILE: HISTORY.md
```

---

## Usage in GitHub Actions

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Semantic Release (Go profile)
        uses: docker://your-dockerhub-namespace/semantic-release-go:latest
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # VERSION_FILE: VERSION
          # CHANGELOG_FILE: HISTORY.md
```

---

## Configuration

The plugin first looks for a `release.config.js` in the project root.  
If none is found, it falls back to the **built-in Go profile** at `/opt/release.config.js`.

---

## Commit Message Rules

- `feat(pkg): add new feature` → minor bump  
- `fix(pkg): bug fix` → patch bump  
- `break(pkg): breaking change` or `BREAKING CHANGE:` footer  
  - **< v1.0.0** → minor bump  
  - **>= v1.0.0** → major bump + new module path `/vN`

---

## Example Commits

```text
fix(net/http): handle nil request body
feat(cmd/tool): add --verbose flag
break(auth): remove deprecated OAuth2 flow

BREAKING CHANGE: NewToken no longer accepts client_secret directly.
```

---

## License

MIT
