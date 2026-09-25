# IML SECURITY-04 — macOS development Key Broker decision

**Decision:** `MACOS_KEYCHAIN_V1`  
**Status:** selected for local development, not yet the production key-custody profile.

## Purpose

Provide the first real Key Broker for the IML Clinical Workspace on macOS while preserving the SECURITY-04 envelope format and keeping key custody independent from PostgreSQL.

## Selected platform

Use Apple Keychain Services through the modern `SecItem` API and the macOS data-protection keychain.

The development KEK is:

- a randomly generated 256-bit symmetric key;
- stored as a Keychain generic-password/key payload, because symmetric CryptoKit keys do not have the same native `SecKey` representation as supported asymmetric keys;
- marked for the data-protection keychain;
- non-synchronizable;
- restricted to the local device;
- accessible only while the device is unlocked.

Initial accessibility profile:

`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`

The provider identifier will be:

`MACOS_KEYCHAIN_V1`

Example non-secret database reference:

`macos-keychain://iml/security/clinical-kek/v1`

The URI is an identifier only. It contains no key material.

## Why not use the Secure Enclave directly for v1

The Secure Enclave is valuable for supported asymmetric operations and device-bound private keys.

The IML SECURITY-04 baseline, however, needs a provider able to protect and rotate a symmetric KEK/DEK envelope.

For the first development provider, forcing the AES wrapping KEK into a Secure Enclave design would add an asymmetric key-agreement/wrapping layer without improving the portability of the IML envelope format.

The Key Broker abstraction keeps open a later high-assurance provider using:

- Secure Enclave-backed asymmetric wrapping;
- an HSM;
- a hosted KMS;
- another jurisdiction-approved cryptographic module.

## Trust boundary

The ordinary IML/Vite application must not read the persisted KEK.

A native macOS Key Broker adapter owns Keychain access.

Conceptual boundary:

```text
IML application
     |
     | generate / wrap / unwrap / rewrap request
     v
MACOS_KEYCHAIN_V1 adapter
     |
     +---- Apple SecItem / data-protection Keychain
                 |
                 +---- KEK
```

The adapter may transiently handle key bytes required by CryptoKit/Keychain conversion, but:

- they are never written to PostgreSQL;
- they are never returned as application data;
- they are never logged;
- temporary byte buffers must be zeroed where the API permits;
- the DEK handed to the SECURITY-04 crypto layer is a non-extractable CryptoKey.

## Initial KEK scopes

Use independent KEKs by purpose rather than one universal master key:

- `clinical`
- `identity`
- `attachment`
- `export`
- `pseudonymisation`

Audit signing should use a distinct signing-key design and is not bundled into the same AES KEK family.

## Rotation

Each purpose receives a stable rotation group.

Example:

```text
purpose: clinical
rotation_group: macos-dev-clinical
version 1 -> version 2 -> version 3
```

Rotation changes the external KEK reference and re-wraps DEKs.

It must not require rewriting clinical ciphertext.

Old KEK versions remain available only for the minimum transition/recovery window defined by policy, then move to `retired` or `revoked`.

## Device binding and recovery consequence

`ThisDeviceOnly` is intentionally strict.

It also means the KEK does not migrate to another Mac.

Therefore this profile is suitable for development only until IML has a tested recovery strategy.

Before real patient data are encrypted, IML must define one of:

- an institutionally controlled recovery KEK/HSM;
- a second encrypted recovery envelope;
- another formally governed key escrow/recovery design.

A backup of ciphertext without an available recovery key is not a usable backup.

## Development lifecycle

### Create

On first initialization for a key purpose:

1. check for an existing active Keychain item;
2. if absent, generate 256 random bits using a cryptographically secure system API;
3. store the KEK in the data-protection Keychain;
4. return only the non-secret key reference metadata.

### Generate data key

For each envelope:

1. generate a fresh 256-bit DEK;
2. wrap it with the selected KEK inside the provider boundary;
3. convert the working AES-GCM key to a non-extractable CryptoKey for IML;
4. zero temporary raw DEK bytes where possible;
5. return the non-extractable CryptoKey plus wrapped DEK and key reference.

### Unwrap

1. resolve the KEK by non-secret key reference;
2. unwrap the DEK inside the provider boundary;
3. expose only a non-extractable AES-GCM CryptoKey to SECURITY-04;
4. never return raw key bytes in an API response.

### Re-wrap

1. resolve current and target KEKs;
2. unwrap/re-wrap inside the provider boundary;
3. return only the new wrapped DEK and target key reference;
4. do not decrypt clinical ciphertext.

## Logging

Key Broker logs may contain:

- operation type;
- key reference ID;
- rotation group;
- purpose;
- success/failure;
- opaque envelope ID.

They must not contain:

- raw KEK;
- raw DEK;
- wrapped-key bytes;
- ciphertext payload;
- plaintext;
- patient identifiers.

## Not production approval

Selecting `MACOS_KEYCHAIN_V1` for development does not mean that:

- macOS Keychain alone is approved for a national deployment;
- HDS/HIPAA compliance is established;
- recovery requirements are solved;
- a hosted deployment should use the same key provider.

Production key custody remains jurisdiction- and deployment-specific.
