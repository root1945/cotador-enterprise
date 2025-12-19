# Migration Scripts - npm to pnpm Monorepo

This directory contains automated scripts to migrate Cotador Enterprise from npm workspaces to pnpm workspaces while preserving 100% of Git history.

## Quick Start

```bash
# Run complete automated migration
bash 00-migrate-to-pnpm-monorepo.sh
```

## Script Overview

| Script | Phase | Purpose | Duration | Risk |
|--------|-------|---------|----------|------|
| `00-migrate-to-pnpm-monorepo.sh` | Master | Orchestrates entire migration | 30-60min | Medium |
| `01-backup.sh` | 1.1 | Creates timestamped backup | 1-2min | Low |
| `02-install-pnpm.sh` | 1.2 | Installs pnpm globally | 1min | Low |
| `03-verify-current-state.sh` | 1.3 | Verifies initial state | 1min | Low |
| `04-merge-api-core-history.sh` | 2.1 | Merges api-core Git history | 5-10min | **High** |
| `05-merge-mobile-history.sh` | 2.2 | Merges mobile Git history | 5-10min | **High** |
| `06-verify-merged-history.sh` | 2.3 | Validates merged history | 1min | Low |
| `07-create-pnpm-workspace.sh` | 3.1 | Creates pnpm-workspace.yaml | <1min | Low |
| `08-create-npmrc.sh` | 3.2 | Creates .npmrc config | <1min | Low |
| `09-clean-npm-artifacts.sh` | 3.3 | Removes npm artifacts | 1-2min | Low |
| `10-install-with-pnpm.sh` | 3.4 | Installs with pnpm | 2-5min | Low |
| `11-update-root-package-json.sh` | 4.1 | Updates root package.json | <1min | Low |
| `12-update-root-tsconfig.sh` | 4.2 | Updates root tsconfig.json | <1min | Low |
| `13-update-api-core-package.sh` | 4.3 | Updates api-core config | <1min | Low |
| `14-update-shared-package.sh` | 4.4 | Updates shared config | <1min | Low |
| `15-update-gitignore.sh` | 4.5 | Updates .gitignore | <1min | Low |
| `16-validate-installation.sh` | 5.1 | Validates pnpm setup | 1min | Low |
| `17-validate-git-history.sh` | 5.2 | Validates Git history | 1min | Low |
| `18-validate-build.sh` | 5.3 | Validates builds | 2-5min | Low |
| `19-validate-tests.sh` | 5.4 | Validates tests | 1-5min | Low |
| `20-validate-lint.sh` | 5.5 | Validates linting | 1min | Low |
| `rollback.sh` | Recovery | Restores from backup | 2-5min | Low |

## Usage

### Automated Migration (Recommended)

```bash
cd /home/victoralencar/Code/cotador-enterprise
bash migration-scripts/00-migrate-to-pnpm-monorepo.sh
```

The master script will:
1. Prompt for confirmation before critical phases
2. Run all phases in sequence
3. Stop on any errors
4. Provide detailed output at each step

### Manual Migration (Advanced)

Run scripts individually for more control:

```bash
# Phase 1: Preparation
bash migration-scripts/01-backup.sh
bash migration-scripts/02-install-pnpm.sh
bash migration-scripts/03-verify-current-state.sh

# Phase 2: Git History (CRITICAL)
bash migration-scripts/04-merge-api-core-history.sh
bash migration-scripts/05-merge-mobile-history.sh
bash migration-scripts/06-verify-merged-history.sh

# Phase 3: pnpm Setup
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
cd ..
pnpm install
cd migration-scripts

# Phase 5: Validation
bash migration-scripts/16-validate-installation.sh
bash migration-scripts/17-validate-git-history.sh
bash migration-scripts/18-validate-build.sh
bash migration-scripts/19-validate-tests.sh
bash migration-scripts/20-validate-lint.sh
```

## Critical Phase: Git History Preservation

**Scripts 04-06 modify Git history permanently.**

### What Happens

1. **Script 04** (api-core):
   - Adds `apps/api-core/.git` as remote
   - Fetches its history
   - Reorganizes files into `apps/api-core/` path
   - Merges history into main repo
   - Removes nested `.git`

2. **Script 05** (mobile):
   - Same process for mobile repository
   - Skips if no commits exist

3. **Script 06** (verification):
   - Confirms all histories merged
   - Verifies no nested repos
   - Shows sample commits

### Before Running

- **BACKUP**: Script 01 creates automatic backup
- **COMMIT**: All changes should be committed
- **UNDERSTAND**: Read MONOREPO_MIGRATION_PLAN.md
- **TIME**: Allow 15-20 minutes for Git operations

### What Cannot Be Undone

Once Git histories are merged:
- Original separate repositories lost
- History rewrite affects all commits
- Force push would be required to remote

**Solution**: Use `rollback.sh` to restore from backup.

## Rollback

If anything goes wrong:

```bash
bash migration-scripts/rollback.sh
```

This will:
1. Find latest backup
2. Confirm with user
3. Delete current state
4. Restore from backup

## Script Dependencies

### Required Tools

- bash
- git
- node (for JSON manipulation)
- npm (for pnpm installation)

### Script Interdependencies

```
00-master.sh
├── 01-backup.sh (no dependencies)
├── 02-install-pnpm.sh (requires npm)
├── 03-verify-current-state.sh (requires git)
├── 04-merge-api-core-history.sh (requires git, 03)
├── 05-merge-mobile-history.sh (requires git, 03, 04)
├── 06-verify-merged-history.sh (requires 04, 05)
├── 07-create-pnpm-workspace.sh (no dependencies)
├── 08-create-npmrc.sh (no dependencies)
├── 09-clean-npm-artifacts.sh (no dependencies)
├── 10-install-with-pnpm.sh (requires pnpm, 07-09)
├── 11-update-root-package-json.sh (requires node)
├── 12-update-root-tsconfig.sh (no dependencies)
├── 13-update-api-core-package.sh (requires node)
├── 14-update-shared-package.sh (requires node)
├── 15-update-gitignore.sh (no dependencies)
├── 16-validate-installation.sh (requires pnpm, 10)
├── 17-validate-git-history.sh (requires git, 06)
├── 18-validate-build.sh (requires pnpm, 10)
├── 19-validate-tests.sh (requires pnpm, 10)
└── 20-validate-lint.sh (requires pnpm, 10)
```

## Error Handling

All scripts use `set -e` to exit on error. If any script fails:

1. **Read error message**: Usually indicates missing dependency or invalid state
2. **Check previous step**: Verify previous script completed successfully
3. **Rollback if needed**: Use `rollback.sh` to restore
4. **Retry**: Fix issue and rerun from failed script

### Common Errors

**"pnpm: command not found"**
```bash
npm install -g pnpm
```

**"remote already exists"**
```bash
cd /home/victoralencar/Code/cotador-enterprise
git remote remove api-core-repo
git remote remove mobile-repo
```

**"No such file or directory"**
- Verify you're running from correct directory
- Check that expected files/directories exist

**"Merge conflict"**
```bash
# Accept incoming changes
git checkout --theirs .
git add .
git merge --continue
```

## Testing Scripts (Development)

To test scripts without modifying actual repo:

```bash
# Create test environment
cp -r /home/victoralencar/Code/cotador-enterprise /tmp/cotador-test
cd /tmp/cotador-test

# Run scripts
bash migration-scripts/00-migrate-to-pnpm-monorepo.sh

# Verify
git log --graph --oneline -20
pnpm list --depth 0
```

## Maintenance

### Updating Scripts

1. Edit script in `migration-scripts/`
2. Ensure `set -e` present
3. Add echo statements for user feedback
4. Test in isolated environment
5. Update this README if behavior changes

### Version Control

These scripts are version controlled with the project:
- Tracked in Git
- Changes committed with project
- Available to all team members

## Support

- **Full Plan**: `../MONOREPO_MIGRATION_PLAN.md`
- **Quick Start**: `../MIGRATION_QUICK_START.md`
- **Validation**: `../MIGRATION_VALIDATION_CHECKLIST.md`
- **Development**: `../DEVELOPMENT_GUIDELINES.md`

## Safety Features

1. **Automatic Backup**: Script 01 creates timestamped backup
2. **Confirmation Prompts**: Master script asks before critical phases
3. **Error Exit**: Scripts stop on first error
4. **Rollback Available**: Can restore from backup
5. **Validation**: Phase 5 verifies successful migration

## Output

Scripts produce verbose output including:
- Current operation
- Progress indicators
- Success/failure status
- Verification results
- Next steps

Example output:
```
🔒 Creating backup of current state...
📁 Copying project files...
✅ Backup created at: /home/victoralencar/cotador-enterprise-backup-20251218-143025
💾 Backup size: 250M
```

## Post-Migration

After successful migration:

1. **Verify**: Check validation checklist
2. **Test**: Run development workflow
3. **Commit**: Commit migration changes
4. **Push**: Push to remote repository
5. **Notify**: Inform team of completion

## Notes

- Scripts are idempotent where possible
- Some scripts create `.backup` files
- Backups kept for safety (manual cleanup)
- Git history modifications are permanent
- pnpm lock file is generated automatically

---

**Created**: 2025-12-18
**Version**: 1.0
**Maintained By**: Platform Team
