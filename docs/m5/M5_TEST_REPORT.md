# CLOUDVAULT — MILESTONE M5 VERIFICATION & TEST REPORT
## Web Client Test Execution, Coverage & Acceptance Evidence

> **Milestone:** M5 — React 18 Progressive Web Application (PWA)  
> **Report Date:** 12 November 2026 (Environment Timestamp: 13 Nov 2026)  
> **Overall Monorepo Test Status:** **135 / 135 TESTS PASSING (100% GREEN)**  

---

## 1. M5 TEST EXECUTION SUITE

### 1.1 Web Client Test Suite (`apps/web`)
- **Command:** `npm --workspace=@cloudvault/web test`
- **Runner:** Vitest v3.2.7 (Environment: jsdom)
- **Exit Code:** `0`
- **Result:** **24 / 24 PASSED (100%)**

| Test File | Category | Tests Passed | Duration | Key Verifications |
| :--- | :--- | :--- | :--- | :--- |
| `tests/crypto/vectors.test.ts` | Cryptographic Parity | **6 / 6** | 653 ms | Argon2id + HKDF PRK/AuthKey/KEK match `v1.json`; MasterKey envelope wrap/unwrap; Chunk 0/1 framing; Tampered tag, wrong AAD, wrong file_id, truncated chunk rejected; Metadata round-trip; BIP-39 mnemonic recovery. |
| `tests/unit/components.test.tsx` | UI Component Unit Tests | **9 / 9** | 355 ms | Button states (loading, disabled); Input password reveal toggle; Modal accessibility & backdrop; Badge variants; ProgressBar percentage clamping; EmptyState actions. |
| `tests/unit/auth-store.test.ts` | Memory Security Unit Tests | **3 / 3** | 10 ms | Volatile memory storage of MasterKey & KEK; 0 localStorage writes; Memory wipe on clearAuth; Window event `cloudvault:session_expired` clears keys. |
| `tests/integration/e2e-user-journey.test.ts` | End-to-End User Journey | **6 / 6** | 1,460 ms | Full zero-knowledge registration with 24-word recovery phrase; Login with Argon2id; Filename metadata encryption; Chunk slicing & 5 MiB wire framing; S3 Range download & decryption assembly (100% bit identity); Password change with zero file re-encryption; Logout memory wipe. |

---

## 2. MONOREPO REGRESSION AUDIT (M1–M5 FULL INVENTORY)

| Workspace Package | Target / Runner | Passed Tests | Total Tests | Exit Code | Regressions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `@cloudvault/crypto-spec` (TS) | Vitest v3.2.7 | 25 | 25 | `0` | None (0) |
| `@cloudvault/crypto-spec` (Android) | Gradle 9.3.1 / JVM JUnit | 20 | 20 | `0` | None (0) |
| `@cloudvault/backend` (Unit) | Vitest v3.2.7 | 32 | 32 | `0` | None (0) |
| `@cloudvault/backend` (Integration) | Real PostgreSQL 15 & MinIO | 34 | 34 | `0` | None (0) |
| `@cloudvault/web` (M5 Suite) | Vitest v3.2.7 | 24 | 24 | `0` | None (0) |
| **Total Test Count** | **Monorepo Complete** | **135** | **135** | **0** | **0 Regressions** |

---

## 3. PRODUCTION BUILD VERIFICATION

- **Command:** `npm --workspace=@cloudvault/web run build`
- **Output:**
  ```text
  vite v6.4.6 building for production...
  transforming...
  ✓ 1680 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                               0.84 kB │ gzip:   0.47 kB
  dist/assets/crypto.worker-DnpvLcu5.js        25.16 kB
  dist/assets/index-BahclYVE.css               30.01 kB │ gzip:   5.89 kB
  dist/assets/index-BxPvlSSt.js               366.43 kB │ gzip: 116.23 kB
  dist/assets/libsodium-wrappers-BTNQlIV4.js  514.73 kB │ gzip: 184.67 kB
  ✓ built in 8.86s
  ```
- **Exit Code:** `0` (Zero TypeScript or bundling errors).
