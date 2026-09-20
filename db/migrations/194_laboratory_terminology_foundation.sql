-- IML Clinical Workspace
-- Migration 194: Laboratory terminology foundation (LOINC + UCUM)
-- Version: 0.1.0
-- Date: 2026-09-20
--
-- Palier 1 only:
--   * register LOINC and UCUM as terminology systems;
--   * register the currently selected releases;
--   * link lab observations to canonical LOINC concepts when available;
--   * make UCUM normalization explicit;
--   * do NOT import LOINC content yet;
--   * do NOT rewrite existing laboratory rows.
--
-- External reference versions selected:
--   LOINC 2.83, released 2026-08-19
--   UCUM 2.2, specification dated 2024-06-17
--
-- This migration is intentionally conservative and idempotent.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:194_laboratory_terminology_foundation'));

-- 1. Register LOINC.
INSERT INTO iml_terminology.system (
    system_code,
    name,
    canonical_uri,
    scope,
    source_authority,
    default_language_code,
    status,
    properties
)
SELECT
    'LOINC',
    'Logical Observation Identifiers Names and Codes',
    'http://loinc.org',
    'laboratory',
    'Regenstrief Institute, Inc. / LOINC Committee',
    'en',
    'active',
    jsonb_build_object(
        'license_url', 'https://loinc.org/license',
        'download_url', 'https://loinc.org/downloads',
        'content_imported_by_migration_194', false,
        'domains', jsonb_build_array('laboratory','clinical_observation','documents')
    )
WHERE NOT EXISTS (
    SELECT 1 FROM iml_terminology.system WHERE system_code='LOINC'
);

-- 2. Register UCUM.
INSERT INTO iml_terminology.system (
    system_code,
    name,
    canonical_uri,
    scope,
    source_authority,
    default_language_code,
    status,
    properties
)
SELECT
    'UCUM',
    'Unified Code for Units of Measure',
    'http://unitsofmeasure.org',
    'laboratory',
    'Regenstrief Institute, Inc. / UCUM Organization',
    NULL,
    'active',
    jsonb_build_object(
        'specification_url', 'https://unitsofmeasure.org/ucum',
        'content_imported_by_migration_194', false,
        'note', 'UCUM expressions are grammar-based and are not exhaustively enumerated as terminology concepts.'
    )
WHERE NOT EXISTS (
    SELECT 1 FROM iml_terminology.system WHERE system_code='UCUM'
);

-- 3. Register the selected LOINC release metadata. No terminology content is
--    imported here because the official download requires acceptance of the
--    LOINC license and authenticated retrieval.
INSERT INTO iml_terminology.release (
    system_id,
    release_key,
    version_label,
    publication_date,
    valid_from,
    release_status,
    source_authority,
    notes,
    properties
)
SELECT
    s.id,
    'LOINC_2.83',
    'LOINC 2.83',
    DATE '2026-08-19',
    DATE '2026-08-19',
    'active',
    'Regenstrief Institute, Inc. / LOINC Committee',
    'Terminology content intentionally not imported by migration 194.',
    jsonb_build_object(
        'license_url', 'https://loinc.org/license',
        'download_url', 'https://loinc.org/downloads'
    )
FROM iml_terminology.system s
WHERE s.system_code='LOINC'
  AND NOT EXISTS (
      SELECT 1 FROM iml_terminology.release r WHERE r.release_key='LOINC_2.83'
  );

-- 4. Register UCUM specification version metadata.
INSERT INTO iml_terminology.release (
    system_id,
    release_key,
    version_label,
    publication_date,
    valid_from,
    release_status,
    source_authority,
    notes,
    properties
)
SELECT
    s.id,
    'UCUM_2.2',
    'UCUM 2.2',
    DATE '2024-06-17',
    DATE '2024-06-17',
    'active',
    'Regenstrief Institute, Inc. / UCUM Organization',
    'UCUM is expression/grammar based; migration 194 does not attempt exhaustive concept enumeration.',
    jsonb_build_object(
        'specification_url', 'https://unitsofmeasure.org/ucum'
    )
FROM iml_terminology.system s
WHERE s.system_code='UCUM'
  AND NOT EXISTS (
      SELECT 1 FROM iml_terminology.release r WHERE r.release_key='UCUM_2.2'
  );

-- 5. Add canonical terminology linkage to laboratory observations.
ALTER TABLE iml_laboratory.lab_observation
    ADD COLUMN IF NOT EXISTS loinc_concept_id bigint NULL
        REFERENCES iml_terminology.concept(id) ON DELETE RESTRICT;

ALTER TABLE iml_laboratory.lab_observation
    ADD COLUMN IF NOT EXISTS normalized_unit_system text NULL;

-- The normalized unit is explicitly UCUM when a normalization system is set.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname='lab_observation_normalized_unit_system_check'
          AND conrelid='iml_laboratory.lab_observation'::regclass
    ) THEN
        ALTER TABLE iml_laboratory.lab_observation
            ADD CONSTRAINT lab_observation_normalized_unit_system_check
            CHECK (normalized_unit_system IS NULL OR normalized_unit_system='UCUM');
    END IF;
END
$$;

-- A linked LOINC concept must have a human/interoperability code alongside it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname='lab_observation_loinc_link_requires_code'
          AND conrelid='iml_laboratory.lab_observation'::regclass
    ) THEN
        ALTER TABLE iml_laboratory.lab_observation
            ADD CONSTRAINT lab_observation_loinc_link_requires_code
            CHECK (loinc_concept_id IS NULL OR nullif(btrim(loinc_code),'') IS NOT NULL);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_lab_observation_loinc_code
    ON iml_laboratory.lab_observation(loinc_code)
    WHERE loinc_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lab_observation_loinc_concept
    ON iml_laboratory.lab_observation(loinc_concept_id)
    WHERE loinc_concept_id IS NOT NULL;

COMMENT ON COLUMN iml_laboratory.lab_observation.loinc_code IS
'LOINC code as exchanged/displayed. May exist before canonical LOINC content is locally imported.';

COMMENT ON COLUMN iml_laboratory.lab_observation.loinc_concept_id IS
'Optional canonical link to iml_terminology.concept for an imported LOINC release. Keep loinc_code for exchange/provenance.';

COMMENT ON COLUMN iml_laboratory.lab_observation.original_unit IS
'Unit exactly as received from the source laboratory/report. Never rewrite for normalization.';

COMMENT ON COLUMN iml_laboratory.lab_observation.normalized_unit IS
'Normalized machine-readable unit expression. When normalized_unit_system=UCUM, this value is a UCUM expression.';

COMMENT ON COLUMN iml_laboratory.lab_observation.normalized_unit_system IS
'Normalization code system. Migration 194 permits UCUM only. NULL means not normalized.';

-- 6. Verification assertions.
DO $$
DECLARE
    loinc_count integer;
    ucum_count integer;
BEGIN
    SELECT count(*) INTO loinc_count
    FROM iml_terminology.system
    WHERE system_code='LOINC' AND status='active';

    SELECT count(*) INTO ucum_count
    FROM iml_terminology.system
    WHERE system_code='UCUM' AND status='active';

    IF loinc_count <> 1 THEN
        RAISE EXCEPTION 'Migration 194 failed: expected exactly one active LOINC system, found %', loinc_count;
    END IF;

    IF ucum_count <> 1 THEN
        RAISE EXCEPTION 'Migration 194 failed: expected exactly one active UCUM system, found %', ucum_count;
    END IF;
END
$$;

COMMIT;

-- Suggested verification:
-- SELECT system_code, name, canonical_uri, scope, status
-- FROM iml_terminology.system
-- WHERE system_code IN ('LOINC','UCUM')
-- ORDER BY system_code;
--
-- SELECT release_key, version_label, publication_date, release_status
-- FROM iml_terminology.release
-- WHERE release_key IN ('LOINC_2.83','UCUM_2.2')
-- ORDER BY release_key;
