#!/bin/bash
# Phase 4.4: Update shared package.json

set -e

cd /home/victoralencar/Code/cotador-enterprise/packages/shared

echo "📝 Updating shared package.json..."

# Backup if exists
if [ -f "package.json" ]; then
  cp package.json package.json.backup
fi

# Update package.json
node << 'NODEJS'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Ensure correct package name
pkg.name = '@cotador/shared';

// Add clean script
pkg.scripts = pkg.scripts || {};
pkg.scripts.clean = pkg.scripts.clean || 'rm -rf dist node_modules';

// Update engines for pnpm
pkg.engines = pkg.engines || {};
pkg.engines.pnpm = '>=9.0.0';
delete pkg.engines.npm;

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ shared package.json updated');
NODEJS

cd ../..
echo ""
