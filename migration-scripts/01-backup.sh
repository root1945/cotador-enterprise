#!/bin/bash
# Phase 1.1: Create Backup

set -e

echo "🔒 Creating backup of current state..."

BACKUP_DIR="$HOME/cotador-enterprise-backup-$(date +%Y%m%d-%H%M%S)"
CURRENT_DIR="/home/victoralencar/Code/cotador-enterprise"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup entire project
echo "📁 Copying project files..."
cp -r "$CURRENT_DIR" "$BACKUP_DIR/"

echo ""
echo "✅ Backup created at: $BACKUP_DIR"
echo "💾 Backup size: $(du -sh $BACKUP_DIR | cut -f1)"
echo ""
echo "📋 To restore if needed:"
echo "   rm -rf $CURRENT_DIR"
echo "   cp -r $BACKUP_DIR/cotador-enterprise $CURRENT_DIR"
echo ""
