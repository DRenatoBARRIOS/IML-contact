-- IML geographic profile subjects
-- Migration 193: Bind country and subnational profiles to geo_entities
-- Version: 0.1.0
-- Date: 2026-09-26
--
-- Purpose:
--   * make geo_entities the canonical geographic subject layer
--   * backfill existing countries without changing their profile content
--   * allow published subnational profiles such as Illinois
--   * preserve the existing country tables during transition
--
-- No score, note, source or indicator is created by this migration.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:193_geographic_profile_subjects'));

DO $$
DECLARE
  v_country_type_id bigint;
  v_state_type_id bigint;
  v_relation_type_id bigint;
  v_entity_id bigint;
  v_usa_entity_id bigint;
  v_illinois_entity_id bigint;
  r record;
BEGIN
  IF to_regclass('public.geo_entities') IS NULL THEN
    RAISE EXCEPTION 'Migration 193 requires migration 192 generic geography layer';
  END IF;

  SELECT id INTO v_country_type_id FROM geo_entity_types WHERE code='country';
  SELECT id INTO v_state_type_id FROM geo_entity_types WHERE code='state';
  SELECT id INTO v_relation_type_id FROM geo_relation_types WHERE code='administrative_part_of';

  IF v_country_type_id IS NULL OR v_state_type_id IS NULL OR v_relation_type_id IS NULL THEN
    RAISE EXCEPTION 'Migration 193 requires country/state entity types and administrative_part_of relation';
  END IF;

  ALTER TABLE countries ADD COLUMN IF NOT EXISTS geo_entity_id bigint;
  ALTER TABLE country_profiles ADD COLUMN IF NOT EXISTS geo_entity_id bigint;
  ALTER TABLE country_profiles ADD COLUMN IF NOT EXISTS version_label text;
  ALTER TABLE country_profiles ALTER COLUMN country_id DROP NOT NULL;

  FOR r IN
    SELECT id, iso3, name_en
    FROM countries
    WHERE is_active = TRUE
    ORDER BY id
  LOOP
    SELECT gi.entity_id INTO v_entity_id
    FROM geo_identifiers gi
    WHERE gi.scheme='ISO_3166_1_ALPHA3'
      AND gi.value=r.iso3
      AND gi.valid_to IS NULL
    LIMIT 1;

    IF v_entity_id IS NULL THEN
      INSERT INTO geo_entities(canonical_name, entity_type_id, status, attributes)
      VALUES (
        r.name_en,
        v_country_type_id,
        'active',
        jsonb_build_object('source','countries_backfill','country_id',r.id,'iso3',r.iso3)
      )
      RETURNING id INTO v_entity_id;

      INSERT INTO geo_identifiers(entity_id, scheme, value, is_primary)
      VALUES (v_entity_id,'ISO_3166_1_ALPHA3',r.iso3,TRUE);
    ELSE
      UPDATE geo_entities
      SET canonical_name=r.name_en,
          attributes=attributes || jsonb_build_object('country_id',r.id,'iso3',r.iso3),
          updated_at=now()
      WHERE id=v_entity_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM geo_names
      WHERE entity_id=v_entity_id
        AND name=r.name_en
        AND name_type='preferred'
        AND valid_to IS NULL
    ) THEN
      INSERT INTO geo_names(entity_id,name,language_code,name_type)
      VALUES (v_entity_id,r.name_en,'en','preferred');
    END IF;

    UPDATE countries
    SET geo_entity_id=v_entity_id,
        updated_at=now()
    WHERE id=r.id;
  END LOOP;

  UPDATE country_profiles cp
  SET geo_entity_id=c.geo_entity_id,
      updated_at=now()
  FROM countries c
  WHERE cp.country_id=c.id
    AND cp.geo_entity_id IS DISTINCT FROM c.geo_entity_id;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='countries_geo_entity_id_fkey') THEN
    ALTER TABLE countries
      ADD CONSTRAINT countries_geo_entity_id_fkey
      FOREIGN KEY (geo_entity_id) REFERENCES geo_entities(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='country_profiles_geo_entity_id_fkey') THEN
    ALTER TABLE country_profiles
      ADD CONSTRAINT country_profiles_geo_entity_id_fkey
      FOREIGN KEY (geo_entity_id) REFERENCES geo_entities(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='country_profiles_has_subject_check') THEN
    ALTER TABLE country_profiles
      ADD CONSTRAINT country_profiles_has_subject_check
      CHECK (country_id IS NOT NULL OR geo_entity_id IS NOT NULL);
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS countries_geo_entity_id_key
    ON countries(geo_entity_id)
    WHERE geo_entity_id IS NOT NULL;

  CREATE UNIQUE INDEX IF NOT EXISTS country_profiles_geo_entity_id_version_key
    ON country_profiles(geo_entity_id, version)
    WHERE geo_entity_id IS NOT NULL;

  CREATE UNIQUE INDEX IF NOT EXISTS one_published_profile_per_geo_entity
    ON country_profiles(geo_entity_id)
    WHERE status='published' AND geo_entity_id IS NOT NULL;

  SELECT gi.entity_id INTO v_usa_entity_id
  FROM geo_identifiers gi
  WHERE gi.scheme='ISO_3166_1_ALPHA3'
    AND gi.value='USA'
    AND gi.valid_to IS NULL
  LIMIT 1;

  IF v_usa_entity_id IS NULL THEN
    RAISE EXCEPTION 'Migration 193 could not resolve United States geo entity';
  END IF;

  SELECT gi.entity_id INTO v_illinois_entity_id
  FROM geo_identifiers gi
  WHERE gi.scheme='ISO_3166_2'
    AND gi.value='US-IL'
    AND gi.valid_to IS NULL
  LIMIT 1;

  IF v_illinois_entity_id IS NULL THEN
    INSERT INTO geo_entities(canonical_name, entity_type_id, status, attributes)
    VALUES (
      'Illinois',
      v_state_type_id,
      'active',
      jsonb_build_object('country_iso3','USA','jurisdiction_code','US-IL')
    )
    RETURNING id INTO v_illinois_entity_id;

    INSERT INTO geo_identifiers(entity_id, scheme, value, is_primary)
    VALUES (v_illinois_entity_id,'ISO_3166_2','US-IL',TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM geo_names
    WHERE entity_id=v_illinois_entity_id
      AND name='Illinois'
      AND name_type='preferred'
      AND valid_to IS NULL
  ) THEN
    INSERT INTO geo_names(entity_id,name,language_code,name_type)
    VALUES (v_illinois_entity_id,'Illinois','en','preferred');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM geo_relations
    WHERE from_entity_id=v_illinois_entity_id
      AND relation_type_id=v_relation_type_id
      AND to_entity_id=v_usa_entity_id
      AND valid_to IS NULL
  ) THEN
    INSERT INTO geo_relations(
      from_entity_id,relation_type_id,to_entity_id,source_note,attributes
    )
    VALUES (
      v_illinois_entity_id,
      v_relation_type_id,
      v_usa_entity_id,
      'Illinois is a state of the United States.',
      '{}'::jsonb
    );
  END IF;
END
$$;

COMMIT;
