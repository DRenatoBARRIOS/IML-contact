import {
  DATA_CLASSIFICATION,
  classificationPolicy,
  isGenericExportAllowed,
  requiresEncryptedExport,
} from './dataClassification.js';

export const EXPORT_POLICY_VERSION = 'IML-SECURITY-03/0.3.0';

export class ExportDeniedError extends Error {
  constructor(message = 'Export denied by IML security policy', details = {}) {
    super(message);
    this.name = 'ExportDeniedError';
    this.code = 'IML_EXPORT_DENIED';
    this.terminal = true;
    this.details = details;
  }
}

function asDate(value, fieldName) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`${fieldName} must be a valid date/time`);
  }

  return date;
}

function normalizeAuthorization(authorization) {
  return {
    ...authorization,
    fieldAllowlist: Array.isArray(authorization?.fieldAllowlist)
      ? authorization.fieldAllowlist
      : [],
    allowedClassifications: Array.isArray(authorization?.allowedClassifications)
      ? authorization.allowedClassifications
      : [],
  };
}

export function validateExportAuthorization(
  authorization,
  { principal, recordCount, destinationClass, now = new Date() } = {},
) {
  const auth = normalizeAuthorization(authorization);
  const errors = [];
  const current = asDate(now, 'now');

  if (!principal?.type || !principal?.id) {
    errors.push('PRINCIPAL_REQUIRED');
  }

  if (principal?.type === 'ai_agent') {
    errors.push('AI_EXPORT_FORBIDDEN');
  }

  if (auth.status !== 'approved') {
    errors.push('EXPORT_NOT_APPROVED');
  }

  if (!auth.id) {
    errors.push('AUTHORIZATION_ID_REQUIRED');
  }

  if (!auth.purposeOfUse) {
    errors.push('PURPOSE_REQUIRED');
  }

  if (auth.expiresAt && current >= asDate(auth.expiresAt, 'authorization.expiresAt')) {
    errors.push('AUTHORIZATION_EXPIRED');
  }

  if (!Number.isInteger(auth.maxRecords) || auth.maxRecords <= 0) {
    errors.push('MAX_RECORDS_REQUIRED');
  }

  if (!Number.isInteger(recordCount) || recordCount < 0) {
    errors.push('VALID_RECORD_COUNT_REQUIRED');
  } else if (Number.isInteger(auth.maxRecords) && recordCount > auth.maxRecords) {
    errors.push('EXPORT_VOLUME_EXCEEDED');
  }

  if (auth.fieldAllowlist.length === 0) {
    errors.push('FIELD_ALLOWLIST_REQUIRED');
  }

  if (auth.allowedClassifications.length === 0) {
    errors.push('CLASSIFICATION_SCOPE_REQUIRED');
  }

  if (auth.destinationClass && destinationClass !== auth.destinationClass) {
    errors.push('DESTINATION_CLASS_MISMATCH');
  }

  for (const classification of auth.allowedClassifications) {
    const policy = classificationPolicy(classification);

    if (!policy) {
      errors.push(`UNKNOWN_CLASSIFICATION:${classification}`);
      continue;
    }

    if (!policy.genericExportAllowed) {
      errors.push(`GENERIC_EXPORT_FORBIDDEN:${classification}`);
    }
  }

  if (
    requiresEncryptedExport(auth.allowedClassifications)
    && auth.requiresEncryption !== true
  ) {
    errors.push('ENCRYPTION_REQUIRED');
  }

  return {
    allowed: errors.length === 0,
    errors,
    authorization: auth,
  };
}

export function prepareExportRows({
  authorization,
  principal,
  records,
  fieldPolicy,
  destinationClass,
  now = new Date(),
}) {
  if (!Array.isArray(records)) {
    throw new TypeError('records must be an array');
  }

  if (!fieldPolicy || typeof fieldPolicy !== 'object') {
    throw new TypeError('fieldPolicy must be an object');
  }

  const validation = validateExportAuthorization(authorization, {
    principal,
    recordCount: records.length,
    destinationClass,
    now,
  });

  if (!validation.allowed) {
    throw new ExportDeniedError(
      'Export authorization failed required safeguards',
      { errors: validation.errors },
    );
  }

  const auth = validation.authorization;
  const selectedFields = [];

  for (const field of auth.fieldAllowlist) {
    const classification = fieldPolicy[field];

    if (!classification) {
      throw new ExportDeniedError('Export field has no classification', {
        errors: [`UNCLASSIFIED_FIELD:${field}`],
      });
    }

    if (!isGenericExportAllowed(classification)) {
      throw new ExportDeniedError('Restricted data cannot use generic export', {
        errors: [`GENERIC_EXPORT_FORBIDDEN:${classification}`],
        field,
      });
    }

    if (!auth.allowedClassifications.includes(classification)) {
      throw new ExportDeniedError('Field classification exceeds authorization', {
        errors: [`CLASSIFICATION_NOT_AUTHORIZED:${classification}`],
        field,
      });
    }

    selectedFields.push(field);
  }

  const rows = records.map((record) => {
    const output = {};

    for (const field of selectedFields) {
      if (Object.prototype.hasOwnProperty.call(record, field)) {
        output[field] = record[field];
      }
    }

    return output;
  });

  const classifications = [
    ...new Set(selectedFields.map((field) => fieldPolicy[field])),
  ];

  return {
    authorizationId: auth.id,
    policyVersion: EXPORT_POLICY_VERSION,
    purposeOfUse: auth.purposeOfUse,
    destinationClass,
    fields: selectedFields,
    classifications,
    sensitive: requiresEncryptedExport(classifications),
    rows,
  };
}

/**
 * Controlled export execution.
 *
 * For PERSONAL/HEALTH data, raw rows are never handed directly to deliver().
 * They must first pass through the provided encrypt() implementation.
 */
export async function executeControlledExport({
  authorization,
  principal,
  records,
  fieldPolicy,
  destinationClass,
  encrypt,
  deliver,
  onEvent = () => {},
  now = new Date(),
}) {
  if (typeof deliver !== 'function') {
    throw new TypeError('deliver must be a function');
  }

  const prepared = prepareExportRows({
    authorization,
    principal,
    records,
    fieldPolicy,
    destinationClass,
    now,
  });

  await onEvent({
    type: 'export_started',
    authorizationId: prepared.authorizationId,
    recordCount: prepared.rows.length,
    fields: prepared.fields,
  });

  let artifact = prepared.rows;

  if (prepared.sensitive) {
    if (typeof encrypt !== 'function') {
      throw new ExportDeniedError(
        'Sensitive export requires encryption before delivery',
        { errors: ['ENCRYPTION_HANDLER_REQUIRED'] },
      );
    }

    artifact = await encrypt(prepared.rows, {
      authorizationId: prepared.authorizationId,
      classifications: prepared.classifications,
    });

    if (artifact == null || artifact === prepared.rows) {
      throw new ExportDeniedError(
        'Encryption handler did not produce a distinct export artifact',
        { errors: ['ENCRYPTION_NOT_APPLIED'] },
      );
    }

    await onEvent({
      type: 'export_encrypted',
      authorizationId: prepared.authorizationId,
    });
  }

  const receipt = await deliver(artifact, {
    authorizationId: prepared.authorizationId,
    destinationClass,
    sensitive: prepared.sensitive,
  });

  await onEvent({
    type: 'export_delivered',
    authorizationId: prepared.authorizationId,
    recordCount: prepared.rows.length,
  });

  return {
    authorizationId: prepared.authorizationId,
    recordCount: prepared.rows.length,
    fields: prepared.fields,
    classifications: prepared.classifications,
    sensitive: prepared.sensitive,
    receipt,
  };
}

export const GENERIC_EXPORT_FORBIDDEN_CLASSIFICATIONS = Object.freeze([
  DATA_CLASSIFICATION.RESTRICTED_IDENTITY,
  DATA_CLASSIFICATION.LINKAGE_RESTRICTED,
  DATA_CLASSIFICATION.SECRET_MATERIAL,
]);
