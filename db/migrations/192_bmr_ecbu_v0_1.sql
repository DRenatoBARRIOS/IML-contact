-- IML BMR / ECBU demonstrator
-- Canonical migration v0.1.1
-- Date: 2026-09-25
-- Target: IML Clinical Workspace (PostgreSQL / Neon-compatible)
--
-- Revision after inspection of the real local schema.
--
-- Existing canonical paths preserved:
--   lab_observation -> lab_report
--   microbiology_context -> lab_report
--   antimicrobial_susceptibility -> lab_report
--
-- Additions:
--   lab_report -> lab_specimen
--   lab_report -> microbiology_isolate
--   antimicrobial_susceptibility -> microbiology_isolate
--   microbiology_interpretation -> lab_report/context/isolate
--
-- Important:
-- * lab_report.lab_order_id is nullable in the current schema, therefore
--   lab_specimen.lab_order_id is also nullable.
-- * lab_observation is NOT given a specimen_id: its existing lab_report_id
--   remains the canonical path and avoids two competing specimen links.
-- * microbiology_context.clinical_interpretation is preserved unchanged as
--   legacy/source narrative. Structured interpretation is stored separately.
-- * Existing specimen/organism text in antimicrobial_susceptibility is preserved.
-- * No patient data are inserted by this migration.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:BMR_ECBU:v0.1.1'));

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Preconditions
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  obj text;
  expected_objects text[] := ARRAY[
    'iml_clinical.encounter',
    'iml_identity.practitioner',
    'iml_laboratory.lab_order',
    'iml_laboratory.lab_observation',
    'iml_laboratory.lab_report',
    'iml_laboratory.microbiology_context',
    'iml_laboratory.antimicrobial_susceptibility'
  ];
  nsp text;
  rel text;
  id_type text;
BEGIN
  FOREACH obj IN ARRAY expected_objects LOOP
    IF to_regclass(obj) IS NULL THEN
      RAISE EXCEPTION 'BMR_ECBU_v0.1.1 aborted: required object % is missing', obj;
    END IF;

    nsp := split_part(obj, '.', 1);
    rel := split_part(obj, '.', 2);

    SELECT data_type
      INTO id_type
      FROM information_schema.columns
     WHERE table_schema = nsp
       AND table_name = rel
       AND column_name = 'id';

    IF id_type IS NULL THEN
      RAISE EXCEPTION 'BMR_ECBU_v0.1.1 aborted: %.id is missing', obj;
    END IF;

    IF id_type <> 'uuid' THEN
      RAISE EXCEPTION 'BMR_ECBU_v0.1.1 aborted: %.id must be uuid, found %',
        obj, id_type;
    END IF;
  END LOOP;

  -- Existing canonical relations used by this migration.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'iml_laboratory'
      AND table_name = 'lab_observation'
      AND column_name = 'lab_report_id'
      AND data_type = 'uuid'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 aborted: expected lab_observation.lab_report_id uuid NOT NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'iml_laboratory'
      AND table_name = 'microbiology_context'
      AND column_name = 'lab_report_id'
      AND data_type = 'uuid'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 aborted: expected microbiology_context.lab_report_id uuid NOT NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'iml_laboratory'
      AND table_name = 'antimicrobial_susceptibility'
      AND column_name = 'lab_report_id'
      AND data_type = 'uuid'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 aborted: expected antimicrobial_susceptibility.lab_report_id uuid NOT NULL';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Physical specimen
-- ---------------------------------------------------------------------------
-- A laboratory report may exist without a local order, so lab_order_id is
-- intentionally nullable. The report will point to the specimen once known.

CREATE TABLE IF NOT EXISTS iml_laboratory.lab_specimen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  lab_order_id uuid NULL
    REFERENCES iml_laboratory.lab_order(id)
    ON DELETE RESTRICT,

  encounter_id uuid NULL
    REFERENCES iml_clinical.encounter(id)
    ON DELETE RESTRICT,

  specimen_type text NOT NULL DEFAULT 'urine',

  collected_at timestamptz NULL,
  received_at timestamptz NULL,

  collection_method text NULL CHECK (
    collection_method IS NULL OR collection_method IN (
      'midstream',
      'catheter',
      'new_catheter',
      'suprapubic',
      'urine_bag',
      'other',
      'unknown'
    )
  ),

  collection_site text NULL,
  catheter_status text NULL,
  specimen_quality text NULL,

  source_system text NULL,
  source_message_id text NULL,

  data_status text NOT NULL DEFAULT 'reported' CHECK (
    data_status IN (
      'observed',
      'reported',
      'derived',
      'clinician_asserted',
      'algorithm_suggested'
    )
  ),

  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),

  CHECK (
    received_at IS NULL
    OR collected_at IS NULL
    OR received_at >= collected_at
  )
);

COMMENT ON TABLE iml_laboratory.lab_specimen IS
'Physical specimen normalized separately from order/report. In BMR/ECBU v0.1.1 the main specimen is urine. A missing local order does not prevent representation of an externally received laboratory report.';

CREATE INDEX IF NOT EXISTS idx_lab_specimen_order
  ON iml_laboratory.lab_specimen(lab_order_id, collected_at DESC)
  WHERE lab_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lab_specimen_encounter
  ON iml_laboratory.lab_specimen(encounter_id, collected_at DESC)
  WHERE encounter_id IS NOT NULL;

-- One canonical specimen link from report.
ALTER TABLE iml_laboratory.lab_report
  ADD COLUMN IF NOT EXISTS specimen_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_lab_report_specimen'
      AND conrelid = 'iml_laboratory.lab_report'::regclass
  ) THEN
    ALTER TABLE iml_laboratory.lab_report
      ADD CONSTRAINT fk_lab_report_specimen
      FOREIGN KEY (specimen_id)
      REFERENCES iml_laboratory.lab_specimen(id)
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_lab_report_specimen
  ON iml_laboratory.lab_report(specimen_id)
  WHERE specimen_id IS NOT NULL;

-- Deliberately no lab_observation.specimen_id:
-- lab_observation -> lab_report -> lab_specimen is the canonical route.

-- ---------------------------------------------------------------------------
-- 3. Microbiology isolate
-- ---------------------------------------------------------------------------
-- Isolate is anchored to the report. Specimen is reached through lab_report,
-- preventing two independent specimen relationships from diverging.

CREATE TABLE IF NOT EXISTS iml_laboratory.microbiology_isolate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  lab_report_id uuid NOT NULL
    REFERENCES iml_laboratory.lab_report(id)
    ON DELETE RESTRICT,

  isolate_rank smallint NULL
    CHECK (isolate_rank IS NULL OR isolate_rank > 0),

  organism_name text NOT NULL,
  organism_code text NULL,
  taxonomy_system text NULL,

  identification_method text NULL,
  identification_confidence text NULL,

  organism_count numeric NULL
    CHECK (organism_count IS NULL OR organism_count >= 0),
  organism_count_unit text NULL,
  colony_count_text text NULL,

  polymicrobial boolean NULL,

  -- Derived resistance classification only.
  bmr_flag boolean NULL,
  bmr_definition text NULL,
  bmr_definition_version text NULL,
  phenotype text NULL,
  resistance_mechanism text NULL,
  mechanism_confirmed boolean NULL,
  mechanism_method text NULL,

  source_system text NULL,
  source_identifier text NULL,

  data_status text NOT NULL DEFAULT 'reported' CHECK (
    data_status IN (
      'observed',
      'reported',
      'derived',
      'clinician_asserted',
      'algorithm_suggested'
    )
  ),

  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE iml_laboratory.microbiology_isolate IS
'Normalized microbiology isolate. Organism presence, colony count and BMR phenotype remain laboratory facts and do not by themselves establish clinical infection.';

COMMENT ON COLUMN iml_laboratory.microbiology_isolate.bmr_flag IS
'Derived BMR classification. The retained definition/version must explain how the flag was obtained; raw susceptibility rows remain authoritative observations.';

CREATE INDEX IF NOT EXISTS idx_microbiology_isolate_report
  ON iml_laboratory.microbiology_isolate(lab_report_id, isolate_rank);

CREATE INDEX IF NOT EXISTS idx_microbiology_isolate_organism
  ON iml_laboratory.microbiology_isolate(organism_name);

CREATE INDEX IF NOT EXISTS idx_microbiology_isolate_bmr
  ON iml_laboratory.microbiology_isolate(bmr_flag)
  WHERE bmr_flag IS TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_microbiology_isolate_report_rank
  ON iml_laboratory.microbiology_isolate(lab_report_id, isolate_rank)
  WHERE isolate_rank IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Susceptibility -> isolate
-- ---------------------------------------------------------------------------
-- Existing columns specimen, organism, antibiotic, mic_or_diameter, unit,
-- interpretation, interpretation_standard and standard_version are preserved.

ALTER TABLE iml_laboratory.antimicrobial_susceptibility
  ADD COLUMN IF NOT EXISTS isolate_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_antimicrobial_susceptibility_isolate'
      AND conrelid = 'iml_laboratory.antimicrobial_susceptibility'::regclass
  ) THEN
    ALTER TABLE iml_laboratory.antimicrobial_susceptibility
      ADD CONSTRAINT fk_antimicrobial_susceptibility_isolate
      FOREIGN KEY (isolate_id)
      REFERENCES iml_laboratory.microbiology_isolate(id)
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_antimicrobial_susceptibility_isolate
  ON iml_laboratory.antimicrobial_susceptibility(isolate_id)
  WHERE isolate_id IS NOT NULL;

-- Guard against linking a susceptibility row to an isolate from another report.
CREATE OR REPLACE FUNCTION iml_laboratory.bmr_ecbu_check_susceptibility_isolate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  isolate_report_id uuid;
BEGIN
  IF NEW.isolate_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lab_report_id
    INTO isolate_report_id
    FROM iml_laboratory.microbiology_isolate
   WHERE id = NEW.isolate_id;

  IF isolate_report_id IS NULL THEN
    RAISE EXCEPTION
      'BMR_ECBU: isolate % does not exist', NEW.isolate_id;
  END IF;

  IF isolate_report_id <> NEW.lab_report_id THEN
    RAISE EXCEPTION
      'BMR_ECBU: susceptibility report % does not match isolate report %',
      NEW.lab_report_id, isolate_report_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bmr_ecbu_susceptibility_isolate
  ON iml_laboratory.antimicrobial_susceptibility;

CREATE TRIGGER trg_bmr_ecbu_susceptibility_isolate
BEFORE INSERT OR UPDATE OF lab_report_id, isolate_id
ON iml_laboratory.antimicrobial_susceptibility
FOR EACH ROW
EXECUTE FUNCTION iml_laboratory.bmr_ecbu_check_susceptibility_isolate();

-- ---------------------------------------------------------------------------
-- 5. Structured clinical interpretation
-- ---------------------------------------------------------------------------
-- microbiology_context.clinical_interpretation already exists and is preserved
-- unchanged. It remains usable as source/legacy narrative.
--
-- This table provides the structured, versionable clinical object required by
-- the demonstrator.

CREATE TABLE IF NOT EXISTS iml_clinical.microbiology_interpretation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  lab_report_id uuid NOT NULL
    REFERENCES iml_laboratory.lab_report(id)
    ON DELETE RESTRICT,

  microbiology_context_id uuid NULL
    REFERENCES iml_laboratory.microbiology_context(id)
    ON DELETE RESTRICT,

  encounter_id uuid NULL
    REFERENCES iml_clinical.encounter(id)
    ON DELETE RESTRICT,

  isolate_id uuid NULL
    REFERENCES iml_laboratory.microbiology_isolate(id)
    ON DELETE RESTRICT,

  classification text NOT NULL CHECK (
    classification IN (
      'symptomatic_uti',
      'asymptomatic_bacteriuria',
      'colonisation',
      'contamination',
      'uncertain',
      'insufficient_information'
    )
  ),

  confidence text NULL CHECK (
    confidence IS NULL OR confidence IN (
      'low',
      'moderate',
      'high',
      'not_stated'
    )
  ),

  supporting_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  contradicting_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,

  assertion_kind text NOT NULL DEFAULT 'clinician_asserted' CHECK (
    assertion_kind IN (
      'clinician_asserted',
      'algorithm_suggested'
    )
  ),

  asserted_by uuid NULL
    REFERENCES iml_identity.practitioner(id)
    ON DELETE RESTRICT,

  asserted_at timestamptz NOT NULL DEFAULT clock_timestamp(),

  status text NOT NULL DEFAULT 'active' CHECK (
    status IN (
      'active',
      'superseded',
      'entered_in_error'
    )
  ),

  interpretation_version integer NOT NULL DEFAULT 1
    CHECK (interpretation_version > 0),

  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),

  CHECK (jsonb_typeof(supporting_evidence) = 'array'),
  CHECK (jsonb_typeof(contradicting_evidence) = 'array')
);

COMMENT ON TABLE iml_clinical.microbiology_interpretation IS
'Structured clinical interpretation of microbiology findings. Laboratory facts, microbiology context and clinical interpretation remain separate. Presence of an organism or BMR phenotype never implies infection by itself.';

CREATE INDEX IF NOT EXISTS idx_microbiology_interpretation_report
  ON iml_clinical.microbiology_interpretation(lab_report_id, asserted_at DESC);

CREATE INDEX IF NOT EXISTS idx_microbiology_interpretation_context
  ON iml_clinical.microbiology_interpretation(microbiology_context_id)
  WHERE microbiology_context_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_microbiology_interpretation_encounter
  ON iml_clinical.microbiology_interpretation(encounter_id, asserted_at DESC)
  WHERE encounter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_microbiology_interpretation_isolate
  ON iml_clinical.microbiology_interpretation(isolate_id, asserted_at DESC)
  WHERE isolate_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_microbiology_interpretation_classification
  ON iml_clinical.microbiology_interpretation(classification, asserted_at DESC);

-- Guard against context/isolate links from a different report.
CREATE OR REPLACE FUNCTION iml_clinical.bmr_ecbu_check_interpretation_links()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  context_report_id uuid;
  isolate_report_id uuid;
BEGIN
  IF NEW.microbiology_context_id IS NOT NULL THEN
    SELECT lab_report_id
      INTO context_report_id
      FROM iml_laboratory.microbiology_context
     WHERE id = NEW.microbiology_context_id;

    IF context_report_id IS NULL THEN
      RAISE EXCEPTION
        'BMR_ECBU: microbiology context % does not exist',
        NEW.microbiology_context_id;
    END IF;

    IF context_report_id <> NEW.lab_report_id THEN
      RAISE EXCEPTION
        'BMR_ECBU: interpretation report % does not match context report %',
        NEW.lab_report_id, context_report_id;
    END IF;
  END IF;

  IF NEW.isolate_id IS NOT NULL THEN
    SELECT lab_report_id
      INTO isolate_report_id
      FROM iml_laboratory.microbiology_isolate
     WHERE id = NEW.isolate_id;

    IF isolate_report_id IS NULL THEN
      RAISE EXCEPTION
        'BMR_ECBU: isolate % does not exist',
        NEW.isolate_id;
    END IF;

    IF isolate_report_id <> NEW.lab_report_id THEN
      RAISE EXCEPTION
        'BMR_ECBU: interpretation report % does not match isolate report %',
        NEW.lab_report_id, isolate_report_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bmr_ecbu_interpretation_links
  ON iml_clinical.microbiology_interpretation;

CREATE TRIGGER trg_bmr_ecbu_interpretation_links
BEFORE INSERT OR UPDATE OF
  lab_report_id, microbiology_context_id, isolate_id
ON iml_clinical.microbiology_interpretation
FOR EACH ROW
EXECUTE FUNCTION iml_clinical.bmr_ecbu_check_interpretation_links();

-- ---------------------------------------------------------------------------
-- 6. Post-migration assertions
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('iml_laboratory.lab_specimen') IS NULL THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 failed post-check: lab_specimen missing';
  END IF;

  IF to_regclass('iml_laboratory.microbiology_isolate') IS NULL THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 failed post-check: microbiology_isolate missing';
  END IF;

  IF to_regclass('iml_clinical.microbiology_interpretation') IS NULL THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 failed post-check: microbiology_interpretation missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'iml_laboratory'
      AND table_name = 'lab_report'
      AND column_name = 'specimen_id'
      AND data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 failed post-check: lab_report.specimen_id missing or not uuid';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'iml_laboratory'
      AND table_name = 'antimicrobial_susceptibility'
      AND column_name = 'isolate_id'
      AND data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 failed post-check: antimicrobial_susceptibility.isolate_id missing or not uuid';
  END IF;

  -- Intentionally verify that no duplicate specimen_id was added to observation.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'iml_laboratory'
      AND table_name = 'lab_observation'
      AND column_name = 'specimen_id'
  ) THEN
    RAISE EXCEPTION
      'BMR_ECBU_v0.1.1 post-check: lab_observation.specimen_id unexpectedly exists; canonical route must remain lab_observation -> lab_report -> lab_specimen';
  END IF;
END
$$;

COMMIT;
