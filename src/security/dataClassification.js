export const DATA_CLASSIFICATION = Object.freeze({
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  PERSONAL: 'PERSONAL',
  HEALTH: 'HEALTH',
  RESTRICTED_IDENTITY: 'RESTRICTED_IDENTITY',
  LINKAGE_RESTRICTED: 'LINKAGE_RESTRICTED',
  SECRET_MATERIAL: 'SECRET_MATERIAL',
});

export const CLASSIFICATION_POLICY = Object.freeze({
  [DATA_CLASSIFICATION.PUBLIC]: Object.freeze({
    sensitivityRank: 0,
    genericExportAllowed: true,
    encryptionRequired: false,
  }),
  [DATA_CLASSIFICATION.INTERNAL]: Object.freeze({
    sensitivityRank: 20,
    genericExportAllowed: true,
    encryptionRequired: false,
  }),
  [DATA_CLASSIFICATION.PERSONAL]: Object.freeze({
    sensitivityRank: 60,
    genericExportAllowed: true,
    encryptionRequired: true,
  }),
  [DATA_CLASSIFICATION.HEALTH]: Object.freeze({
    sensitivityRank: 80,
    genericExportAllowed: true,
    encryptionRequired: true,
  }),
  [DATA_CLASSIFICATION.RESTRICTED_IDENTITY]: Object.freeze({
    sensitivityRank: 95,
    genericExportAllowed: false,
    encryptionRequired: true,
  }),
  [DATA_CLASSIFICATION.LINKAGE_RESTRICTED]: Object.freeze({
    sensitivityRank: 100,
    genericExportAllowed: false,
    encryptionRequired: true,
  }),
  [DATA_CLASSIFICATION.SECRET_MATERIAL]: Object.freeze({
    sensitivityRank: 110,
    genericExportAllowed: false,
    encryptionRequired: true,
  }),
});

export function classificationPolicy(classification) {
  return CLASSIFICATION_POLICY[classification] ?? null;
}

export function requiresEncryptedExport(classifications = []) {
  return classifications.some(
    (classification) => classificationPolicy(classification)?.encryptionRequired,
  );
}

export function isGenericExportAllowed(classification) {
  return classificationPolicy(classification)?.genericExportAllowed === true;
}
