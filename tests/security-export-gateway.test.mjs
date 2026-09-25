import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DATA_CLASSIFICATION,
  ExportDeniedError,
  executeControlledExport,
  prepareExportRows,
} from '../src/security/index.js';

const physician = {
  type: 'human',
  id: '11111111-1111-4111-8111-111111111111',
  roles: ['physician'],
};

const authorization = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  status: 'approved',
  purposeOfUse: 'care_quality_review',
  maxRecords: 2,
  destinationClass: 'controlled_research',
  fieldAllowlist: ['age_band', 'diagnosis_code'],
  allowedClassifications: [
    DATA_CLASSIFICATION.PERSONAL,
    DATA_CLASSIFICATION.HEALTH,
  ],
  requiresEncryption: true,
  expiresAt: '2026-09-26T00:00:00Z',
};

const fieldPolicy = {
  age_band: DATA_CLASSIFICATION.PERSONAL,
  diagnosis_code: DATA_CLASSIFICATION.HEALTH,
  full_name: DATA_CLASSIFICATION.RESTRICTED_IDENTITY,
  subject_ref: DATA_CLASSIFICATION.LINKAGE_RESTRICTED,
};

test('export gateway emits only explicitly allowlisted fields', () => {
  const prepared = prepareExportRows({
    authorization,
    principal: physician,
    records: [{
      age_band: '60-69',
      diagnosis_code: 'N39.0',
      full_name: 'DO NOT EXPORT',
      subject_ref: 'DO NOT EXPORT',
    }],
    fieldPolicy,
    destinationClass: 'controlled_research',
    now: new Date('2026-09-25T12:00:00Z'),
  });

  assert.deepEqual(prepared.rows, [{
    age_band: '60-69',
    diagnosis_code: 'N39.0',
  }]);
  assert.equal(prepared.sensitive, true);
});

test('restricted identity cannot pass through generic export even if allowlisted', () => {
  const unsafeAuthorization = {
    ...authorization,
    fieldAllowlist: ['age_band', 'full_name'],
    allowedClassifications: [
      ...authorization.allowedClassifications,
      DATA_CLASSIFICATION.RESTRICTED_IDENTITY,
    ],
  };

  assert.throws(
    () => prepareExportRows({
      authorization: unsafeAuthorization,
      principal: physician,
      records: [{ age_band: '60-69', full_name: 'Patient Name' }],
      fieldPolicy,
      destinationClass: 'controlled_research',
      now: new Date('2026-09-25T12:00:00Z'),
    }),
    (error) => (
      error instanceof ExportDeniedError
      && error.details.errors.some((item) => item.includes('GENERIC_EXPORT_FORBIDDEN'))
    ),
  );
});

test('export volume cannot exceed explicit authorization', () => {
  assert.throws(
    () => prepareExportRows({
      authorization,
      principal: physician,
      records: [
        { age_band: '60-69', diagnosis_code: 'N39.0' },
        { age_band: '70-79', diagnosis_code: 'N39.0' },
        { age_band: '80-89', diagnosis_code: 'N39.0' },
      ],
      fieldPolicy,
      destinationClass: 'controlled_research',
      now: new Date('2026-09-25T12:00:00Z'),
    }),
    (error) => (
      error instanceof ExportDeniedError
      && error.details.errors.includes('EXPORT_VOLUME_EXCEEDED')
    ),
  );
});

test('expired export authorization is terminal', () => {
  assert.throws(
    () => prepareExportRows({
      authorization: {
        ...authorization,
        expiresAt: '2026-09-24T00:00:00Z',
      },
      principal: physician,
      records: [{ age_band: '60-69', diagnosis_code: 'N39.0' }],
      fieldPolicy,
      destinationClass: 'controlled_research',
      now: new Date('2026-09-25T12:00:00Z'),
    }),
    (error) => (
      error instanceof ExportDeniedError
      && error.details.errors.includes('AUTHORIZATION_EXPIRED')
    ),
  );
});

test('AI principal cannot execute export', () => {
  assert.throws(
    () => prepareExportRows({
      authorization,
      principal: {
        type: 'ai_agent',
        id: '44444444-4444-4444-8444-444444444444',
        roles: ['ai_service'],
      },
      records: [{ age_band: '60-69', diagnosis_code: 'N39.0' }],
      fieldPolicy,
      destinationClass: 'controlled_research',
      now: new Date('2026-09-25T12:00:00Z'),
    }),
    (error) => (
      error instanceof ExportDeniedError
      && error.details.errors.includes('AI_EXPORT_FORBIDDEN')
    ),
  );
});

test('sensitive export is encrypted before delivery', async () => {
  const calls = [];

  const result = await executeControlledExport({
    authorization,
    principal: physician,
    records: [{ age_band: '60-69', diagnosis_code: 'N39.0' }],
    fieldPolicy,
    destinationClass: 'controlled_research',
    now: new Date('2026-09-25T12:00:00Z'),
    encrypt: async (rows) => {
      calls.push('encrypt');
      return JSON.stringify({ encrypted: true, count: rows.length });
    },
    deliver: async (artifact) => {
      calls.push('deliver');
      assert.equal(typeof artifact, 'string');
      assert.match(artifact, /encrypted/);
      return { delivered: true };
    },
  });

  assert.deepEqual(calls, ['encrypt', 'deliver']);
  assert.equal(result.recordCount, 1);
  assert.equal(result.sensitive, true);
});

test('sensitive export without encryption never reaches delivery', async () => {
  let delivered = false;

  await assert.rejects(
    () => executeControlledExport({
      authorization,
      principal: physician,
      records: [{ age_band: '60-69', diagnosis_code: 'N39.0' }],
      fieldPolicy,
      destinationClass: 'controlled_research',
      now: new Date('2026-09-25T12:00:00Z'),
      deliver: async () => {
        delivered = true;
      },
    }),
    (error) => (
      error instanceof ExportDeniedError
      && error.details.errors.includes('ENCRYPTION_HANDLER_REQUIRED')
    ),
  );

  assert.equal(delivered, false);
});

test('an unclassified allowlisted field is denied', () => {
  assert.throws(
    () => prepareExportRows({
      authorization: {
        ...authorization,
        fieldAllowlist: ['age_band', 'mystery_field'],
      },
      principal: physician,
      records: [{ age_band: '60-69', mystery_field: 'x' }],
      fieldPolicy,
      destinationClass: 'controlled_research',
      now: new Date('2026-09-25T12:00:00Z'),
    }),
    (error) => (
      error instanceof ExportDeniedError
      && error.details.errors.includes('UNCLASSIFIED_FIELD:mystery_field')
    ),
  );
});
