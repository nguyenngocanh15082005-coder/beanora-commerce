#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Cần DATABASE_URL của database đích}"
: "${1:?Cách dùng: CONFIRM_RESTORE=YES DATABASE_URL=... ./scripts/restore.sh backups/file.dump}"
if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo "Khôi phục sẽ ghi đè dữ liệu. Đặt CONFIRM_RESTORE=YES để xác nhận." >&2
  exit 1
fi
[[ -f "$1" ]] || { echo "Không tìm thấy file backup" >&2; exit 1; }
PG_DATABASE_URL="$(node -e 'const u=new URL(process.env.DATABASE_URL); u.searchParams.delete("schema"); process.stdout.write(u.toString())')"
pg_restore --dbname="$PG_DATABASE_URL" --clean --if-exists --no-owner --single-transaction "$1"
