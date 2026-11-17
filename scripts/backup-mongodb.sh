#!/usr/bin/env sh
set -eu
: "${MONGODB_URI:?Set MONGODB_URI}"
: "${MONGODB_DB:?Set MONGODB_DB}"
OUT_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"
mongodump --uri="$MONGODB_URI" --db="$MONGODB_DB" --archive="$OUT_DIR/${MONGODB_DB}-${STAMP}.archive.gz" --gzip
printf 'Backup created: %s/%s-%s.archive.gz\n' "$OUT_DIR" "$MONGODB_DB" "$STAMP"
