#!/bin/bash
# Phase 3.3: Clean npm Artifacts

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🧹 Cleaning npm artifacts..."

# Remove root node_modules
if [ -d "node_modules" ]; then
  echo "Removing root node_modules..."
  rm -rf node_modules
fi

# Remove root package-lock.json
if [ -f "package-lock.json" ]; then
  echo "Removing root package-lock.json..."
  rm -f package-lock.json
fi

# Remove api-core npm artifacts
if [ -d "apps/api-core/node_modules" ]; then
  echo "Removing api-core/node_modules..."
  rm -rf apps/api-core/node_modules
fi
if [ -f "apps/api-core/package-lock.json" ]; then
  echo "Removing api-core/package-lock.json..."
  rm -f apps/api-core/package-lock.json
fi

# Remove mobile npm artifacts
if [ -d "apps/mobile/node_modules" ]; then
  echo "Removing mobile/node_modules..."
  rm -rf apps/mobile/node_modules
fi
if [ -f "apps/mobile/package-lock.json" ]; then
  echo "Removing mobile/package-lock.json..."
  rm -f apps/mobile/package-lock.json
fi

# Remove shared npm artifacts
if [ -d "packages/shared/node_modules" ]; then
  echo "Removing shared/node_modules..."
  rm -rf packages/shared/node_modules
fi
if [ -f "packages/shared/package-lock.json" ]; then
  echo "Removing shared/package-lock.json..."
  rm -f packages/shared/package-lock.json
fi

echo ""
echo "✅ npm artifacts cleaned"
echo ""
