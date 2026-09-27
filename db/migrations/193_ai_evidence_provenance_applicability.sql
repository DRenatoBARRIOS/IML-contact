-- IML Open Clinical Workspace
-- AI-EVIDENCE-02A / MEDICATION-DECISION-01
-- Migration 193: Clinical Evidence Provenance, Applicability & Medication Knowledge
-- Version: 0.3.2
-- Date: 2026-09-06
--
-- IML is not a publication repository. Sources are read/imported under an
-- appropriate rights basis; clinically useful knowledge is normalized,
-- provenance is preserved, and patient applicability is resolved at runtime.
--
-- This migration creates PATIENT-INDEPENDENT reference structures only.
-- No patient-specific evidence resolution is persisted in Neon.
--
-- Principles:
-- * national legally/regulatorily applicable information has priority for action;
-- * scientific certainty and legal/applicability priority are separate dimensions;
-- * GRADE is represented as an external methodology, not an IML score;
-- * MAGIC may supply structured PICO/recommendation/evidence objects;
-- * EMA ePI/SmPC supplies regulatory product information;
-- * EMA clinical-data publication supplies deep provenance;
-- * studied populations and applicability limitations remain explicit;
-- * meta-analysis is not automatically assigned superior certainty;
-- * fixed-dose combinations are decomposed into active ingredients;
-- * medication rules may represent pairwise and cumulative risks;
-- * operational retrieval priority is distinct from formal authority priority;
-- * VIDAL/FASS-like references and Janusmed-like decision support are modeled separately;
-- * AI proposes; the clinician validates;
-- * no verbatim source-text repository is created here.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS iml_ai;
CREATE SCHEMA IF NOT EXISTS iml_medication;

DO $$
BEGIN
  IF to_regclass('iml_ai.evidence_source') IS NULL
     OR to_regclass('iml_ai.evidence_record') IS NULL THEN
    RAISE EXCEPTION 'AI-EVIDENCE-01 foundation is required before AI-EVIDENCE-02A';
  END IF;
  IF to_regclass('iml_system.module_registry') IS NULL THEN
    RAISE EXCEPTION 'iml_system.module_registry is required before migration 193';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS iml_ai.clinical_knowledge_source_profile (
  source_code text PRIMARY KEY REFERENCES iml_ai.evidence_source(source_code) ON DELETE CASCADE,
  knowledge_role text NOT NULL,
  default_jurisdiction text,
  default_language_code text,
  default_binding_status text NOT NULL DEFAULT 'unknown',
  authority_priority smallint NOT NULL DEFAULT 50,
  retrieval_priority smallint NOT NULL DEFAULT 50,
  international_relevance boolean NOT NULL DEFAULT false,
  national_contextual_role boolean NOT NULL DEFAULT false,
  primary_care_relevance boolean NOT NULL DEFAULT false,
  human_read_permitted boolean,
  machine_retrieval_permitted boolean,
  machine_processing_permitted boolean,
  persistent_storage_permitted boolean,
  methodological_note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (knowledge_role IN (
    'NATIONAL_RULE','NATIONAL_GUIDANCE','NATIONAL_CLINICAL_REFERENCE',
    'INTERNATIONAL_GUIDELINE','EVIDENCE_METHOD','STRUCTURED_EVIDENCE_PROVIDER',
    'REGULATORY_PRODUCT_INFO','REGULATORY_CLINICAL_DATA','RESEARCH_SOURCE',
    'OPERATIONAL_MEDICATION_REFERENCE','MEDICATION_DECISION_SUPPORT'
  )),
  CHECK (default_binding_status IN (
    'binding','conditionally_binding','advisory','methodological','informational','unknown'
  )),
  CHECK (authority_priority BETWEEN 1 AND 100),
  CHECK (retrieval_priority BETWEEN 1 AND 100)
);

COMMENT ON TABLE iml_ai.clinical_knowledge_source_profile IS
'Patient-independent source policy. authority_priority expresses formal/applicability authority; retrieval_priority expresses operational usefulness/speed. Neither is a scientific quality score.';

COMMENT ON COLUMN iml_ai.clinical_knowledge_source_profile.authority_priority IS
'Lower values indicate stronger formal/applicability priority for action. This is not a scientific evidence score.';

COMMENT ON COLUMN iml_ai.clinical_knowledge_source_profile.retrieval_priority IS
'Lower values indicate preferred operational retrieval/use during care. A source may be retrieved first without being the formal authority.';

CREATE TABLE IF NOT EXISTS iml_ai.clinical_evidence_claim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_key text NOT NULL UNIQUE,
  claim_type text NOT NULL,
  clinical_domain text,
  condition_code_system text,
  condition_code text,
  intervention_code_system text,
  intervention_code text,
  statement_summary text NOT NULL,
  jurisdiction text,
  authority_level text NOT NULL DEFAULT 'scientific_evidence',
  binding_status text NOT NULL DEFAULT 'unknown',
  grade_certainty text NOT NULL DEFAULT 'not_graded',
  recommendation_strength text NOT NULL DEFAULT 'not_applicable',
  valid_from date,
  valid_until date,
  review_status text NOT NULL DEFAULT 'machine_extracted',
  reviewed_by_role text,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (claim_type IN (
    'DIAGNOSTIC_CRITERION','THERAPEUTIC_INDICATION','THERAPEUTIC_TARGET',
    'FIRST_LINE_TREATMENT','ALTERNATIVE_TREATMENT','CONTRAINDICATION','DRUG_DOSE',
    'RENAL_DOSE_ADJUSTMENT','HEPATIC_DOSE_ADJUSTMENT','MONITORING_REQUIREMENT',
    'FOLLOW_UP_INTERVAL','SCREENING_RECOMMENDATION','REFERRAL_CRITERION','RED_FLAG',
    'STOP_RULE','PREGNANCY_CONSIDERATION','AGE_CONSIDERATION','DRUG_INTERACTION',
    'CUMULATIVE_MEDICATION_RISK','VACCINATION_RECOMMENDATION','PROGNOSTIC_INFORMATION','OTHER'
  )),
  CHECK (authority_level IN (
    'legally_binding','regulatory','national_standard','national_guidance',
    'international_guideline','scientific_evidence','methodological'
  )),
  CHECK (binding_status IN ('binding','conditionally_binding','advisory','not_applicable','unknown')),
  CHECK (grade_certainty IN ('high','moderate','low','very_low','not_graded','unknown')),
  CHECK (recommendation_strength IN (
    'strong_for','conditional_for','conditional_against','strong_against','not_applicable','unknown'
  )),
  CHECK (review_status IN ('machine_extracted','human_reviewed','validated','rejected','superseded')),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);

COMMENT ON TABLE iml_ai.clinical_evidence_claim IS
'Clinically useful normalized claim, with no verbatim source-text archive.';

CREATE INDEX IF NOT EXISTS idx_clinical_evidence_claim_condition
  ON iml_ai.clinical_evidence_claim(condition_code_system, condition_code);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_claim_jurisdiction
  ON iml_ai.clinical_evidence_claim(jurisdiction, authority_level, binding_status);

CREATE TABLE IF NOT EXISTS iml_ai.clinical_evidence_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES iml_ai.clinical_evidence_claim(id) ON DELETE CASCADE,
  source_code text NOT NULL REFERENCES iml_ai.evidence_source(source_code) ON DELETE RESTRICT,
  evidence_record_id uuid REFERENCES iml_ai.evidence_record(id) ON DELETE SET NULL,
  source_role text NOT NULL DEFAULT 'supporting',
  source_identifier jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_locator text,
  source_version text,
  source_publication_date date,
  sponsor_type text NOT NULL DEFAULT 'unknown',
  sponsor_name text,
  sponsor_roles jsonb NOT NULL DEFAULT '{}'::jsonb,
  trial_registration text,
  protocol_available boolean,
  statistical_analysis_plan_available boolean,
  clinical_study_report_available boolean,
  extraction_method text NOT NULL,
  extractor_version text,
  extracted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  knowledge_persistence_basis text NOT NULL DEFAULT 'not_assessed',
  rights_note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (source_role IN ('primary','supporting','contradicting','regulatory_basis','methodological_basis')),
  CHECK (sponsor_type IN ('industry','public','academic','charitable','mixed','other','unknown')),
  CHECK (extraction_method IN (
    'structured_import','manual_extraction','assisted_extraction','machine_extraction','transient_reasoning'
  )),
  CHECK (knowledge_persistence_basis IN (
    'open_licence','licensed','public_domain','original_summary','metadata_only','transient_only','not_assessed'
  ))
);

CREATE INDEX IF NOT EXISTS idx_clinical_evidence_provenance_claim
  ON iml_ai.clinical_evidence_provenance(claim_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_provenance_source
  ON iml_ai.clinical_evidence_provenance(source_code);

CREATE TABLE IF NOT EXISTS iml_ai.clinical_evidence_population (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provenance_id uuid NOT NULL REFERENCES iml_ai.clinical_evidence_provenance(id) ON DELETE CASCADE,
  population_key text NOT NULL,
  population_description text,
  inclusion_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  exclusion_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  age_min_years numeric,
  age_max_years numeric,
  sex_scope text NOT NULL DEFAULT 'all',
  pregnancy_included boolean,
  renal_function_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  hepatic_function_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  comorbidities jsonb NOT NULL DEFAULT '[]'::jsonb,
  concomitant_therapies jsonb NOT NULL DEFAULT '[]'::jsonb,
  sample_size integer,
  follow_up_days integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (provenance_id, population_key),
  CHECK (sex_scope IN ('all','female','male','other_specific','unknown')),
  CHECK (age_min_years IS NULL OR age_max_years IS NULL OR age_max_years >= age_min_years),
  CHECK (sample_size IS NULL OR sample_size >= 0),
  CHECK (follow_up_days IS NULL OR follow_up_days >= 0)
);

CREATE TABLE IF NOT EXISTS iml_ai.clinical_evidence_outcome (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES iml_ai.clinical_evidence_claim(id) ON DELETE CASCADE,
  outcome_key text NOT NULL,
  outcome_name text NOT NULL,
  outcome_type text NOT NULL DEFAULT 'other',
  effect_measure text,
  effect_estimate numeric,
  ci_lower numeric,
  ci_upper numeric,
  absolute_risk_intervention numeric,
  absolute_risk_comparator numeric,
  risk_unit text,
  time_horizon text,
  grade_certainty text NOT NULL DEFAULT 'not_graded',
  grade_domains jsonb NOT NULL DEFAULT '{}'::jsonb,
  patient_importance text NOT NULL DEFAULT 'unknown',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (claim_id, outcome_key),
  CHECK (outcome_type IN (
    'mortality','morbidity','quality_of_life','symptom','hospitalisation','safety','surrogate','resource_use','other'
  )),
  CHECK (grade_certainty IN ('high','moderate','low','very_low','not_graded','unknown')),
  CHECK (patient_importance IN ('critical','important','limited','unknown'))
);

CREATE TABLE IF NOT EXISTS iml_ai.clinical_claim_applicability_criterion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES iml_ai.clinical_evidence_claim(id) ON DELETE CASCADE,
  criterion_key text NOT NULL,
  criterion_type text NOT NULL,
  code_system text,
  code text,
  operator text NOT NULL,
  criterion_value jsonb NOT NULL,
  applicability_effect text NOT NULL,
  importance text NOT NULL DEFAULT 'major',
  rationale_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (claim_id, criterion_key),
  CHECK (criterion_type IN (
    'age','sex','pregnancy','diagnosis','symptom','renal_function','hepatic_function',
    'laboratory','medication','comorbidity','care_setting','jurisdiction','other'
  )),
  CHECK (operator IN ('eq','neq','lt','lte','gt','gte','in','not_in','exists','not_exists','contains','range')),
  CHECK (applicability_effect IN ('required','supports','limits','excludes','unknown')),
  CHECK (importance IN ('hard','major','moderate','minor'))
);

CREATE TABLE IF NOT EXISTS iml_ai.evidence_synthesis_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provenance_id uuid NOT NULL UNIQUE REFERENCES iml_ai.clinical_evidence_provenance(id) ON DELETE CASCADE,
  synthesis_type text NOT NULL,
  included_study_count integer,
  total_participants integer,
  heterogeneity_i2 numeric,
  population_heterogeneity text NOT NULL DEFAULT 'unknown',
  intervention_heterogeneity text NOT NULL DEFAULT 'unknown',
  outcome_heterogeneity text NOT NULL DEFAULT 'unknown',
  publication_bias_concern text NOT NULL DEFAULT 'unknown',
  selective_reporting_concern text NOT NULL DEFAULT 'unknown',
  indirectness_concern text NOT NULL DEFAULT 'unknown',
  industry_funding_concern text NOT NULL DEFAULT 'unknown',
  methodological_note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (synthesis_type IN ('systematic_review','meta_analysis','network_meta_analysis','pooled_analysis','other')),
  CHECK (included_study_count IS NULL OR included_study_count >= 0),
  CHECK (total_participants IS NULL OR total_participants >= 0),
  CHECK (heterogeneity_i2 IS NULL OR (heterogeneity_i2 >= 0 AND heterogeneity_i2 <= 100)),
  CHECK (population_heterogeneity IN ('low','moderate','high','unknown')),
  CHECK (intervention_heterogeneity IN ('low','moderate','high','unknown')),
  CHECK (outcome_heterogeneity IN ('low','moderate','high','unknown')),
  CHECK (publication_bias_concern IN ('low','moderate','high','unknown')),
  CHECK (selective_reporting_concern IN ('low','moderate','high','unknown')),
  CHECK (indirectness_concern IN ('low','moderate','high','unknown')),
  CHECK (industry_funding_concern IN ('low','moderate','high','unknown'))
);

COMMENT ON TABLE iml_ai.evidence_synthesis_profile IS
'Meta-analysis/systematic-review transparency. Synthesis type alone never grants superior certainty.';

CREATE TABLE IF NOT EXISTS iml_medication.product_component (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text,
  product_code_system text NOT NULL,
  product_code text NOT NULL,
  product_name text,
  ingredient_code_system text NOT NULL,
  ingredient_code text NOT NULL,
  ingredient_name text NOT NULL,
  strength_value numeric,
  strength_unit text,
  source_code text REFERENCES iml_ai.evidence_source(source_code) ON DELETE SET NULL,
  valid_from date,
  valid_until date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (jurisdiction, product_code_system, product_code, ingredient_code_system, ingredient_code),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);

COMMENT ON TABLE iml_medication.product_component IS
'Decomposes medicinal products, including fixed-dose combinations, into active ingredients.';

CREATE TABLE IF NOT EXISTS iml_medication.decision_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  rule_type text NOT NULL,
  substances jsonb NOT NULL DEFAULT '[]'::jsonb,
  clinical_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_domain text,
  severity text NOT NULL DEFAULT 'informational',
  action_summary text NOT NULL,
  monitoring jsonb NOT NULL DEFAULT '{}'::jsonb,
  jurisdiction text,
  authority_level text NOT NULL DEFAULT 'scientific_evidence',
  binding_status text NOT NULL DEFAULT 'unknown',
  source_claim_id uuid REFERENCES iml_ai.clinical_evidence_claim(id) ON DELETE SET NULL,
  review_status text NOT NULL DEFAULT 'machine_extracted',
  valid_from date,
  valid_until date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (rule_type IN (
    'INDICATION','CONTRAINDICATION','DOSE_ADJUSTMENT','PAIRWISE_INTERACTION','CUMULATIVE_RISK',
    'THERAPEUTIC_DUPLICATION','MONITORING','STOP_RULE','PREGNANCY','AGE','RENAL_FUNCTION',
    'HEPATIC_FUNCTION','OTHER'
  )),
  CHECK (severity IN ('critical','major','moderate','minor','informational')),
  CHECK (authority_level IN (
    'legally_binding','regulatory','national_standard','national_guidance','international_guideline','scientific_evidence'
  )),
  CHECK (binding_status IN ('binding','conditionally_binding','advisory','not_applicable','unknown')),
  CHECK (review_status IN ('machine_extracted','human_reviewed','validated','rejected','superseded')),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);

COMMENT ON TABLE iml_medication.decision_rule IS
'Patient-independent medication knowledge supporting combinations, pairwise interactions and cumulative multi-factor risk.';

INSERT INTO iml_ai.evidence_source (
  source_code,name,source_kind,access_mode,homepage_url,api_base_url,terms_url,
  enabled,stores_full_text,capabilities,licence_note
)
VALUES
('GRADE_METHOD','GRADE Working Group','knowledge_base','public_web',
 'https://www.gradeworkinggroup.org/',NULL,NULL,false,false,
 jsonb_build_object('certainty_method',true,'evidence_to_decision',true,'outcome_level_certainty',true),
 'Methodological framework; IML must not invent a substitute certainty score where GRADE data are available.'),
('MAGIC_EVIDENCE','MAGIC Evidence / MAGICapp','knowledge_base','public_api',
 'https://www.magicevidence.org/','https://api.magicapp.org','https://help.magicapp.org/',false,false,
 jsonb_build_object('structured_guidance',true,'pico_linked_data',true,'recommendations',true,'api',true,'grade_integration',true),
 'Public API and non-public content have different access conditions; validate reuse rights per content.'),
('EMA_EPI','EMA / EMRN Electronic Product Information','knowledge_base','public_web',
 'https://www.ema.europa.eu/en/human-regulatory-overview/marketing-authorisation/product-information-requirements/electronic-product-information-epi',NULL,NULL,false,false,
 jsonb_build_object('regulatory_product_information',true,'smpc',true,'fhir',true,'eu_epi',true),
 'Authorised regulatory product information; validate technical availability and reuse rights for each ingestion route.'),
('EMA_CLINICAL_DATA','EMA Clinical Data Publication','knowledge_base','public_web',
 'https://clinicaldata.ema.europa.eu/home',NULL,'https://clinicaldata.ema.europa.eu/',false,false,
 jsonb_build_object('clinical_study_reports',true,'protocols',true,'statistical_methods',true,'regulatory_provenance',true),
 'Access is governed by EMA terms; source documents are not persisted by default.'),
('FR_BDPM','Base de Donnees Publique des Medicaments','knowledge_base','public_web',
 'https://base-donnees-publique.medicaments.gouv.fr/',NULL,'https://base-donnees-publique.medicaments.gouv.fr/',false,false,
 jsonb_build_object('regulatory_product_information',true,'official_national_source',true,'jurisdiction','FR'),
 'Official French medicine information source. Reuse must follow the applicable BDPM licence and preserve source/update attribution.'),
('SE_LAKEMEDELSVERKET_PRODUCT_INFO','Läkemedelsverket Product Information','knowledge_base','public_web',
 'https://www.lakemedelsverket.se/sv/om-webbplatsen/oppna-data/produktdokument-for-lakemedel-som-oppen-data',NULL,NULL,false,false,
 jsonb_build_object('regulatory_product_information',true,'open_data_xml',true,'official_national_source',true,'jurisdiction','SE'),
 'Official Swedish product documents and regulatory information are available as open-data XML; validate the applicable reuse terms before ingestion.'),
('GUIDELINE_ADA','American Diabetes Association Standards of Care','guideline','public_web',
 'https://diabetesjournals.org/care/pages/standards-of-care',NULL,NULL,false,false,
 jsonb_build_object('primary_care_relevance',true,'iml_role','INTERNATIONAL_GUIDELINE'),
 'Internationally influential diabetes guidance; machine reuse requires a verified rights basis.'),
('GUIDELINE_AHA_ACC','AHA/ACC Clinical Practice Guidelines','guideline','public_web',
 'https://professional.heart.org/en/guidelines-statements',NULL,NULL,false,false,
 jsonb_build_object('primary_care_relevance',true,'iml_role','INTERNATIONAL_GUIDELINE'),
 'Internationally influential cardiovascular guidance; machine reuse requires a verified rights basis.'),
('GUIDELINE_ESC','European Society of Cardiology Clinical Practice Guidelines','guideline','public_web',
 'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines',NULL,NULL,false,false,
 jsonb_build_object('primary_care_relevance',true,'iml_role','INTERNATIONAL_GUIDELINE'),
 'International clinical reference; public access does not automatically establish automated-reuse rights.'),
('GUIDELINE_WHO','World Health Organization Guidelines','guideline','public_web',
 'https://www.who.int/publications/who-guidelines',NULL,NULL,false,false,
 jsonb_build_object('public_health_relevance',true,'iml_role','INTERNATIONAL_GUIDELINE'),
 'Global guideline source; reuse remains source- and licence-aware.'),
('GUIDELINE_HAS','Haute Autorite de Sante Recommendations','guideline','public_web',
 'https://www.has-sante.fr/',NULL,NULL,false,false,
 jsonb_build_object('jurisdiction','FR','iml_role','NATIONAL_GUIDANCE'),
 'French national guidance. Binding status must be determined document by document.'),
('GUIDELINE_NICE','NICE Guidance','guideline','public_api',
 'https://www.nice.org.uk/guidance',NULL,'https://www.nice.org.uk/reusing-our-content/nice-syndication-api',false,false,
 jsonb_build_object('jurisdiction','GB','iml_role','NATIONAL_GUIDANCE'),
 'UK national guidance; API/syndication use is subject to applicable terms.'),
('GUIDELINE_SOCIALSTYRELSEN','Socialstyrelsen National Guidelines','guideline','public_web',
 'https://www.socialstyrelsen.se/en/clinical-practise-guidelines-and-regulations/regulations-and-guidelines/national-guidelines/',NULL,NULL,false,false,
 jsonb_build_object('jurisdiction','SE','iml_role','NATIONAL_GUIDANCE'),
 'Swedish national guidance; applicability and reuse rights require source-specific validation.'),
('CLINICAL_REF_LAKEMEDELSBOKEN','Läkemedelsboken','knowledge_base','public_web',
 'https://lakemedelsboken.se/',NULL,NULL,false,false,
 jsonb_build_object('medication_reference',true,'primary_care_relevance',true,'jurisdiction','SE','iml_role','NATIONAL_CLINICAL_REFERENCE'),
 'Swedish practical clinical medication reference; public availability does not itself authorize automated reuse.'),
('VIDAL_FR','VIDAL France Medication Knowledge','knowledge_base','hybrid',
 'https://www.vidal.fr/',NULL,'https://www.vidalfrance.com/',false,false,
 jsonb_build_object(
   'operational_medication_reference',true,
   'licensed_integration',true,
   'structured_drug_reference',true,
   'active_ingredient_indexing',true,
   'interaction_support',true,
   'renal_medication_support',true,
   'fhir_interoperability',true,
   'jurisdiction','FR',
   'iml_role','OPERATIONAL_MEDICATION_REFERENCE'
 ),
 'Operational medication reference widely integrated into French clinical software. Licensed/API use requires an explicit VIDAL agreement. Formal regulatory authority remains with applicable official product information and regulators.'),
('FASS_SE','FASS Vård','knowledge_base','public_web',
 'https://fass.se/health',NULL,NULL,false,false,
 jsonb_build_object(
   'operational_medication_reference',true,
   'product_information',true,
   'healthcare_professional_reference',true,
   'smpc_access',true,
   'jurisdiction','SE',
   'iml_role','OPERATIONAL_MEDICATION_REFERENCE'
 ),
 'Major Swedish medication-information reference. FASS-text is based on authority-approved product information but FASS is not itself the medicines regulator. Automated reuse/integration rights require validation.'),
('JANUSMED_SE','Janusmed','knowledge_base','public_web',
 'https://janusmed.se/',NULL,NULL,false,false,
 jsonb_build_object(
   'medication_decision_support',true,
   'interaction_support',true,
   'risk_profile',true,
   'multi_drug_pharmacodynamic_risk',true,
   'healthcare_professional_use',true,
   'patient_age_aware',false,
   'patient_sex_aware',false,
   'patient_dose_aware',false,
   'jurisdiction','SE',
   'iml_role','MEDICATION_DECISION_SUPPORT'
 ),
 'Region Stockholm medication decision-support source. Janusmed interactions and risk profile provide general substance-based support; patient-specific age, sex and current dose are not automatically incorporated by the source and must be resolved by IML locally.')
ON CONFLICT (source_code) DO UPDATE SET
  name=EXCLUDED.name,
  source_kind=EXCLUDED.source_kind,
  access_mode=EXCLUDED.access_mode,
  homepage_url=EXCLUDED.homepage_url,
  api_base_url=EXCLUDED.api_base_url,
  terms_url=EXCLUDED.terms_url,
  enabled=false,
  stores_full_text=false,
  capabilities=iml_ai.evidence_source.capabilities || EXCLUDED.capabilities,
  licence_note=EXCLUDED.licence_note,
  updated_at=clock_timestamp();

INSERT INTO iml_ai.clinical_knowledge_source_profile (
  source_code,knowledge_role,default_jurisdiction,default_language_code,
  default_binding_status,authority_priority,retrieval_priority,international_relevance,national_contextual_role,
  primary_care_relevance,human_read_permitted,machine_retrieval_permitted,
  machine_processing_permitted,persistent_storage_permitted,methodological_note
)
VALUES
('FR_BDPM','REGULATORY_PRODUCT_INFO','FR','fr','unknown',5,25,false,true,true,true,NULL,NULL,NULL,
 'Official French medicine information should be routed before advisory guidance for medication actions in France; claim-level legal status must still be determined.'),
('SE_LAKEMEDELSVERKET_PRODUCT_INFO','REGULATORY_PRODUCT_INFO','SE','sv','unknown',5,25,false,true,true,true,NULL,NULL,NULL,
 'Official Swedish product information should be routed before advisory guidance for medication actions in Sweden; claim-level legal status must still be determined.'),
('EMA_EPI','REGULATORY_PRODUCT_INFO','EU','en','conditionally_binding',10,30,true,true,true,true,NULL,NULL,NULL,
 'Regulatory product information is considered before advisory guidance for medication actions; national authorisation may further constrain applicability.'),
('GUIDELINE_HAS','NATIONAL_GUIDANCE','FR','fr','unknown',30,20,false,true,true,true,NULL,NULL,NULL,
 'French national source; classify binding status document by document.'),
('GUIDELINE_NICE','NATIONAL_GUIDANCE','GB','en','advisory',30,20,true,true,true,true,NULL,NULL,NULL,
 'UK national guidance; contextual outside its jurisdiction.'),
('GUIDELINE_SOCIALSTYRELSEN','NATIONAL_GUIDANCE','SE','sv','advisory',30,20,false,true,true,true,NULL,NULL,NULL,
 'Swedish national guidance for local priorities and implementation.'),
('CLINICAL_REF_LAKEMEDELSBOKEN','NATIONAL_CLINICAL_REFERENCE','SE','sv','informational',50,10,false,true,true,true,NULL,NULL,NULL,
 'Practical Swedish medication/clinical reference relevant to primary care.'),
('GUIDELINE_ADA','INTERNATIONAL_GUIDELINE','US','en','advisory',60,30,true,false,true,true,NULL,NULL,NULL,
 'Internationally influential diabetes guidance while retaining its US issuing context.'),
('GUIDELINE_AHA_ACC','INTERNATIONAL_GUIDELINE','US','en','advisory',60,30,true,false,true,true,NULL,NULL,NULL,
 'Internationally influential cardiovascular guidance while retaining its US issuing context.'),
('GUIDELINE_ESC','INTERNATIONAL_GUIDELINE','EUROPE','en','advisory',60,30,true,false,true,true,NULL,NULL,NULL,
 'European specialty guidance used as an international clinical reference.'),
('GUIDELINE_WHO','INTERNATIONAL_GUIDELINE','GLOBAL','en','advisory',60,30,true,false,true,true,NULL,NULL,NULL,
 'Global clinical/public-health guidance.'),
('MAGIC_EVIDENCE','STRUCTURED_EVIDENCE_PROVIDER','GLOBAL','en','informational',70,40,true,false,true,true,true,true,NULL,
 'Structured PICO/recommendation/evidence transport. Rights depend on the specific content.'),
('GRADE_METHOD','EVIDENCE_METHOD','GLOBAL','en','methodological',70,40,true,false,true,true,NULL,NULL,NULL,
 'Methodological layer for certainty and Evidence-to-Decision judgments.'),
('EMA_CLINICAL_DATA','REGULATORY_CLINICAL_DATA','EU','en','informational',70,50,true,false,false,true,NULL,NULL,false,
 'Deep provenance source for study reports, protocols and statistical methods; source documents are not persisted by default.'),
('VIDAL_FR','OPERATIONAL_MEDICATION_REFERENCE','FR','fr','informational',50,5,false,true,true,true,NULL,NULL,NULL,
 'Operational French medication reference for rapid in-consultation retrieval and structured medication support. Formal authority is checked against applicable RCP/ANSM/EMA information.'),
('FASS_SE','OPERATIONAL_MEDICATION_REFERENCE','SE','sv','informational',50,5,false,true,true,true,NULL,NULL,NULL,
 'Operational Swedish medication reference. FASS is retrieved early for practical use, while formal authority remains with applicable regulator-approved product information.'),
('JANUSMED_SE','MEDICATION_DECISION_SUPPORT','SE','sv','informational',50,4,false,true,true,true,NULL,NULL,NULL,
 'Operational Swedish decision support for interactions and cumulative pharmacodynamic risk. IML must add patient age, sex, dose, renal function and other context locally where relevant.')
ON CONFLICT (source_code) DO UPDATE SET
  knowledge_role=EXCLUDED.knowledge_role,
  default_jurisdiction=EXCLUDED.default_jurisdiction,
  default_language_code=EXCLUDED.default_language_code,
  default_binding_status=EXCLUDED.default_binding_status,
  authority_priority=EXCLUDED.authority_priority,
  retrieval_priority=EXCLUDED.retrieval_priority,
  international_relevance=EXCLUDED.international_relevance,
  national_contextual_role=EXCLUDED.national_contextual_role,
  primary_care_relevance=EXCLUDED.primary_care_relevance,
  human_read_permitted=EXCLUDED.human_read_permitted,
  machine_retrieval_permitted=EXCLUDED.machine_retrieval_permitted,
  machine_processing_permitted=EXCLUDED.machine_processing_permitted,
  persistent_storage_permitted=EXCLUDED.persistent_storage_permitted,
  methodological_note=EXCLUDED.methodological_note,
  updated_at=clock_timestamp();

INSERT INTO iml_system.module_registry (code,name,category,status,version,description)
VALUES
('AI_EVIDENCE_RETRIEVAL','Clinical evidence provenance and applicability','TRANSVERSAL','SCAFFOLD','AI-EVIDENCE-02A/0.3.2',
 'Patient-independent clinical knowledge engine: normalized claims, source provenance, GRADE outcome certainty, studied populations, applicability criteria and synthesis transparency. No publication repository and no patient-specific cloud resolution.'),
('MEDICATION_DECISION_ENGINE','Medication decision support','TRANSVERSAL','SCAFFOLD','MEDICATION-DECISION-01/0.2.0',
 'Patient-independent medication knowledge scaffold: fixed-dose combination decomposition, pairwise and cumulative medication risks, dose/monitoring rules, and separate operational-versus-authoritative source routing. Includes VIDAL (France), FASS and Janusmed (Sweden) as disabled reference integrations. Patient-specific resolution remains local and clinician-controlled.')
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name,
  category=EXCLUDED.category,
  status=EXCLUDED.status,
  version=EXCLUDED.version,
  description=EXCLUDED.description,
  updated_at=clock_timestamp();

COMMIT;
