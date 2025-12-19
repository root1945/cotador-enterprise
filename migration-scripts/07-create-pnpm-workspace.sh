#!/bin/bash
# Phase 3.1: Create pnpm-workspace.yaml

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Creating pnpm-workspace.yaml..."

cat > pnpm-workspace.yaml << 'EOF'
# pnpm workspace configuration
# See: https://pnpm.io/workspaces

packages:
  # All packages in apps directory
  - 'apps/*'

  # All packages in packages directory
  - 'packages/*'
EOF

echo "✅ pnpm-workspace.yaml created"
echo ""
cat pnpm-workspace.yaml
echo ""
