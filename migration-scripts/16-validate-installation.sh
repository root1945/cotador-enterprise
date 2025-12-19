#!/bin/bash
# Phase 5.1: Validate Installation

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Validating pnpm installation..."

echo ""
echo "=== pnpm Version ==="
pnpm --version

echo ""
echo "=== Workspace Configuration ==="
if [ -f "pnpm-workspace.yaml" ]; then
  echo "✅ pnpm-workspace.yaml exists"
  cat pnpm-workspace.yaml
else
  echo "❌ pnpm-workspace.yaml not found"
  exit 1
fi

echo ""
echo "=== Workspace Packages ==="
pnpm list --depth 0

echo ""
echo "=== Workspace Package Details ==="
pnpm ls --depth 0 -r

echo ""
echo "=== Check @cotador/shared Resolution (from api-core) ==="
cd apps/api-core
if node -e "try { console.log('✅ Resolved:', require.resolve('@cotador/shared')); } catch (e) { console.error('❌ Cannot resolve @cotador/shared'); process.exit(1); }"; then
  echo "Package resolution working"
fi
cd ../..

echo ""
echo "=== pnpm Store Info ==="
pnpm store path
echo ""
pnpm store status

echo ""
echo "✅ Installation validation complete"
echo ""
