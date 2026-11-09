#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Cần DATABASE_URL}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/beanora-$(date -u +%Y%m%dT%H%M%SZ).dump"
PG_DATABASE_URL="$(node -e 'const u=new URL(process.env.DATABASE_URL); u.searchParams.delete("schema"); process.stdout.write(u.toString())')"
pg_dump "$PG_DATABASE_URL" --format=custom --no-owner --file="$file"
sha256sum "$file" > "$file.sha256"
printf 'Backup created: %s\n' "$file"
