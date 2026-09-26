-- IML Country Profiles
-- Migration 192: Generic geographic layer
-- Version: 0.1.0
-- Date: 2026-09-24
--
-- Purpose
-- -------
-- Introduce a geography layer independent from the IML assessment engine.
-- The layer is intentionally generic: countries, states, provinces, regions,
-- historical territories, health regions and future geographic concepts can
-- be represented without changing profile scores, evidence or indicators.
--
-- Architectural rule
-- ------------------
-- IML profiles will ultimately reference a stable geo_entity_id. Administrative
-- type, names, identifiers, relationships and temporal validity belong to this
-- independent geography layer.
--
-- Conservative guarantees
-- -----------------------
--   * additive only
--   * no DROP / DELETE / TRUNCATE
--   * does not modify countries or country_profile_* tables
--   * does not change the public API
--   * safe to run more than once
--
-- A later migration will bind existing profiles to geo_entities only after the
-- production schema has been inspected and existing country profiles can
-- be verified unchanged.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:192_generic_geography_layer'));

CREATE TABLE IF NOT EXISTS geo_entity_types (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS geo_entities (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    canonical_name text NOT NULL,
    entity_type_id bigint NOT NULL REFERENCES geo_entity_types(id),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'historical', 'proposed', 'retired')),
    valid_from date,
    valid_to date,
    attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE INDEX IF NOT EXISTS geo_entities_type_idx
    ON geo_entities(entity_type_id);

CREATE INDEX IF NOT EXISTS geo_entities_status_idx
    ON geo_entities(status);

CREATE TABLE IF NOT EXISTS geo_identifiers (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity_id bigint NOT NULL REFERENCES geo_entities(id) ON DELETE CASCADE,
    scheme text NOT NULL,
    value text NOT NULL,
    valid_from date,
    valid_to date,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE INDEX IF NOT EXISTS geo_identifiers_entity_idx
    ON geo_identifiers(entity_id);

CREATE INDEX IF NOT EXISTS geo_identifiers_lookup_idx
    ON geo_identifiers(scheme, value);

CREATE UNIQUE INDEX IF NOT EXISTS geo_identifiers_current_unique_idx
    ON geo_identifiers(scheme, value)
    WHERE valid_to IS NULL;

CREATE TABLE IF NOT EXISTS geo_names (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity_id bigint NOT NULL REFERENCES geo_entities(id) ON DELETE CASCADE,
    name text NOT NULL,
    language_code text,
    name_type text NOT NULL DEFAULT 'official',
    valid_from date,
    valid_to date,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE INDEX IF NOT EXISTS geo_names_entity_idx
    ON geo_names(entity_id);

CREATE INDEX IF NOT EXISTS geo_names_lookup_idx
    ON geo_names(name);

CREATE TABLE IF NOT EXISTS geo_relation_types (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS geo_relations (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_entity_id bigint NOT NULL REFERENCES geo_entities(id) ON DELETE CASCADE,
    relation_type_id bigint NOT NULL REFERENCES geo_relation_types(id),
    to_entity_id bigint NOT NULL REFERENCES geo_entities(id) ON DELETE CASCADE,
    valid_from date,
    valid_to date,
    source_note text,
    attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (from_entity_id <> to_entity_id),
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE INDEX IF NOT EXISTS geo_relations_from_idx
    ON geo_relations(from_entity_id);

CREATE INDEX IF NOT EXISTS geo_relations_to_idx
    ON geo_relations(to_entity_id);

CREATE INDEX IF NOT EXISTS geo_relations_type_idx
    ON geo_relations(relation_type_id);

INSERT INTO geo_entity_types (code, label, description)
VALUES
    ('country', 'Country', 'Country-level entity'),
    ('constituent_country', 'Constituent country', 'Country-level constituent entity within a larger sovereign structure'),
    ('state', 'State', 'Subnational state'),
    ('province', 'Province', 'Subnational province'),
    ('region', 'Region', 'Administrative or geographic region'),
    ('autonomous_community', 'Autonomous community', 'Autonomous territorial entity'),
    ('land', 'Land', 'Federal Land or equivalent'),
    ('canton', 'Canton', 'Cantonal entity'),
    ('federal_district', 'Federal district', 'Federal district or equivalent'),
    ('territory', 'Territory', 'Territorial jurisdiction'),
    ('historical_region', 'Historical region', 'Historically bounded geographic entity'),
    ('health_region', 'Health region', 'Health-system or public-health jurisdiction'),
    ('municipality', 'Municipality', 'Municipal or local-government entity')
ON CONFLICT (code) DO NOTHING;

INSERT INTO geo_relation_types (code, label, description)
VALUES
    ('administrative_part_of', 'Administrative part of', 'Current or historical administrative containment'),
    ('health_authority_part_of', 'Health authority part of', 'Health-system-specific containment'),
    ('historical_part_of', 'Historical part of', 'Historical territorial containment'),
    ('overlaps', 'Overlaps', 'Spatial or jurisdictional overlap'),
    ('precedes', 'Precedes', 'Entity precedes another entity historically'),
    ('succeeds', 'Succeeds', 'Entity succeeds another entity historically'),
    ('associated_with', 'Associated with', 'Non-hierarchical geographic association')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
    required_type_count integer;
    required_relation_count integer;
BEGIN
    SELECT count(*) INTO required_type_count
    FROM geo_entity_types
    WHERE code IN (
        'country', 'state', 'province', 'region', 'historical_region', 'health_region'
    );

    IF required_type_count <> 6 THEN
        RAISE EXCEPTION 'Migration 192 failed: required geographic entity types are missing';
    END IF;

    SELECT count(*) INTO required_relation_count
    FROM geo_relation_types
    WHERE code IN (
        'administrative_part_of', 'historical_part_of', 'overlaps', 'precedes', 'succeeds'
    );

    IF required_relation_count <> 5 THEN
        RAISE EXCEPTION 'Migration 192 failed: required geographic relation types are missing';
    END IF;
END
$$;

COMMIT;

-- Verification queries:
--
-- SELECT code, label FROM geo_entity_types ORDER BY code;
-- SELECT code, label FROM geo_relation_types ORDER BY code;
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name LIKE 'geo_%'
-- ORDER BY table_name;
