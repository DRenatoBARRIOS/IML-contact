-- IML AI-EVIDENCE-01 v0.1.1
-- Retrieval and provenance foundation for bibliographic evidence.
-- Canonical integration target: IML Core Socle 0.1.9-rc2.2
-- Additive only: no existing IML table is dropped or altered.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS iml_ai;

CREATE OR REPLACE FUNCTION iml_ai.evidence_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS iml_ai.evidence_source (
  source_code text PRIMARY KEY,
  name text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN (
    'bibliographic_database',
    'systematic_review',
    'trial_registry',
    'metadata_registry',
    'guideline',
    'knowledge_base',
    'institutional'
  )),
  access_mode text NOT NULL CHECK (access_mode IN (
    'public_api',
    'public_web',
    'institutional',
    'hybrid',
    'disabled'
  )),
  homepage_url text,
  api_base_url text,
  terms_url text,
  enabled boolean NOT NULL DEFAULT false,
  stores_full_text boolean NOT NULL DEFAULT false,
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  licence_note text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE iml_ai.evidence_source IS
'Registry of evidence sources available to IML. Credentials are never stored here.';

CREATE TABLE IF NOT EXISTS iml_ai.evidence_query (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NULL
    REFERENCES iml_clinical.encounter(id)
    ON DELETE SET NULL,
  assessment_id uuid NULL
    REFERENCES iml_clinical.diagnostic_assessment(id)
    ON DELETE SET NULL,
  question_sha256 char(64) NOT NULL
    CHECK (length(question_sha256) = 64),
  question_type text NOT NULL DEFAULT 'other' CHECK (question_type IN (
    'diagnostic',
    'treatment',
    'prognosis',
    'harm',
    'screening',
    'monitoring',
    'other'
  )),
  language_code text NOT NULL DEFAULT 'fr',
  search_expression text NOT NULL,
  search_expression_sha256 char(64) NOT NULL
    CHECK (length(search_expression_sha256) = 64),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',
    'running',
    'completed',
    'partial',
    'failed',
    'cancelled'
  )),
  requested_by uuid NULL
    REFERENCES iml_identity.practitioner(id)
    ON DELETE RESTRICT,
  requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  completed_at timestamptz NULL
);

COMMENT ON TABLE iml_ai.evidence_query IS
'Bibliographic query metadata. search_expression must be de-identified; raw patient-identifying clinical questions must not be copied here.';

CREATE TABLE IF NOT EXISTS iml_ai.evidence_source_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL
    REFERENCES iml_ai.evidence_query(id)
    ON DELETE CASCADE,
  source_code text NOT NULL
    REFERENCES iml_ai.evidence_source(source_code)
    ON DELETE RESTRICT,
  run_status text NOT NULL DEFAULT 'queued' CHECK (run_status IN (
    'queued',
    'running',
    'success',
    'no_results',
    'partial',
    'unavailable',
    'rate_limited',
    'failed',
    'cancelled'
  )),
  request_fingerprint char(64) NULL
    CHECK (request_fingerprint IS NULL OR length(request_fingerprint) = 64),
  response_fingerprint char(64) NULL
    CHECK (response_fingerprint IS NULL OR length(response_fingerprint) = 64),
  result_count integer NULL
    CHECK (result_count IS NULL OR result_count >= 0),
  error_code text NULL,
  error_summary text NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE iml_ai.evidence_source_run IS
'One auditable execution of one external evidence source for one query, including zero-result and failure states.';

CREATE TABLE IF NOT EXISTS iml_ai.evidence_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key text NOT NULL UNIQUE,
  title text NOT NULL,
  record_type text NOT NULL DEFAULT 'other' CHECK (record_type IN (
    'systematic_review',
    'meta_analysis',
    'randomized_trial',
    'controlled_trial',
    'observational_study',
    'case_report',
    'guideline',
    'trial_registration',
    'protocol',
    'review',
    'editorial',
    'other'
  )),
  source_title text NULL,
  publication_date date NULL,
  publication_year integer NULL,
  abstract_available boolean NOT NULL DEFAULT false,
  open_access boolean NULL,
  retracted boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE iml_ai.evidence_record IS
'Canonical bibliographic/scientific metadata. Publisher full text is not stored by default.';

CREATE TABLE IF NOT EXISTS iml_ai.evidence_identifier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL
    REFERENCES iml_ai.evidence_record(id)
    ON DELETE CASCADE,
  source_code text NOT NULL
    REFERENCES iml_ai.evidence_source(source_code)
    ON DELETE RESTRICT,
  identifier_type text NOT NULL CHECK (identifier_type IN (
    'PMID',
    'PMCID',
    'DOI',
    'NCT',
    'COCHRANE',
    'OTHER'
  )),
  identifier_value text NOT NULL,
  source_url text NULL,
  retrieved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  raw_metadata_sha256 char(64) NULL
    CHECK (raw_metadata_sha256 IS NULL OR length(raw_metadata_sha256) = 64),
  UNIQUE (source_code, identifier_type, identifier_value)
);

CREATE TABLE IF NOT EXISTS iml_ai.evidence_query_result (
  query_id uuid NOT NULL
    REFERENCES iml_ai.evidence_query(id)
    ON DELETE CASCADE,
  source_run_id uuid NOT NULL
    REFERENCES iml_ai.evidence_source_run(id)
    ON DELETE CASCADE,
  record_id uuid NOT NULL
    REFERENCES iml_ai.evidence_record(id)
    ON DELETE CASCADE,
  source_rank integer NULL
    CHECK (source_rank IS NULL OR source_rank > 0),
  relevance_score numeric(6,5) NULL
    CHECK (relevance_score IS NULL OR relevance_score BETWEEN 0 AND 1),
  retrieval_status text NOT NULL DEFAULT 'retrieved' CHECK (retrieval_status IN (
    'retrieved',
    'included',
    'excluded',
    'duplicate',
    'unavailable'
  )),
  exclusion_reason text NULL,
  retrieved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (query_id, source_run_id, record_id)
);

COMMENT ON TABLE iml_ai.evidence_query_result IS
'Traceable relation between an evidence query, a particular source execution, and a retrieved canonical record.';

CREATE TABLE IF NOT EXISTS iml_ai.evidence_access_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_code text NOT NULL,
  institution_name text NULL,
  source_code text NOT NULL
    REFERENCES iml_ai.evidence_source(source_code)
    ON DELETE RESTRICT,
  access_mode text NOT NULL CHECK (access_mode IN (
    'public',
    'institutional',
    'link_resolver',
    'disabled'
  )),
  enabled boolean NOT NULL DEFAULT false,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (profile_code, source_code)
);

COMMENT ON TABLE iml_ai.evidence_access_profile IS
'Deployment-level access capability only. Passwords, session cookies, API secrets and institutional credentials must never be stored here.';

CREATE INDEX IF NOT EXISTS idx_evidence_query_encounter
  ON iml_ai.evidence_query(encounter_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_query_assessment
  ON iml_ai.evidence_query(assessment_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_source_run_query
  ON iml_ai.evidence_source_run(query_id, source_code, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_record_year
  ON iml_ai.evidence_record(publication_year DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_record_type
  ON iml_ai.evidence_record(record_type);

CREATE INDEX IF NOT EXISTS idx_evidence_identifier_record
  ON iml_ai.evidence_identifier(record_id);

CREATE INDEX IF NOT EXISTS idx_evidence_identifier_lookup
  ON iml_ai.evidence_identifier(identifier_type, identifier_value);

CREATE INDEX IF NOT EXISTS idx_evidence_result_query_rank
  ON iml_ai.evidence_query_result(query_id, source_rank);

DROP TRIGGER IF EXISTS trg_evidence_source_touch ON iml_ai.evidence_source;
CREATE TRIGGER trg_evidence_source_touch
BEFORE UPDATE ON iml_ai.evidence_source
FOR EACH ROW EXECUTE FUNCTION iml_ai.evidence_touch_updated_at();

DROP TRIGGER IF EXISTS trg_evidence_record_touch ON iml_ai.evidence_record;
CREATE TRIGGER trg_evidence_record_touch
BEFORE UPDATE ON iml_ai.evidence_record
FOR EACH ROW EXECUTE FUNCTION iml_ai.evidence_touch_updated_at();

DROP TRIGGER IF EXISTS trg_evidence_access_profile_touch ON iml_ai.evidence_access_profile;
CREATE TRIGGER trg_evidence_access_profile_touch
BEFORE UPDATE ON iml_ai.evidence_access_profile
FOR EACH ROW EXECUTE FUNCTION iml_ai.evidence_touch_updated_at();

INSERT INTO iml_ai.evidence_source (
  source_code, name, source_kind, access_mode,
  homepage_url, api_base_url, enabled, stores_full_text,
  capabilities, licence_note
)
VALUES
(
  'PUBMED','PubMed / NCBI','bibliographic_database','public_api',
  'https://pubmed.ncbi.nlm.nih.gov/',
  'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
  false,false,
  '{"identifiers":["PMID","PMCID","DOI"],"search":true,"metadata":true}'::jsonb,
  'Metadata/provenance use subject to NCBI policies.'
),
(
  'EUROPE_PMC','Europe PMC','bibliographic_database','public_api',
  'https://europepmc.org/',
  'https://www.ebi.ac.uk/europepmc/webservices/rest/',
  false,false,
  '{"identifiers":["PMID","PMCID","DOI"],"search":true,"metadata":true,"open_access_links":true}'::jsonb,
  'Use subject to Europe PMC terms and licences of individual records.'
),
(
  'CLINICALTRIALS_GOV','ClinicalTrials.gov','trial_registry','public_api',
  'https://clinicaltrials.gov/',
  'https://clinicaltrials.gov/api/v2/',
  false,false,
  '{"identifiers":["NCT"],"search":true,"metadata":true,"registration":true,"results_status":true}'::jsonb,
  'Registry metadata only in AI-EVIDENCE-01.'
),
(
  'CROSSREF','Crossref','metadata_registry','public_api',
  'https://www.crossref.org/',
  'https://api.crossref.org/',
  false,false,
  '{"identifiers":["DOI"],"search":true,"metadata":true,"funding_metadata":true,"update_metadata":true}'::jsonb,
  'Use subject to Crossref REST API etiquette and record licences.'
),
(
  'COCHRANE_PUBLIC','Cochrane Library - public metadata','systematic_review','public_web',
  'https://www.cochranelibrary.com/',
  NULL,
  false,false,
  '{"identifiers":["COCHRANE","DOI"],"search":true,"metadata":true,"institutional_access_possible":true}'::jsonb,
  'Public metadata/link-out only. Full text must respect subscription and institutional rights.'
)
ON CONFLICT (source_code) DO UPDATE SET
  name = EXCLUDED.name,
  source_kind = EXCLUDED.source_kind,
  access_mode = EXCLUDED.access_mode,
  homepage_url = EXCLUDED.homepage_url,
  api_base_url = EXCLUDED.api_base_url,
  stores_full_text = EXCLUDED.stores_full_text,
  capabilities = EXCLUDED.capabilities,
  licence_note = EXCLUDED.licence_note;

INSERT INTO iml_system.module_registry(code,name,category,status,version,description)
VALUES (
  'AI_EVIDENCE_RETRIEVAL',
  'Clinical evidence retrieval',
  'TRANSVERSAL',
  'SCAFFOLD',
  'AI-EVIDENCE-01/0.1.1',
  'Traceable retrieval foundation for PubMed, Europe PMC, ClinicalTrials.gov, Crossref and Cochrane public metadata; connectors disabled until application-side validation.'
)
ON CONFLICT(code) DO UPDATE SET
  name=EXCLUDED.name,
  category=EXCLUDED.category,
  status=EXCLUDED.status,
  version=EXCLUDED.version,
  description=EXCLUDED.description,
  updated_at=now();

COMMIT;
