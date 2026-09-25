import { POLICY_EFFECT } from './policyEngine.js';

export const ROLE_CODE = Object.freeze({
  PHYSICIAN: 'physician',
  MEDICAL_ASSISTANT: 'medical_assistant',
  LABORATORY_SERVICE: 'laboratory_service',
  LOCAL_CONNECTOR: 'local_connector',
  AI_SERVICE: 'ai_service',
  SECURITY_ADMIN: 'security_admin',
});

export const PURPOSE = Object.freeze({
  TREATMENT: 'treatment',
  CARE_COORDINATION: 'care_coordination',
  ADMINISTRATION: 'administration',
  LABORATORY_PROCESSING: 'laboratory_processing',
  DEVICE_INTEGRATION: 'device_integration',
  CLINICAL_SUPPORT: 'clinical_support',
  SECURITY_OPERATIONS: 'security_operations',
  EMERGENCY_TREATMENT: 'emergency_treatment',
});

export const RESOURCE_TYPE = Object.freeze({
  IDENTITY_SUMMARY: 'identity_summary',
  CLINICAL_RECORD: 'clinical_record',
  ENCOUNTER: 'encounter',
  ADMINISTRATIVE_RECORD: 'administrative_record',
  LAB_ORDER: 'lab_order',
  LAB_RESULT: 'lab_result',
  AI_CONTEXT: 'ai_context',
  CONNECTOR_JOB: 'connector_job',
  CONNECTOR_PAYLOAD: 'connector_payload',
  EXPORT_REQUEST: 'export_request',
  PSEUDONYM_BINDING: 'pseudonym_binding',
  AUDIT_EVENT: 'audit_event',
  KEY_REFERENCE: 'key_reference',
  POLICY_CONFIG: 'policy_config',
});

const allow = (id, roles, actions, resourceTypes, purposes, reasonCode) => ({
  id,
  effect: POLICY_EFFECT.ALLOW,
  reasonCode,
  match: {
    roles,
    actions,
    resourceTypes,
    purposes,
  },
});

const deny = (id, roles, actions, resourceTypes, purposes, reasonCode) => ({
  id,
  effect: POLICY_EFFECT.DENY_FINAL,
  reasonCode,
  match: {
    roles,
    actions,
    resourceTypes,
    purposes,
  },
});

/**
 * Source-controlled baseline policy bundle.
 *
 * This is intentionally conservative. A jurisdiction or deployment may add
 * narrower ALLOW rules, but should not weaken the explicit DENY rules without
 * a reviewed policy-version change.
 */
export const CORE_ACCESS_RULES = Object.freeze([
  allow(
    'physician-read-identity-for-treatment',
    [ROLE_CODE.PHYSICIAN],
    ['read'],
    [RESOURCE_TYPE.IDENTITY_SUMMARY],
    [PURPOSE.TREATMENT],
    'PHYSICIAN_TREATMENT_IDENTITY',
  ),
  allow(
    'physician-read-clinical-for-treatment',
    [ROLE_CODE.PHYSICIAN],
    ['read'],
    [
      RESOURCE_TYPE.CLINICAL_RECORD,
      RESOURCE_TYPE.ENCOUNTER,
      RESOURCE_TYPE.LAB_ORDER,
      RESOURCE_TYPE.LAB_RESULT,
    ],
    [PURPOSE.TREATMENT],
    'PHYSICIAN_TREATMENT_READ',
  ),
  allow(
    'physician-write-clinical-for-treatment',
    [ROLE_CODE.PHYSICIAN],
    ['create', 'write', 'update'],
    [
      RESOURCE_TYPE.CLINICAL_RECORD,
      RESOURCE_TYPE.ENCOUNTER,
      RESOURCE_TYPE.LAB_ORDER,
    ],
    [PURPOSE.TREATMENT],
    'PHYSICIAN_TREATMENT_WRITE',
  ),

  allow(
    'assistant-read-identity-administration',
    [ROLE_CODE.MEDICAL_ASSISTANT],
    ['read'],
    [RESOURCE_TYPE.IDENTITY_SUMMARY, RESOURCE_TYPE.ADMINISTRATIVE_RECORD],
    [PURPOSE.ADMINISTRATION, PURPOSE.CARE_COORDINATION],
    'ASSISTANT_MINIMUM_NECESSARY',
  ),
  allow(
    'assistant-write-administration',
    [ROLE_CODE.MEDICAL_ASSISTANT],
    ['create', 'write', 'update'],
    [RESOURCE_TYPE.ADMINISTRATIVE_RECORD],
    [PURPOSE.ADMINISTRATION, PURPOSE.CARE_COORDINATION],
    'ASSISTANT_ADMIN_WRITE',
  ),

  allow(
    'laboratory-read-orders',
    [ROLE_CODE.LABORATORY_SERVICE],
    ['read'],
    [RESOURCE_TYPE.LAB_ORDER],
    [PURPOSE.LABORATORY_PROCESSING],
    'LAB_ORDER_PROCESSING',
  ),
  allow(
    'laboratory-write-results',
    [ROLE_CODE.LABORATORY_SERVICE],
    ['create', 'write', 'update'],
    [RESOURCE_TYPE.LAB_RESULT],
    [PURPOSE.LABORATORY_PROCESSING],
    'LAB_RESULT_PROCESSING',
  ),

  allow(
    'local-connector-execute-jobs',
    [ROLE_CODE.LOCAL_CONNECTOR],
    ['execute'],
    [RESOURCE_TYPE.CONNECTOR_JOB],
    [PURPOSE.DEVICE_INTEGRATION],
    'CONNECTOR_ALLOWLISTED_JOB',
  ),
  allow(
    'local-connector-handle-payload',
    [ROLE_CODE.LOCAL_CONNECTOR],
    ['read', 'write'],
    [RESOURCE_TYPE.CONNECTOR_PAYLOAD],
    [PURPOSE.DEVICE_INTEGRATION],
    'CONNECTOR_MINIMUM_PAYLOAD',
  ),

  allow(
    'ai-read-minimized-context',
    [ROLE_CODE.AI_SERVICE],
    ['read'],
    [RESOURCE_TYPE.AI_CONTEXT],
    [PURPOSE.CLINICAL_SUPPORT],
    'AI_MINIMIZED_CONTEXT',
  ),
  deny(
    'ai-no-identity',
    [ROLE_CODE.AI_SERVICE],
    ['*'],
    [RESOURCE_TYPE.IDENTITY_SUMMARY],
    ['*'],
    'AI_IDENTITY_FORBIDDEN',
  ),
  deny(
    'ai-no-reidentification',
    [ROLE_CODE.AI_SERVICE],
    ['reidentify'],
    ['*'],
    ['*'],
    'AI_REIDENTIFICATION_FORBIDDEN',
  ),
  deny(
    'ai-no-export',
    [ROLE_CODE.AI_SERVICE],
    ['export', 'approve_export'],
    ['*'],
    ['*'],
    'AI_EXPORT_FORBIDDEN',
  ),
  deny(
    'ai-no-linkage-material',
    [ROLE_CODE.AI_SERVICE],
    ['*'],
    [RESOURCE_TYPE.PSEUDONYM_BINDING],
    ['*'],
    'AI_LINKAGE_FORBIDDEN',
  ),

  allow(
    'security-admin-read-audit',
    [ROLE_CODE.SECURITY_ADMIN],
    ['read'],
    [RESOURCE_TYPE.AUDIT_EVENT, RESOURCE_TYPE.KEY_REFERENCE, RESOURCE_TYPE.POLICY_CONFIG],
    [PURPOSE.SECURITY_OPERATIONS],
    'SECURITY_ADMIN_METADATA_READ',
  ),
  allow(
    'security-admin-manage-policy',
    [ROLE_CODE.SECURITY_ADMIN],
    ['create', 'write', 'update'],
    [RESOURCE_TYPE.KEY_REFERENCE, RESOURCE_TYPE.POLICY_CONFIG],
    [PURPOSE.SECURITY_OPERATIONS],
    'SECURITY_ADMIN_CONTROL_PLANE',
  ),
  deny(
    'security-admin-no-clinical-content',
    [ROLE_CODE.SECURITY_ADMIN],
    ['*'],
    [RESOURCE_TYPE.CLINICAL_RECORD, RESOURCE_TYPE.ENCOUNTER, RESOURCE_TYPE.LAB_RESULT],
    ['*'],
    'SECURITY_ADMIN_CLINICAL_FORBIDDEN',
  ),
  deny(
    'security-admin-no-identity-content',
    [ROLE_CODE.SECURITY_ADMIN],
    ['*'],
    [RESOURCE_TYPE.IDENTITY_SUMMARY],
    ['*'],
    'SECURITY_ADMIN_IDENTITY_FORBIDDEN',
  ),

  deny(
    'nonhuman-no-emergency-purpose',
    [ROLE_CODE.LABORATORY_SERVICE, ROLE_CODE.LOCAL_CONNECTOR, ROLE_CODE.AI_SERVICE],
    ['*'],
    ['*'],
    [PURPOSE.EMERGENCY_TREATMENT],
    'BREAK_GLASS_HUMAN_ONLY',
  ),
]);

export const ACCESS_MATRIX_VERSION = 'IML-SECURITY-02/0.2.0';
