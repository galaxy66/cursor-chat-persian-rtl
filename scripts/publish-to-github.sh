#!/usr/bin/env bash
# Create/push public repo under the authenticated GitHub user and attach VSIX as a Release.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh is not authenticated" >&2
  exit 1
fi

LOGIN="$(gh api user --jq .login)"
echo "Authenticated as: $LOGIN"

if [[ "$LOGIN" != "galaxy66" ]]; then
  echo "WARNING: expected galaxy66, got $LOGIN — continuing under authenticated account." >&2
fi

REPO_NAME="cursor-chat-persian-rtl"
REPO_FULL="${LOGIN}/${REPO_NAME}"
VSIX="$ROOT/cursor-chat-persian-rtl-1.0.0.vsix"

if [[ ! -f "$VSIX" ]]; then
  echo "Building VSIX..."
  npm run package
fi

# Ensure package.json points at the real repo before push
node - <<NODE
const fs = require('fs');
const p = 'package.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
j.repository = { type: 'git', url: 'https://github.com/${REPO_FULL}' };
j.homepage = 'https://github.com/${REPO_FULL}#readme';
j.bugs = { url: 'https://github.com/${REPO_FULL}/issues' };
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
NODE

git add package.json
git -c user.email="haniyeh.ghassami@gmail.com" -c user.name="Haniyeh Ghassami" \
  commit -m "Set GitHub repository metadata" || true

# Create public repo if missing
if gh repo view "$REPO_FULL" >/dev/null 2>&1; then
  echo "Repo already exists: https://github.com/$REPO_FULL"
else
  gh repo create "$REPO_FULL" \
    --public \
    --description "Cursor chat RTL for Persian/Arabic/Hebrew — auto-detect bubbles & input; Install from VSIX" \
    --source "$ROOT" \
    --remote origin \
    --push
  echo "Created and pushed: https://github.com/$REPO_FULL"
fi

# Ensure remote + push main
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/${REPO_FULL}.git"
fi
git push -u origin main

# GitHub Release with VSIX asset
TAG="v1.0.0"
if gh release view "$TAG" --repo "$REPO_FULL" >/dev/null 2>&1; then
  echo "Release $TAG exists — uploading/replacing asset if needed"
  gh release upload "$TAG" "$VSIX" --repo "$REPO_FULL" --clobber
else
  gh release create "$TAG" "$VSIX" \
    --repo "$REPO_FULL" \
    --title "v1.0.0 — Cursor Chat Persian RTL" \
    --notes "$(cat <<'EOF'
First release of **Cursor Chat Persian RTL**.

## Install
1. Download `cursor-chat-persian-rtl-1.0.0.vsix` from the Assets below.
2. Cursor → Command Palette → **Extensions: Install from VSIX…**
3. Run **Persian Chat RTL: Activate (auto-detect)**
4. Fully quit and reopen Cursor.

See README for فارسی / English details and known limitations (workbench inject).
EOF
)"
fi

echo "DONE"
echo "REPO=https://github.com/$REPO_FULL"
echo "BRANCH=main"
echo "RELEASE=https://github.com/$REPO_FULL/releases/tag/$TAG"
echo "VSIX_ASSET=Release $TAG (not committed to git tree)"
