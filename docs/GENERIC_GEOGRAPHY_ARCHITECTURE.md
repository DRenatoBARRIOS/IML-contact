# IML Generic Geography Architecture

Status: canonical technical architecture decision  
Date: 2026-09-24

## Purpose

IML evaluates health-information environments attached to geographic entities. The assessment engine must remain independent from the administrative classification, naming, identifiers, hierarchy and historical evolution of those entities.

This decision prevents future geographic changes from forcing changes to IML scores, evidence, indicators, notes or assessment logic.

## Canonical rule

> IML profiles are attached to stable geographic entities, not to country-specific database structures. Geographic type, names, identifiers, territorial relationships and temporal validity are maintained in a separate geographic layer. The IML assessment engine references only the geographic entity and remains independent of its administrative classification or hierarchy.

## Geographic layer

The canonical geography layer is composed of:

- `geo_entity_types`
- `geo_entities`
- `geo_identifiers`
- `geo_names`
- `geo_relation_types`
- `geo_relations`

### Stable identity

`geo_entities.id` is the internal stable key.

External identifiers such as ISO 3166-1, ISO 3166-2, FIPS or national administrative codes are stored in `geo_identifiers`. They must never be used as the immutable primary identity of an IML geographic entity.

### Entity types

Entity type is data, not schema.

Examples include country, state, province, region, Land, canton, territory, historical region and health region. New types are added as rows in `geo_entity_types`, not by creating new profile-table families.

### Relationships

Geographic relationships are represented in `geo_relations`, not by assuming one permanent parent hierarchy.

Examples:

- `administrative_part_of`
- `historical_part_of`
- `health_authority_part_of`
- `overlaps`
- `precedes`
- `succeeds`

Relationships may have `valid_from` and `valid_to` dates.

This permits representation of changing jurisdictions, historical regions, overlapping health regions and future territorial reforms without changing the IML assessment schema.

## Profile boundary

The target IML profile model references a geographic entity through a stable `geo_entity_id`.

Scores, sources, indicators, notes and assessments reference the profile, not the geographic hierarchy.

Therefore:

- a United States federal profile can reference the United States entity;
- an Illinois profile can reference the Illinois entity;
- neither score is inherited from or mathematically aggregated with the other;
- a federal source applicable to Illinois may be linked as evidence with an explicit evidence scope, but it is not automatically evidence of Illinois implementation.

## Temporal scope

Profiles should ultimately carry an explicit `scope_date` or equivalent temporal reference.

Geographic names, identifiers and relationships can then be resolved for the period assessed without changing the profile itself.

## Map and selector contract

The world map remains country-level.

The map should read from a stable projection/view that exposes only geographic entities intended for the world map.

The profile selector may expose any reviewed entity with a profile, including subnational or historical entities.

Example:

- United States — Federal
- Illinois — United States

Selecting Illinois must reuse the existing six-domain profile interface. No second map is required.

## Compatibility rule

The existing `countries`, `country_profiles` and related production tables remain untouched during the first migration phase.

Migration 192 creates only the independent geographic layer.

A later migration may bind the current profiles to `geo_entities` after the production schema has been inspected and the existing published profiles can be verified unchanged.

Existing public API contracts must remain stable during migration. Compatibility views or projections should be preferred over breaking public consumers.

## Explicit non-goals

Do not:

- create a physical table per country;
- create separate profile engines for states, provinces, cantons or regions;
- use ISO codes as immutable internal identifiers;
- calculate a parent score as the average of child jurisdictions;
- make a child score inherit from its parent;
- encode geographic hierarchy directly into the UI;
- require a new map for every subnational level;
- rewrite or delete existing production profiles merely to introduce the geography layer.

## First implementation

Migration `192_generic_geography_layer.sql` creates the geography module additively.

The next migration must be based on the real production schema and should:

1. create one `geo_entity` for each existing country profile;
2. preserve the current country ISO identifiers in `geo_identifiers`;
3. add or create the profile-to-geography binding without changing existing scores, sources, notes or indicator evidence;
4. verify the existing profile count and all published profile outputs before and after the binding;
5. add the United States and Illinois entities only after those checks pass;
6. keep United States federal and Illinois assessments independent.

