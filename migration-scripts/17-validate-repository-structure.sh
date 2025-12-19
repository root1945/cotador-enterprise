#!/bin/bash
# Phase 5.2: Validate Repository Structure

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Validating repository structure..."

echo ""
echo "=== Verify no nested .git directories ==="
NESTED_GIT=$(find apps/ packages/ -name ".git" -type d 2>/dev/null | wc -l)
if [ "$NESTED_GIT" -eq 0 ]; then
  echo "✅ No nested .git directories found"
else
  echo "❌ Found $NESTED_GIT nested .git directories:"
  find apps/ packages/ -name ".git" -type d
  exit 1
fi

echo ""
echo "=== Verify directory structure ==="
if [ -d "apps/api-core" ]; then
  echo "✅ apps/api-core exists"
else
  echo "❌ apps/api-core not found"
  exit 1
fi

if [ -d "packages/shared" ]; then
  echo "✅ packages/shared exists"
else
  echo "❌ packages/shared not found"
  exit 1
fi

if [ -d "apps/mobile" ]; then
  echo "✅ apps/mobile exists"
else
  echo "ℹ️  apps/mobile not found (optional)"
fi

echo ""
echo "=== Verify main .git exists ==="
if [ -d ".git" ]; then
  echo "✅ Main .git repository exists"
  echo "   Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "   Commits: $(git rev-list --count HEAD)"
else
  echo "❌ Main .git repository not found"
  exit 1
fi

echo ""
echo "=== Repository Health Check ==="
if git fsck --no-progress > /dev/null 2>&1; then
  echo "✅ Git repository is healthy"
else
  echo "⚠️  Git repository health check found issues"
  git fsck
fi

echo ""
echo "✅ Repository structure validation complete"
echo ""

