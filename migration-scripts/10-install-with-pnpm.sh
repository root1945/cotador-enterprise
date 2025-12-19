#!/bin/bash
# Phase 3.4: Install with pnpm

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📦 Installing dependencies with pnpm..."

# Install all dependencies
pnpm install

echo ""
echo "✅ Dependencies installed with pnpm"
echo ""
echo "📊 Workspace summary:"
pnpm list --depth 0
echo ""
