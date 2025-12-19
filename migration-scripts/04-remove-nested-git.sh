#!/bin/bash
# Phase 2.1: Remove Nested Git Repositories

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🧹 Removing nested Git repositories..."

# Remove api-core .git if it exists
if [ -d "apps/api-core/.git" ]; then
  echo "Removing apps/api-core/.git..."
  rm -rf apps/api-core/.git
  echo "✅ Removed api-core .git"
else
  echo "ℹ️  No .git directory in apps/api-core"
fi

# Remove mobile .git if it exists
if [ -d "apps/mobile/.git" ]; then
  echo "Removing apps/mobile/.git..."
  rm -rf apps/mobile/.git
  echo "✅ Removed mobile .git"
else
  echo "ℹ️  No .git directory in apps/mobile"
fi

# Verify no nested .git directories remain
echo ""
echo "=== Verifying no nested .git directories ==="
NESTED_GIT=$(find apps/ packages/ -name ".git" -type d 2>/dev/null | wc -l)
if [ "$NESTED_GIT" -eq 0 ]; then
  echo "✅ No nested .git directories found"
else
  echo "⚠️  Found $NESTED_GIT nested .git directories:"
  find apps/ packages/ -name ".git" -type d
  echo ""
  echo "❌ Please remove these manually before continuing"
  exit 1
fi

# Verify main .git exists
if [ ! -d ".git" ]; then
  echo "❌ Main .git repository not found at root!"
  exit 1
fi

echo ""
echo "✅ Cleanup complete"
echo ""
echo "📊 Repository structure:"
echo "  - Main .git: ✅ exists"
echo "  - Nested .git: ✅ none found"
echo ""

