#!/bin/bash
# Creates timestamped backup of entire project

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="khs-crm-backup-${TIMESTAMP}"

# Create backup directory
mkdir -p ../backups

# Create the backup
echo "Creating backup: ${BACKUP_NAME}.tar.gz"
tar -czf "../backups/${BACKUP_NAME}.tar.gz" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='*.log' \
  --exclude='.env.local' \
  .

echo "Backup created at: ../backups/${BACKUP_NAME}.tar.gz"

# Also create a quick restore script
echo "#!/bin/bash
tar -xzf ../backups/${BACKUP_NAME}.tar.gz -C .
echo 'Restored from ${BACKUP_NAME}'
" > "../backups/restore-${TIMESTAMP}.sh"

chmod +x "../backups/restore-${TIMESTAMP}.sh"

# List all backups
echo ""
echo "All backups:"
ls -lh ../backups/*.tar.gz