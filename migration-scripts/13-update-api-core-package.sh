#!/bin/bash
# Phase 4.3: Update api-core package.json

set -e

cd /home/victoralencar/Code/cotador-enterprise/apps/api-core

echo "📝 Updating api-core package.json..."

# Backup original
cp package.json package.json.backup

# Update package.json
node << 'NODEJS'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update workspace dependencies
if (pkg.dependencies && pkg.dependencies['@cotador/shared']) {
  pkg.dependencies['@cotador/shared'] = 'workspace:*';
}

// Add clean script
pkg.scripts = pkg.scripts || {};
pkg.scripts.clean = 'rm -rf dist node_modules';

// Update engines for pnpm
if (pkg.engines) {
  delete pkg.engines.npm;
  pkg.engines.pnpm = '>=9.0.0';
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ api-core package.json updated');
NODEJS

cd ../..
echo ""
