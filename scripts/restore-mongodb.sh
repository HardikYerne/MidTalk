#!/usr/bin/env sh
set -eu
: "${MONGODB_URI:?Set MONGODB_URI}"
: "${MONGODB_DB:?Set MONGODB_DB}"
: "${BACKUP_FILE:?Set BACKUP_FILE to a verified archive}"
[ -f "$BACKUP_FILE" ] || { echo "Backup file not found: $BACKUP_FILE" >&2; exit 1; }
printf 'WARNING: this replaces collections in database %s.\n' "$MONGODB_DB"
[ "${CONFIRM_RESTORE:-}" = "yes" ] || { echo 'Set CONFIRM_RESTORE=yes to proceed.' >&2; exit 1; }
mongorestore --uri="$MONGODB_URI" --nsInclude="${MONGODB_DB}.*" --archive="$BACKUP_FILE" --gzip --drop
