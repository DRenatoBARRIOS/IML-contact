export const KEY_BROKER_VERSION = 'IML-SECURITY-04/0.4.0';
export const DATA_CIPHER = 'AES-256-GCM';
export const AES_GCM_KEY_BITS = 256;

export class KeyBrokerError extends Error {
  constructor(message = 'IML Key Broker error', details = {}) {
    super(message);
    this.name = 'KeyBrokerError';
    this.code = 'IML_KEY_BROKER_ERROR';
    this.terminal = true;
    this.details = details;
  }
}

function hasFunction(value, name) {
  return value && typeof value[name] === 'function';
}

export function validateKeyReference(keyReference) {
  const missing = [];

  if (!keyReference?.id) missing.push('id');
  if (!keyReference?.provider) missing.push('provider');
  if (!keyReference?.providerKeyRef) missing.push('providerKeyRef');
  if (!keyReference?.algorithm) missing.push('algorithm');

  if (keyReference?.status && keyReference.status !== 'active' && keyReference.status !== 'rotating') {
    throw new KeyBrokerError('Key reference is not usable', {
      errors: ['KEY_REFERENCE_NOT_ACTIVE'],
      status: keyReference.status,
    });
  }

  if (missing.length > 0) {
    throw new KeyBrokerError('Invalid external key reference', {
      errors: missing.map((field) => `MISSING_KEY_REFERENCE_${field.toUpperCase()}`),
    });
  }

  return keyReference;
}

function validateCryptoKey(cryptoKey, usage) {
  if (!cryptoKey || cryptoKey.type !== 'secret') {
    throw new KeyBrokerError('Provider did not supply a secret CryptoKey', {
      errors: ['INVALID_DATA_KEY'],
    });
  }

  if (cryptoKey.extractable === true) {
    throw new KeyBrokerError('Data key must be non-extractable', {
      errors: ['EXTRACTABLE_DATA_KEY_FORBIDDEN'],
    });
  }

  if (cryptoKey.algorithm?.name !== 'AES-GCM') {
    throw new KeyBrokerError('Data key must use AES-GCM', {
      errors: ['INVALID_DATA_KEY_ALGORITHM'],
    });
  }

  if (Number(cryptoKey.algorithm?.length) !== AES_GCM_KEY_BITS) {
    throw new KeyBrokerError('Data key must be 256 bits', {
      errors: ['INVALID_DATA_KEY_LENGTH'],
    });
  }

  if (!cryptoKey.usages?.includes(usage)) {
    throw new KeyBrokerError('Data key lacks required usage', {
      errors: [`DATA_KEY_USAGE_MISSING:${usage}`],
    });
  }

  return cryptoKey;
}

/**
 * Wrap a provider-specific implementation behind the IML Key Broker contract.
 *
 * The provider must keep KEK material outside PostgreSQL and outside the
 * crypto-envelope module. Plaintext DEKs should be converted immediately to
 * non-extractable AES-GCM CryptoKeys by the provider adapter.
 */
export function createKeyBroker(provider) {
  if (!provider || typeof provider !== 'object') {
    throw new TypeError('key provider must be an object');
  }

  if (!hasFunction(provider, 'withGeneratedDataKey')) {
    throw new TypeError('key provider must implement withGeneratedDataKey()');
  }

  if (!hasFunction(provider, 'withUnwrappedDataKey')) {
    throw new TypeError('key provider must implement withUnwrappedDataKey()');
  }

  return Object.freeze({
    version: KEY_BROKER_VERSION,

    async withGeneratedDataKey(request, callback) {
      if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
      }

      return provider.withGeneratedDataKey(request, async (material) => {
        const keyReference = validateKeyReference(material?.keyReference);
        const cryptoKey = validateCryptoKey(material?.cryptoKey, 'encrypt');

        if (!(material?.wrappedKey instanceof Uint8Array) || material.wrappedKey.byteLength === 0) {
          throw new KeyBrokerError('Provider must return a non-empty wrapped DEK', {
            errors: ['WRAPPED_DEK_REQUIRED'],
          });
        }

        if (!material?.wrapAlgorithm) {
          throw new KeyBrokerError('Provider must identify the wrapping algorithm', {
            errors: ['WRAP_ALGORITHM_REQUIRED'],
          });
        }

        return callback({
          cryptoKey,
          wrappedKey: material.wrappedKey,
          keyReference,
          wrapAlgorithm: material.wrapAlgorithm,
        });
      });
    },

    async withUnwrappedDataKey(request, callback) {
      if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
      }

      validateKeyReference(request?.keyReference);

      return provider.withUnwrappedDataKey(request, async (cryptoKey) => {
        return callback(validateCryptoKey(cryptoKey, 'decrypt'));
      });
    },

    async rewrapDataKey(request) {
      if (!hasFunction(provider, 'rewrapDataKey')) {
        throw new KeyBrokerError('Key provider does not support re-wrapping', {
          errors: ['REWRAP_NOT_SUPPORTED'],
        });
      }

      validateKeyReference(request?.currentKeyReference);
      validateKeyReference(request?.targetKeyReference);

      const result = await provider.rewrapDataKey(request);

      if (!(result?.wrappedKey instanceof Uint8Array) || result.wrappedKey.byteLength === 0) {
        throw new KeyBrokerError('Re-wrap operation returned no wrapped key', {
          errors: ['WRAPPED_DEK_REQUIRED'],
        });
      }

      return {
        wrappedKey: result.wrappedKey,
        keyReference: validateKeyReference(
          result.keyReference ?? request.targetKeyReference,
        ),
        wrapAlgorithm: result.wrapAlgorithm ?? request.wrapAlgorithm,
      };
    },
  });
}
