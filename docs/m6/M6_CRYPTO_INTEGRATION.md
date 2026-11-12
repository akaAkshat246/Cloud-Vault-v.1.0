# CloudVault — Milestone M6 Cryptographic Integration
## Android Zero-Knowledge Cryptographic Specification & Vector Verification

**Document Version:** 1.0.0  
**Target Milestone:** M6 (Native Android Application)  
**Author:** Cryptography Engineer & Mobile Security Architect  
**Specification Reference:** `packages/crypto-spec/test-vectors/v1.json`

---

## 1. Cryptographic Protocol Summary

CloudVault Android implements a strict zero-knowledge cryptographic pipeline. Plaintext passwords, MasterKeys, and File Encryption Keys (FEKs) are never transmitted over the network or exposed to the backend host.

```
Master Password + User Salt
       │
       ▼ (Argon2id: m=64MB, t=3, p=1, out=64B)
Argon2id Pseudo-Random Key (PRK, 64 bytes)
       │
       ├─────────────────────────────────────────┐
       ▼ (HKDF-SHA256, info="cloudvault-auth-key-v1")
  AuthKey (32 bytes)                        Key Encryption Key (KEK, 32 bytes)
       │                                         │
       ▼                                         ▼
Sent to server (bcrypt hashed)              Unwraps MasterKey (AES-256-GCM)
                                                 │
                                                 ▼
                                            MasterKey (32 bytes volatile)
                                                 │
                                                 ├──────────────────────┐
                                                 ▼                      ▼
                                            Unwraps FEK         Encrypts Metadata
                                                 │
                                                 ▼
                                       Encrypts 5MB Chunks
                                       (AES-GCM + 27B AAD)
```

---

## 2. Key Derivation Function (Argon2id)

The Android client utilizes Bouncy Castle's `Argon2BytesGenerator` configured with the parameters frozen in Milestone M1:
- **Algorithm:** Argon2id (`Argon2Parameters.ARGON2_id`)
- **Version:** $0x13$ (`ARGON2_VERSION_13`)
- **Iterations ($t$):** 3
- **Memory ($m$):** $65,536\text{ KiB}$ ($64\text{ MiB}$)
- **Parallelism ($p$):** 1 thread
- **Output Length:** 64 bytes (Raw PRK)

### HKDF Domain Separation (RFC 5869)
From the 64-byte raw PRK, two distinct 32-byte keys are derived:
1. **`AuthKey`:** `HKDF(PRK, info = "cloudvault-auth-key-v1", length = 32)`
2. **`KEK` (Key Encryption Key):** `HKDF(PRK, info = "cloudvault-kek-v1", length = 32)`

---

## 3. Wire Chunk Framing & 27-Byte AAD Binding

Each file payload is split into fixed 5 MiB chunks ($5,242,880$ bytes plaintext). Each encrypted chunk is packed into a binary wire format:

```
┌──────────────┬───────────────────────────────┬──────────────┐
│  IV (12B)    │      Ciphertext (<= 5 MiB)    │   Tag (16B)  │
└──────────────┴───────────────────────────────┴──────────────┘
```

### 27-Byte Additional Authenticated Data (AAD)
To prevent cross-file chunk swapping, chunk reordering, and truncation attacks, each chunk binds a deterministic 27-byte AAD buffer into the AES-GCM tag:

| Field | Size | Type / Format | Purpose |
| :--- | :--- | :--- | :--- |
| `format_version` | 2 bytes | Big-Endian Short (`0x0001`) | Format versioning |
| `file_id` | 16 bytes | Big-Endian UUID (128 bits) | Cryptographic file binding |
| `chunk_index` | 4 bytes | Big-Endian Integer | Sequence ordering |
| `total_chunks` | 4 bytes | Big-Endian Integer | Truncation prevention |
| `is_final` | 1 byte | Byte (`0x01` or `0x00`) | Final chunk integrity |

If an attacker alters the chunk sequence or swaps chunks between files, AES-GCM tag verification fails immediately with a `AEADBadTagException`.

---

## 4. BIP-39 Emergency Recovery Kit

In accordance with ADR-007:
- **Entropy:** 256 bits of cryptographically secure random bytes generated via `SecureRandom`.
- **Checksum:** First 8 bits of SHA-256 hash of entropy.
- **Mnemonic:** $264\text{ bits} / 11\text{ bits per word} = 24\text{ words}$ selected from the standard 2,048 English wordlist (`Bip39Wordlist.kt`).
- **RecoveryKey Derivation:** `PBKDF2-HMAC-SHA512(mnemonic, salt="mnemonic", iterations=2048, length=512 bits)`. The first 32 bytes constitute the Recovery KEK used to unwrap `master_key_recovery_wrapped`.

---

## 5. Test Vector Parity Results (`v1.json`)

All cryptographic operations were verified using automated JVM unit tests against the frozen specification vector:

| Test Vector Case | Expected Value Source | Android Engine Result | Parity Status |
| :--- | :--- | :--- | :--- |
| **BIP-39 Wordlist Count** | 2048 Words | 2048 Words | **MATCH** |
| **Argon2id PRK** | `v1.json: kdf.raw_prk_hex` | Byte-for-byte identical | **MATCH** |
| **AuthKey (HKDF)** | `v1.json: kdf.auth_key_hex` | Byte-for-byte identical | **MATCH** |
| **KEK (HKDF)** | `v1.json: kdf.kek_hex` | Byte-for-byte identical | **MATCH** |
| **MasterKey Unwrapping** | `v1.json: master_key_wrap` | Byte-for-byte identical | **MATCH** |
| **Recovery Kit Unwrapping** | `v1.json: recovery` | Byte-for-byte identical | **MATCH** |
| **Chunk 0 Framing + AAD** | `v1.json: chunks[0]` | Byte-for-byte identical | **MATCH** |
| **Tampered Tag Injection** | Negative Test | Throws Exception | **PASS** |
| **Tampered AAD Injection** | Negative Test | Throws Exception | **PASS** |
