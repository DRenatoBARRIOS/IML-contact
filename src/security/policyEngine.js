export const POLICY_EFFECT = Object.freeze({
  ALLOW: 'ALLOW',
  DENY_FINAL: 'DENY_FINAL',
});

export class PolicyDeniedError extends Error {
  constructor(message = 'Access denied by IML policy', details = {}) {
    super(message);
    this.name = 'PolicyDeniedError';
    this.code = 'IML_POLICY_DENY_FINAL';
    this.terminal = true;
    this.details = details;
  }
}

function arrayify(value) {
  if (value == null) return null;
  return Array.isArray(value) ? value : [value];
}

function matchesOne(expected, actual) {
  const values = arrayify(expected);
  if (values == null || values.length === 0) return true;
  return values.includes('*') || values.includes(actual);
}

function matchesAny(expected, actualValues = []) {
  const values = arrayify(expected);
  if (values == null || values.length === 0) return true;
  if (values.includes('*')) return true;
  return actualValues.some((value) => values.includes(value));
}

function matchesAttributes(expected = {}, actual = {}) {
  return Object.entries(expected).every(([key, expectedValue]) => {
    const actualValue = actual[key];

    if (Array.isArray(expectedValue)) {
      return expectedValue.includes(actualValue);
    }

    return expectedValue === actualValue;
  });
}

function ruleMatches(rule, request) {
  const match = rule.match ?? {};

  return (
    matchesOne(match.principalTypes, request.principal?.type) &&
    matchesOne(match.principalIds, request.principal?.id) &&
    matchesAny(match.roles, request.principal?.roles ?? []) &&
    matchesOne(match.actions, request.action) &&
    matchesOne(match.resourceTypes, request.resource?.type) &&
    matchesOne(match.resourceIds, request.resource?.id) &&
    matchesOne(match.purposes, request.purposeOfUse) &&
    matchesAttributes(match.attributes, request.attributes ?? {})
  );
}

function validateRequest(request) {
  const missing = [];

  if (!request?.principal?.type) missing.push('principal.type');
  if (!request?.principal?.id) missing.push('principal.id');
  if (!request?.action) missing.push('action');
  if (!request?.resource?.type) missing.push('resource.type');
  if (!request?.purposeOfUse) missing.push('purposeOfUse');

  return missing;
}

/**
 * Evaluate one authorization request.
 *
 * Invariants:
 * - default deny;
 * - deny overrides allow;
 * - every denial is DENY_FINAL;
 * - this function never searches for alternate resources or credentials.
 */
export function evaluateAccess(request, rules = [], policyVersion = 'IML-SECURITY-01/0.1.0') {
  const missing = validateRequest(request);

  if (missing.length > 0) {
    return {
      effect: POLICY_EFFECT.DENY_FINAL,
      reasonCode: 'INVALID_REQUEST_CONTEXT',
      policyVersion,
      matchedRuleId: null,
      details: { missing },
    };
  }

  const matchingRules = rules.filter((rule) => ruleMatches(rule, request));

  const denyRule = matchingRules.find(
    (rule) => rule.effect === 'DENY' || rule.effect === POLICY_EFFECT.DENY_FINAL,
  );

  if (denyRule) {
    return {
      effect: POLICY_EFFECT.DENY_FINAL,
      reasonCode: denyRule.reasonCode ?? 'EXPLICIT_DENY',
      policyVersion,
      matchedRuleId: denyRule.id ?? null,
      details: {},
    };
  }

  const allowRule = matchingRules.find((rule) => rule.effect === POLICY_EFFECT.ALLOW);

  if (allowRule) {
    return {
      effect: POLICY_EFFECT.ALLOW,
      reasonCode: allowRule.reasonCode ?? 'EXPLICIT_ALLOW',
      policyVersion,
      matchedRuleId: allowRule.id ?? null,
      details: {},
    };
  }

  return {
    effect: POLICY_EFFECT.DENY_FINAL,
    reasonCode: 'DEFAULT_DENY',
    policyVersion,
    matchedRuleId: null,
    details: {},
  };
}

export function assertAllowed(decision) {
  if (!decision || decision.effect !== POLICY_EFFECT.ALLOW) {
    throw new PolicyDeniedError('IML policy denied access', {
      decision: decision ?? null,
    });
  }

  return decision;
}

/**
 * Execute an operation only after an ALLOW decision.
 *
 * Deliberately has no fallback callback. A denied operation cannot invoke
 * alternate tools, sources, identities, credentials or data paths.
 */
export async function executeAuthorized(decision, operation) {
  assertAllowed(decision);

  if (typeof operation !== 'function') {
    throw new TypeError('operation must be a function');
  }

  return operation();
}

/**
 * Minimum-necessary helper for outbound contexts.
 * Only explicitly listed top-level fields are copied.
 */
export function pickAllowedFields(input, allowedFields = []) {
  if (!input || typeof input !== 'object') return {};

  const output = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      output[field] = input[field];
    }
  }

  return output;
}
