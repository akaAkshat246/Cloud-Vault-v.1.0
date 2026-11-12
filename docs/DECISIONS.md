# CloudVault — Architecture Decision Records (ADRs)

> **Status:** Accepted & Baseline Frozen (Updated with Lead Amendments)  
> **Initial Date:** November 2026  
> **Governance:** CloudVault Engineering Architecture Committee (Lead: Akshat Vats)  

---

## Index of Architecture Decision Records

| ADR ID | Title | Status | Date |
|---|---|---|---|
| **ADR-001** | Mobile Platform: Native Android (Kotlin + Jetpack Compose) | **ACCEPTED** | 2026-11-12 |
| **ADR-002** | Key Derivation: Argon2id with Dual-Key Separation & Versioned Parameters | **ACCEPTED** | 2026-11-12 |
| **ADR-003** | File Ingestion: Direct-to-S3 Chunked Multipart via Presigned URLs | **ACCEPTED** | 2026-11-12 |
| **ADR-004** | Metadata Privacy: Zero-Knowledge Client-Side Metadata Encryption | **ACCEPTED** | 2026-11-12 |
| **ADR-005** | AI Architecture: Post-MVP (Phase 3) Client-Side Decrypted Opt-In Only | **ACCEPTED** | 2026-11-12 |
| **ADR-006** | Commercial Tiers & Quota: Dynamic Database Plans (Free / Personal / Pro) | **ACCEPTED** | 2026-11-12 |
| **ADR-007** | Account Recovery: BIP-39 Recovery Kit with Challenge-Response & Zero-Escrow | **ACCEPTED** | 2026-11-12 |
| **ADR-008** | E2EE Link Sharing: URL Fragment Key Passing (`#key=<fek>`) & Trust Model | **ACCEPTED** | 2026-11-12 |
| **ADR-009** | Backend Stack: Express.js + TypeORM Versioned Migrations (No Synchronize) | **ACCEPTED** | 2026-11-12 |
| **ADR-010** | Sync Engine: Deterministic Conflict Forking with Encrypted Conflict Names | **ACCEPTED** | 2026-11-12 |
| **ADR-011** | Organization & Team Harmonization: 11 Members across 8 Roles | **ACCEPTED** | 2026-11-12 |
| **ADR-012** | Authentication Protocol: AuthKey-over-TLS in MVP vs. OPAQUE/SRP Post-MVP | **ACCEPTED** | 2026-11-12 |

---

### ADR-001: Mobile Platform: Native Android (Kotlin + Jetpack Compose)
- **Status:** ACCEPTED
- **Context:** Mobile direction conflict resolved in favor of native implementation.
- **Decision:** The CloudVault Android application is **100% Native in Kotlin with Jetpack Compose, Room Database, WorkManager, Hilt, and Android Keystore**. All references to Capacitor/Cordova wrappers are formally **DEPRECATED**.
- **Consequences:** Direct Scoped Storage access, reliable background sync, high crypto throughput.

---

### ADR-002: Key Derivation: Argon2id with Dual-Key Separation & Versioned Parameters
- **Status:** ACCEPTED
- **Context:** Standardizing memory-hard KDF and isolating authentication credentials from encryption keys.
- **Decision:** 
  1. Standardize on **Argon2id** across Web (`libsodium-wrappers-sumo` in Web Worker) and Android (`libsodium-jni` / Bouncy Castle Argon2).
  2. Baseline Parameters: Memory = 64 MiB (`m=65536`), Iterations = 3 (`t=3`), Parallelism = 1 (`p=1`), Salt = 16 cryptographically random bytes, Output = 64 bytes.
  3. **Dual-Key Derivation with Domain Separation:**
     - `AuthKey` (bytes 0–31): Derived using domain tag `"cloudvault-auth-key-v1"`. Transmitted over TLS 1.3 to backend for user login.
     - `KeyEncryptionKey (KEK)` (bytes 32–63): Derived using domain tag `"cloudvault-kek-key-v1"`. Retained strictly in client memory to wrap/unwrap File Encryption Keys (FEKs). **Server never receives KEK**.
  4. **Backend Server-Side Hashing:** The backend **never** stores the client `AuthKey` directly. The server hashes `AuthKey` with bcrypt (cost factor 12) or Argon2id prior to database persistence. Login endpoints enforce strict rate limiting and progressive account lockout.
  5. Versioning columns (`kdf_algorithm`, `kdf_version`, `kdf_memory_kib`, `kdf_iterations`, `kdf_parallelism`) are stored per user.

---

### ADR-003: File Ingestion: Direct-to-S3 Chunked Multipart via Presigned URLs
- **Status:** ACCEPTED
- **Context:** S3 multipart upload compliance and high throughput.
- **Decision:**
  1. Base64-through-Node upload is **REJECTED**.
  2. Direct S3 multipart upload using Presigned URLs.
  3. **Chunk Sizing Rule:** AWS S3 requires every non-final multipart part to be **at least 5 MiB (5,242,880 bytes)**.
     - Standard plaintext chunk size: **$5 \text{ MiB} = 5,242,880\text{ bytes}$**.
     - AES-256-GCM overhead: 12-byte IV + 16-byte authentication tag = 28 bytes.
     - Standard ciphertext chunk size: **$5,242,908\text{ bytes} > 5\text{ MiB}$** (fully compliant with S3 constraints).
     - Final chunk may be smaller than 5 MiB.
  4. **Authenticated Additional Data (AAD) Binding:** Every chunk binds:
     $$\text{AAD} = \text{format\_version (2B)} \parallel \text{file\_id (16B UUID)} \parallel \text{chunk\_index (4B)} \parallel \text{total\_chunks (4B)} \parallel \text{is\_final (1B)}$$
     This mathematically prevents chunk swapping across files, chunk reordering within a file, and truncation attacks.
  5. **Nonce Strategy:** Each chunk uses a fresh 96-bit random nonce (`crypto.getRandomValues()` / `SecureRandom`) paired with the cryptographically unique 256-bit random FEK generated for that file. Because an FEK is never used across files and encrypts at most $\sim 10^5$ chunks in a massive file, 96-bit random nonces provide negligible collision risk ($< 2^{-60}$, well beyond NIST SP 800-38D bounds).

---

### ADR-004: Metadata Privacy: Zero-Knowledge Client-Side Metadata Encryption
- **Status:** ACCEPTED
- **Context:** Preventing sensitive file/folder names and MIME types from leaking in database.
- **Decision:** `file_name`, folder names, original MIME types, and file attributes are encrypted client-side using AES-256-GCM. PostgreSQL stores only `encrypted_name` and `name_nonce`. Search and sort by name happen client-side against local decrypted indexes.

---

### ADR-005: AI Architecture: Post-MVP (Phase 3) Client-Side Decrypted Opt-In Only
- **Status:** ACCEPTED
- **Context:** Third-party AI vs. Zero-Knowledge security perimeter.
- **Decision:** AI features are strictly **Post-MVP (Phase 3)**. Text extraction runs client-side after local decryption. Content leaves client only upon explicit user consent per-file. Default is always OFF.

---

### ADR-006: Commercial Tiers & Quota: Dynamic Database Plans
- **Status:** ACCEPTED
- **Decision:** Default tiers: **Free 5GB (2 devices) / Personal 100GB (₹149/mo) / Pro 1TB (₹349/mo)**. Quota parameters stored in PostgreSQL `plans` table and validated server-side before issuing presigned S3 URLs.

---

### ADR-007: Account Recovery: BIP-39 Recovery Kit with Challenge-Response & Zero-Escrow
- **Status:** ACCEPTED (Amended by Stakeholder)
- **Context:** Zero-knowledge password reset without server escrow keys.
- **Decision:**
  1. Signup generates a 24-word BIP-39 mnemonic phrase.
  2. **Mandatory Challenge-Response Gate:** During signup, after displaying the phrase, the user **must re-enter 3 to 4 randomly selected words** (e.g. words #4, #11, #19) to verify they recorded the phrase before the account creation is finalized.
  3. The recovery phrase derives a 256-bit `RecoveryKey` which encrypts a secondary copy of the user's `MasterKey` (`encrypted_recovery_master_key`).
  4. **Password Change Workflow:** When a user changes their password, **files are NOT re-encrypted**. The client derives the new KEK from the new password, decrypts the `MasterKey` in client memory with the old KEK, re-wraps the `MasterKey` with the new KEK, and updates the single user wrap record in PostgreSQL.
  5. Recovery flow: User verifies email OTP, submits 24-word phrase client-side, decrypts `MasterKey`, derives a new KEK from their new password, and re-wraps the `MasterKey`.

---

### ADR-008: E2EE Link Sharing: URL Fragment Key Passing (`#key=<fek>`) & Trust Model
- **Status:** ACCEPTED (Amended by Stakeholder)
- **Context:** Zero-knowledge web link sharing mechanics.
- **Decision:**
  1. Public links use URI fragments: `https://cloudvault.app/share/:token#key=<base64_fek>`.
  2. Per RFC 3986, the fragment `#...` is never transmitted to the HTTP server.
  3. **Share Link Features:** Supports optional expiration timestamp, optional maximum download counter, and optional password protection.
  4. **Password-Protected Share Links:** When password protection is enabled, the FEK in the fragment is further encrypted with an Argon2id key derived from the share password. The server stores only a bcrypt hash of the password to enforce rate limiting on password submission attempts.
  5. **Documented Residual Risks in `THREAT_MODEL.md`:**
     - Browser History: URL fragments may be retained in local browser history or copied to clipboard.
     - Web App Trust: Web applications trust the server to deliver untampered JavaScript. Mitigations include Subresource Integrity (SRI), strict Content Security Policy (CSP), and future work on reproducible builds / signed web bundles.

---

### ADR-009: Backend Stack: Express.js + TypeORM Versioned Migrations (No Synchronize)
- **Status:** ACCEPTED (Amended by Stakeholder)
- **Decision:** Node.js 20 LTS + TypeScript + Express.js + PostgreSQL 15. TypeORM entities strictly use **timestamped versioned migrations**. Setting `synchronize: true` is strictly **PROHIBITED** in all environments (including development) to prevent accidental data loss and untracked schema drift.

---

### ADR-010: Sync Engine: Deterministic Conflict Forking with Encrypted Conflict Names
- **Status:** ACCEPTED (Amended by Stakeholder)
- **Decision:** PostgreSQL `sync_log` tracks monotonic sync sequences. Simultaneous offline edits create a **Conflict Fork**: the newer version is saved with an encrypted filename corresponding to `<OriginalName> (Conflict from <DeviceName> <Timestamp>)`, preserving both copies while respecting ADR-004 metadata encryption.

---

### ADR-011: Organization & Team Harmonization: 11 Members across 8 Roles
- **Status:** ACCEPTED
- **Decision:** The team is harmonized to 11 members across 8 roles per `CloudVault_Report_2026.docx`:
  - CV-01: Project Lead & Full Stack (Akshat Vats)
  - CV-02: Android Developer (Akshat Kumar)
  - CV-03: React Frontend Developer (Akshay Yadav)
  - CV-04: Backend Support (Akarsh Bhardwaj)
  - CV-05a & CV-05b: UI/UX Designers (Ananya, Anokhi Agarwal)
  - CV-06a & CV-06b: DevOps Engineers (Arsh Rana, Ashwani Bhardwaj)
  - CV-07: Security Reviewer (Akshat Singh)
  - CV-08: QA Tester (Anaahita Tripathi)

---

### ADR-012: Authentication Protocol: AuthKey-over-TLS in MVP vs. OPAQUE/SRP Post-MVP
- **Status:** ACCEPTED
- **Context:** Zero-knowledge authentication protocols.
- **Decision:**
  1. For MVP, CloudVault uses **Dual-Key Argon2id Derivation over TLS 1.3**:
     The user derives an `AuthKey` client-side from their password using a dedicated domain tag. The `AuthKey` is transmitted over TLS 1.3 to the backend, which hashes it with bcrypt (cost factor 12) before storage. The `KeyEncryptionKey (KEK)` never leaves the client.
  2. **Accepted Risk:** While the plaintext password is never revealed to the server, a compromised server observing the TLS stream could capture the derived `AuthKey` during login. However, because the server never learns the KEK or Master Key, stored files remain unreadable even if the server is fully compromised.
  3. **Post-MVP Hardening:** Zero-Knowledge Password Proof protocols (OPAQUE or SRP-6a) will be evaluated in Phase 3/4 to eliminate transmission of the `AuthKey` altogether.

---

### ADR-013: Android Argon2id Library Selection: Argon2Kt + Standard Android JCA
- **Status:** ACCEPTED (Single Choice Frozen)
- **Context:** `joshjdevl/libsodium-jni` last released in April 2019 (v2.0.2) and is abandoned. We evaluated alternatives for Android Kotlin client.
- **Alternatives Evaluated:**
  1. *Lazysodium-Android (`com.goterl:lazysodium-android`):* Wraps full libsodium. However, it is licensed under **LGPL-3.0**, which creates dynamic linking and compliance risks for Google Play Store APK distribution without exposing source or relinkable object files. Overhead is ~2.2 MB.
  2. *Argon2Kt (`com.lambdapioneer.argon2kt:argon2kt:1.6.0`):* Maintained by Christian Melchior (`https://github.com/lambdapioneer/argon2kt`, verified March 2026). Packages the official reference C `argon2` implementation via Android NDK. License: **Apache-2.0** (permissive, zero copyleft risk). Overhead is ~450 KB APK footprint.
  3. *Bouncy Castle Java (`org.bouncycastle:bcprov`):* Pure Java. Rejected due to lack of SIMD vectorization resulting in >7s unlock times on mobile CPUs.
- **Decision:**
  - Adopt **Argon2Kt** strictly for Argon2id key derivation on Android.
  - Adopt **Standard Android JCA (`javax.crypto.Cipher` with `AES/GCM/NoPadding` and `javax.crypto.Mac` with `HmacSHA256`)** for AES-256-GCM symmetric operations and HKDF key expansion.
  - Android Keystore will be used for securing the local cached Master Key at rest.
- **Cross-Implementation Guarantee:** Argon2id parameters ($m=64\text{ MiB}, t=3, p=1$, 16B salt, 64B output) produce 100% byte-identical PRK across Web (`libsodium-wrappers-sumo`) and Android (`argon2kt`).
- **Benchmark Target:** Current mobile estimate: ~1.25s on mid-range ARM cores. Marked as **ESTIMATE** pending physical device run by reviewer.

---

### ADR-014: Zero-Knowledge Forgot Password Semantics: Dual Recovery Paths
- **Status:** ACCEPTED
- **Context:** In a zero-knowledge system, the server possesses only the bcrypt/Argon2id hash of the `AuthKey` and wrapped ciphertexts. The server cannot decrypt user data or restore access via email reset links alone.
- **Decision:** Implement two distinct forgot-password workflows:
  1. **Path A — Vault Recovery via Emergency Kit (Zero Data Loss):**
     - User provides their 24-word BIP-39 recovery mnemonic and receives email verification challenge.
     - Client derives `RecoveryKey` locally and unwraps `encrypted_recovery_master_key` to recover the plaintext `MasterKey`.
     - User enters a new password. Client derives new `AuthKey` and new `KEK`, re-wraps the `MasterKey` with new `KEK`, and uploads new credentials via `POST /api/v1/auth/recovery/unlock`.
     - 100% of files remain intact and accessible with zero re-encryption.
  2. **Path B — Account Reset without Recovery Phrase (Cryptographic Data Loss):**
     - When the recovery phrase is lost, the Master Key is mathematically unrecoverable.
     - Flow requires: (a) Explicit confirmation typing (`"DELETE MY ENCRYPTED VAULT"`), (b) Time-limited email verification token, (c) Revocation of all active sessions and refresh tokens.
     - **30-Day Grace Window:** All existing file and folder records are marked as `is_orphaned = true` and `orphaned_at = now()`. If the user finds their recovery phrase within 30 days, Path A can still restore the vault.
     - After 30 days, a background sweeper permanently purges orphaned DB records and deletes underlying S3 ciphertext objects.
     - A fresh empty vault with new keys is created for the account.
- **UI Warning Copy Standard:**
  > "WARNING: Because CloudVault is zero-knowledge encrypted, losing both your password and your 24-word Emergency Recovery Kit means your encrypted files CANNOT be recovered by anyone—including CloudVault staff. Proceeding will wipe access to all existing encrypted data."

---

### ADR-015: Test Runner Architecture: Vitest over Jest for Monorepo TypeScript ESM
- **Status:** ACCEPTED
- **Context:** Monorepo test infrastructure selection for Node.js 20 LTS ESM and TypeScript.
- **Decision:** Adopt **Vitest** across `@cloudvault/crypto-spec`, `@cloudvault/backend`, and frontend packages:
  1. Native ESM support without `ts-jest` or Babel transform overhead.
  2. Multi-threaded execution yielding sub-second unit test runs across workspace packages.
  3. Seamless compatibility with Vite (planned for React 18 PWA frontend in M5).
  4. Compatible with standard Jest API assertions (`describe`, `it`, `expect`, `vi.fn`).

---

### ADR-016: Storage Quota Atomicity & Multi-Tier Rate Limiting Architecture
- **Status:** ACCEPTED
- **Context:** Preventing storage quota race conditions (concurrent uploads exceeding account limits) and protecting authentication/upload endpoints against credential stuffing and brute-force denial of service.
- **Decision:**
  1. **Two-Phase Quota Reservation:** When initiating an upload (`POST /api/v1/files/uploads`), the client must declare `expected_bytes`. The server atomically reserves quota using an atomic SQL query:
     `UPDATE users SET storage_reserved_bytes = storage_reserved_bytes + :expectedBytes WHERE id = :userId AND (CAST(storage_used_bytes AS BIGINT) + CAST(storage_reserved_bytes AS BIGINT) + :expectedBytes) <= CAST(storage_quota_bytes AS BIGINT)`.
     If the atomic update affects 0 rows, the request is rejected with `413 Payload Too Large / Quota Exceeded`.
  2. **Quota Finalization & Sweeping:**
     - On upload completion (`POST /api/v1/files/uploads/:id/complete`): the server verifies actual object size via S3 `HeadObject`, atomically decrements `storage_reserved_bytes` and increments `storage_used_bytes`.
     - On upload abortion or expiration (`POST /api/v1/files/uploads/:id/abort` or 24-hour background sweeper): the server calls S3 `AbortMultipartUpload` and decrements `storage_reserved_bytes`.
  3. **Multi-Tier Rate Limiting:**
     - Global API rate limiter (`express-rate-limit`): 100 requests / 15 minutes per IP.
     - Auth prelogin & login limiter: strict exponential backoff per `(account, IP)` upon 5 failed attempts ($30 \times 2^{\text{attempts}-5}$ seconds, capped at 1 hour) with security email notification.
     - Storage presigning limiter: max 60 presigned URL generations per minute per user.
  4. **Privacy-Preserving IP & Metadata Logging:**
     - Full raw client IP addresses and user agent strings are restricted to security audit logs (`audit_logs`) and session tracking tables (`refresh_tokens`), with 90-day automated retention purge.
     - Application logs (Pino) redact authentication keys, tokens, passwords, and sensitive client identifiers.
