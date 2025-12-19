#!/bin/bash
# Phase 4.1: Update Root package.json

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Updating root package.json..."

# Backup original
cp package.json package.json.npm-backup

# Create new package.json with pnpm scripts
node << 'NODEJS'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update scripts for pnpm
pkg.scripts = {
  "prepare": "husky install",

  // Development
  "dev": "pnpm --parallel --filter \"./apps/*\" run start:dev",
  "dev:api": "pnpm --filter api-core run start:dev",
  "dev:mobile": "pnpm --filter mobile run start",

  // Build
  "build": "pnpm --recursive run build",
  "build:api": "pnpm --filter api-core run build",
  "build:mobile": "pnpm --filter mobile run build",
  "build:shared": "pnpm --filter @cotador/shared run build",

  // Test
  "test": "pnpm --recursive run test",
  "test:api": "pnpm --filter api-core run test",
  "test:mobile": "pnpm --filter mobile run test",
  "test:cov": "pnpm --recursive run test:cov",
  "test:e2e": "pnpm --filter api-core run test:e2e",

  // Lint & Format
  "lint": "pnpm --recursive run lint",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",

  // Clean
  "clean": "pnpm --recursive exec rm -rf dist build node_modules && rm -rf node_modules",

  // Database (api-core specific)
  "db:migrate": "pnpm --filter api-core -- npx prisma migrate dev",
  "db:migrate:deploy": "pnpm --filter api-core -- npx prisma migrate deploy",
  "db:studio": "pnpm --filter api-core -- npx prisma studio",
  "db:generate": "pnpm --filter api-core -- npx prisma generate"
};

// Update engines
pkg.engines = {
  "node": ">=20.0.0",
  "pnpm": ">=9.0.0"
};

// Add packageManager field
pkg.packageManager = "pnpm@9.15.3";

// Remove npm from workspaces
if (pkg.workspaces) {
  delete pkg.workspaces;
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Root package.json updated');
NODEJS

echo ""
echo "Updated scripts available:"
echo "  pnpm run dev:api      - Start api-core in dev mode"
echo "  pnpm run build        - Build all packages"
echo "  pnpm run test         - Run all tests"
echo "  pnpm run lint         - Lint all packages"
echo "  pnpm run db:migrate   - Run database migrations"
echo ""
