#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# import_project.sh
# -----------------------------------------------------------------------------
# Usage: ./import_project.sh <dump_file> <source_project_id> <new_author_id>
#
# Imports a specific project (and all related data) from a production database
# dump into the local dev Supabase instance, remapping ownership to a local
# dev user.
# -----------------------------------------------------------------------------
set -euo pipefail

# ------------------------------------
# 1. Validate input
# ------------------------------------
if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <dump_file> <source_project_id> <new_author_id>" >&2
  exit 1
fi

DUMP_FILE="$1"
SOURCE_PROJECT_ID="$2"
NEW_AUTHOR_ID="$3"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Error: dump file not found: $DUMP_FILE" >&2
  exit 1
fi

# ------------------------------------
# [1/5] Resolve new owner's organization
# ------------------------------------
echo "[1/5] Resolving organization for author ${NEW_AUTHOR_ID}…"

NEW_ORG_ID=$(psql "$DB_URL" -tAc "SELECT id FROM organizations WHERE owner_id = '${NEW_AUTHOR_ID}' LIMIT 1")

if [[ -z "$NEW_ORG_ID" ]]; then
  echo "Error: no organization found for owner_id '${NEW_AUTHOR_ID}'" >&2
  exit 1
fi

echo "       Organization: ${NEW_ORG_ID}"

# ------------------------------------
# [2/5] Create _import schema with table structures
# ------------------------------------
echo "[2/5] Creating _import schema…"

psql "$DB_URL" -q <<'SQL'
DROP SCHEMA IF EXISTS _import CASCADE;
CREATE SCHEMA _import;
CREATE TABLE _import.organizations    (LIKE public.organizations    INCLUDING ALL);
CREATE TABLE _import.projects         (LIKE public.projects         INCLUDING ALL);
CREATE TABLE _import.topics           (LIKE public.topics           INCLUDING ALL);
CREATE TABLE _import.prompts          (LIKE public.prompts          INCLUDING ALL);
CREATE TABLE _import.competitors      (LIKE public.competitors      INCLUDING ALL);
CREATE TABLE _import.prompt_responses (LIKE public.prompt_responses INCLUDING ALL);
SQL

# ------------------------------------
# [3/5] Load dump data into _import schema
# ------------------------------------
echo "[3/5] Loading dump data into _import schema…"

TABLES="organizations|projects|topics|prompts|competitors|prompt_responses"

awk -v tables="$TABLES" '
  BEGIN { capturing = 0; pattern = "^INSERT INTO \"public\"\\.\"(" tables ")\"" }
  $0 ~ pattern { capturing = 1 }
  capturing { print }
  capturing && /;[[:space:]]*$/ { capturing = 0 }
' "$DUMP_FILE" \
  | sed 's/"public"\./"_import"./g' \
  | psql "$DB_URL" -q

# ------------------------------------
# [4/5] Import project data with remapped ownership
# ------------------------------------
echo "[4/5] Importing project data…"

psql "$DB_URL" -q <<SQL
BEGIN;

-- Clean up if the project already exists locally
SELECT delete_project_cascade('${SOURCE_PROJECT_ID}');

-- Import project
INSERT INTO public.projects
SELECT id, created_at, updated_at, url, name, aliases, icon_url,
       '${NEW_ORG_ID}'::uuid AS organization_id,
       '${NEW_AUTHOR_ID}'::uuid AS author_id,
       prompts_updated_at, hostname, is_paused, is_archived, target_location
FROM _import.projects
WHERE id = '${SOURCE_PROJECT_ID}';

-- Import topics
INSERT INTO public.topics
SELECT id, created_at, updated_at, name, project_id,
       '${NEW_AUTHOR_ID}'::uuid AS author_id,
       is_archived
FROM _import.topics
WHERE project_id = '${SOURCE_PROJECT_ID}';

-- Import prompts
INSERT INTO public.prompts
SELECT id, created_at, updated_at, name, topic_id, project_id,
       '${NEW_AUTHOR_ID}'::uuid AS author_id,
       '${NEW_ORG_ID}'::uuid AS organization_id,
       is_archived
FROM _import.prompts
WHERE project_id = '${SOURCE_PROJECT_ID}';

-- Import competitors
INSERT INTO public.competitors
SELECT id, created_at, updated_at, url, name, aliases, icon_url, project_id,
       '${NEW_AUTHOR_ID}'::uuid AS author_id,
       hostname,
       '${NEW_ORG_ID}'::uuid AS organization_id,
       is_archived
FROM _import.competitors
WHERE project_id = '${SOURCE_PROJECT_ID}';

-- Import prompt_responses (no ownership columns to remap)
INSERT INTO public.prompt_responses
SELECT *
FROM _import.prompt_responses
WHERE project_id = '${SOURCE_PROJECT_ID}';

COMMIT;
SQL

# ------------------------------------
# [5/5] Clean up _import schema
# ------------------------------------
echo "[5/5] Cleaning up…"

psql "$DB_URL" -q -c "DROP SCHEMA _import CASCADE;"

echo "Import complete — project ${SOURCE_PROJECT_ID} imported successfully."
