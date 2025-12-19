#!/bin/bash
# Phase 3.2: Create .npmrc

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Creating .npmrc with pnpm configuration..."

cat > .npmrc << 'EOF'
# pnpm configuration

# Use pnpm's strict peer dependencies
strict-peer-dependencies=false

# Enable shamefully-hoist for better compatibility
shamefully-hoist=true

# Auto-install peers
auto-install-peers=true

# Use hoisted node-linker for monorepo compatibility
node-linker=hoisted

# Enable workspace protocol
link-workspace-packages=true

# Save exact versions
save-exact=false
EOF

echo "✅ .npmrc created"
echo ""
cat .npmrc
echo ""
