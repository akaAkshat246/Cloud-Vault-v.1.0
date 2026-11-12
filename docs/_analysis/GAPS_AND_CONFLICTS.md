# CloudVault — Gaps, Conflicts & Technical Decisions Register

> **Document Type:** Architectural Review, Risk Register & Resolution Strategy  
> **Source Documents Analyzed:** All 34 workspace artifacts  
> **Status:** All Core Gaps & Conflicts RESOLVED via Architecture Decision Records (ADRs)  
> **Author:** Senior Staff Engineer, Security Architect & Technical Lead  

---

## 1. Executive Summary of Resolution

During the Phase 0 audit, 8 major contradictions/security risks and 5 missing technical specifications were identified across the workspace documentation. All of these have been resolved in alignment with the Technical Lead / Stakeholder Decisions and formally recorded in [`/docs/DECISIONS.md`](file:///d:/Cloud-Vault/docs/DECISIONS.md).

Below is the definitive status and resolution matrix for every item.

---

## 2. Contradiction Resolution Matrix

| Conflict ID | Area | Conflict Summary | Status | Resolution Summary & ADR Reference |
|---|---|---|---|---|
| **C-01** | **Mobile Platform** | Native Kotlin + Compose vs. Capacitor 6 hybrid. | **RESOLVED (ADR-001)** | 100% Native Kotlin + Jetpack Compose app (`/apps/android`). Capacitor references marked DEPRECATED. |
| **C-02** | **KDF Algorithm** | PBKDF2 (100k iter) vs. Argon2id. | **RESOLVED (ADR-002)** | Standardized on **Argon2id** (64 MiB, t=3, p=1, 16-byte salt, 64-byte output) with Dual-Key Derivation (AuthKey vs KEK) and versioned DB columns. |
| **C-03** | **Crypto Stacks** | WebCrypto API vs. `libsodium.js`. | **RESOLVED (ADR-002)** | `libsodium-wrappers-sumo` inside dedicated Web Worker on Web; native `libsodium-jni` / Bouncy Castle on Android; common spec in `/packages/crypto-spec`. |
| **C-04** | **Upload Architecture** | Base64 JSON via Node API vs. S3 Direct Chunked. | **RESOLVED (ADR-003)** | Base64-through-Node REJECTED. 3-Step **Direct S3 Presigned Multipart Chunked Upload** (5MB chunks, per-chunk nonce + tag). |
| **C-05** | **Metadata Privacy** | Plaintext `file_name` in DB vs. Zero-Knowledge. | **RESOLVED (ADR-004)** | Filenames, folder names, and MIME types **encrypted client-side**. DB stores `encrypted_name` and `name_nonce`. |
| **C-06** | **AI Features & Privacy** | Claude API / Semantic Search vs. ZK Encryption. | **RESOLVED (ADR-005)** | AI features classified strictly as **Post-MVP (Phase 3)**. Client-side decryption + explicit user opt-in consent modal required. No server extraction. |
| **C-07** | **Account Recovery** | Email password reset vs. ZK Irrecoverability. | **RESOLVED (ADR-007)** | Client-side **24-word BIP-39 Emergency Recovery Kit**. Secondary email resets login auth only; vault data remains encrypted without Recovery Key. |
| **C-08** | **Commercial Tiers** | Blueprint (₹49/50GB) vs. Report 2026 (₹149/100GB). | **RESOLVED (ADR-006)** | Report 2026 tiers adopted: **Free 5GB / Personal 100GB (₹149/mo) / Pro 1TB (₹349/mo)**. Database-driven `plans` table avoids hardcoded values. |
| **C-09** | **Team Size** | 10 members vs. 11 members across docs. | **RESOLVED (ADR-011)** | Standardized on **11 core team members across 8 defined functional roles** per Role Assignment sheet and Report 2026. |

---

## 3. Detailed Architectural Resolutions

### C-01: Mobile Platform — Native Kotlin + Compose (ADR-001)
- **Resolution:** The mobile application (`/apps/android`) is strictly built as a **Native Android application** using **Kotlin, Jetpack Compose, Room DB, WorkManager, Hilt, and Android Keystore**.
- **Deprecation Notice:** All references in UI/UX mockups (`cloudvault_screen_solution_report.html`) and frameworks (`cloudvault-framework.html`) to Capacitor plugins (`@capacitor-community/app-widget-plugin`, `Capacitor Biometrics`) are deprecated. Native Android APIs (`AppWidgetProvider`, `TileService`, `BiometricPrompt`, `MediaStore`) will be used instead.

### C-02: Key Derivation — Argon2id with Dual-Key Derivation (ADR-002)
- **Resolution:**
  - Standardize on **Argon2id** across Web and Android.
  - Parameter Baseline: Memory = 64 MiB (`m=65536`), Iterations = 3 (`t=3`), Parallelism = 1 (`p=1`), Salt = 16 cryptographically random bytes.
  - **Dual-Key Derivation Flow:**
    $$\text{Argon2id}(\text{password}, \text{salt}) \longrightarrow 64\text{ bytes}$$
    - Bytes 0–31 $\longrightarrow$ `AuthKey` $\longrightarrow$ Sent over TLS 1.3 to backend for login authentication (hashed with bcrypt cost 12 on server).
    - Bytes 32–63 $\longrightarrow$ `KeyEncryptionKey (KEK)` $\longrightarrow$ Retained strictly in client volatile memory. Used exclusively to wrap/unwrap File Encryption Keys (FEKs). **Never transmitted to server**.
  - Database stores: `kdf_algorithm`, `kdf_version`, `kdf_memory_kib`, `kdf_iterations`, `kdf_parallelism`, and `salt`.

### C-03: Upload Architecture — Direct S3 Presigned Multipart (ADR-003)
- **Resolution:**
  - Direct S3 upload replaces all server proxying.
  - S3 Presigned Multipart URLs issued per 5MB chunk.
  - Flow:
    1. `POST /api/v1/files/upload/init` (metadata, size, chunks, wrapped FEK, checksum) $\rightarrow$ Returns S3 upload ID and presigned chunk PUT URLs.
    2. Client encrypts each chunk with AES-256-GCM (`chunk_iv + ciphertext + auth_tag`) and streams directly to S3.
    3. `POST /api/v1/files/upload/complete` (passes S3 ETags) $\rightarrow$ Server verifies object size in S3, commits file record in PostgreSQL, and logs sync event.

### C-04: Metadata Privacy — Zero-Knowledge Metadata (ADR-004)
- **Resolution:**
  - Filenames and folder names are encrypted client-side using the parent folder key or file FEK via AES-256-GCM.
  - PostgreSQL schema updated: `file_name` column replaced with `encrypted_name TEXT NOT NULL` and `name_nonce VARCHAR(32) NOT NULL`.
  - Client decrypts metadata locally for display, search, and sorting.

### C-05: AI Architecture — Post-MVP Client-Side Decrypted Opt-In (ADR-005)
- **Resolution:**
  - AI features removed from MVP scope.
  - When implemented in Phase 3, text extraction will run on the client device after local decryption.
  - Any communication with external AI APIs (Claude API) requires explicit per-file user consent with an unmissable privacy warning.

### C-06: Account Recovery — Zero-Escrow Emergency Recovery Kit (ADR-007)
- **Resolution:**
  - On signup, the client generates a 24-word BIP-39 mnemonic recovery phrase.
  - The KEK is encrypted with a key derived from this recovery phrase and stored as `encrypted_recovery_kek` in the database.
  - If a user loses their password, they can reset their auth credentials via email OTP, but must supply the 24-word phrase to restore vault decryption keys. Without it, data is unrecoverable.

### C-07: Public Link Sharing — URL Fragment Key Architecture (ADR-008)
- **Resolution:**
  - Share links format: `https://cloudvault.app/share/:token#key=<base64_fek>`
  - The browser fragment (`#...`) is never sent to the server.
  - The server provides the encrypted file blob; the recipient's browser extracts the key from the fragment and performs client-side decryption.
  - Optional password protection adds a second layer of Argon2id key wrapping over the FEK.

---

## 4. Missing Technical Specifications — Frozen Standards

| Spec ID | Technical Area | Frozen Specification Standard |
|---|---|---|
| **S-01** | **Chunk Framing** | 5MB chunks. Wire format per chunk: `[12-byte IV] + [AES-256-GCM Ciphertext] + [16-byte GCM Tag]`. IV is generated via `SecureRandom` per chunk. |
| **S-02** | **Key Wrap Framing** | FEK (32 bytes) wrapped with KEK using AES-256-GCM. Stored in DB as JSON string: `{"v":1,"iv":"...","tag":"...","ct":"..."}`. |
| **S-03** | **Sync Collision Protocol** | Append-only `sync_log` in DB. Offline collisions fork deterministically: newer conflict saved as `<Name> (Conflict from <Device> <Timestamp>)`. |
| **S-04** | **Database Cascades & Indexes** | Composite indexes on `(user_id, is_deleted)`, `(user_id, parent_id)`, and `(sync_id, user_id)`. Soft deletes enforce `is_deleted = TRUE` with `deleted_at TIMESTAMP`. |
| **S-05** | **Token Lifetime & Storage** | Access tokens: 15-minute JWT stored in memory / Zustand store only. Refresh tokens: 7-day cryptographically secure random token stored in HttpOnly, SameSite=Strict cookie. |
