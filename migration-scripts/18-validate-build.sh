#!/bin/bash
# Phase 5.3: Validate Build

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔨 Validating build process..."

echo ""
echo "=== Building shared package ==="
pnpm --filter @cotador/shared run build || {
  echo "⚠️  shared build failed or no build script"
}

echo ""
echo "=== Building api-core ==="
pnpm --filter api-core run build || {
  echo "⚠️  api-core build failed"
  exit 1
}

echo ""
echo "=== Verifying Build Outputs ==="
if [ -d "packages/shared/dist" ]; then
  echo "✅ shared/dist exists"
  ls -lh packages/shared/dist | head -5
else
  echo "⚠️  shared/dist not found (may not have build output)"
fi

if [ -d "apps/api-core/dist" ]; then
  echo "✅ api-core/dist exists"
  ls -lh apps/api-core/dist | head -5
else
  echo "❌ api-core/dist not found"
  exit 1
fi

echo ""
echo "✅ Build validation complete"
echo ""
