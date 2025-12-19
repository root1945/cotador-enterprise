#!/bin/bash
# Master Migration Script: Cotador Enterprise → pnpm Monorepo
# This script orchestrates the complete migration process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/home/victoralencar/Code/cotador-enterprise"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Cotador Enterprise - Monorepo Migration                     ║"
echo "║  npm workspaces → pnpm workspaces                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Full documentation: MONOREPO_MIGRATION_PLAN.md"
echo ""

# Confirmation
read -p "⚠️  This will remove nested Git repositories. Have you created a backup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled. Please backup first."
  echo "💡 Run: bash $SCRIPT_DIR/01-backup.sh"
  exit 1
fi

echo ""
echo "🚀 Starting migration..."
echo ""

# Phase 1: Backup and Preparation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Backup and Preparation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

bash "$SCRIPT_DIR/01-backup.sh"
bash "$SCRIPT_DIR/02-install-pnpm.sh"
bash "$SCRIPT_DIR/03-verify-current-state.sh"

# Phase 2: Cleanup Nested Git Repositories
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: Cleanup Nested Git Repositories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

bash "$SCRIPT_DIR/04-remove-nested-git.sh"

# Phase 3: pnpm Migration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3: pnpm Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

bash "$SCRIPT_DIR/07-create-pnpm-workspace.sh"
bash "$SCRIPT_DIR/08-create-npmrc.sh"
bash "$SCRIPT_DIR/09-clean-npm-artifacts.sh"
bash "$SCRIPT_DIR/10-install-with-pnpm.sh"

# Phase 4: Configuration Updates
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 4: Configuration Updates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

bash "$SCRIPT_DIR/11-update-root-package-json.sh"
bash "$SCRIPT_DIR/12-update-root-tsconfig.sh"
bash "$SCRIPT_DIR/13-update-api-core-package.sh"
bash "$SCRIPT_DIR/14-update-shared-package.sh"
bash "$SCRIPT_DIR/15-update-gitignore.sh"

# Reinstall after config changes
echo ""
echo "📦 Reinstalling dependencies with updated configuration..."
cd "$PROJECT_DIR"
pnpm install

# Phase 5: Validation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 5: Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

bash "$SCRIPT_DIR/16-validate-installation.sh"
bash "$SCRIPT_DIR/17-validate-repository-structure.sh"
bash "$SCRIPT_DIR/18-validate-build.sh"
bash "$SCRIPT_DIR/19-validate-tests.sh"
bash "$SCRIPT_DIR/20-validate-lint.sh"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Migration Complete!                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo "  1. Test applications: pnpm run dev:api"
echo "  2. Run tests: pnpm run test"
echo "  3. Commit changes:"
echo "     git add ."
echo "     git commit -m 'chore: migrate to pnpm monorepo'"
echo "  4. Push to remote: git push origin main"
echo ""
echo "📄 See MONOREPO_MIGRATION_PLAN.md for detailed documentation"
echo ""
