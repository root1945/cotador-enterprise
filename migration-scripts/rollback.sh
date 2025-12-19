#!/bin/bash
# Rollback Migration Script

set -e

echo "🔙 Rollback Migration"
echo ""

# Find latest backup
BACKUP_DIR=$(ls -dt $HOME/cotador-enterprise-backup-* 2>/dev/null | head -1)

if [ -z "$BACKUP_DIR" ]; then
  echo "❌ No backup found!"
  echo ""
  echo "Backup directories should match pattern: cotador-enterprise-backup-*"
  echo "Location: $HOME/"
  exit 1
fi

echo "Found backup: $BACKUP_DIR"
echo "Backup date: $(basename $BACKUP_DIR | sed 's/cotador-enterprise-backup-//')"
echo "Backup size: $(du -sh $BACKUP_DIR | cut -f1)"
echo ""

read -p "⚠️  This will delete current state and restore from backup. Continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Rollback cancelled"
  exit 0
fi

echo ""
echo "🔄 Rolling back..."

# Remove current state
rm -rf /home/victoralencar/Code/cotador-enterprise

# Restore from backup
cp -r "$BACKUP_DIR/cotador-enterprise" /home/victoralencar/Code/

echo ""
echo "✅ Rollback complete"
echo "📁 Restored from: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  cd /home/victoralencar/Code/cotador-enterprise"
echo "  npm install  # Restore npm dependencies"
echo ""
