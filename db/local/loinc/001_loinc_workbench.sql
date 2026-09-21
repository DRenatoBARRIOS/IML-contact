-- IML LOINC local workbench
-- Local-only: this file is intentionally NOT part of db/migrations.
-- It must never be applied automatically to Neon.
--
-- Purpose:
--   * keep the complete LOINC release locally;
--   * materialize derived EXTENDED / SEARCH / ORDERS sets locally;
--   * keep LAB_CORE and clinical GP/ED sets empty until curated;
--   * promote only validated concepts later to canonical IML tables.

CREATE SCHEMA IF NOT EXISTS iml_loinc_workbench;

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.source_release (
    id bigserial PRIMARY KEY,
    version_label text NOT NULL UNIQUE,
    source_zip_name text NOT NULL,
    source_zip_sha256 char(64) NOT NULL,
    imported_at timestamptz NOT NULL DEFAULT now(),
    is_current boolean NOT NULL DEFAULT false,
    main_row_count integer,
    french_row_count integer,
    universal_order_row_count integer,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_iml_loinc_current_release
    ON iml_loinc_workbench.source_release(is_current)
    WHERE is_current;

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.loinc_source (
    release_id bigint NOT NULL
        REFERENCES iml_loinc_workbench.source_release(id) ON DELETE CASCADE,
    loinc_num text NOT NULL,
    component text,
    property text,
    time_aspect text,
    system_axis text,
    scale_typ text,
    method_typ text,
    class_code text,
    classtype smallint,
    status text,
    order_obs text,
    long_common_name text,
    shortname text,
    common_test_rank integer,
    common_order_rank integer,
    example_ucum_units text,
    raw_payload jsonb NOT NULL,
    PRIMARY KEY (release_id, loinc_num)
);

CREATE INDEX IF NOT EXISTS idx_iml_loinc_source_status
    ON iml_loinc_workbench.loinc_source(release_id, status, classtype, order_obs);
CREATE INDEX IF NOT EXISTS idx_iml_loinc_source_test_rank
    ON iml_loinc_workbench.loinc_source(release_id, common_test_rank);
CREATE INDEX IF NOT EXISTS idx_iml_loinc_source_order_rank
    ON iml_loinc_workbench.loinc_source(release_id, common_order_rank);
CREATE INDEX IF NOT EXISTS idx_iml_loinc_source_class_system
    ON iml_loinc_workbench.loinc_source(release_id, class_code, system_axis);

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.fr_variant_raw (
    release_id bigint NOT NULL,
    loinc_num text NOT NULL,
    raw_payload jsonb NOT NULL,
    PRIMARY KEY (release_id, loinc_num),
    FOREIGN KEY (release_id, loinc_num)
        REFERENCES iml_loinc_workbench.loinc_source(release_id, loinc_num)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.universal_order_raw (
    release_id bigint NOT NULL,
    loinc_num text NOT NULL,
    raw_payload jsonb NOT NULL,
    PRIMARY KEY (release_id, loinc_num),
    FOREIGN KEY (release_id, loinc_num)
        REFERENCES iml_loinc_workbench.loinc_source(release_id, loinc_num)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.reference_set (
    release_id bigint NOT NULL
        REFERENCES iml_loinc_workbench.source_release(id) ON DELETE CASCADE,
    set_code varchar(64) NOT NULL,
    name_fr text NOT NULL,
    set_kind varchar(32) NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'draft',
    rule_description text,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (release_id, set_code),
    CONSTRAINT ck_iml_loinc_set_kind
        CHECK (set_kind IN ('source','terminology_layer','clinical_layer','workflow_trace')),
    CONSTRAINT ck_iml_loinc_set_status
        CHECK (status IN ('draft','active','superseded','retired'))
);

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.reference_set_member (
    release_id bigint NOT NULL,
    set_code varchar(64) NOT NULL,
    loinc_num text NOT NULL,
    clinical_group text,
    clinical_tier varchar(32),
    priority integer,
    sequence_order integer,
    selection_reason text,
    trigger_type text,
    trigger_detail text,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (release_id, set_code, loinc_num),
    FOREIGN KEY (release_id, set_code)
        REFERENCES iml_loinc_workbench.reference_set(release_id, set_code)
        ON DELETE CASCADE,
    FOREIGN KEY (release_id, loinc_num)
        REFERENCES iml_loinc_workbench.loinc_source(release_id, loinc_num)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_iml_loinc_set_member_code
    ON iml_loinc_workbench.reference_set_member(release_id, loinc_num);

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.gp_catalog_item (
    catalog_code varchar(96) PRIMARY KEY,
    group_code varchar(64) NOT NULL,
    tier varchar(32) NOT NULL,
    label_fr text NOT NULL,
    clinical_intent text,
    preferred_systems text[] NOT NULL DEFAULT '{}',
    search_terms text[] NOT NULL DEFAULT '{}',
    known_loinc_hint text,
    mapping_status varchar(24) NOT NULL DEFAULT 'UNMAPPED',
    selected_loinc_num text,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_gp_catalog_tier
      CHECK (tier IN ('GP_FIRST_LINE','GP_SECOND_LINE','GP_SPECIALIZED','GP_ACUTE_POCT')),
    CONSTRAINT ck_gp_catalog_mapping_status
      CHECK (mapping_status IN ('UNMAPPED','CANDIDATE','VALIDATED','AMBIGUOUS','ABSENT'))
);

CREATE TABLE IF NOT EXISTS iml_loinc_workbench.gp_catalog_candidate (
    catalog_code varchar(96) NOT NULL
      REFERENCES iml_loinc_workbench.gp_catalog_item(catalog_code) ON DELETE CASCADE,
    release_id bigint NOT NULL
      REFERENCES iml_loinc_workbench.source_release(id) ON DELETE CASCADE,
    loinc_num text NOT NULL,
    score integer NOT NULL,
    rank_order integer NOT NULL,
    candidate_label text,
    system_axis text,
    class_code text,
    method_typ text,
    common_test_rank integer,
    PRIMARY KEY (catalog_code, release_id, loinc_num),
    FOREIGN KEY (release_id, loinc_num)
      REFERENCES iml_loinc_workbench.loinc_source(release_id, loinc_num)
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gp_catalog_candidate_rank
  ON iml_loinc_workbench.gp_catalog_candidate(release_id, catalog_code, rank_order);

CREATE OR REPLACE VIEW iml_loinc_workbench.v_source AS
SELECT s.*
FROM iml_loinc_workbench.loinc_source s
JOIN iml_loinc_workbench.source_release r ON r.id = s.release_id
WHERE r.is_current;

CREATE OR REPLACE VIEW iml_loinc_workbench.v_extended AS
SELECT *
FROM iml_loinc_workbench.v_source
WHERE upper(status) = 'ACTIVE'
  AND classtype = 1
  AND upper(order_obs) IN ('OBSERVATION', 'BOTH');

CREATE OR REPLACE VIEW iml_loinc_workbench.v_search AS
SELECT *
FROM iml_loinc_workbench.v_extended
WHERE common_test_rank IS NOT NULL
  AND common_test_rank > 0;

CREATE OR REPLACE VIEW iml_loinc_workbench.v_core_candidate_rank2500 AS
SELECT *
FROM iml_loinc_workbench.v_search
WHERE common_test_rank <= 2500;

CREATE OR REPLACE VIEW iml_loinc_workbench.v_ranked_common_systems AS
SELECT *
FROM iml_loinc_workbench.v_search
WHERE system_axis IN ('Ser', 'Ser/Plas', 'Plas', 'Bld', 'Urine');

CREATE OR REPLACE VIEW iml_loinc_workbench.v_orders_active AS
SELECT s.*
FROM iml_loinc_workbench.v_source s
JOIN iml_loinc_workbench.universal_order_raw o
  ON o.release_id = s.release_id
 AND o.loinc_num = s.loinc_num
WHERE upper(s.status) = 'ACTIVE'
  AND s.classtype = 1;

COMMENT ON SCHEMA iml_loinc_workbench IS
'Local-only LOINC workbench. Complete releases stay here; only curated subsets are later promoted to canonical IML terminology/laboratory tables.';
