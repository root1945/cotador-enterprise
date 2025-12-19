#!/bin/bash
# Phase 2.2: Merge mobile Git History

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔀 Merging mobile Git history..."

# Check if mobile has a .git directory
if [ ! -d "apps/mobile/.git" ]; then
  echo "⚠️  No .git directory in apps/mobile, skipping..."
  exit 0
fi

# Check if mobile has any commits
cd apps/mobile
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
cd ../..

if [ "$COMMIT_COUNT" = "0" ]; then
  echo "⚠️  mobile has no commits, skipping history merge..."
  rm -rf apps/mobile/.git
  exit 0
fi

echo "Found $COMMIT_COUNT commits in mobile repository"

# Verify we're on main/master branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo "⚠️  Not on main/master branch (currently on: $CURRENT_BRANCH)"
fi

echo ""
echo "Step 1/8: Adding mobile as remote..."
git remote add mobile-repo ./apps/mobile || echo "Remote already exists"

echo "Step 2/8: Fetching mobile history..."
git fetch mobile-repo

echo "Step 3/8: Detecting mobile branch..."
MOBILE_BRANCH=$(cd apps/mobile && git rev-parse --abbrev-ref HEAD)
echo "mobile is on branch: $MOBILE_BRANCH"

echo "Step 4/8: Creating temporary branch..."
git checkout -b temp-mobile mobile-repo/$MOBILE_BRANCH 2>/dev/null || git checkout -b temp-mobile mobile-repo/main 2>/dev/null || git checkout -b temp-mobile mobile-repo/master

echo "Step 5/8: Reorganizing directory structure in history..."
echo "⚠️  This may take several minutes for large histories..."

git filter-branch --force --prune-empty --subdirectory-filter . \
  --tree-filter '
    if [ ! -d ../../apps-temp ]; then
      mkdir -p ../../apps-temp/mobile
    fi
    cp -r . ../../apps-temp/mobile/ 2>/dev/null || true
    rm -rf *
    mv ../../apps-temp/* . 2>/dev/null || true
    rm -rf ../../apps-temp
  ' HEAD

echo "Step 6/8: Switching back to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

echo "Step 7/8: Merging mobile history..."
git merge temp-mobile --allow-unrelated-histories --no-edit -m "chore: merge mobile repository history

Preserved full Git history from mobile repository.
Original repository: apps/mobile/.git"

echo "Step 8/8: Cleaning up..."
git branch -D temp-mobile
git remote remove mobile-repo

# Remove old .git directory
echo "Removing old .git from apps/mobile..."
rm -rf apps/mobile/.git

echo ""
echo "✅ mobile history merged successfully"
echo ""
echo "📊 Verification:"
git log --oneline --all -- apps/mobile | head -5
echo ""
