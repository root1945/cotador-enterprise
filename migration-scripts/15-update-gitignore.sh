#!/bin/bash
# Phase 4.5: Update .gitignore

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Updating .gitignore for pnpm..."

# Check if pnpm entries already exist
if grep -q "pnpm-lock.yaml" .gitignore 2>/dev/null; then
  echo "ℹ️  pnpm entries already exist in .gitignore"
else
  # Add pnpm-specific entries
  cat >> .gitignore << 'EOF'

# pnpm
pnpm-lock.yaml
.pnpm-store/
.pnpm-debug.log

# Workspace
.turbo/

# Backups from migration
*.npm-backup
*.backup
EOF
  echo "✅ .gitignore updated with pnpm entries"
fi

echo ""
