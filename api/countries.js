import { neon } from "@neondatabase/serverless";
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL_MANUAL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    return Response.json(
      { error: "DATABASE_URL is not available." },
      { status: 500 }
    );
  }

  try {
    const sql = neon(databaseUrl);

    const countries = await sql`
      SELECT
        c.iso3,
        c.slug,
        c.name_en AS name,
        c.map_x::double precision AS map_x,
        c.map_y::double precision AS map_y,
        c.label_dx::double precision AS label_dx,
        c.label_dy::double precision AS label_dy,
        c.text_size::double precision AS text_size,

        cp.version,
        cp.subtitle,
        cp.assessment_date,
        cp.published_at,

        (
          SELECT a.overall_score
          FROM country_profile_assessments a
          WHERE a.profile_id = cp.id
          ORDER BY a.id DESC
          LIMIT 1
        ) AS overall_score,

        COALESCE(
          (
            SELECT json_build_object(
              'assessment_status', a.assessment_status,
              'assessment_method', a.assessment_method,
              'confidence_level', a.confidence_level,
              'review_notes', a.review_notes,
              'reviewed_at', a.reviewed_at,
              'published_at', a.published_at,
              'overall_score', a.overall_score
            )
            FROM country_profile_assessments a
            WHERE a.profile_id = cp.id
            ORDER BY a.id DESC
            LIMIT 1
          ),
          '{}'::json
        ) AS assessment,

        COALESCE(
          (
            SELECT json_agg(s.score ORDER BY d.display_order)
            FROM country_profile_scores s
            JOIN iml_domains d
              ON d.code = s.domain_code
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS values,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id
              AND n.note_type = 'strength'
          ),
          '[]'::json
        ) AS strengths,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id
              AND n.note_type = 'watch'
          ),
          '[]'::json
        ) AS watch,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'title', s.title,
                'publisher', s.publisher,
                'url',
                CASE
                  WHEN s.url_status IN ('verified', 'redirected')
                    THEN s.public_url
                  ELSE NULL
                END,
                'url_status', COALESCE(s.url_status, 'unverified'),
                'documentary_url', s.source_url,
                'last_checked_at', s.last_checked_at,
                'replacement_reason', s.replacement_reason,
                'publication_date', s.publication_date,
                'accessed_at', s.accessed_at,
                'note', s.evidence_note,
                'indicators',
                COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'code', i.indicator_code,
                        'evidence_level', i.evidence_level,
                        'support_type', i.support_type,
                        'summary', i.evidence_summary,
                        'limitation', i.limitation_note
                      )
                      ORDER BY i.indicator_code
                    )
                    FROM country_profile_source_indicators i
                    WHERE i.source_id = s.id
                  ),
                  '[]'::json
                )
              )
              ORDER BY s.id
            )
            FROM country_profile_sources s
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS sources

      FROM countries c
      JOIN country_profiles cp
        ON cp.country_id = c.id

      WHERE c.is_active = TRUE
        AND cp.status = 'published'

      ORDER BY c.name_en;
    `;

    const jurisdictions = await sql`
      SELECT
        CASE
          WHEN parent_identifier.value IS NOT NULL
               AND jurisdiction_identifier.scheme = 'ISO_3166_2'
          THEN parent_identifier.value || '-' || split_part(jurisdiction_identifier.value, '-', 2)
          ELSE jurisdiction_identifier.value
        END AS iso3,
        jurisdiction_identifier.value AS jurisdiction_code,
        ge.canonical_name AS name,
        et.code AS entity_type,
        parent_identifier.value AS parent_iso3,
        parent.canonical_name AS parent_name,

        COALESCE(cp.version_label, cp.version::text) AS version,
        cp.status,
        cp.subtitle,
        cp.assessment_date,
        cp.published_at,

        (
          SELECT a.overall_score
          FROM country_profile_assessments a
          WHERE a.profile_id = cp.id
          ORDER BY a.id DESC
          LIMIT 1
        ) AS overall_score,

        COALESCE(
          (
            SELECT json_build_object(
              'assessment_status', a.assessment_status,
              'assessment_method', a.assessment_method,
              'confidence_level', a.confidence_level,
              'review_notes', a.review_notes,
              'reviewed_at', a.reviewed_at,
              'published_at', a.published_at,
              'overall_score', a.overall_score
            )
            FROM country_profile_assessments a
            WHERE a.profile_id = cp.id
            ORDER BY a.id DESC
            LIMIT 1
          ),
          '{}'::json
        ) AS assessment,

        COALESCE(
          (
            SELECT json_agg(s.score ORDER BY d.display_order)
            FROM country_profile_scores s
            JOIN iml_domains d ON d.code = s.domain_code
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS values,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id AND n.note_type = 'strength'
          ),
          '[]'::json
        ) AS strengths,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id AND n.note_type = 'watch'
          ),
          '[]'::json
        ) AS watch,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'title', s.title,
                'publisher', s.publisher,
                'url',
                CASE
                  WHEN s.url_status IN ('verified', 'redirected')
                    THEN s.public_url
                  ELSE NULL
                END,
                'url_status', COALESCE(s.url_status, 'unverified'),
                'documentary_url', s.source_url,
                'last_checked_at', s.last_checked_at,
                'replacement_reason', s.replacement_reason,
                'publication_date', s.publication_date,
                'accessed_at', s.accessed_at,
                'note', s.evidence_note,
                'indicators',
                COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'code', i.indicator_code,
                        'evidence_level', i.evidence_level,
                        'support_type', i.support_type,
                        'summary', i.evidence_summary,
                        'limitation', i.limitation_note
                      )
                      ORDER BY i.indicator_code
                    )
                    FROM country_profile_source_indicators i
                    WHERE i.source_id = s.id
                  ),
                  '[]'::json
                )
              )
              ORDER BY s.id
            )
            FROM country_profile_sources s
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS sources

      FROM geo_entities ge
      JOIN geo_entity_types et
        ON et.id = ge.entity_type_id
      JOIN geo_identifiers jurisdiction_identifier
        ON jurisdiction_identifier.entity_id = ge.id
       AND jurisdiction_identifier.is_primary = TRUE
       AND jurisdiction_identifier.valid_to IS NULL
      JOIN geo_relations gr
        ON gr.from_entity_id = ge.id
       AND gr.valid_to IS NULL
      JOIN geo_relation_types rt
        ON rt.id = gr.relation_type_id
       AND rt.code = 'administrative_part_of'
      JOIN geo_entities parent
        ON parent.id = gr.to_entity_id
      JOIN geo_identifiers parent_identifier
        ON parent_identifier.entity_id = parent.id
       AND parent_identifier.scheme = 'ISO_3166_1_ALPHA3'
       AND parent_identifier.valid_to IS NULL
      JOIN country_profiles cp
        ON cp.geo_entity_id = ge.id
       AND cp.status = 'published'

      WHERE et.code <> 'country'
        AND ge.status = 'active'

      ORDER BY parent.canonical_name, ge.canonical_name;
    `;

    return Response.json(
      {
        count: countries.length,
        countries,
        jurisdiction_count: jurisdictions.length,
        jurisdictions,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Unable to load IML country profiles:", error);

    return Response.json(
      { error: "Unable to load country profiles." },
      { status: 500 }
    );
  }
}
