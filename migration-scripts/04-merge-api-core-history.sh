#!/bin/bash
# Phase 2.1: Merge api-core Git History

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔀 Merging api-core Git history..."

# Check if api-core has a .git directory
if [ ! -d "apps/api-core/.git" ]; then
  echo "⚠️  No .git directory in apps/api-core, skipping..."
  exit 0
fi

# Verify we're on main/master branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo "⚠️  Not on main/master branch (currently on: $CURRENT_BRANCH)"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "Step 1/8: Adding api-core as remote..."
git remote add api-core-repo ./apps/api-core || echo "Remote already exists"

echo "Step 2/8: Fetching api-core history..."
git fetch api-core-repo

echo "Step 3/8: Detecting api-core branch..."
API_BRANCH=$(cd apps/api-core && git rev-parse --abbrev-ref HEAD)
echo "api-core is on branch: $API_BRANCH"

echo "Step 4/8: Creating temporary branch..."
git checkout -b temp-api-core api-core-repo/$API_BRANCH 2>/dev/null || git checkout -b temp-api-core api-core-repo/main 2>/dev/null || git checkout -b temp-api-core api-core-repo/master

echo "Step 5/8: Reorganizing directory structure in history..."
echo "⚠️  This may take several minutes for large histories..."

# Use subdirectory-filter to move everything to apps/api-core
git filter-branch --force --prune-empty --subdirectory-filter . \
  --tree-filter '
    if [ ! -d ../../apps-temp ]; then
      mkdir -p ../../apps-temp/api-core
    fi
    cp -r . ../../apps-temp/api-core/ 2>/dev/null || true
    rm -rf *
    mv ../../apps-temp/* . 2>/dev/null || true
    rm -rf ../../apps-temp
  ' HEAD

echo "Step 6/8: Switching back to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

echo "Step 7/8: Merging api-core history..."
git merge temp-api-core --allow-unrelated-histories --no-edit -m "chore: merge api-core repository history

Preserved full Git history from api-core repository.
Original repository: apps/api-core/.git"

echo "Step 8/8: Cleaning up..."
git branch -D temp-api-core
git remote remove api-core-repo

# Remove old .git directory
echo "Removing old .git from apps/api-core..."
rm -rf apps/api-core/.git

echo ""
echo "✅ api-core history merged successfully"
echo ""
echo "📊 Verification:"
git log --oneline --all -- apps/api-core | head -5
echo ""
