import test from 'node:test';
import assert from 'node:assert/strict';

import {
  POLICY_EFFECT,
  PolicyDeniedError,
  TechnicalUnavailableError,
  evaluateAccess,
  executeAuthorized,
  executeAiAccessPlan,
  pickAllowedFields,
} from '../src/security/index.js';

const request = {
  principal: {
    type: 'human',
    id: '11111111-1111-4111-8111-111111111111',
    roles: ['physician'],
  },
  action: 'read',
  resource: {
    type: 'clinical_record',
    id: 'patient-opaque-ref',
  },
  purposeOfUse: 'treatment',
  attributes: {
    organisation: 'practice-a',
  },
};

test('policy engine is default deny', () => {
  const decision = evaluateAccess(request, []);

  assert.equal(decision.effect, POLICY_EFFECT.DENY_FINAL);
  assert.equal(decision.reasonCode, 'DEFAULT_DENY');
});

test('deny overrides allow when both rules match', () => {
  const decision = evaluateAccess(request, [
    {
      id: 'allow-physician-treatment',
      effect: POLICY_EFFECT.ALLOW,
      match: {
        roles: ['physician'],
        actions: ['read'],
        resourceTypes: ['clinical_record'],
        purposes: ['treatment'],
      },
    },
    {
      id: 'deny-restricted-organisation',
      effect: 'DENY',
      reasonCode: 'ORGANISATION_BLOCK',
      match: {
        actions: ['read'],
        resourceTypes: ['clinical_record'],
        attributes: {
          organisation: 'practice-a',
        },
      },
    },
  ]);

  assert.equal(decision.effect, POLICY_EFFECT.DENY_FINAL);
  assert.equal(decision.reasonCode, 'ORGANISATION_BLOCK');
  assert.equal(decision.matchedRuleId, 'deny-restricted-organisation');
});

test('authorized operation executes exactly once', async () => {
  let calls = 0;

  const result = await executeAuthorized(
    { effect: POLICY_EFFECT.ALLOW },
    async () => {
      calls += 1;
      return 'ok';
    },
  );

  assert.equal(result, 'ok');
  assert.equal(calls, 1);
});

test('denied operation is never invoked', async () => {
  let calls = 0;

  await assert.rejects(
    () => executeAuthorized(
      { effect: POLICY_EFFECT.DENY_FINAL, reasonCode: 'TEST_DENY' },
      async () => {
        calls += 1;
      },
    ),
    (error) => error instanceof PolicyDeniedError && error.terminal === true,
  );

  assert.equal(calls, 0);
});

test('AI DENY_FINAL is terminal and does not inspect or invoke alternatives', async () => {
  const decisionCalls = [];
  const invokeCalls = [];

  await assert.rejects(
    () => executeAiAccessPlan({
      candidates: ['primary-clinical-source', 'alternate-source', 'web-search'],
      decide: async (candidate) => {
        decisionCalls.push(candidate);
        return {
          effect: POLICY_EFFECT.DENY_FINAL,
          reasonCode: 'MINIMUM_NECESSARY_BLOCK',
        };
      },
      invoke: async (candidate) => {
        invokeCalls.push(candidate);
        return 'should-not-run';
      },
    }),
    (error) => error instanceof PolicyDeniedError && error.terminal === true,
  );

  assert.deepEqual(decisionCalls, ['primary-clinical-source']);
  assert.deepEqual(invokeCalls, []);
});

test('technical unavailability may fall back only after ALLOW', async () => {
  const decisionCalls = [];
  const invokeCalls = [];

  const result = await executeAiAccessPlan({
    candidates: ['source-a', 'source-b'],
    decide: async (candidate) => {
      decisionCalls.push(candidate);
      return {
        effect: POLICY_EFFECT.ALLOW,
        reasonCode: 'APPROVED_SCOPE',
      };
    },
    invoke: async (candidate) => {
      invokeCalls.push(candidate);

      if (candidate === 'source-a') {
        throw new TechnicalUnavailableError('source-a timeout');
      }

      return 'source-b-result';
    },
  });

  assert.equal(result, 'source-b-result');
  assert.deepEqual(decisionCalls, ['source-a', 'source-b']);
  assert.deepEqual(invokeCalls, ['source-a', 'source-b']);
});

test('invalid authorization context is a terminal denial', () => {
  const decision = evaluateAccess({
    principal: { type: 'human', id: 'x', roles: ['physician'] },
    action: 'read',
    resource: { type: 'clinical_record' },
  }, []);

  assert.equal(decision.effect, POLICY_EFFECT.DENY_FINAL);
  assert.equal(decision.reasonCode, 'INVALID_REQUEST_CONTEXT');
  assert.deepEqual(decision.details.missing, ['purposeOfUse']);
});

test('minimum-necessary helper emits only explicit fields', () => {
  const source = {
    age_band: '60-69',
    diagnosis_code: 'N39.0',
    full_name: 'DO NOT EXPORT',
    email: 'DO NOT EXPORT',
  };

  assert.deepEqual(
    pickAllowedFields(source, ['age_band', 'diagnosis_code']),
    {
      age_band: '60-69',
      diagnosis_code: 'N39.0',
    },
  );
});
