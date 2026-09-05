-- IML Clinical Workspace
-- Migration 191: Terminology canonicalization
-- Version: 0.1.0
-- Date: 2026-09-05
--
-- Purpose
-- -------
-- Make iml_terminology the unique active terminology schema while preserving
-- historical schemas as legacy archives by renaming them.
--
-- Conservative guarantees:
--   * no DROP SCHEMA
--   * no DELETE / TRUNCATE
--   * aborts if the old terminology schema contains data
--   * aborts if the old KSH97-P staging content differs materially from the
--     canonical staging content (loaded_at timestamps are ignored)
--
-- Expected result
-- ---------------
--   iml_terminology
--   iml_terminology_staging
--   terminology_legacy_20260905
--   terminology_staging_legacy_20260905
--
-- Safe to run on databases where the renames have already been performed.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:191_terminology_canonicalization'));

-- 1. Canonical schemas must exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'iml_terminology') THEN
        RAISE EXCEPTION 'Migration 191 aborted: canonical schema iml_terminology does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'iml_terminology_staging') THEN
        RAISE EXCEPTION 'Migration 191 aborted: canonical schema iml_terminology_staging does not exist';
    END IF;
END
$$;

-- 2. Retire the old terminology schema only if all of its base tables are empty.
DO $$
DECLARE
    r record;
    row_count bigint;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'terminology') THEN
        IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'terminology_legacy_20260905') THEN
            RAISE EXCEPTION 'Migration 191 aborted: both terminology and terminology_legacy_20260905 exist';
        END IF;

        FOR r IN
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'terminology'
            ORDER BY tablename
        LOOP
            EXECUTE format('SELECT count(*) FROM %I.%I', 'terminology', r.tablename)
            INTO row_count;

            IF row_count <> 0 THEN
                RAISE EXCEPTION 'Migration 191 aborted: terminology.% contains % rows', r.tablename, row_count;
            END IF;
        END LOOP;

        EXECUTE 'ALTER SCHEMA terminology RENAME TO terminology_legacy_20260905';
    END IF;
END
$$;

-- 3. Retire the old KSH97-P staging schema only if its business content matches
--    the canonical staging content. loaded_at is intentionally ignored.
DO $$
DECLARE
    raw_diff bigint := 0;
    map_diff bigint := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'terminology_staging') THEN
        IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'terminology_staging_legacy_20260905') THEN
            RAISE EXCEPTION 'Migration 191 aborted: both terminology_staging and terminology_staging_legacy_20260905 exist';
        END IF;

        IF to_regclass('terminology_staging.ksh97p_raw') IS NOT NULL THEN
            IF to_regclass('iml_terminology_staging.ksh97p_raw') IS NULL THEN
                RAISE EXCEPTION 'Migration 191 aborted: canonical iml_terminology_staging.ksh97p_raw is missing';
            END IF;

            SELECT count(*) INTO raw_diff
            FROM (
                (
                    SELECT release_key, chapter_code, code, label_sv, label_en,
                           source_mapping_text, source_row_number
                    FROM terminology_staging.ksh97p_raw
                    EXCEPT
                    SELECT release_key, chapter_code, code, label_sv, label_en,
                           source_mapping_text, source_row_number
                    FROM iml_terminology_staging.ksh97p_raw
                )
                UNION ALL
                (
                    SELECT release_key, chapter_code, code, label_sv, label_en,
                           source_mapping_text, source_row_number
                    FROM iml_terminology_staging.ksh97p_raw
                    EXCEPT
                    SELECT release_key, chapter_code, code, label_sv, label_en,
                           source_mapping_text, source_row_number
                    FROM terminology_staging.ksh97p_raw
                )
            ) d;

            IF raw_diff <> 0 THEN
                RAISE EXCEPTION 'Migration 191 aborted: KSH97-P staging business content differs (% differing rows)', raw_diff;
            END IF;
        END IF;

        IF to_regclass('terminology_staging.ksh97p_mapping_raw') IS NOT NULL THEN
            IF to_regclass('iml_terminology_staging.ksh97p_mapping_raw') IS NULL THEN
                RAISE EXCEPTION 'Migration 191 aborted: canonical iml_terminology_staging.ksh97p_mapping_raw is missing';
            END IF;

            SELECT count(*) INTO map_diff
            FROM (
                (
                    SELECT release_key, ksh97p_code, mapping_order, mapping_expression
                    FROM terminology_staging.ksh97p_mapping_raw
                    EXCEPT
                    SELECT release_key, ksh97p_code, mapping_order, mapping_expression
                    FROM iml_terminology_staging.ksh97p_mapping_raw
                )
                UNION ALL
                (
                    SELECT release_key, ksh97p_code, mapping_order, mapping_expression
                    FROM iml_terminology_staging.ksh97p_mapping_raw
                    EXCEPT
                    SELECT release_key, ksh97p_code, mapping_order, mapping_expression
                    FROM terminology_staging.ksh97p_mapping_raw
                )
            ) d;

            IF map_diff <> 0 THEN
                RAISE EXCEPTION 'Migration 191 aborted: KSH97-P mapping staging content differs (% differing rows)', map_diff;
            END IF;
        END IF;

        EXECUTE 'ALTER SCHEMA terminology_staging RENAME TO terminology_staging_legacy_20260905';
    END IF;
END
$$;

-- 4. Post-migration assertions.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_namespace
        WHERE nspname IN ('terminology', 'terminology_staging')
    ) THEN
        RAISE EXCEPTION 'Migration 191 failed post-check: old terminology schema name still exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'iml_terminology')
       OR NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'iml_terminology_staging') THEN
        RAISE EXCEPTION 'Migration 191 failed post-check: canonical terminology schemas are missing';
    END IF;
END
$$;

COMMIT;

-- Optional verification query:
-- SELECT schema_name
-- FROM information_schema.schemata
-- WHERE schema_name LIKE '%terminology%'
-- ORDER BY schema_name;
