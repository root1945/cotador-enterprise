#!/bin/bash
# Phase 1.2: Install pnpm

set -e

echo "📦 Installing pnpm..."

# Check if already installed
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  echo "ℹ️  pnpm already installed (version $PNPM_VERSION)"

  # Check if version is recent enough
  if [[ $(echo "$PNPM_VERSION" | cut -d. -f1) -ge 9 ]]; then
    echo "✅ pnpm version is sufficient"
    exit 0
  else
    echo "⚠️  pnpm version is too old, upgrading..."
  fi
fi

# Install pnpm globally
npm install -g pnpm@latest

# Verify installation
PNPM_VERSION=$(pnpm --version)
echo ""
echo "✅ pnpm installed successfully"
echo "📌 Version: $PNPM_VERSION"
echo ""
