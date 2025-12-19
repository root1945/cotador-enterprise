#!/bin/bash
# Phase 5.2: Validate Git History

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Validating Git history preservation..."

echo ""
echo "=== Repository Statistics ==="
TOTAL_COMMITS=$(git rev-list --count HEAD)
echo "📊 Total commits: $TOTAL_COMMITS"

API_COMMITS=$(git log --all --oneline --no-merges -- apps/api-core 2>/dev/null | wc -l)
echo "📊 api-core commits: $API_COMMITS"

MOBILE_COMMITS=$(git log --all --oneline --no-merges -- apps/mobile 2>/dev/null | wc -l)
echo "📊 mobile commits: $MOBILE_COMMITS"

SHARED_COMMITS=$(git log --all --oneline --no-merges -- packages/shared 2>/dev/null | wc -l)
echo "📊 shared commits: $SHARED_COMMITS"

echo ""
echo "=== Sample History from api-core ==="
git log --oneline --no-merges -- apps/api-core | head -5 || echo "No commits found"

echo ""
echo "=== Sample History from mobile ==="
git log --oneline --no-merges -- apps/mobile | head -5 || echo "No commits found"

echo ""
echo "=== Verify No Nested Repositories ==="
NESTED_GIT=$(find apps/ packages/ -name ".git" -type d 2>/dev/null | wc -l)
if [ "$NESTED_GIT" -eq 0 ]; then
  echo "✅ No nested .git directories found"
else
  echo "❌ Found $NESTED_GIT nested .git directories:"
  find apps/ packages/ -name ".git" -type d
  exit 1
fi

echo ""
echo "=== Git Graph View ==="
git log --all --graph --oneline -15

echo ""
echo "✅ Git history validation complete"
echo ""
