# CloudVault — Project Execution Progress & Session State

> **Last Updated:** November 2026  
> **Current Phase:** Phase 2 — Build (Milestone M1 COMPLETED)  
> **Next Milestone:** Milestone M2 (Backend Skeleton, PostgreSQL Database Schema, TypeORM Migrations & S3 Local Mock)  
> **Status:** Awaiting User Approval to Begin Milestone M2  

---

## 1. Project Milestone Tracking

| Milestone | Focus Area | Status | Progress | Key Deliverables & Test Status |
|---|---|---|---|---|
| **Phase 0** | Workspace Audit & SSoT Synthesis | **COMPLETED** | 100% | 34 files read completely; `PROJECT_UNDERSTANDING.md` & `GAPS_AND_CONFLICTS.md` created. |
| **Phase 1** | Implementation Plan & Architecture | **COMPLETED** | 100% | `IMPLEMENTATION_PLAN.md` (8–9 week buffered plan, 11-member team), ADRs 001–012. |
| **M1** | **Crypto Core Spec & Test Vectors** | **COMPLETED** | 100% | `CRYPTO_SPEC.md` v1, `test-vectors/v1.json` (positive+negative), TS ref (25/25 Vitest pass), Android Kotlin Gradle (14/14 JUnit pass on JDK 17), ADR-013, benchmarks. |
| **M2** | **Backend Core, DB Migrations & S3 Mock** | **COMPLETED** | 100% | Node 20 LTS + TS strict, PG 15 entities & `1700000000000` + `1741800000000` migrations (`synchronize: false`), plan seeder, S3StorageService, Pino redaction, Terraform S3, 18/18 tests passing. |
| **M3** | **Auth, Sessions & Recovery Kit** | **COMPLETED** | 100% | Anti-enumeration pre-login, dual-key AuthKey bcrypt hash, session family rotation & reuse detection, ADR-014 (Path A & B), 13/13 auth tests passing (31/31 backend suite). |
| **M4** | Direct-to-S3 Chunked Upload API | **QUEUED** | 0% | S3 Presigned multipart upload/download, quota validation, chunk verification. |
| **M5** | Web Client (React 18 PWA) | **QUEUED** | 0% | Tailwind UI, Zustand, Web Worker crypto (`crypto.worker.ts`), browser, decrypted preview. |
| **M6** | Android Client (Kotlin Compose) | **QUEUED** | 0% | Jetpack Compose, Room DB, Android Keystore, WorkManager background sync. |
| **M7** | ZK Link Sharing & URL Fragments | **QUEUED** | 0% | `#key=<fek>` sharing, optional password wrap layer, expiry & download counters. |
| **M8** | Multi-Device Sync & Conflict Engine | **QUEUED** | 0% | `sync_log`, Room cache, deterministic branch forking with encrypted conflict names. |
| **M9** | Polish, Hardening, Audit & Release | **QUEUED** | 0% | OWASP Top 10 penetration audit, k6 load testing, signed APK, CI/CD deployment. |

---

## 2. Milestone M1 Completed Deliverables Checklist

- [x] **`/packages/crypto-spec/CRYPTO_SPEC.md`**: Complete v1.0 specification defining Key Hierarchy, Argon2id parameters, HKDF domain tags, AES-256-GCM envelope wrapping, 5MB chunk framing with 27-byte AAD binding, metadata encryption, BIP-39 recovery kit, and password change re-key protocol.
- [x] **`/packages/crypto-spec/test-vectors/v1.json`**: Deterministic test vectors covering KDF, MasterKey wrap, Chunk 0 & 1 with AAD, metadata encryption, BIP-39 recovery, password change, and negative tampering/reordering/swapping vectors.
- [x] **TypeScript Reference Implementation (`/packages/crypto-spec/ts/src`)**:
  - `kdf.ts` (Argon2id + HKDF-SHA256 dual-key derivation)
  - `cipher.ts` (AES-256-GCM encryption, decryption, envelope wrapping)
  - `framing.ts` (27-byte AAD builder, chunk packer/unpacker)
  - `metadata.ts` (Zero-knowledge metadata encryption)
  - `recovery.ts` (24-word BIP-39 mnemonic derivation, seed derivation, 4-word challenge verifier)
  - `streaming.ts` (5MB chunk slicer, async stream generator)
  - `sharing.ts` (URL fragment parser, password-protected FEK wrap)
- [x] **Test Verification**:
  - `packages/crypto-spec/ts/tests/vectors.test.ts` (17 tests passing)
  - `packages/crypto-spec/ts/tests/streaming.test.ts` (3 tests passing)
  - Total: **20/20 Vitest unit tests passing 100%**.
  - TypeScript build passes (`tsc`) producing valid types and ESM output in `dist/`.
- [x] **Android Reference Implementation (`/packages/crypto-spec/android`)**:
  - `CryptoSpec.kt`: Kotlin standard JCA implementation for Android matching spec.
  - `CryptoSpecTest.kt`: JUnit 5 test harness running the same `test-vectors/v1.json`.
  - `ARGON2_EVALUATION.md`: Performance and security comparison recommending `lazysodium-android` / `libsodium-jni` for sub-500ms unlock and zero GC pressure.
- [x] **`/docs/benchmarks/M1.md`**: Telemetry report:
  - Argon2id latency: 425 ms (Desktop), ~850 ms (projected low-end Android).
  - AES-256-GCM throughput: **195.2 MB/s**.
  - 1 GB file encryption time: **5.25 seconds**.
- [x] **`/docs/THREAT_MODEL.md`**: STRIDE analysis, honest metadata leakage list, and web trust model.
- [x] **`/docs/DECISIONS.md`**: Updated with ADR-001 through ADR-012.
- [x] **`/.github/workflows/crypto-spec-ci.yml`**: Continuous Integration workflow enforcing interoperability gate.

---

## 3. Next Milestone: M2 (Backend Core Skeleton, DB Migrations & S3 Mock)

Upon user approval:
1. Initialize `/backend` package with Node.js 20 LTS, TypeScript, and Express.js.
2. Setup `/infra/docker/docker-compose.yml` with PostgreSQL 15, MinIO (local S3), and Redis.
3. Configure TypeORM with explicit entities: `Plan`, `User`, `EncryptionKey`, `File`, `SyncLog`, `Session`, `Share`, `AuditLog`.
4. Create versioned migration scripts (`synchronize: false` strictly enforced per ADR-009).
5. Seed commercial plans (Free 5GB, Personal 100GB ₹149, Pro 1TB ₹349).
6. Implement health endpoints and integration tests.
