#!/usr/bin/env bash
set -euo pipefail

IML_SYNC_VERSION="0.1.2"
IML_LOCAL_DB="${IML_LOCAL_DB:-iml_workspace}"
IML_NEON_URL="${IML_NEON_URL:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MANIFEST="${IML_SYNC_MANIFEST:-${REPO_ROOT}/db/sync/iml-sync-manifest.tsv}"
MIGRATIONS_DIR="${IML_MIGRATIONS_DIR:-${REPO_ROOT}/db/migrations}"
BACKUP_DIR="${IML_BACKUP_DIR:-${HOME}/Documents/IML_Backups}"

usage() {
  cat <<USAGE
IML-SYNC-01 v${IML_SYNC_VERSION}

Usage:
  scripts/iml-sync.sh status
  scripts/iml-sync.sh backup
  scripts/iml-sync.sh migrate local
  scripts/iml-sync.sh migrate neon
  scripts/iml-sync.sh sync-reference --apply

Environment:
  IML_LOCAL_DB       Local PostgreSQL database (default: iml_workspace)
  IML_NEON_URL       Neon connection URL. Required for remote commands.
  IML_SYNC_MANIFEST  Override sync manifest path.
  IML_BACKUP_DIR     Override backup directory.

Safety model:
  * Only tables marked SYNC in the manifest can be copied.
  * Reference synchronization is local -> Neon only.
  * UPSERT only. No DELETE, TRUNCATE or CASCADE is issued.
  * VERIFY tables are never copied automatically.
  * LOCAL tables are intentionally local-only and are never copied.
  * The Neon endpoint must expose clinical-workspace marker tables.
  * Connection URLs are never printed.
USAGE
}

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
info() { printf '==> %s\n' "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

check_dependencies() {
  need_cmd psql
  need_cmd pg_dump
  need_cmd shasum
  need_cmd awk
  need_cmd mktemp
  need_cmd sort
}

require_manifest() {
  [[ -f "$MANIFEST" ]] || fail "Manifest not found: $MANIFEST"
}

require_remote() {
  [[ -n "$IML_NEON_URL" ]] || fail "IML_NEON_URL is not set"
  case "$IML_NEON_URL" in
    *localhost*|*127.0.0.1*|*"[::1]"*)
      fail "IML_NEON_URL appears to point to a local host; refusing remote operation"
      ;;
  esac
}

local_query() {
  psql -X -qAt -v ON_ERROR_STOP=1 -d "$IML_LOCAL_DB" -c "$1"
}

remote_query() {
  require_remote
  psql -X -qAt -v ON_ERROR_STOP=1 "$IML_NEON_URL" -c "$1"
}

preflight_local() {
  local db
  db="$(local_query "SELECT current_database();")"
  [[ "$db" == "$IML_LOCAL_DB" ]] || fail "Connected local database is '$db', expected '$IML_LOCAL_DB'"
  info "Local database verified: ${db}"
}

preflight_remote() {
  require_remote
  local line db user addr marker
  line="$(remote_query "SELECT current_database() || '|' || current_user || '|' || coalesce(inet_server_addr()::text,'unknown');")"
  IFS='|' read -r db user addr <<< "$line"
  [[ -n "$db" ]] || fail "Could not identify remote database"
  [[ "$db" != "$IML_LOCAL_DB" || "$addr" != "unknown" ]] || fail "Remote endpoint cannot be distinguished from local database"

  marker="$(remote_query "
    SELECT
      (to_regclass('iml_system.module_registry') IS NOT NULL)::int || '|' ||
      (to_regclass('iml_clinical.encounter') IS NOT NULL)::int || '|' ||
      (to_regclass('iml_identity.person') IS NOT NULL)::int || '|' ||
      (to_regclass('iml_terminology.concept') IS NOT NULL)::int;
  ")"
  [[ "$marker" == "1|1|1|1" ]] || fail "Remote endpoint does not look like the IML Clinical Workspace Neon database"

  info "Remote clinical database verified: ${db} (user ${user}, server ${addr})"
}

manifest_rows() {
  require_manifest
  awk -F '\t' '
    /^[[:space:]]*#/ {next}
    NF < 2 {next}
    $1 ~ /^(SYNC|VERIFY|LOCAL)$/ {print $1 "\t" $2}
  ' "$MANIFEST"
}

validate_manifest() {
  local policy table
  while IFS=$'\t' read -r policy table; do
    [[ "$table" =~ ^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$ ]] \
      || fail "Invalid manifest table identifier: $table"
  done < <(manifest_rows)
}

manifest_sha() {
  shasum -a 256 "$MANIFEST" | awk '{print $1}'
}

table_exists_local() {
  [[ "$(local_query "SELECT to_regclass('$1') IS NOT NULL;")" == "t" ]]
}

table_exists_remote() {
  [[ "$(remote_query "SELECT to_regclass('$1') IS NOT NULL;")" == "t" ]]
}

row_count_local() { local_query "SELECT count(*) FROM $1;"; }
row_count_remote() { remote_query "SELECT count(*) FROM $1;"; }

# Deterministic digest across hosts:
# PostgreSQL's default collation can differ between macOS and Neon/Linux.
# Sorting is therefore done outside PostgreSQL under the C locale.
stable_digest_local() {
  local table="$1"
  psql -X -qAt -v ON_ERROR_STOP=1 -d "$IML_LOCAL_DB" -c \
    "SET TIME ZONE 'UTC'; SELECT (to_jsonb(t) - ARRAY['created_at','updated_at','loaded_at'])::text FROM ${table} t;" \
    | LC_ALL=C sort | shasum -a 256 | awk '{print $1}'
}

stable_digest_remote() {
  local table="$1"
  psql -X -qAt -v ON_ERROR_STOP=1 "$IML_NEON_URL" -c \
    "SET TIME ZONE 'UTC'; SELECT (to_jsonb(t) - ARRAY['created_at','updated_at','loaded_at'])::text FROM ${table} t;" \
    | LC_ALL=C sort | shasum -a 256 | awk '{print $1}'
}

exact_digest_local() {
  local table="$1"
  psql -X -qAt -v ON_ERROR_STOP=1 -d "$IML_LOCAL_DB" -c \
    "SET TIME ZONE 'UTC'; SELECT to_jsonb(t)::text FROM ${table} t;" \
    | LC_ALL=C sort | shasum -a 256 | awk '{print $1}'
}

exact_digest_remote() {
  local table="$1"
  psql -X -qAt -v ON_ERROR_STOP=1 "$IML_NEON_URL" -c \
    "SET TIME ZONE 'UTC'; SELECT to_jsonb(t)::text FROM ${table} t;" \
    | LC_ALL=C sort | shasum -a 256 | awk '{print $1}'
}

status_cmd() {
  check_dependencies
  require_manifest
  validate_manifest
  preflight_local
  preflight_remote

  printf '\n%-7s %-58s %10s %10s %-12s\n' POLICY TABLE LOCAL NEON RESULT
  printf '%-7s %-58s %10s %10s %-12s\n' '-------' '----------------------------------------------------------' '----------' '----------' '------------'

  local policy table lc rc ld rd result
  while IFS=$'\t' read -r policy table; do
    if ! table_exists_local "$table"; then
      printf '%-7s %-58s %10s %10s %-12s\n' "$policy" "$table" '-' '-' 'LOCAL_MISSING'
      continue
    fi
    lc="$(row_count_local "$table")"

    if ! table_exists_remote "$table"; then
      printf '%-7s %-58s %10s %10s %-12s\n' "$policy" "$table" "$lc" '-' 'NEON_MISSING'
      continue
    fi
    rc="$(row_count_remote "$table")"

    case "$policy" in
      SYNC)
        ld="$(stable_digest_local "$table")"
        rd="$(stable_digest_remote "$table")"
        if [[ "$lc" == "$rc" && "$ld" == "$rd" ]]; then result='MATCH'; else result='DIFF'; fi
        ;;
      VERIFY)
        ld="$(exact_digest_local "$table")"
        rd="$(exact_digest_remote "$table")"
        if [[ "$lc" == "$rc" && "$ld" == "$rd" ]]; then result='MATCH'; else result='DIFF'; fi
        ;;
      LOCAL)
        if [[ "$rc" == "0" ]]; then result='LOCAL_ONLY'; else result='REMOTE_HAS_DATA'; fi
        ;;
    esac
    printf '%-7s %-58s %10s %10s %-12s\n' "$policy" "$table" "$lc" "$rc" "$result"
  done < <(manifest_rows)
}

verify_policy_or_fail() {
  local policy table lc rc ld rd
  while IFS=$'\t' read -r policy table; do
    [[ "$policy" == 'VERIFY' ]] || continue
    table_exists_local "$table" || fail "VERIFY source table missing: $table"
    table_exists_remote "$table" || fail "VERIFY target table missing: $table"
    lc="$(row_count_local "$table")"
    rc="$(row_count_remote "$table")"
    [[ "$lc" == "$rc" ]] || fail "VERIFY count precondition failed for $table: local=$lc Neon=$rc"
    ld="$(exact_digest_local "$table")"
    rd="$(exact_digest_remote "$table")"
    [[ "$ld" == "$rd" ]] || fail "VERIFY digest precondition failed for $table"
  done < <(manifest_rows)
}

safe_backup() {
  check_dependencies
  require_manifest
  validate_manifest
  preflight_remote

  local stamp dir schema_file refs_file
  stamp="$(date +%Y%m%d_%H%M%S)"
  dir="${BACKUP_DIR}/IML_SYNC_${stamp}"
  mkdir -p "$dir"
  schema_file="${dir}/neon_schema.dump"
  refs_file="${dir}/neon_sync_reference_data.dump"

  info "Creating Neon schema-only backup (no patient data)"
  pg_dump "$IML_NEON_URL" --format=custom --schema-only --file="$schema_file"

  local -a table_args=()
  local policy table
  while IFS=$'\t' read -r policy table; do
    [[ "$policy" == 'SYNC' ]] || continue
    table_args+=("--table=${table}")
  done < <(manifest_rows)

  info "Creating allowlisted reference-data backup only"
  pg_dump "$IML_NEON_URL" --format=custom --data-only "${table_args[@]}" --file="$refs_file"

  shasum -a 256 "$schema_file" "$refs_file" > "${dir}/SHA256SUMS.txt"
  info "Safe backup created: $dir"
}

bootstrap_migration_history() {
  local target="$1"
  local sql="CREATE SCHEMA IF NOT EXISTS iml_system;
CREATE TABLE IF NOT EXISTS iml_system.migration_history (
 migration_name text PRIMARY KEY,
 sha256 char(64) NOT NULL,
 applied_at timestamptz NOT NULL DEFAULT now(),
 applied_by text NOT NULL DEFAULT current_user,
 tool_code text NOT NULL DEFAULT 'IML-SYNC-01'
);"
  if [[ "$target" == 'local' ]]; then
    psql -X -q -v ON_ERROR_STOP=1 -d "$IML_LOCAL_DB" -c "$sql"
  else
    psql -X -q -v ON_ERROR_STOP=1 "$IML_NEON_URL" -c "$sql"
  fi
}

target_query() {
  local target="$1" sql="$2"
  if [[ "$target" == 'local' ]]; then
    local_query "$sql"
  else
    remote_query "$sql"
  fi
}

run_migration_file() {
  local target="$1" file="$2"
  if [[ "$target" == 'local' ]]; then
    psql -X -v ON_ERROR_STOP=1 -d "$IML_LOCAL_DB" -f "$file"
  else
    psql -X -v ON_ERROR_STOP=1 "$IML_NEON_URL" -f "$file"
  fi
}

record_migration() {
  local target="$1" name="$2" sha="$3"
  if [[ "$target" == 'local' ]]; then
    psql -X -q -v ON_ERROR_STOP=1 -d "$IML_LOCAL_DB" \
      -v migration_name="$name" -v sha256="$sha" <<'SQL'
INSERT INTO iml_system.migration_history(migration_name, sha256, tool_code)
VALUES (:'migration_name', :'sha256', 'IML-SYNC-01')
ON CONFLICT (migration_name) DO NOTHING;
SQL
  else
    psql -X -q -v ON_ERROR_STOP=1 "$IML_NEON_URL" \
      -v migration_name="$name" -v sha256="$sha" <<'SQL'
INSERT INTO iml_system.migration_history(migration_name, sha256, tool_code)
VALUES (:'migration_name', :'sha256', 'IML-SYNC-01')
ON CONFLICT (migration_name) DO NOTHING;
SQL
  fi
}

migrate_cmd() {
  check_dependencies
  local target="${1:-}"
  [[ "$target" == 'local' || "$target" == 'neon' ]] || fail "migrate requires target: local or neon"
  [[ -d "$MIGRATIONS_DIR" ]] || fail "Migrations directory not found: $MIGRATIONS_DIR"

  if [[ "$target" == 'local' ]]; then
    preflight_local
  else
    preflight_remote
    safe_backup
  fi

  bootstrap_migration_history "$target"

  local file name sha previous
  shopt -s nullglob
  local files=("$MIGRATIONS_DIR"/*.sql)
  (( ${#files[@]} > 0 )) || fail "No SQL migrations found in $MIGRATIONS_DIR"

  for file in "${files[@]}"; do
    name="$(basename "$file")"
    sha="$(shasum -a 256 "$file" | awk '{print $1}')"
    previous="$(target_query "$target" "SELECT sha256 FROM iml_system.migration_history WHERE migration_name = '$name';")"

    if [[ -n "$previous" ]]; then
      [[ "$previous" == "$sha" ]] || fail "Checksum drift for applied migration $name"
      info "Already applied: $name"
      continue
    fi

    info "Applying $name to $target"
    run_migration_file "$target" "$file"
    record_migration "$target" "$name" "$sha"
  done

  info "Migration pass completed for $target"
}

sync_columns_local() {
  local table="$1" schema="${table%%.*}" rel="${table#*.}"
  local_query "SELECT string_agg(format('%I',column_name), ', ' ORDER BY ordinal_position)
FROM information_schema.columns
WHERE table_schema='$schema' AND table_name='$rel' AND is_generated='NEVER';"
}

pk_columns_local() {
  local table="$1" schema="${table%%.*}" rel="${table#*.}"
  local_query "SELECT string_agg(format('%I',a.attname), ', ' ORDER BY array_position(i.indkey,a.attnum))
FROM pg_index i
JOIN pg_class c ON c.oid=i.indrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=ANY(i.indkey)
WHERE i.indisprimary AND n.nspname='$schema' AND c.relname='$rel';"
}

update_set_local() {
  local table="$1" schema="${table%%.*}" rel="${table#*.}"
  local_query "WITH pk AS (
 SELECT a.attname
 FROM pg_index i
 JOIN pg_class c ON c.oid=i.indrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=ANY(i.indkey)
 WHERE i.indisprimary AND n.nspname='$schema' AND c.relname='$rel'
)
SELECT string_agg(format('%1\$I = EXCLUDED.%1\$I', col.column_name), ', ' ORDER BY col.ordinal_position)
FROM information_schema.columns col
WHERE col.table_schema='$schema' AND col.table_name='$rel'
  AND col.is_generated='NEVER'
  AND NOT EXISTS (SELECT 1 FROM pk WHERE pk.attname=col.column_name);"
}

sync_one_table() {
  local table="$1"
  table_exists_local "$table" || fail "SYNC source table missing: $table"
  table_exists_remote "$table" || fail "SYNC target table missing: $table"

  local cols pkcols updates tmp
  cols="$(sync_columns_local "$table")"
  pkcols="$(pk_columns_local "$table")"
  updates="$(update_set_local "$table")"
  [[ -n "$cols" ]] || fail "No transferable columns for $table"
  [[ -n "$pkcols" ]] || fail "SYNC table has no primary key: $table"

  tmp="$(mktemp "/tmp/iml-sync-${table//./_}.XXXXXX.csv")"
  trap 'rm -f "$tmp"' RETURN

  psql -X -q -v ON_ERROR_STOP=1 -d "$IML_LOCAL_DB" -c \
    "\\copy (SELECT $cols FROM $table) TO '$tmp' WITH (FORMAT csv)"

  local conflict_action
  if [[ -n "$updates" ]]; then
    conflict_action="DO UPDATE SET $updates"
  else
    conflict_action="DO NOTHING"
  fi

  psql -X -v ON_ERROR_STOP=1 "$IML_NEON_URL" <<SQL
BEGIN;
CREATE TEMP TABLE _iml_sync_stage AS SELECT $cols FROM $table WITH NO DATA;
\copy _iml_sync_stage ($cols) FROM '$tmp' WITH (FORMAT csv)
INSERT INTO $table ($cols) OVERRIDING SYSTEM VALUE
SELECT $cols FROM _iml_sync_stage
ON CONFLICT ($pkcols) $conflict_action;
COMMIT;
SQL

  rm -f "$tmp"
  trap - RETURN
}

log_sync_success() {
  local mode="$1" direction="$2" manifest_hash="$3"
  if table_exists_remote 'iml_system.sync_run'; then
    psql -X -q -v ON_ERROR_STOP=1 "$IML_NEON_URL" \
      -v sync_version="$IML_SYNC_VERSION" \
      -v direction="$direction" \
      -v mode="$mode" \
      -v source_db="$IML_LOCAL_DB" \
      -v manifest_sha="$manifest_hash" <<'SQL'
INSERT INTO iml_system.sync_run(
    sync_version,
    direction,
    mode,
    source_database,
    target_database,
    manifest_sha256,
    status,
    completed_at
)
VALUES (
    :'sync_version',
    :'direction',
    :'mode',
    :'source_db',
    current_database(),
    :'manifest_sha',
    'SUCCEEDED',
    now()
);
SQL
  fi
}

sync_reference_cmd() {
  check_dependencies
  [[ "${1:-}" == '--apply' ]] || fail "sync-reference is write-capable and requires explicit --apply"
  require_manifest
  validate_manifest
  preflight_local
  preflight_remote
  info "Checking VERIFY-only terminology preconditions (counts + deterministic SHA-256)"
  verify_policy_or_fail
  safe_backup

  local policy table
  while IFS=$'\t' read -r policy table; do
    [[ "$policy" == 'SYNC' ]] || continue
    info "UPSERT local -> Neon: $table"
    sync_one_table "$table"
  done < <(manifest_rows)

  log_sync_success 'REFERENCE_UPSERT' 'LOCAL_TO_NEON' "$(manifest_sha)"
  info "Reference synchronization completed. No target-only rows were deleted."
  info "Run 'scripts/iml-sync.sh status' to verify the result."
}

main() {
  case "${1:-}" in
    status) shift; status_cmd "$@" ;;
    backup) shift; safe_backup "$@" ;;
    migrate) shift; migrate_cmd "$@" ;;
    sync-reference) shift; sync_reference_cmd "$@" ;;
    -h|--help|help|'') usage ;;
    *) usage; fail "Unknown command: $1" ;;
  esac
}

main "$@"
