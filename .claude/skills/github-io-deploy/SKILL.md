---
name: github-io-deploy
description: Deploy a Vite React website to GitHub Pages. Use this when the user wants to deploy an existing website to GitHub Pages, set up GitHub Actions deployment, configure GitHub Pages settings, fix deployment issues, or troubleshoot 404 errors on github.io. Covers both the workflow setup and the repo configuration steps.
---

# GitHub.io Deploy

Deploy a Vite + React website to GitHub Pages using GitHub Actions source mode. This skill handles everything: creating the workflow, configuring repo settings via `gh`, and troubleshooting.

## When to use

- User wants to deploy an existing Vite/React site to GitHub Pages
- User needs to fix deployment issues (404s, build failures, wrong content)
- User asks how to set up GitHub Pages for their project
- User mentions "deploy to github.io", "set up GitHub Actions", or "GitHub Pages not working"

## How it works

Uses **GitHub Actions source mode** — the workflow builds the site, uploads it as an artifact, and GitHub Pages serves directly from it. No `gh-pages` branch needed.

## Deployment steps

### Step 1: Update vite.config.ts

Set the `base` to match your repo name:

```ts
export default defineConfig({
  base: "/<repo-name>/",  // e.g., "/NBUI/" for ljlabs/NBUI
  // ...
});
```

### Step 2: Create the GitHub Actions workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: website/package-lock.json

      - name: Install dependencies
        working-directory: website
        run: npm ci

      - name: Build
        working-directory: website
        run: npm run build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: website/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Adjust `working-directory` and `path` to match your project structure:
- Monorepo with website in `website/`: use `working-directory: website` and `path: website/dist`
- Single-repo project: remove `working-directory` and use `path: dist`

### Step 3: Enable GitHub Pages via `gh`

Run these commands to configure the repo. Replace `OWNER/REPO` with your actual repo:

```bash
# Enable Pages with GitHub Actions source mode
gh api -X PUT repos/OWNER/REPO/pages \
  -f build_type=workflow \
  -f source='{"branch":"main","path":"/"}'

# Or if Pages isn't enabled yet:
gh api -X POST repos/OWNER/REPO/pages \
  -f build_type=workflow \
  -f source='{"branch":"main","path":"/"}'
```

**Important:** Pages must be set to `build_type: "workflow"` (not `"legacy"`). If it was previously set to "Deploy from a branch", you need to switch it. The `gh api` call above handles this.

### Step 4: Commit and push

```bash
git add .
git commit -m "deploy to GitHub Pages"
git push origin main
```

The push triggers the workflow automatically. Check status with:

```bash
gh run list --limit 3
```

Your site will be live at:
`https://<owner>.github.io/<repo>/`

## Full automated setup script

For new projects, this one-liner does everything after you've created the files:

```bash
# Get repo info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Enable Pages with workflow source mode
gh api -X PUT repos/$REPO/pages -f build_type=workflow -f source='{"branch":"main","path":"/"}'

# Commit and push
git add .github/workflows/deploy.yml website/
git commit -m "deploy to GitHub Pages"
git push origin main

# Watch the deployment
gh run watch
```

## Troubleshooting

### 404 on the deployed site

**Cause:** `base` in `vite.config.ts` doesn't match the repo name.

**Fix:** Update `base` to `"/<repo-name>/"` and redeploy.

### "Get Pages site failed" in GitHub Actions

**Cause:** Pages isn't enabled in repo settings, or is set to "Deploy from a branch" instead of "GitHub Actions".

**Fix:**
```bash
gh api -X PUT repos/OWNER/REPO/pages -f build_type=workflow -f source='{"branch":"main","path":"/"}'
```

### Build fails in CI but works locally

**Cause:** Usually Windows-specific paths in npm scripts.

**Fix:** Remove explicit `--skills-dir` arguments or backslash paths from package.json scripts. Let the build script use its own default path resolution. Example:
```json
"build": "node scripts/generate-manifest.js && tsc -b && vite build"
// NOT:
"build": "node scripts/generate-manifest.js --skills-dir ..\\skills && tsc -b && vite build"
```

### Windows backslash errors in CI

**Cause:** npm scripts with `..\\skills` work on Windows but fail on Linux CI.

**Fix:** Use forward slashes or remove explicit path arguments. The build script's default resolution works cross-platform.

### Wrong content being served

**Cause:** Stale build artifact, or Pages pointing to the wrong branch.

**Fix:** Push an empty commit to re-trigger the workflow, or run `gh workflow run deploy.yml`. Check `gh api repos/OWNER/REPO/pages` to verify `build_type` is `"workflow"`.

### Pages was previously set to "Deploy from a branch"

**Cause:** Legacy Pages config conflicts with Actions source mode.

**Fix:**
```bash
# Switch to workflow mode
gh api -X PUT repos/OWNER/REPO/pages -f build_type=workflow -f source='{"branch":"main","path":"/"}'
```

## Checking current Pages config

```bash
gh api repos/OWNER/REPO/pages --jq '{build_type: .build_type, source: .source, url: .html_url}'
```

Expected output for GitHub Actions mode:
```json
{
  "build_type": "workflow",
  "source": {"branch": "main", "path": "/"},
  "url": "https://OWNER.github.io/REPO/"
}
```
