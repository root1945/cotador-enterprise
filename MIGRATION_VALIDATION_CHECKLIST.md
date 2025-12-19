# Migration Validation Checklist

Complete this checklist to verify successful migration from npm to pnpm monorepo.

## Pre-Migration Validation

### Environment Check
- [ ] Node.js 20+ installed: `node --version`
- [ ] npm installed and working
- [ ] Git repository is clean: `git status`
- [ ] All changes committed
- [ ] Backup created successfully

### Repository State
- [ ] Main repository `.git` exists at root
- [ ] `apps/api-core/.git` exists (will be merged)
- [ ] `apps/mobile/.git` exists or directory exists
- [ ] `packages/shared/` directory exists
- [ ] Current package manager is npm (package-lock.json exists)

## Phase 1: Backup & Preparation

### Backup Validation
- [ ] Backup directory created: `~/cotador-enterprise-backup-*`
- [ ] Backup size matches project size
- [ ] Backup contains all files including `.git`
- [ ] Rollback instructions understood

### pnpm Installation
- [ ] pnpm installed globally: `pnpm --version`
- [ ] pnpm version >= 9.0.0
- [ ] pnpm accessible from terminal

### Current State Verification
- [ ] Git repositories located (3 repos: root, api-core, mobile)
- [ ] Git histories verified (commit counts noted)
- [ ] npm workspaces configuration noted

## Phase 2: Git History Preservation

### api-core History Merge
- [ ] api-core added as remote
- [ ] api-core history fetched
- [ ] Temporary branch created
- [ ] Directory structure reorganized in history
- [ ] History merged into main
- [ ] Merge commit created
- [ ] Temporary branch deleted
- [ ] Remote removed
- [ ] `apps/api-core/.git` directory removed

### mobile History Merge
- [ ] mobile repo checked for commits
- [ ] mobile history merged (if commits exist)
- [ ] `apps/mobile/.git` directory removed

### History Verification
- [ ] Total commit count increased
- [ ] api-core commits visible: `git log -- apps/api-core`
- [ ] mobile commits visible: `git log -- apps/mobile`
- [ ] No nested `.git` directories: `find apps/ packages/ -name ".git"`
- [ ] Git repository healthy: `git fsck`

## Phase 3: pnpm Migration

### Workspace Configuration
- [ ] `pnpm-workspace.yaml` created at root
- [ ] Workspace configuration includes `apps/*`
- [ ] Workspace configuration includes `packages/*`

### pnpm Configuration
- [ ] `.npmrc` created at root
- [ ] shamefully-hoist enabled
- [ ] auto-install-peers enabled
- [ ] node-linker set to hoisted
- [ ] link-workspace-packages enabled

### Cleanup
- [ ] Root `node_modules/` removed
- [ ] Root `package-lock.json` removed
- [ ] `apps/api-core/node_modules/` removed
- [ ] `apps/api-core/package-lock.json` removed
- [ ] `apps/mobile/node_modules/` removed (if exists)
- [ ] `apps/mobile/package-lock.json` removed (if exists)
- [ ] `packages/shared/node_modules/` removed (if exists)
- [ ] `packages/shared/package-lock.json` removed (if exists)

### pnpm Installation
- [ ] `pnpm install` completed successfully
- [ ] `pnpm-lock.yaml` created at root
- [ ] Root `node_modules/.pnpm/` directory created
- [ ] All workspace packages detected: `pnpm list --depth 0`

## Phase 4: Configuration Updates

### Root package.json
- [ ] Backup created: `package.json.npm-backup`
- [ ] `workspaces` field removed (not needed for pnpm)
- [ ] Scripts updated for pnpm:
  - [ ] `dev`, `dev:api`, `dev:mobile`
  - [ ] `build`, `build:api`, `build:shared`
  - [ ] `test`, `test:api`, `test:cov`
  - [ ] `lint`, `lint:fix`
  - [ ] `format`, `format:check`
  - [ ] `clean`
  - [ ] `db:migrate`, `db:studio`, `db:generate`
- [ ] `engines.pnpm` set to `>=9.0.0`
- [ ] `packageManager` field added

### Root tsconfig.json
- [ ] Backup created: `tsconfig.json.backup`
- [ ] `baseUrl` set to `./`
- [ ] `paths` configured for `@cotador/shared`
- [ ] All strict options enabled
- [ ] Exclude patterns include `node_modules`, `dist`

### api-core package.json
- [ ] Backup created
- [ ] `@cotador/shared` dependency uses `workspace:*`
- [ ] `clean` script added
- [ ] `engines.pnpm` configured
- [ ] `engines.npm` removed

### shared package.json
- [ ] Backup created
- [ ] Package name is `@cotador/shared`
- [ ] `clean` script added
- [ ] `engines.pnpm` configured

### .gitignore
- [ ] pnpm-specific entries added:
  - [ ] `pnpm-lock.yaml`
  - [ ] `.pnpm-store/`
  - [ ] `.pnpm-debug.log`
  - [ ] `.turbo/`
  - [ ] `*.backup`

## Phase 5: Validation

### Installation Validation
- [ ] `pnpm --version` shows correct version
- [ ] `pnpm-workspace.yaml` exists and is valid
- [ ] `pnpm list --depth 0` shows all packages
- [ ] `pnpm ls --depth 0 -r` lists workspace packages
- [ ] `@cotador/shared` resolves from api-core

### Git History Validation
- [ ] Total commit count >= original + api-core commits
- [ ] api-core history preserved (sample commits visible)
- [ ] mobile history preserved (if applicable)
- [ ] No nested `.git` directories
- [ ] `git log --graph` shows merged histories
- [ ] `git fsck` passes

### Build Validation
- [ ] `pnpm --filter @cotador/shared run build` succeeds
- [ ] `packages/shared/dist/` created
- [ ] `pnpm --filter api-core run build` succeeds
- [ ] `apps/api-core/dist/` created
- [ ] Build outputs contain expected files

### Test Validation
- [ ] `pnpm --filter api-core run test` executes
- [ ] Tests pass or identify known issues
- [ ] Test coverage generated (if configured)

### Lint Validation
- [ ] `pnpm run lint` executes across workspaces
- [ ] Linting issues identified (if any)
- [ ] `pnpm run format:check` validates formatting

## Functional Validation

### Development Workflow
- [ ] Start API: `pnpm run dev:api` works
- [ ] API starts without errors
- [ ] Hot reload works when editing api-core files
- [ ] Modify shared package, verify api-core picks up changes

### Database Operations
- [ ] `pnpm run db:generate` generates Prisma client
- [ ] `pnpm run db:studio` opens Prisma Studio
- [ ] Database migrations work: `pnpm run db:migrate`

### Docker Integration
- [ ] `docker-compose up -d` starts infrastructure
- [ ] PostgreSQL accessible
- [ ] RabbitMQ accessible
- [ ] Redis accessible
- [ ] API connects to all services

### Workspace Dependencies
- [ ] api-core can import from `@cotador/shared`
- [ ] TypeScript IntelliSense works for shared package
- [ ] Changes in shared trigger rebuilds in api-core
- [ ] Workspace protocol links work correctly

## Post-Migration Tasks

### Code Commit
- [ ] All migration changes staged: `git add .`
- [ ] Commit created with descriptive message
- [ ] Commit includes:
  - [ ] `pnpm-workspace.yaml`
  - [ ] `.npmrc`
  - [ ] Updated `package.json` files
  - [ ] Updated `tsconfig.json`
  - [ ] Updated `.gitignore`
  - [ ] Removed `package-lock.json` files

### Documentation Updates
- [ ] README.md updated with pnpm commands
- [ ] CLAUDE.md reflects new commands
- [ ] Team notified of migration
- [ ] CI/CD pipeline configuration reviewed

### Remote Push
- [ ] Push to remote: `git push origin main`
- [ ] Verify push succeeded
- [ ] Check GitHub/GitLab for merged history
- [ ] Verify all commits visible in web UI

## Team Onboarding

### Team Communication
- [ ] Migration announcement sent
- [ ] Migration documentation shared
- [ ] Office hours scheduled for questions
- [ ] FAQ document created

### Team Member Validation
- [ ] Team member deletes local clone
- [ ] Team member fresh clones repository
- [ ] Team member installs pnpm globally
- [ ] Team member runs `pnpm install`
- [ ] Team member successfully runs `pnpm run dev:api`
- [ ] Team member can make changes and see hot reload

## Success Metrics

### Performance
- [ ] `pnpm install` faster than `npm install` (baseline noted)
- [ ] Disk space reduced (pnpm content-addressable storage)
- [ ] Build times equivalent or faster

### Functionality
- [ ] All previous features work
- [ ] No regression in functionality
- [ ] Development workflow improved
- [ ] Cross-package dependencies work

### Git History
- [ ] 100% of commits from all repos preserved
- [ ] Full attribution maintained (author, dates)
- [ ] Commit messages intact
- [ ] Branch history visible

## Known Issues (If Any)

### Document Any Issues Found
- Issue 1: [Description and resolution]
- Issue 2: [Description and resolution]
- Issue 3: [Description and resolution]

## Rollback (If Needed)

### Rollback Validation
- [ ] Rollback script available: `migration-scripts/rollback.sh`
- [ ] Backup location known
- [ ] Rollback procedure tested (optional)
- [ ] Team aware of rollback possibility

## Sign-Off

**Migration Completed By**: ___________________
**Date**: ___________________
**Time Taken**: ___________________
**Issues Encountered**: ___________________
**Status**: ✅ Success / ⚠️ Partial / ❌ Failed

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Quick Verification Commands

Run these commands to quickly verify migration success:

```bash
# 1. Check pnpm version
pnpm --version

# 2. List workspaces
pnpm list --depth 0

# 3. Verify Git history
git log --oneline --graph --all -20

# 4. Check for nested .git
find apps/ packages/ -name ".git" -type d

# 5. Test build
pnpm run build

# 6. Test shared package resolution
cd apps/api-core
node -e "console.log(require.resolve('@cotador/shared'))"
cd ../..

# 7. Start development server
pnpm run dev:api

# 8. Run tests
pnpm run test

# 9. Check linting
pnpm run lint

# 10. Verify database connection
pnpm run db:generate
```

All commands should succeed for a successful migration.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-18
