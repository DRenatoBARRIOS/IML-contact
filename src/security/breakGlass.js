import { POLICY_EFFECT } from './policyEngine.js';
import {
  PURPOSE,
  RESOURCE_TYPE,
  ROLE_CODE,
} from './accessMatrix.js';

export const BREAK_GLASS_MAX_MINUTES = 30;
export const BREAK_GLASS_STEP_UP_MAX_AGE_MINUTES = 5;

function asDate(value, fieldName) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`${fieldName} must be a valid date/time`);
  }

  return date;
}

function newId() {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure random UUID generation is unavailable');
  }

  return globalThis.crypto.randomUUID();
}

export class BreakGlassDeniedError extends Error {
  constructor(message = 'Emergency access denied', details = {}) {
    super(message);
    this.name = 'BreakGlassDeniedError';
    this.code = 'IML_BREAK_GLASS_DENIED';
    this.terminal = true;
    this.details = details;
  }
}

export function validateBreakGlassRequest(request, now = new Date()) {
  const errors = [];
  const current = asDate(now, 'now');

  if (request?.principal?.type !== 'human') {
    errors.push('HUMAN_PRINCIPAL_REQUIRED');
  }

  if (!request?.principal?.roles?.includes(ROLE_CODE.PHYSICIAN)) {
    errors.push('PHYSICIAN_ROLE_REQUIRED');
  }

  if (!request?.principal?.id) {
    errors.push('PRINCIPAL_ID_REQUIRED');
  }

  if (!request?.subjectRef) {
    errors.push('SUBJECT_SCOPE_REQUIRED');
  }

  if (String(request?.justification ?? '').trim().length < 12) {
    errors.push('JUSTIFICATION_REQUIRED');
  }

  if (!request?.stepUpAuth?.method || !request?.stepUpAuth?.authenticatedAt) {
    errors.push('STEP_UP_AUTH_REQUIRED');
  } else {
    const authenticatedAt = asDate(
      request.stepUpAuth.authenticatedAt,
      'stepUpAuth.authenticatedAt',
    );
    const ageMs = current.getTime() - authenticatedAt.getTime();
    const maxAgeMs = BREAK_GLASS_STEP_UP_MAX_AGE_MINUTES * 60_000;

    if (ageMs < -60_000 || ageMs > maxAgeMs) {
      errors.push('STEP_UP_AUTH_STALE');
    }
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}

export function createBreakGlassGrant(request, now = new Date()) {
  const validation = validateBreakGlassRequest(request, now);

  if (!validation.allowed) {
    throw new BreakGlassDeniedError(
      'Emergency access request failed required safeguards',
      { errors: validation.errors },
    );
  }

  const activatedAt = asDate(now, 'now');
  const expiresAt = new Date(
    activatedAt.getTime() + BREAK_GLASS_MAX_MINUTES * 60_000,
  );

  return Object.freeze({
    id: newId(),
    principalId: request.principal.id,
    principalType: 'human',
    roleCode: ROLE_CODE.PHYSICIAN,
    subjectRef: request.subjectRef,
    purposeOfUse: PURPOSE.EMERGENCY_TREATMENT,
    justification: String(request.justification).trim(),
    stepUpAuthMethod: request.stepUpAuth.method,
    stepUpAuthenticatedAt: asDate(
      request.stepUpAuth.authenticatedAt,
      'stepUpAuth.authenticatedAt',
    ).toISOString(),
    activatedAt: activatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    requiresAlert: true,
    requiresPostReview: true,
  });
}

export function validateBreakGlassGrant(grant, context, now = new Date()) {
  const errors = [];
  const current = asDate(now, 'now');

  if (!grant || grant.status !== 'active') {
    errors.push('GRANT_NOT_ACTIVE');
  }

  if (context?.principal?.type !== 'human') {
    errors.push('HUMAN_PRINCIPAL_REQUIRED');
  }

  if (context?.principal?.id !== grant?.principalId) {
    errors.push('PRINCIPAL_MISMATCH');
  }

  if (!context?.principal?.roles?.includes(ROLE_CODE.PHYSICIAN)) {
    errors.push('PHYSICIAN_ROLE_REQUIRED');
  }

  if (context?.subjectRef !== grant?.subjectRef) {
    errors.push('SUBJECT_SCOPE_MISMATCH');
  }

  if (!context?.breakGlassGrantId || context.breakGlassGrantId !== grant?.id) {
    errors.push('GRANT_CONTEXT_REQUIRED');
  }

  if (!grant?.expiresAt || current >= asDate(grant.expiresAt, 'grant.expiresAt')) {
    errors.push('GRANT_EXPIRED');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Produces the only emergency ALLOW rule in the baseline implementation.
 *
 * It is read-only and subject-scoped by attributes. The caller must validate
 * the grant immediately before evaluating access and must persist the grant,
 * alert and audit trail through the Security Plane.
 */
export function buildBreakGlassReadRule(grant) {
  if (!grant?.id || grant?.principalType !== 'human' || grant?.roleCode !== ROLE_CODE.PHYSICIAN) {
    throw new BreakGlassDeniedError('Invalid emergency grant');
  }

  return {
    id: `break-glass-read:${grant.id}`,
    effect: POLICY_EFFECT.ALLOW,
    reasonCode: 'HUMAN_BREAK_GLASS_READ',
    match: {
      principalTypes: ['human'],
      principalIds: [grant.principalId],
      roles: [ROLE_CODE.PHYSICIAN],
      actions: ['read'],
      resourceTypes: [
        RESOURCE_TYPE.IDENTITY_SUMMARY,
        RESOURCE_TYPE.CLINICAL_RECORD,
        RESOURCE_TYPE.ENCOUNTER,
        RESOURCE_TYPE.LAB_RESULT,
      ],
      purposes: [PURPOSE.EMERGENCY_TREATMENT],
      attributes: {
        breakGlassGrantId: grant.id,
        subjectRef: grant.subjectRef,
      },
    },
  };
}
