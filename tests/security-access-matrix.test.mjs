import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACCESS_MATRIX_VERSION,
  BREAK_GLASS_MAX_MINUTES,
  BreakGlassDeniedError,
  CORE_ACCESS_RULES,
  POLICY_EFFECT,
  PURPOSE,
  RESOURCE_TYPE,
  ROLE_CODE,
  buildBreakGlassReadRule,
  createBreakGlassGrant,
  evaluateAccess,
  validateBreakGlassGrant,
} from '../src/security/index.js';

const physician = {
  type: 'human',
  id: '11111111-1111-4111-8111-111111111111',
  roles: [ROLE_CODE.PHYSICIAN],
};

test('canonical access matrix has a version', () => {
  assert.equal(ACCESS_MATRIX_VERSION, 'IML-SECURITY-02/0.2.0');
});

test('physician can read clinical record for treatment', () => {
  const decision = evaluateAccess({
    principal: physician,
    action: 'read',
    resource: { type: RESOURCE_TYPE.CLINICAL_RECORD, id: 'subject-a' },
    purposeOfUse: PURPOSE.TREATMENT,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  assert.equal(decision.effect, POLICY_EFFECT.ALLOW);
});

test('medical assistant has no default unrestricted clinical-record access', () => {
  const decision = evaluateAccess({
    principal: {
      type: 'human',
      id: '22222222-2222-4222-8222-222222222222',
      roles: [ROLE_CODE.MEDICAL_ASSISTANT],
    },
    action: 'read',
    resource: { type: RESOURCE_TYPE.CLINICAL_RECORD, id: 'subject-a' },
    purposeOfUse: PURPOSE.CARE_COORDINATION,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  assert.equal(decision.effect, POLICY_EFFECT.DENY_FINAL);
  assert.equal(decision.reasonCode, 'DEFAULT_DENY');
});

test('laboratory service is limited to laboratory workflow', () => {
  const principal = {
    type: 'service',
    id: '33333333-3333-4333-8333-333333333333',
    roles: [ROLE_CODE.LABORATORY_SERVICE],
  };

  const allowed = evaluateAccess({
    principal,
    action: 'read',
    resource: { type: RESOURCE_TYPE.LAB_ORDER, id: 'order-a' },
    purposeOfUse: PURPOSE.LABORATORY_PROCESSING,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  const denied = evaluateAccess({
    principal,
    action: 'read',
    resource: { type: RESOURCE_TYPE.CLINICAL_RECORD, id: 'subject-a' },
    purposeOfUse: PURPOSE.LABORATORY_PROCESSING,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  assert.equal(allowed.effect, POLICY_EFFECT.ALLOW);
  assert.equal(denied.effect, POLICY_EFFECT.DENY_FINAL);
});

test('AI may read minimized AI context but cannot read identity', () => {
  const principal = {
    type: 'ai_agent',
    id: '44444444-4444-4444-8444-444444444444',
    roles: [ROLE_CODE.AI_SERVICE],
  };

  const contextDecision = evaluateAccess({
    principal,
    action: 'read',
    resource: { type: RESOURCE_TYPE.AI_CONTEXT, id: 'ctx-a' },
    purposeOfUse: PURPOSE.CLINICAL_SUPPORT,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  const identityDecision = evaluateAccess({
    principal,
    action: 'read',
    resource: { type: RESOURCE_TYPE.IDENTITY_SUMMARY, id: 'subject-a' },
    purposeOfUse: PURPOSE.CLINICAL_SUPPORT,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  assert.equal(contextDecision.effect, POLICY_EFFECT.ALLOW);
  assert.equal(identityDecision.effect, POLICY_EFFECT.DENY_FINAL);
  assert.equal(identityDecision.reasonCode, 'AI_IDENTITY_FORBIDDEN');
});

test('AI cannot re-identify or export', () => {
  const principal = {
    type: 'ai_agent',
    id: '44444444-4444-4444-8444-444444444444',
    roles: [ROLE_CODE.AI_SERVICE],
  };

  for (const action of ['reidentify', 'export']) {
    const decision = evaluateAccess({
      principal,
      action,
      resource: { type: RESOURCE_TYPE.AI_CONTEXT, id: 'ctx-a' },
      purposeOfUse: PURPOSE.CLINICAL_SUPPORT,
    }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

    assert.equal(decision.effect, POLICY_EFFECT.DENY_FINAL);
  }
});

test('security administrator has no implicit clinical access', () => {
  const decision = evaluateAccess({
    principal: {
      type: 'human',
      id: '55555555-5555-4555-8555-555555555555',
      roles: [ROLE_CODE.SECURITY_ADMIN],
    },
    action: 'read',
    resource: { type: RESOURCE_TYPE.CLINICAL_RECORD, id: 'subject-a' },
    purposeOfUse: PURPOSE.SECURITY_OPERATIONS,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  assert.equal(decision.effect, POLICY_EFFECT.DENY_FINAL);
  assert.equal(decision.reasonCode, 'SECURITY_ADMIN_CLINICAL_FORBIDDEN');
});

test('non-human principals cannot use emergency purpose', () => {
  const decision = evaluateAccess({
    principal: {
      type: 'ai_agent',
      id: '44444444-4444-4444-8444-444444444444',
      roles: [ROLE_CODE.AI_SERVICE],
    },
    action: 'read',
    resource: { type: RESOURCE_TYPE.AI_CONTEXT, id: 'ctx-a' },
    purposeOfUse: PURPOSE.EMERGENCY_TREATMENT,
  }, CORE_ACCESS_RULES, ACCESS_MATRIX_VERSION);

  assert.equal(decision.effect, POLICY_EFFECT.DENY_FINAL);
  assert.equal(decision.reasonCode, 'BREAK_GLASS_HUMAN_ONLY');
});

test('break-glass requires recent step-up MFA and meaningful justification', () => {
  const now = new Date('2026-09-25T12:00:00Z');

  assert.throws(
    () => createBreakGlassGrant({
      principal: physician,
      subjectRef: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      justification: 'urgent',
      stepUpAuth: {
        method: 'webauthn',
        authenticatedAt: '2026-09-25T11:50:00Z',
      },
    }, now),
    (error) => error instanceof BreakGlassDeniedError && error.terminal === true,
  );
});

test('valid break-glass grant is human-only, subject-scoped and maximum 30 minutes', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const subjectRef = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const grant = createBreakGlassGrant({
    principal: physician,
    subjectRef,
    justification: 'Emergency treatment requires immediate chart review',
    stepUpAuth: {
      method: 'webauthn',
      authenticatedAt: '2026-09-25T11:58:00Z',
    },
  }, now);

  assert.equal(grant.principalType, 'human');
  assert.equal(grant.subjectRef, subjectRef);
  assert.equal(grant.requiresAlert, true);
  assert.equal(grant.requiresPostReview, true);

  const durationMinutes = (
    new Date(grant.expiresAt).getTime() - new Date(grant.activatedAt).getTime()
  ) / 60_000;
  assert.equal(durationMinutes, BREAK_GLASS_MAX_MINUTES);

  const validation = validateBreakGlassGrant(grant, {
    principal: physician,
    subjectRef,
    breakGlassGrantId: grant.id,
  }, new Date('2026-09-25T12:10:00Z'));

  assert.equal(validation.valid, true);
});

test('break-glass rule cannot be reused for another patient', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const subjectRef = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const grant = createBreakGlassGrant({
    principal: physician,
    subjectRef,
    justification: 'Emergency treatment requires immediate chart review',
    stepUpAuth: {
      method: 'webauthn',
      authenticatedAt: '2026-09-25T11:58:00Z',
    },
  }, now);

  const rule = buildBreakGlassReadRule(grant);

  const correctPatient = evaluateAccess({
    principal: physician,
    action: 'read',
    resource: { type: RESOURCE_TYPE.CLINICAL_RECORD, id: subjectRef },
    purposeOfUse: PURPOSE.EMERGENCY_TREATMENT,
    attributes: {
      breakGlassGrantId: grant.id,
      subjectRef,
    },
  }, [...CORE_ACCESS_RULES, rule], ACCESS_MATRIX_VERSION);

  const wrongPatient = evaluateAccess({
    principal: physician,
    action: 'read',
    resource: {
      type: RESOURCE_TYPE.CLINICAL_RECORD,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    },
    purposeOfUse: PURPOSE.EMERGENCY_TREATMENT,
    attributes: {
      breakGlassGrantId: grant.id,
      subjectRef: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    },
  }, [...CORE_ACCESS_RULES, rule], ACCESS_MATRIX_VERSION);

  assert.equal(correctPatient.effect, POLICY_EFFECT.ALLOW);
  assert.equal(wrongPatient.effect, POLICY_EFFECT.DENY_FINAL);
});

test('AI cannot create a break-glass grant', () => {
  const now = new Date('2026-09-25T12:00:00Z');

  assert.throws(
    () => createBreakGlassGrant({
      principal: {
        type: 'ai_agent',
        id: '44444444-4444-4444-8444-444444444444',
        roles: [ROLE_CODE.AI_SERVICE],
      },
      subjectRef: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      justification: 'Emergency treatment requires immediate chart review',
      stepUpAuth: {
        method: 'service-token',
        authenticatedAt: '2026-09-25T11:59:00Z',
      },
    }, now),
    (error) => error instanceof BreakGlassDeniedError,
  );
});
