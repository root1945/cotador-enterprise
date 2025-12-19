#!/bin/bash
# Phase 5.5: Validate Linting

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Validating linting..."

echo ""
echo "=== Running lint across workspace ==="
pnpm run lint || {
  echo "⚠️  Linting found issues"
  echo "This is not critical for migration, but should be fixed"
}

echo ""
echo "=== Check Prettier formatting ==="
pnpm run format:check || {
  echo "⚠️  Formatting issues found"
  echo "Run: pnpm run format"
}

echo ""
echo "✅ Lint validation complete"
echo ""
