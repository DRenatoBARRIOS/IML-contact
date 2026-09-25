import {
  DATA_CIPHER,
  KeyBrokerError,
} from './keyBroker.js';

export const CRYPTO_ENVELOPE_VERSION = 'IML-CRYPTO-01';
export const AES_GCM_NONCE_BYTES = 12;
export const AES_GCM_TAG_BITS = 128;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Web Crypto API is unavailable');
  }

  return globalThis.crypto;
}

function toUint8Array(value, fieldName) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === 'string') return encoder.encode(value);

  throw new TypeError(`${fieldName} must be a string, ArrayBuffer or Uint8Array`);
}

function bytesToBase64Url(bytes) {
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function base64UrlToBytes(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError('base64url value must be a non-empty string');
  }

  const base64 = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  const binary = atob(base64);
  const output = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }

  return output;
}

function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  }

  const keys = Object.keys(value).sort();

  return `{${keys.map((key) => (
    `${JSON.stringify(key)}:${canonicalize(value[key])}`
  )).join(',')}}`;
}

async function sha256Hex(bytes) {
  const crypto = getCrypto();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));

  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function buildAadContext({
  resourceType,
  resourceRef,
  fieldRef = null,
  classification,
  purpose,
  schemaVersion = CRYPTO_ENVELOPE_VERSION,
}) {
  if (!resourceType) throw new TypeError('resourceType is required');
  if (!resourceRef) throw new TypeError('resourceRef is required');
  if (!classification) throw new TypeError('classification is required');
  if (!purpose) throw new TypeError('purpose is required');

  return Object.freeze({
    schemaVersion,
    resourceType,
    resourceRef,
    fieldRef,
    classification,
    purpose,
  });
}

export async function fingerprintAad(aadContext) {
  const canonical = canonicalize(aadContext);
  return sha256Hex(encoder.encode(canonical));
}

/**
 * Encrypt one payload with a provider-generated DEK.
 *
 * The returned object contains ciphertext plus non-secret envelope metadata.
 * It never returns plaintext DEK or KEK material.
 */
export async function encryptEnvelope({
  plaintext,
  aadContext,
  keyPurpose,
  keyBroker,
}) {
  if (!keyBroker?.withGeneratedDataKey) {
    throw new TypeError('keyBroker is required');
  }

  if (!keyPurpose) {
    throw new TypeError('keyPurpose is required');
  }

  const crypto = getCrypto();
  const plaintextBytes = toUint8Array(plaintext, 'plaintext');
  const aadBytes = encoder.encode(canonicalize(aadContext));
  const aadHash = await sha256Hex(aadBytes);
  const nonce = crypto.getRandomValues(new Uint8Array(AES_GCM_NONCE_BYTES));

  return keyBroker.withGeneratedDataKey(
    {
      purpose: keyPurpose,
      aadHash,
      cipherAlgorithm: DATA_CIPHER,
      context: aadContext,
    },
    async ({
      cryptoKey,
      wrappedKey,
      keyReference,
      wrapAlgorithm,
    }) => {
      const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: nonce,
            additionalData: aadBytes,
            tagLength: AES_GCM_TAG_BITS,
          },
          cryptoKey,
          plaintextBytes,
        ),
      );

      return Object.freeze({
        version: CRYPTO_ENVELOPE_VERSION,
        cipherAlgorithm: DATA_CIPHER,
        keyPurpose,
        keyReference: Object.freeze({ ...keyReference }),
        wrapAlgorithm,
        nonce: bytesToBase64Url(nonce),
        wrappedDek: bytesToBase64Url(wrappedKey),
        aadHash,
        ciphertextHash: await sha256Hex(ciphertext),
        ciphertext: bytesToBase64Url(ciphertext),
      });
    },
  );
}

/**
 * Decrypt an envelope only when the caller supplies the same contextual AAD.
 * AES-GCM authentication then protects both ciphertext and context.
 */
export async function decryptEnvelope({
  envelope,
  aadContext,
  keyBroker,
  output = 'bytes',
}) {
  if (!envelope || envelope.version !== CRYPTO_ENVELOPE_VERSION) {
    throw new KeyBrokerError('Unsupported crypto envelope', {
      errors: ['UNSUPPORTED_CRYPTO_ENVELOPE'],
    });
  }

  if (envelope.cipherAlgorithm !== DATA_CIPHER) {
    throw new KeyBrokerError('Unsupported data cipher', {
      errors: ['UNSUPPORTED_DATA_CIPHER'],
    });
  }

  if (!keyBroker?.withUnwrappedDataKey) {
    throw new TypeError('keyBroker is required');
  }

  const aadBytes = encoder.encode(canonicalize(aadContext));
  const aadHash = await sha256Hex(aadBytes);

  if (aadHash !== envelope.aadHash) {
    throw new KeyBrokerError('AAD context does not match ciphertext envelope', {
      errors: ['AAD_CONTEXT_MISMATCH'],
    });
  }

  const nonce = base64UrlToBytes(envelope.nonce);
  const ciphertext = base64UrlToBytes(envelope.ciphertext);
  const ciphertextHash = await sha256Hex(ciphertext);

  if (ciphertextHash !== envelope.ciphertextHash) {
    throw new KeyBrokerError('Ciphertext hash mismatch', {
      errors: ['CIPHERTEXT_HASH_MISMATCH'],
    });
  }

  const wrappedKey = base64UrlToBytes(envelope.wrappedDek);
  const crypto = getCrypto();

  const plaintext = await keyBroker.withUnwrappedDataKey(
    {
      wrappedKey,
      keyReference: envelope.keyReference,
      wrapAlgorithm: envelope.wrapAlgorithm,
      purpose: envelope.keyPurpose,
      aadHash,
      context: aadContext,
    },
    async (cryptoKey) => {
      try {
        return new Uint8Array(
          await crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: nonce,
              additionalData: aadBytes,
              tagLength: AES_GCM_TAG_BITS,
            },
            cryptoKey,
            ciphertext,
          ),
        );
      } catch (error) {
        throw new KeyBrokerError('Authenticated decryption failed', {
          errors: ['AEAD_AUTHENTICATION_FAILED'],
          cause: error?.name ?? 'UNKNOWN',
        });
      }
    },
  );

  if (output === 'text') return decoder.decode(plaintext);
  if (output === 'bytes') return plaintext;

  throw new TypeError('output must be "bytes" or "text"');
}

/**
 * Rotate the KEK reference without decrypting the clinical ciphertext.
 * The provider is responsible for securely re-wrapping the DEK.
 */
export async function rewrapEnvelope({
  envelope,
  targetKeyReference,
  aadContext,
  keyBroker,
}) {
  if (!envelope || envelope.version !== CRYPTO_ENVELOPE_VERSION) {
    throw new KeyBrokerError('Unsupported crypto envelope', {
      errors: ['UNSUPPORTED_CRYPTO_ENVELOPE'],
    });
  }

  const aadHash = await fingerprintAad(aadContext);

  if (aadHash !== envelope.aadHash) {
    throw new KeyBrokerError('AAD context does not match ciphertext envelope', {
      errors: ['AAD_CONTEXT_MISMATCH'],
    });
  }

  const result = await keyBroker.rewrapDataKey({
    wrappedKey: base64UrlToBytes(envelope.wrappedDek),
    currentKeyReference: envelope.keyReference,
    targetKeyReference,
    wrapAlgorithm: envelope.wrapAlgorithm,
    purpose: envelope.keyPurpose,
    aadHash,
    context: aadContext,
  });

  return Object.freeze({
    ...envelope,
    keyReference: Object.freeze({ ...result.keyReference }),
    wrapAlgorithm: result.wrapAlgorithm,
    wrappedDek: bytesToBase64Url(result.wrappedKey),
  });
}
