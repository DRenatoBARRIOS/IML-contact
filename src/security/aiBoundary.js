import {
  POLICY_EFFECT,
  PolicyDeniedError,
  assertAllowed,
} from './policyEngine.js';

export class TechnicalUnavailableError extends Error {
  constructor(message = 'Authorized resource is technically unavailable', details = {}) {
    super(message);
    this.name = 'TechnicalUnavailableError';
    this.code = 'IML_TECHNICAL_UNAVAILABLE';
    this.details = details;
  }
}

function isTechnicalUnavailable(error) {
  return error instanceof TechnicalUnavailableError ||
    error?.code === 'IML_TECHNICAL_UNAVAILABLE';
}

/**
 * Execute an AI/tool access plan while preserving the IML terminal-denial rule.
 *
 * Rules:
 * - Each candidate must receive an explicit policy decision before invocation.
 * - Any decision other than ALLOW is terminal.
 * - Alternatives are considered only after a technical failure of an already
 *   authorized candidate.
 * - The caller is responsible for ensuring alternatives remain within the
 *   same approved purpose and minimum-necessary scope.
 */
export async function executeAiAccessPlan({
  candidates,
  decide,
  invoke,
  onEvent = () => {},
}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new TypeError('candidates must be a non-empty array');
  }

  if (typeof decide !== 'function' || typeof invoke !== 'function') {
    throw new TypeError('decide and invoke must be functions');
  }

  let lastTechnicalError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const decision = await decide(candidate);

    await onEvent({
      type: 'policy_decision',
      candidate,
      decision,
      index,
    });

    if (!decision || decision.effect !== POLICY_EFFECT.ALLOW) {
      await onEvent({
        type: 'denied_final',
        candidate,
        decision: decision ?? null,
        index,
      });

      throw new PolicyDeniedError(
        'AI access denied: terminal refusal; no alternate route may be attempted',
        {
          candidate,
          decision: decision ?? null,
          index,
        },
      );
    }

    assertAllowed(decision);

    try {
      const result = await invoke(candidate, decision);

      await onEvent({
        type: 'completed',
        candidate,
        decision,
        index,
      });

      return result;
    } catch (error) {
      if (!isTechnicalUnavailable(error)) {
        await onEvent({
          type: 'failed',
          candidate,
          decision,
          index,
          errorCode: error?.code ?? error?.name ?? 'UNKNOWN_ERROR',
        });
        throw error;
      }

      lastTechnicalError = error;

      await onEvent({
        type: 'technical_unavailable',
        candidate,
        decision,
        index,
        errorCode: error.code,
      });

      // A fallback is permitted only because policy already ALLOWED the
      // attempted candidate and the failure was technical, not a refusal.
    }
  }

  throw lastTechnicalError ?? new TechnicalUnavailableError(
    'No authorized AI/tool candidate completed successfully',
  );
}
