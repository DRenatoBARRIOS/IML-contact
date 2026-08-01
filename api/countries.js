import { neon } from "@neondatabase/serverless";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL is not available." },
      { status: 500 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

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
                'url', s.source_url,
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

    return Response.json(
      {
        count: countries.length,
        countries,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=3600",
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
