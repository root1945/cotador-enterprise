#!/bin/bash
# Phase 2.3: Verify Merged History

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Verifying merged Git history..."

echo ""
echo "=== Total commit count ==="
TOTAL_COMMITS=$(git rev-list --count HEAD)
echo "Total commits: $TOTAL_COMMITS"

echo ""
echo "=== Commits from api-core history ==="
API_COMMITS=$(git log --all --oneline --no-merges -- apps/api-core 2>/dev/null | wc -l)
echo "api-core commits: $API_COMMITS"

echo ""
echo "=== Commits from mobile history ==="
MOBILE_COMMITS=$(git log --all --oneline --no-merges -- apps/mobile 2>/dev/null | wc -l)
echo "mobile commits: $MOBILE_COMMITS"

echo ""
echo "=== Sample commits from each source ==="
echo ""
echo "📁 Recent commits affecting apps/api-core:"
git log --oneline --no-merges -- apps/api-core | head -5 || echo "No commits found"

echo ""
echo "📁 Recent commits affecting apps/mobile:"
git log --oneline --no-merges -- apps/mobile | head -5 || echo "No commits found"

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
echo "=== Git repository health check ==="
git fsck --no-reflogs --no-dangling 2>&1 | head -10

echo ""
echo "✅ Git history verification complete"
echo ""
