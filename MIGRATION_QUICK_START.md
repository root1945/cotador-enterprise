# Monorepo Migration - Quick Start Guide

## TL;DR - Execute Migration

**WARNING**: This modifies Git history. Backup first!

```bash
cd /home/victoralencar/Code/cotador-enterprise

# Run complete migration
bash migration-scripts/00-migrate-to-pnpm-monorepo.sh
```

## What This Migration Does

1. **Preserves 100% of Git history** from all repositories (main, api-core, mobile)
2. **Merges all Git histories** into single unified repository
3. **Migrates from npm to pnpm** workspaces
4. **Configures workspace dependencies** with `@cotador/shared`
5. **Updates all configuration files** for monorepo structure

## Pre-Migration Checklist

- [ ] All changes committed to Git
- [ ] Team notified of migration
- [ ] CI/CD pipeline will need updates (if exists)
- [ ] Node.js 20+ installed
- [ ] You have 15-30 minutes for migration

## Manual Step-by-Step (Alternative)

If you prefer manual control:

```bash
cd /home/victoralencar/Code/cotador-enterprise

# Phase 1: Backup
bash migration-scripts/01-backup.sh
bash migration-scripts/02-install-pnpm.sh
bash migration-scripts/03-verify-current-state.sh

# Phase 2: Git History (CRITICAL - cannot be easily undone)
bash migration-scripts/04-merge-api-core-history.sh
bash migration-scripts/05-merge-mobile-history.sh
bash migration-scripts/06-verify-merged-history.sh

# Phase 3: pnpm Migration
bash migration-scripts/07-create-pnpm-workspace.sh
bash migration-scripts/08-create-npmrc.sh
bash migration-scripts/09-clean-npm-artifacts.sh
bash migration-scripts/10-install-with-pnpm.sh

# Phase 4: Configuration
bash migration-scripts/11-update-root-package-json.sh
bash migration-scripts/12-update-root-tsconfig.sh
bash migration-scripts/13-update-api-core-package.sh
bash migration-scripts/14-update-shared-package.sh
bash migration-scripts/15-update-gitignore.sh

# Reinstall after config changes
pnpm install

# Phase 5: Validation
bash migration-scripts/16-validate-installation.sh
bash migration-scripts/17-validate-git-history.sh
bash migration-scripts/18-validate-build.sh
bash migration-scripts/19-validate-tests.sh
bash migration-scripts/20-validate-lint.sh
```

## Post-Migration Commands

### Development
```bash
# Start API in dev mode
pnpm run dev:api

# Start all apps in parallel
pnpm run dev

# Start specific app
pnpm --filter api-core run start:dev
```

### Building
```bash
# Build everything
pnpm run build

# Build specific package
pnpm run build:api
pnpm run build:shared
```

### Testing
```bash
# Run all tests
pnpm run test

# Test specific package
pnpm --filter api-core run test
pnpm --filter api-core run test:cov
```

### Database Operations
```bash
# Run migrations
pnpm run db:migrate

# Open Prisma Studio
pnpm run db:studio

# Generate Prisma Client
pnpm run db:generate
```

### Code Quality
```bash
# Lint all packages
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code
pnpm run format

# Check formatting
pnpm run format:check
```

## Verification After Migration

### 1. Check Git History
```bash
# View merged history
git log --all --graph --oneline -20

# Verify api-core history preserved
git log --oneline -- apps/api-core | head -10

# Verify mobile history preserved
git log --oneline -- apps/mobile | head -10
```

### 2. Check Workspace Structure
```bash
# List all workspaces
pnpm list --depth 0

# Check workspace details
pnpm ls -r
```

### 3. Test Development Workflow
```bash
# Start API
pnpm run dev:api

# In another terminal, make changes to shared package
# Verify hot reload works
```

### 4. Test Build Process
```bash
# Clean build
pnpm run clean
pnpm run build

# Verify build outputs
ls -la apps/api-core/dist
ls -la packages/shared/dist
```

## Common Issues & Solutions

### Issue: pnpm not found
```bash
npm install -g pnpm@latest
```

### Issue: @cotador/shared not resolving
```bash
cd packages/shared
pnpm run build
cd ../..
pnpm install
```

### Issue: Git merge conflicts
```bash
# Accept incoming changes
git checkout --theirs .
git add .
git merge --continue
```

### Issue: Build fails after migration
```bash
# Clear everything and reinstall
pnpm run clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

## Rollback If Needed

```bash
bash migration-scripts/rollback.sh
```

This will restore from the automatic backup created in Phase 1.

## Team Instructions

### For Team Members (After Migration)

1. Delete your local clone
2. Fresh clone from repository:
   ```bash
   git clone <repo-url>
   cd cotador-enterprise
   ```

3. Install pnpm globally:
   ```bash
   npm install -g pnpm
   ```

4. Install dependencies:
   ```bash
   pnpm install
   ```

5. Start development:
   ```bash
   pnpm run dev:api
   ```

### Key Changes for Developers

| Before (npm) | After (pnpm) |
|--------------|--------------|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm run dev:api` |
| `npm run build` | `pnpm run build` |
| `npm test` | `pnpm run test` |
| `cd apps/api-core && npm install` | `pnpm install` (from root) |

## Success Criteria

- [ ] `pnpm install` completes without errors
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run dev:api` starts successfully
- [ ] Hot reload works in development
- [ ] Git history shows commits from all repos
- [ ] No nested `.git` directories exist
- [ ] `@cotador/shared` imports work in api-core
- [ ] `pnpm-lock.yaml` exists at root
- [ ] Tests pass: `pnpm run test`
- [ ] Linting passes: `pnpm run lint`

## Next Steps After Migration

1. Review and verify Git history
2. Test all applications locally
3. Update CI/CD pipeline configuration
4. Update documentation with new commands
5. Commit changes:
   ```bash
   git add .
   git commit -m "chore: migrate to pnpm monorepo with preserved history"
   ```
6. Push to remote:
   ```bash
   git push origin main
   ```
7. Notify team of migration completion

## Support

- Full documentation: `MONOREPO_MIGRATION_PLAN.md`
- Development guidelines: `DEVELOPMENT_GUIDELINES.md`
- Architecture docs: `DESIGN_DOCUMENT.md`
- Claude Code guide: `CLAUDE.md`

---

**Migration Date**: 2025-12-18
**Estimated Duration**: 30-60 minutes
**Risk Level**: Medium (Git history modification)
**Rollback**: Available via `migration-scripts/rollback.sh`
