#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# backup_dump.sh
# -----------------------------------------------------------------------------
# Usage: ./backup_dump.sh <supabasePassword> <backupPassword>
#
# Dumps the Supabase database data-only export using the provided Supabase
# password and creates a compressed, password-protected archive.
# -----------------------------------------------------------------------------
set -euo pipefail

# ------------------------------------
# 1. Validate input
# ------------------------------------
if [[ $# -ne 4 ]]; then
  echo "Usage: $0 <supabaseProjectId> <supabaseRegion> <supabasePassword> <backupPassword>" >&2
  exit 1
fi

SUPABASE_PROJECT_ID="$1"
SUPABASE_REGION="$2" # e.g., aws-1-us-west-1.pooler
SUPABASE_PASSWORD="$3"
BACKUP_PASSWORD="$4"

# ------------------------------------
# 2. Constants
# ------------------------------------
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="dump_${TIMESTAMP}.sql"
ARCHIVE_FILE="dump_${TIMESTAMP}.tar.gz"
ENCRYPTED_FILE="dump_${TIMESTAMP}.tar.gz.enc"
DB_URL="postgresql://postgres.${SUPABASE_PROJECT_ID}:${SUPABASE_PASSWORD}@${SUPABASE_REGION}.pooler.supabase.com:6543/postgres"

# ------------------------------------
# 3. Perform the database dump (data-only)
# ------------------------------------

echo "[1/3] Dumping database…" && \
  supabase db dump --db-url "$DB_URL" -f "$DUMP_FILE" --data-only

echo "[2/3] Creating compressed tarball…" && \
  tar -czf "$ARCHIVE_FILE" "$DUMP_FILE"

echo "[3/3] Encrypting archive…" && \
  openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -k "$BACKUP_PASSWORD" -in "$ARCHIVE_FILE" -out "$ENCRYPTED_FILE"

# Clean up plaintext artefacts
rm -f "$DUMP_FILE" "$ARCHIVE_FILE"

echo "Backup complete → ${ENCRYPTED_FILE}"
