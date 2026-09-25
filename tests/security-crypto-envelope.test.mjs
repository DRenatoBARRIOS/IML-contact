import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAadContext,
  createKeyBroker,
  decryptEnvelope,
  encryptEnvelope,
  rewrapEnvelope,
  KeyBrokerError,
} from '../src/security/index.js';

const crypto = globalThis.crypto;

function bytesEqual(left, right) {
  if (left.byteLength !== right.byteLength) return false;

  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }

  return true;
}

async function createTestProvider() {
  const keys = new Map();

  async function addKek(id, rawBytes) {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      rawBytes,
      { name: 'AES-KW' },
      false,
      ['wrapKey', 'unwrapKey'],
    );

    const reference = {
      id,
      provider: 'TEST_ONLY',
      providerKeyRef: `test://${id}`,
      algorithm: 'AES-KW-256',
      status: 'active',
    };

    keys.set(id, { cryptoKey, reference });
    return reference;
  }

  const keyA = await addKek(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    new Uint8Array(32).fill(0x11),
  );
  const keyB = await addKek(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    new Uint8Array(32).fill(0x22),
  );

  async function generateDataKey() {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  async function wrapDataKey(dataKey, kek) {
    return new Uint8Array(
      await crypto.subtle.wrapKey(
        'raw',
        dataKey,
        kek,
        { name: 'AES-KW' },
      ),
    );
  }

  async function unwrapDataKey(wrappedKey, kek) {
    return crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      kek,
      { name: 'AES-KW' },
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  function keyByReference(reference) {
    const found = keys.get(reference?.id);
    if (!found) throw new Error('unknown test KEK');
    return found;
  }

  return {
    keyA,
    keyB,
    provider: {
      async withGeneratedDataKey(request, callback) {
        const selected = keyByReference(request?.keyReference ?? keyA);
        const dataKey = await generateDataKey();
        const wrappedKey = await wrapDataKey(dataKey, selected.cryptoKey);

        // Convert to non-extractable before giving it to the IML crypto layer.
        const raw = new Uint8Array(
          await crypto.subtle.exportKey('raw', dataKey),
        );

        try {
          const nonExtractable = await crypto.subtle.importKey(
            'raw',
            raw,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'],
          );

          return callback({
            cryptoKey: nonExtractable,
            wrappedKey,
            keyReference: selected.reference,
            wrapAlgorithm: 'AES-KW-256',
          });
        } finally {
          raw.fill(0);
        }
      },

      async withUnwrappedDataKey(request, callback) {
        const selected = keyByReference(request.keyReference);
        const dataKey = await unwrapDataKey(
          request.wrappedKey,
          selected.cryptoKey,
        );

        return callback(dataKey);
      },

      async rewrapDataKey(request) {
        const current = keyByReference(request.currentKeyReference);
        const target = keyByReference(request.targetKeyReference);
        const dataKey = await unwrapDataKey(
          request.wrappedKey,
          current.cryptoKey,
        );

        return {
          wrappedKey: await wrapDataKey(dataKey, target.cryptoKey),
          keyReference: target.reference,
          wrapAlgorithm: 'AES-KW-256',
        };
      },
    },
  };
}

function clinicalContext(resourceRef = 'opaque-subject-a') {
  return buildAadContext({
    resourceType: 'clinical_record',
    resourceRef,
    fieldRef: 'diagnostic_summary',
    classification: 'HEALTH',
    purpose: 'treatment',
  });
}

test('envelope encryption round-trips without exposing plaintext key material', async () => {
  const { provider } = await createTestProvider();
  const broker = createKeyBroker(provider);
  const context = clinicalContext();

  const envelope = await encryptEnvelope({
    plaintext: 'confidential clinical text',
    aadContext: context,
    keyPurpose: 'clinical',
    keyBroker: broker,
  });

  assert.equal(envelope.cipherAlgorithm, 'AES-256-GCM');
  assert.equal(envelope.keyReference.provider, 'TEST_ONLY');
  assert.equal(typeof envelope.wrappedDek, 'string');
  assert.equal(typeof envelope.ciphertext, 'string');
  assert.equal(Object.hasOwn(envelope, 'plaintextKey'), false);
  assert.equal(Object.hasOwn(envelope, 'dek'), false);
  assert.doesNotMatch(JSON.stringify(envelope), /confidential clinical text/);

  const plaintext = await decryptEnvelope({
    envelope,
    aadContext: context,
    keyBroker: broker,
    output: 'text',
  });

  assert.equal(plaintext, 'confidential clinical text');
});

test('same plaintext encrypts to different ciphertext', async () => {
  const { provider } = await createTestProvider();
  const broker = createKeyBroker(provider);
  const context = clinicalContext();

  const first = await encryptEnvelope({
    plaintext: 'same value',
    aadContext: context,
    keyPurpose: 'clinical',
    keyBroker: broker,
  });

  const second = await encryptEnvelope({
    plaintext: 'same value',
    aadContext: context,
    keyPurpose: 'clinical',
    keyBroker: broker,
  });

  assert.notEqual(first.nonce, second.nonce);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.notEqual(first.wrappedDek, second.wrappedDek);
});

test('ciphertext cannot be moved to another patient context', async () => {
  const { provider } = await createTestProvider();
  const broker = createKeyBroker(provider);
  const envelope = await encryptEnvelope({
    plaintext: 'patient A',
    aadContext: clinicalContext('opaque-subject-a'),
    keyPurpose: 'clinical',
    keyBroker: broker,
  });

  await assert.rejects(
    () => decryptEnvelope({
      envelope,
      aadContext: clinicalContext('opaque-subject-b'),
      keyBroker: broker,
      output: 'text',
    }),
    (error) => (
      error instanceof KeyBrokerError
      && error.details.errors.includes('AAD_CONTEXT_MISMATCH')
    ),
  );
});

test('tampered ciphertext fails before plaintext is returned', async () => {
  const { provider } = await createTestProvider();
  const broker = createKeyBroker(provider);
  const context = clinicalContext();

  const envelope = await encryptEnvelope({
    plaintext: 'protected',
    aadContext: context,
    keyPurpose: 'clinical',
    keyBroker: broker,
  });

  const final = envelope.ciphertext.at(-1);
  const tampered = {
    ...envelope,
    ciphertext: envelope.ciphertext.slice(0, -1) + (final === 'A' ? 'B' : 'A'),
  };

  await assert.rejects(
    () => decryptEnvelope({
      envelope: tampered,
      aadContext: context,
      keyBroker: broker,
      output: 'text',
    }),
    (error) => (
      error instanceof KeyBrokerError
      && error.details.errors.includes('CIPHERTEXT_HASH_MISMATCH')
    ),
  );
});

test('KEK rotation re-wraps DEK without changing clinical ciphertext', async () => {
  const { provider, keyA, keyB } = await createTestProvider();
  const broker = createKeyBroker(provider);
  const context = clinicalContext();

  const envelope = await encryptEnvelope({
    plaintext: 'rotate me without decrypting payload',
    aadContext: context,
    keyPurpose: 'clinical',
    keyBroker: broker,
  });

  assert.equal(envelope.keyReference.id, keyA.id);

  const rotated = await rewrapEnvelope({
    envelope,
    targetKeyReference: keyB,
    aadContext: context,
    keyBroker: broker,
  });

  assert.equal(rotated.keyReference.id, keyB.id);
  assert.notEqual(rotated.wrappedDek, envelope.wrappedDek);
  assert.equal(rotated.ciphertext, envelope.ciphertext);
  assert.equal(rotated.nonce, envelope.nonce);
  assert.equal(rotated.ciphertextHash, envelope.ciphertextHash);

  const plaintext = await decryptEnvelope({
    envelope: rotated,
    aadContext: context,
    keyBroker: broker,
    output: 'text',
  });

  assert.equal(plaintext, 'rotate me without decrypting payload');
});

test('invalid or inactive external key reference is rejected', async () => {
  const { provider } = await createTestProvider();
  const broker = createKeyBroker({
    ...provider,
    async withGeneratedDataKey(request, callback) {
      return provider.withGeneratedDataKey(request, ({ cryptoKey, wrappedKey, keyReference, wrapAlgorithm }) => (
        callback({
          cryptoKey,
          wrappedKey,
          wrapAlgorithm,
          keyReference: {
            ...keyReference,
            status: 'revoked',
          },
        })
      ));
    },
  });

  await assert.rejects(
    () => encryptEnvelope({
      plaintext: 'blocked',
      aadContext: clinicalContext(),
      keyPurpose: 'clinical',
      keyBroker: broker,
    }),
    (error) => (
      error instanceof KeyBrokerError
      && error.details.errors.includes('KEY_REFERENCE_NOT_ACTIVE')
    ),
  );
});
