#!/bin/bash
# Phase 1.3: Verify Current State

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📊 Verifying current state..."

echo ""
echo "=== Git Repositories ==="
find . -maxdepth 3 -name ".git" -type d

echo ""
echo "=== Git History (main) ==="
git log --oneline -5

echo ""
echo "=== Git History (api-core) ==="
if [ -d "apps/api-core/.git" ]; then
  cd apps/api-core
  git log --oneline -5
  cd ../..
else
  echo "⚠️  No separate .git in apps/api-core"
fi

echo ""
echo "=== Git History (mobile) ==="
if [ -d "apps/mobile/.git" ]; then
  cd apps/mobile
  git log --oneline -5 2>/dev/null || echo "No commits in mobile"
  cd ../..
else
  echo "⚠️  No separate .git in apps/mobile"
fi

echo ""
echo "=== Current Package Manager ==="
if [ -f "package-lock.json" ]; then
  echo "📦 npm (package-lock.json found)"
elif [ -f "pnpm-lock.yaml" ]; then
  echo "📦 pnpm (pnpm-lock.yaml found)"
elif [ -f "yarn.lock" ]; then
  echo "📦 yarn (yarn.lock found)"
fi

echo ""
echo "✅ Verification complete"
echo ""
