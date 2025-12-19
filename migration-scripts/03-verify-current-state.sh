#!/bin/bash
# Phase 1.3: Verify Current State

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📊 Verifying current state..."

echo ""
echo "=== Git Repositories ==="
GIT_REPOS=$(find . -maxdepth 3 -name ".git" -type d)
if [ -z "$GIT_REPOS" ]; then
  echo "⚠️  No .git directories found"
else
  echo "$GIT_REPOS"
fi

echo ""
echo "=== Project Structure ==="
if [ -d "apps/api-core" ]; then
  echo "✅ apps/api-core exists"
  if [ -d "apps/api-core/.git" ]; then
    echo "   ⚠️  Contains nested .git (will be removed)"
  fi
else
  echo "❌ apps/api-core not found"
fi

if [ -d "apps/mobile" ]; then
  echo "✅ apps/mobile exists"
  if [ -d "apps/mobile/.git" ]; then
    echo "   ⚠️  Contains nested .git (will be removed)"
  fi
else
  echo "ℹ️  apps/mobile not found (optional)"
fi

if [ -d "packages/shared" ]; then
  echo "✅ packages/shared exists"
else
  echo "❌ packages/shared not found"
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
