-- IML Open Clinical Workspace
-- AI-EVIDENCE-02
-- Migration 193: evidence access and rights resolution
-- Version: 0.2.0
-- Date: 2026-09-06
--
-- Stores locators, rights decisions and provenance only.
-- Does not store publisher full text, institutional credentials,
-- cookies, SAML assertions or authentication secrets.
--
-- Human access and machine-processing rights are separate decisions.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS iml_ai;

DO $$
BEGIN
    IF to_regclass('iml_ai.evidence_source') IS NULL
       OR to_regclass('iml_ai.evidence_record') IS NULL
       OR to_regclass('iml_ai.evidence_identifier') IS NULL
       OR to_regclass('iml_ai.evidence_source_run') IS NULL
       OR to_regclass('iml_ai.evidence_access_profile') IS NULL THEN
        RAISE EXCEPTION 'AI-EVIDENCE-01 foundation is required before migration 193';
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS iml_ai.evidence_access_resolution (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id uuid NOT NULL
        REFERENCES iml_ai.evidence_record(id) ON DELETE CASCADE,
    access_profile_id uuid
        REFERENCES iml_ai.evidence_access_profile(id) ON DELETE SET NULL,
    identifier_id uuid
        REFERENCES iml_ai.evidence_identifier(id) ON DELETE SET NULL,
    source_run_id uuid
        REFERENCES iml_ai.evidence_source_run(id) ON DELETE SET NULL,
    resolver_source_code text NOT NULL
        REFERENCES iml_ai.evidence_source(source_code) ON DELETE RESTRICT,

    access_status text NOT NULL,

    full_text_available boolean NOT NULL DEFAULT false,
    full_text_human_read_permitted boolean NOT NULL DEFAULT false,
    full_text_machine_retrieval_permitted boolean NOT NULL DEFAULT false,
    full_text_machine_processing_permitted boolean NOT NULL DEFAULT false,
    full_text_persistent_storage_permitted boolean NOT NULL DEFAULT false,

    licence_code text,
    licence_uri text,
    full_text_format text,

    landing_url text,
    full_text_url text,
    institutional_url text,

    decision_basis text NOT NULL,
    decision_mode text NOT NULL DEFAULT 'automated',
    policy_version text NOT NULL DEFAULT 'AI-EVIDENCE-02/0.2.0',

    raw_metadata_sha256 character(64),
    rights_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    checked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    expires_at timestamptz,

    CONSTRAINT evidence_access_resolution_access_status_check
        CHECK (access_status IN (
            'metadata_only',
            'abstract_available',
            'free_to_read',
            'reuse_permitted',
            'institutional_access',
            'user_provided',
            'unavailable',
            'unknown'
        )),

    CONSTRAINT evidence_access_resolution_decision_mode_check
        CHECK (decision_mode IN (
            'automated',
            'manual_review',
            'institutional_resolver',
            'user_provided'
        )),

    CONSTRAINT evidence_access_resolution_full_text_format_check
        CHECK (
            full_text_format IS NULL
            OR full_text_format IN ('xml', 'html', 'pdf', 'text', 'other')
        ),

    CONSTRAINT evidence_access_resolution_raw_metadata_sha256_check
        CHECK (
            raw_metadata_sha256 IS NULL
            OR length(raw_metadata_sha256) = 64
        ),

    CONSTRAINT evidence_access_resolution_expiry_check
        CHECK (
            expires_at IS NULL
            OR expires_at >= checked_at
        ),

    CONSTRAINT evidence_access_resolution_machine_retrieval_requires_text_check
        CHECK (
            NOT full_text_machine_retrieval_permitted
            OR full_text_available
        )
);

COMMENT ON TABLE iml_ai.evidence_access_resolution IS
'Rights-aware access-resolution history for evidence records. Separates human reading, machine retrieval, machine processing and persistent-storage permissions.';

CREATE INDEX IF NOT EXISTS idx_evidence_access_resolution_record_checked
    ON iml_ai.evidence_access_resolution(record_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_access_resolution_profile_checked
    ON iml_ai.evidence_access_resolution(access_profile_id, checked_at DESC)
    WHERE access_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_access_resolution_source_checked
    ON iml_ai.evidence_access_resolution(resolver_source_code, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_access_resolution_machine_process
    ON iml_ai.evidence_access_resolution(record_id, checked_at DESC)
    WHERE full_text_machine_processing_permitted = true;

CREATE OR REPLACE VIEW iml_ai.evidence_access_resolution_current AS
SELECT DISTINCT ON (
    r.record_id,
    r.resolver_source_code,
    r.access_profile_id
)
    r.*
FROM iml_ai.evidence_access_resolution r
ORDER BY
    r.record_id,
    r.resolver_source_code,
    r.access_profile_id,
    r.checked_at DESC,
    r.id DESC;

INSERT INTO iml_ai.evidence_source (
    source_code, name, source_kind, access_mode,
    homepage_url, api_base_url, terms_url,
    enabled, stores_full_text, capabilities, licence_note
)
VALUES (
    'PMC_OPEN_ACCESS',
    'PubMed Central Open Access',
    'knowledge_base',
    'public_api',
    'https://pmc.ncbi.nlm.nih.gov/',
    NULL,
    NULL,
    false,
    false,
    jsonb_build_object(
        'full_text_resolution', true,
        'pmcid', true,
        'license_required_for_machine_processing', true,
        'stores_credentials', false
    ),
    'Machine processing requires explicit article-level reuse rights; presence in PMC alone is not sufficient.'
)
ON CONFLICT (source_code) DO UPDATE SET
    name = EXCLUDED.name,
    source_kind = EXCLUDED.source_kind,
    access_mode = EXCLUDED.access_mode,
    homepage_url = EXCLUDED.homepage_url,
    capabilities = iml_ai.evidence_source.capabilities || EXCLUDED.capabilities,
    licence_note = EXCLUDED.licence_note,
    updated_at = clock_timestamp();

INSERT INTO iml_ai.evidence_source (
    source_code, name, source_kind, access_mode,
    homepage_url, api_base_url, terms_url,
    enabled, stores_full_text, capabilities, licence_note
)
VALUES (
    'INSTITUTIONAL_RESOLVER',
    'Institutional access resolver',
    'institutional',
    'institutional',
    NULL,
    NULL,
    NULL,
    false,
    false,
    jsonb_build_object(
        'openurl', true,
        'saml', true,
        'shibboleth', true,
        'openathens', true,
        'proxy', true,
        'browser_redirect_only', true,
        'credential_storage', false,
        'session_cookie_storage', false,
        'saml_assertion_storage', false
    ),
    'Institutional authentication remains between the user, institution and provider. IML stores no institutional password, session cookie or SAML assertion.'
)
ON CONFLICT (source_code) DO UPDATE SET
    name = EXCLUDED.name,
    source_kind = EXCLUDED.source_kind,
    access_mode = EXCLUDED.access_mode,
    capabilities = iml_ai.evidence_source.capabilities || EXCLUDED.capabilities,
    licence_note = EXCLUDED.licence_note,
    updated_at = clock_timestamp();

UPDATE iml_ai.evidence_source
SET capabilities = capabilities || jsonb_build_object(
        'discovery', true,
        'identifier_backbone', jsonb_build_array('PMID', 'PMCID', 'DOI'),
        'full_text_source', false
    ),
    updated_at = clock_timestamp()
WHERE source_code = 'PUBMED';

UPDATE iml_ai.evidence_source
SET capabilities = capabilities || jsonb_build_object(
        'open_access_resolution', true,
        'article_level_rights_required', true
    ),
    updated_at = clock_timestamp()
WHERE source_code = 'EUROPE_PMC';

UPDATE iml_ai.evidence_source
SET capabilities = capabilities || jsonb_build_object(
        'doi_metadata', true,
        'licence_metadata', true,
        'licence_metadata_not_authoritative_alone', true
    ),
    updated_at = clock_timestamp()
WHERE source_code = 'CROSSREF';

INSERT INTO iml_ai.evidence_access_profile (
    profile_code, institution_name, source_code,
    access_mode, enabled, configuration
)
VALUES (
    'INSTITUTIONAL_GENERIC',
    NULL,
    'INSTITUTIONAL_RESOLVER',
    'link_resolver',
    false,
    jsonb_build_object(
        'browser_redirect_only', true,
        'credential_storage', 'forbidden',
        'session_cookie_storage', 'forbidden',
        'saml_assertion_storage', 'forbidden',
        'resolver_url', NULL,
        'institution_specific_configuration_required', true
    )
)
ON CONFLICT (profile_code, source_code) DO UPDATE SET
    access_mode = EXCLUDED.access_mode,
    enabled = false,
    configuration = EXCLUDED.configuration,
    updated_at = clock_timestamp();

INSERT INTO iml_system.module_registry (
    code, name, category, status, version, description
)
VALUES (
    'AI_EVIDENCE_RETRIEVAL',
    'Clinical evidence retrieval',
    'TRANSVERSAL',
    'SCAFFOLD',
    'AI-EVIDENCE-02/0.2.0',
    'Rights-aware PubMed/PMC/Europe PMC/DOI discovery and access resolution. Human institutional access is separated from automated full-text retrieval and AI-processing rights.'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    version = EXCLUDED.version,
    description = EXCLUDED.description,
    updated_at = clock_timestamp();

COMMIT;
