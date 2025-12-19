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
- [ ] `apps/api-core/` directory exists
- [ ] `apps/mobile/` directory exists (if applicable)
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
- [ ] Project structure verified
- [ ] npm workspaces configuration noted
- [ ] All applications accessible

## Phase 2: Cleanup Nested Git Repositories

### Repository Cleanup
- [ ] `apps/api-core/.git` directory removed
- [ ] `apps/mobile/.git` directory removed (if existed)
- [ ] No nested `.git` directories found: `find apps/ packages/ -name ".git"`
- [ ] Main `.git` repository still exists at root
- [ ] All application files remain intact

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

### Repository Structure Validation
- [ ] Single `.git` repository at root
- [ ] No nested `.git` directories in apps/ or packages/
- [ ] All applications accessible
- [ ] Directory structure intact
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
- [ ] Check GitHub/GitLab for updated structure

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

### Repository Structure
- [ ] Single unified repository
- [ ] Clean monorepo structure
- [ ] All files accessible

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

# 3. Check for nested .git (should be empty)
find apps/ packages/ -name ".git" -type d

# 4. Test build
pnpm run build

# 5. Test shared package resolution
cd apps/api-core
node -e "console.log(require.resolve('@cotador/shared'))"
cd ../..

# 6. Start development server
pnpm run dev:api

# 7. Run tests
pnpm run test

# 8. Check linting
pnpm run lint

# 9. Verify database connection
pnpm run db:generate
```

All commands should succeed for a successful migration.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-18
