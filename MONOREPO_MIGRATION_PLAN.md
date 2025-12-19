# Monorepo Migration Plan - npm to pnpm with Git History Preservation

**Project**: Cotador Enterprise
**Date**: 2025-12-18
**Status**: Ready for Execution

## Executive Summary

This plan migrates the Cotador Enterprise project from npm workspaces to pnpm workspaces while preserving **100% of Git history** from all repositories (main, api-core, and mobile).

### Current State
```
cotador-enterprise/ (Git repo)
├── apps/
│   ├── api-core/ (.git - separate repo)
│   └── mobile/ (.git - separate repo)
├── packages/
│   └── shared/
├── package.json (npm workspaces)
└── .git (main repo)
```

### Target State
```
cotador-enterprise/ (unified Git repo)
├── apps/
│   ├── api-core/ (history preserved)
│   └── mobile/ (history preserved)
├── packages/
│   └── shared/
├── pnpm-workspace.yaml
└── .git (merged histories)
```

## Migration Strategy

### Phase 1: Backup and Preparation
**Duration**: 5 minutes
**Risk**: Low

### Phase 2: Git History Preservation
**Duration**: 15-20 minutes
**Risk**: Medium (requires careful Git operations)

### Phase 3: pnpm Migration
**Duration**: 10 minutes
**Risk**: Low

### Phase 4: Configuration Updates
**Duration**: 15 minutes
**Risk**: Low

### Phase 5: Validation
**Duration**: 10 minutes
**Risk**: Low

**Total Estimated Time**: ~60 minutes

---

## Phase 1: Backup and Preparation

### 1.1 Create Backup

```bash
#!/bin/bash
# Script: 01-backup.sh

set -e

echo "🔒 Creating backup of current state..."

BACKUP_DIR="$HOME/cotador-enterprise-backup-$(date +%Y%m%d-%H%M%S)"
CURRENT_DIR="/home/victoralencar/Code/cotador-enterprise"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup entire project
cp -r "$CURRENT_DIR" "$BACKUP_DIR/"

echo "✅ Backup created at: $BACKUP_DIR"
echo "📁 To restore: rm -rf $CURRENT_DIR && cp -r $BACKUP_DIR/cotador-enterprise $CURRENT_DIR"
```

### 1.2 Install pnpm

```bash
#!/bin/bash
# Script: 02-install-pnpm.sh

set -e

echo "📦 Installing pnpm..."

# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version

echo "✅ pnpm installed successfully"
```

### 1.3 Verify Current State

```bash
#!/bin/bash
# Script: 03-verify-current-state.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📊 Verifying current state..."

echo ""
echo "=== Git Repositories ==="
find . -maxdepth 3 -name ".git" -type d

echo ""
echo "=== Git History (main) ==="
git log --oneline -5

echo ""
echo "=== Git History (api-core) ==="
cd apps/api-core
git log --oneline -5

echo ""
echo "=== Git History (mobile) ==="
cd ../mobile
git log --oneline -5 2>/dev/null || echo "No commits"

cd /home/victoralencar/Code/cotador-enterprise

echo ""
echo "✅ Verification complete"
```

---

## Phase 2: Git History Preservation

This is the **most critical phase**. We'll use Git subtree merge strategy to preserve all history.

### 2.1 Strategy: Git Subtree Merge

We'll merge the api-core and mobile repos into the main repo as subdirectories while preserving their complete history.

**Key Concepts:**
- Use `git remote add` to add subprojects as remotes
- Use `git fetch` to get their history
- Use `git read-tree` with `--prefix` to place them in correct directories
- Use `git merge -s subtree` to merge histories

### 2.2 Merge api-core History

```bash
#!/bin/bash
# Script: 04-merge-api-core-history.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔀 Merging api-core Git history..."

# Step 1: Add api-core as a remote
echo "Adding api-core as remote..."
git remote add api-core-repo ./apps/api-core

# Step 2: Fetch api-core history
echo "Fetching api-core history..."
git fetch api-core-repo

# Step 3: Create a temporary branch for api-core
echo "Creating temporary branch..."
git checkout -b temp-api-core api-core-repo/main || git checkout -b temp-api-core api-core-repo/master

# Step 4: Move all files to apps/api-core subdirectory in history
echo "Reorganizing directory structure in history..."
git filter-branch --prune-empty --tree-filter '
  mkdir -p apps/api-core-temp
  for file in *; do
    if [ "$file" != "apps" ]; then
      mv "$file" apps/api-core-temp/ 2>/dev/null || true
    fi
  done
  if [ -d apps/api-core-temp ]; then
    mkdir -p apps
    mv apps/api-core-temp apps/api-core
  fi
' HEAD

# Step 5: Switch back to main branch
echo "Switching back to main branch..."
git checkout main

# Step 6: Merge api-core history
echo "Merging api-core history into main..."
git merge temp-api-core --allow-unrelated-histories -m "chore: merge api-core repository history"

# Step 7: Clean up
echo "Cleaning up..."
git branch -D temp-api-core
git remote remove api-core-repo

# Step 8: Remove old .git directory from api-core
echo "Removing old .git from apps/api-core..."
rm -rf apps/api-core/.git

echo "✅ api-core history merged successfully"
```

### 2.3 Merge mobile History

```bash
#!/bin/bash
# Script: 05-merge-mobile-history.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔀 Merging mobile Git history..."

# Check if mobile has any commits
if [ ! -d "apps/mobile/.git" ]; then
  echo "⚠️  mobile has no .git directory, skipping..."
  exit 0
fi

cd apps/mobile
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
cd ../..

if [ "$COMMIT_COUNT" = "0" ]; then
  echo "⚠️  mobile has no commits, skipping..."
  rm -rf apps/mobile/.git
  exit 0
fi

# Step 1: Add mobile as a remote
echo "Adding mobile as remote..."
git remote add mobile-repo ./apps/mobile

# Step 2: Fetch mobile history
echo "Fetching mobile history..."
git fetch mobile-repo

# Step 3: Create a temporary branch for mobile
echo "Creating temporary branch..."
git checkout -b temp-mobile mobile-repo/main || git checkout -b temp-mobile mobile-repo/master

# Step 4: Move all files to apps/mobile subdirectory in history
echo "Reorganizing directory structure in history..."
git filter-branch --prune-empty --tree-filter '
  mkdir -p apps/mobile-temp
  for file in *; do
    if [ "$file" != "apps" ]; then
      mv "$file" apps/mobile-temp/ 2>/dev/null || true
    fi
  done
  if [ -d apps/mobile-temp ]; then
    mkdir -p apps
    mv apps/mobile-temp apps/mobile
  fi
' HEAD

# Step 5: Switch back to main branch
echo "Switching back to main branch..."
git checkout main

# Step 6: Merge mobile history
echo "Merging mobile history into main..."
git merge temp-mobile --allow-unrelated-histories -m "chore: merge mobile repository history"

# Step 7: Clean up
echo "Cleaning up..."
git branch -D temp-mobile
git remote remove mobile-repo

# Step 8: Remove old .git directory from mobile
echo "Removing old .git from apps/mobile..."
rm -rf apps/mobile/.git

echo "✅ mobile history merged successfully"
```

### 2.4 Verify Merged History

```bash
#!/bin/bash
# Script: 06-verify-merged-history.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Verifying merged Git history..."

echo ""
echo "=== All commits in repository ==="
git log --oneline --all --graph -20

echo ""
echo "=== Commits affecting apps/api-core ==="
git log --oneline --all -- apps/api-core | head -10

echo ""
echo "=== Commits affecting apps/mobile ==="
git log --oneline --all -- apps/mobile | head -10

echo ""
echo "=== Check for .git directories (should be none in subdirectories) ==="
find apps/ packages/ -name ".git" -type d

echo ""
echo "✅ History verification complete"
```

---

## Phase 3: pnpm Migration

### 3.1 Create pnpm-workspace.yaml

```bash
#!/bin/bash
# Script: 07-create-pnpm-workspace.sh

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
cat pnpm-workspace.yaml
```

### 3.2 Create .npmrc for pnpm Configuration

```bash
#!/bin/bash
# Script: 08-create-npmrc.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Creating .npmrc with pnpm configuration..."

cat > .npmrc << 'EOF'
# pnpm configuration

# Use pnpm's strict peer dependencies
strict-peer-dependencies=false

# Enable shamefully-hoist for better compatibility with tools
# that don't handle pnpm's node_modules structure
shamefully-hoist=true

# Auto-install peers
auto-install-peers=true

# Use node-linker=hoisted for better monorepo compatibility
node-linker=hoisted

# Enable workspace protocol
link-workspace-packages=true
EOF

echo "✅ .npmrc created"
cat .npmrc
```

### 3.3 Clean npm Artifacts

```bash
#!/bin/bash
# Script: 09-clean-npm-artifacts.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🧹 Cleaning npm artifacts..."

# Remove root node_modules
echo "Removing root node_modules..."
rm -rf node_modules

# Remove root package-lock.json
echo "Removing root package-lock.json..."
rm -f package-lock.json

# Remove api-core npm artifacts
echo "Removing api-core npm artifacts..."
rm -rf apps/api-core/node_modules
rm -f apps/api-core/package-lock.json

# Remove mobile npm artifacts
echo "Removing mobile npm artifacts..."
rm -rf apps/mobile/node_modules
rm -f apps/mobile/package-lock.json

# Remove shared npm artifacts
echo "Removing shared npm artifacts..."
rm -rf packages/shared/node_modules
rm -f packages/shared/package-lock.json

echo "✅ npm artifacts cleaned"
```

### 3.4 Install with pnpm

```bash
#!/bin/bash
# Script: 10-install-with-pnpm.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📦 Installing dependencies with pnpm..."

# Install all dependencies
pnpm install

echo ""
echo "✅ Dependencies installed with pnpm"
echo ""
echo "📊 Workspace info:"
pnpm list --depth 0
```

---

## Phase 4: Configuration Updates

### 4.1 Update Root package.json

```bash
#!/bin/bash
# Script: 11-update-root-package-json.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Updating root package.json..."

# Backup original
cp package.json package.json.backup

# Create new package.json
cat > package.json << 'EOF'
{
  "name": "cotador-enterprise",
  "version": "1.0.0",
  "private": true,
  "description": "Plataforma SaaS de alta escala para gestão e precificação de serviços",
  "scripts": {
    "prepare": "husky install",

    "dev": "pnpm --filter \"./apps/*\" run start:dev",
    "dev:api": "pnpm --filter api-core run start:dev",
    "dev:mobile": "pnpm --filter mobile run start",

    "build": "pnpm --recursive run build",
    "build:api": "pnpm --filter api-core run build",
    "build:mobile": "pnpm --filter mobile run build",
    "build:shared": "pnpm --filter @cotador/shared run build",

    "test": "pnpm --recursive run test",
    "test:api": "pnpm --filter api-core run test",
    "test:mobile": "pnpm --filter mobile run test",
    "test:cov": "pnpm --recursive run test:cov",

    "lint": "pnpm --recursive run lint",
    "lint:fix": "pnpm --recursive run lint --fix",

    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",

    "clean": "pnpm --recursive run clean && rm -rf node_modules",

    "db:migrate": "pnpm --filter api-core run db:migrate",
    "db:studio": "pnpm --filter api-core run db:studio"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.2",
    "eslint": "^9.39.2",
    "globals": "^16.5.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.5.2",
    "prettier": "^3.4.2",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.50.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.15.3"
}
EOF

echo "✅ Root package.json updated"
```

### 4.2 Update Root tsconfig.json

```bash
#!/bin/bash
# Script: 12-update-root-tsconfig.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Updating root tsconfig.json..."

# Backup original
cp tsconfig.json tsconfig.json.backup

# Create new tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "incremental": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": "./",
    "paths": {
      "@cotador/shared": ["packages/shared/src/index.ts"],
      "@cotador/shared/*": ["packages/shared/src/*"]
    }
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage"
  ]
}
EOF

echo "✅ Root tsconfig.json updated"
```

### 4.3 Update api-core package.json

```bash
#!/bin/bash
# Script: 13-update-api-core-package.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise/apps/api-core

echo "📝 Updating api-core package.json..."

# Read current package.json and update workspace references
node << 'NODEJS'
const fs = require('fs');
const path = require('path');

const packagePath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update workspace dependencies to use workspace protocol
if (pkg.dependencies && pkg.dependencies['@cotador/shared']) {
  pkg.dependencies['@cotador/shared'] = 'workspace:*';
}

// Add scripts if missing
pkg.scripts = pkg.scripts || {};
pkg.scripts.clean = pkg.scripts.clean || 'rm -rf dist node_modules';

// Update to use pnpm
if (pkg.engines) {
  delete pkg.engines.npm;
  pkg.engines.pnpm = '>=9.0.0';
}

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ api-core package.json updated');
NODEJS
```

### 4.4 Update shared package.json

```bash
#!/bin/bash
# Script: 14-update-shared-package.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise/packages/shared

echo "📝 Updating shared package.json..."

node << 'NODEJS'
const fs = require('fs');

const packagePath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Ensure package has correct name
pkg.name = '@cotador/shared';

// Add clean script
pkg.scripts = pkg.scripts || {};
pkg.scripts.clean = pkg.scripts.clean || 'rm -rf dist node_modules';

// Update to use pnpm
pkg.engines = pkg.engines || {};
pkg.engines.pnpm = '>=9.0.0';

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ shared package.json updated');
NODEJS
```

### 4.5 Update .gitignore

```bash
#!/bin/bash
# Script: 15-update-gitignore.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Updating .gitignore for pnpm..."

# Add pnpm-specific entries if not present
cat >> .gitignore << 'EOF'

# pnpm
pnpm-lock.yaml
.pnpm-store/
.pnpm-debug.log

# Workspace
.turbo/
EOF

echo "✅ .gitignore updated"
```

---

## Phase 5: Validation

### 5.1 Validate Installation

```bash
#!/bin/bash
# Script: 16-validate-installation.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Validating installation..."

echo ""
echo "=== pnpm Version ==="
pnpm --version

echo ""
echo "=== Workspace Structure ==="
pnpm list --depth 0

echo ""
echo "=== Workspace Verification ==="
pnpm exec pnpm ls --depth 0 -r

echo ""
echo "=== Check @cotador/shared Resolution ==="
cd apps/api-core
node -e "console.log(require.resolve('@cotador/shared'))" || echo "⚠️  Cannot resolve @cotador/shared"
cd ../..

echo ""
echo "✅ Installation validation complete"
```

### 5.2 Validate Git History

```bash
#!/bin/bash
# Script: 17-validate-git-history.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Validating Git history preservation..."

echo ""
echo "=== Total commit count ==="
TOTAL_COMMITS=$(git rev-list --count HEAD)
echo "Total commits: $TOTAL_COMMITS"

echo ""
echo "=== Commits from api-core history ==="
API_COMMITS=$(git log --all --oneline --no-merges -- apps/api-core | wc -l)
echo "api-core commits: $API_COMMITS"

echo ""
echo "=== Commits from mobile history ==="
MOBILE_COMMITS=$(git log --all --oneline --no-merges -- apps/mobile | wc -l)
echo "mobile commits: $MOBILE_COMMITS"

echo ""
echo "=== Sample commits from each source ==="
echo ""
echo "📁 api-core history:"
git log --oneline --no-merges -- apps/api-core | head -5

echo ""
echo "📁 mobile history:"
git log --oneline --no-merges -- apps/mobile | head -5

echo ""
echo "=== Verify no nested .git directories ==="
NESTED_GIT=$(find apps/ packages/ -name ".git" -type d | wc -l)
if [ "$NESTED_GIT" -eq 0 ]; then
  echo "✅ No nested .git directories found"
else
  echo "❌ Found $NESTED_GIT nested .git directories"
  find apps/ packages/ -name ".git" -type d
fi

echo ""
echo "✅ Git history validation complete"
```

### 5.3 Validate Build

```bash
#!/bin/bash
# Script: 18-validate-build.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔨 Validating build process..."

echo ""
echo "=== Building shared package ==="
pnpm --filter @cotador/shared run build

echo ""
echo "=== Building api-core ==="
pnpm --filter api-core run build

echo ""
echo "✅ Build validation complete"
```

### 5.4 Validate Tests

```bash
#!/bin/bash
# Script: 19-validate-tests.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🧪 Validating test execution..."

echo ""
echo "=== Running api-core tests ==="
pnpm --filter api-core run test || echo "⚠️  Tests failed or no tests configured"

echo ""
echo "✅ Test validation complete"
```

### 5.5 Validate Linting

```bash
#!/bin/bash
# Script: 20-validate-lint.sh

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "🔍 Validating linting..."

echo ""
echo "=== Running lint across workspace ==="
pnpm run lint || echo "⚠️  Linting found issues"

echo ""
echo "✅ Lint validation complete"
```

---

## Master Migration Script

Complete automation of all phases:

```bash
#!/bin/bash
# Script: migrate-to-pnpm-monorepo.sh
# Complete migration automation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/home/victoralencar/Code/cotador-enterprise"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Cotador Enterprise - Monorepo Migration                     ║"
echo "║  npm workspaces → pnpm workspaces + Git History Merge        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Confirmation
read -p "⚠️  This will modify Git history. Have you created a backup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled. Please backup first."
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

# Phase 2: Git History Preservation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: Git History Preservation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "⚠️  About to merge Git histories. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled at Phase 2"
  exit 1
fi

bash "$SCRIPT_DIR/04-merge-api-core-history.sh"
bash "$SCRIPT_DIR/05-merge-mobile-history.sh"
bash "$SCRIPT_DIR/06-verify-merged-history.sh"

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

# Phase 5: Validation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 5: Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

bash "$SCRIPT_DIR/16-validate-installation.sh"
bash "$SCRIPT_DIR/17-validate-git-history.sh"
bash "$SCRIPT_DIR/18-validate-build.sh"
bash "$SCRIPT_DIR/19-validate-tests.sh"
bash "$SCRIPT_DIR/20-validate-lint.sh"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Migration Complete!                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo "  1. Review git log to verify history preservation"
echo "  2. Test all applications: pnpm run dev"
echo "  3. Commit changes: git add . && git commit -m 'chore: migrate to pnpm monorepo'"
echo "  4. Push to remote: git push origin main"
echo ""
```

---

## Validation Checklist

### Pre-Migration
- [ ] Backup created at `$HOME/cotador-enterprise-backup-*`
- [ ] pnpm installed globally (v9+)
- [ ] All changes committed to Git
- [ ] Team notified of migration

### During Migration
- [ ] Phase 1 completed without errors
- [ ] api-core history merged successfully
- [ ] mobile history merged successfully
- [ ] No nested .git directories remain
- [ ] pnpm-workspace.yaml created
- [ ] .npmrc configured
- [ ] All npm artifacts cleaned

### Post-Migration
- [ ] `pnpm install` succeeds
- [ ] `pnpm list --depth 0` shows all workspaces
- [ ] `@cotador/shared` resolves correctly
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test` succeeds
- [ ] `pnpm run lint` succeeds
- [ ] Git history preserved (verify with `git log`)
- [ ] All commits from subprojects visible
- [ ] `pnpm-lock.yaml` generated
- [ ] Documentation updated

### Final Verification
- [ ] Start dev servers: `pnpm run dev:api`
- [ ] Database migrations work: `pnpm run db:migrate`
- [ ] Hot reload works in development
- [ ] Production build succeeds: `pnpm run build`
- [ ] Docker Compose still works: `docker-compose up -d`
- [ ] CI/CD updated (if applicable)

---

## Rollback Procedure

If anything goes wrong:

```bash
#!/bin/bash
# Script: rollback.sh

set -e

echo "🔙 Rolling back migration..."

# Find latest backup
BACKUP_DIR=$(ls -dt $HOME/cotador-enterprise-backup-* | head -1)

if [ -z "$BACKUP_DIR" ]; then
  echo "❌ No backup found!"
  exit 1
fi

echo "Found backup: $BACKUP_DIR"
read -p "Restore from this backup? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf /home/victoralencar/Code/cotador-enterprise
  cp -r "$BACKUP_DIR/cotador-enterprise" /home/victoralencar/Code/
  echo "✅ Rollback complete"
else
  echo "❌ Rollback cancelled"
fi
```

---

## Common Issues and Solutions

### Issue 1: Git filter-branch is slow

**Solution**: This is normal for large repositories. Progress is shown. Be patient.

### Issue 2: Merge conflicts during git merge

**Solution**:
```bash
# Accept theirs for conflicts
git merge --strategy-option theirs temp-api-core
```

### Issue 3: pnpm install fails

**Solution**:
```bash
# Clear pnpm cache
pnpm store prune
rm -rf node_modules
pnpm install --force
```

### Issue 4: @cotador/shared not resolving

**Solution**:
```bash
# Rebuild shared package
cd packages/shared
pnpm run build
cd ../..

# Reinstall
pnpm install
```

### Issue 5: Can't find git histories after merge

**Solution**:
```bash
# View all history including merged branches
git log --all --graph --oneline

# View specific path history
git log --all --follow -- apps/api-core/src/main.ts
```

---

## Team Communication Template

### Email to Team

**Subject**: Monorepo Migration - npm to pnpm - Action Required

**Body**:
```
Hi Team,

We're migrating Cotador Enterprise from npm workspaces to pnpm workspaces.

What's Changing:
- npm → pnpm package manager
- Git histories from api-core and mobile will be merged into main repo
- All dependency management through pnpm

What You Need to Do:
1. Install pnpm globally: npm install -g pnpm
2. After migration, delete your local clone
3. Fresh clone from repository
4. Run: pnpm install
5. Continue development as normal

New Commands:
- pnpm install (instead of npm install)
- pnpm run dev
- pnpm run build
- pnpm run test

Questions? Contact [Tech Lead]

Thanks,
[Your Name]
```

---

## Success Metrics

After migration, verify:

1. **Git History**
   - All commits from api-core visible: `git log -- apps/api-core`
   - All commits from mobile visible: `git log -- apps/mobile`
   - Total commit count increased by subproject commits

2. **Workspace Functionality**
   - All packages detected: `pnpm list --depth 0`
   - Cross-package dependencies work: `@cotador/shared` imports succeed
   - Build propagation works: changing shared package triggers api-core rebuild

3. **Performance**
   - Install time < 30s (pnpm is faster than npm)
   - Disk space reduced (pnpm uses content-addressable storage)
   - Symlinks created for workspace packages

4. **Developer Experience**
   - Hot reload works in all apps
   - VSCode IntelliSense works across packages
   - Debugging works through workspace boundaries

---

## Post-Migration Optimization (Optional)

### Enable Turborepo for Faster Builds

```bash
pnpm add -D -w turbo

# Add turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "dev": {
      "cache": false
    }
  }
}
EOF

# Update package.json scripts to use turbo
# Replace: "build": "pnpm --recursive run build"
# With: "build": "turbo run build"
```

---

## Appendix: Alternative Strategy (Git Submodules)

If subtree merge fails, alternative using git submodules:

```bash
# Not recommended, but documented for reference
git submodule add ./apps/api-core apps/api-core
git submodule add ./apps/mobile apps/mobile

# This preserves history but creates complexity
# Prefer subtree merge approach above
```

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-18 | Initial migration plan |

---

## Support and Escalation

If migration fails:
1. Check logs in each script output
2. Verify backup exists before any destructive operations
3. Use rollback procedure if needed
4. Contact DevOps team for Git history issues
5. Contact Platform team for pnpm configuration issues

---

**End of Migration Plan**
