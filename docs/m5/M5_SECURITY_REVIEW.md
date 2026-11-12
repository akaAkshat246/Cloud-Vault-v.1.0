# CLOUDVAULT — M5 APPLICATION SECURITY REVIEW
## Zero-Knowledge Web Client Perimeter, Memory Invariants & Threat Model

> **Milestone:** M5 — Web Client Tier  
> **Status:** APPROVED & AUDITED  
> **Review Date:** 12 November 2026 (Environment: 13 Nov 2026)  
> **Classification:** Application Security & Cryptographic Review  

---

## 1. ZERO-KNOWLEDGE SECURITY INVARIANTS AUDIT

| Invariant | Specification Requirement | Web Client Implementation | Audit Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **INV-01: Zero Plaintext Password** | Password must never be transmitted or stored on server | Master password is consumed strictly in client Web Worker to derive PRK via Argon2id. | **PASS** | `web-crypto-engine.ts:145`, `useAuth.ts:24` |
| **INV-02: Key Isolation** | MasterKey, KEK, and FEK must never reach the backend | AuthKey is separated using domain tag `cloudvault-auth-key-v1`. Server receives only AuthKey and wrapped blobs. | **PASS** | `api.types.ts:28`, `e2e-user-journey.test.ts:38` |
| **INV-03: Zero Plaintext Metadata** | Filenames and directory paths must be encrypted | Filenames encrypted with MasterKey + random 12B IV. Database stores only `encrypted_name` and `name_nonce`. | **PASS** | `FileItemResponse`, `web-crypto-engine.ts:320` |
| **INV-04: Client-Side Encryption** | S3 stores only AES-256-GCM ciphertext chunks | Chunks sliced to 5 MiB, encrypted in Web Worker with 27B AAD binding before direct S3 PUT. | **PASS** | `useUpload.ts:98`, `web-crypto-engine.ts:275` |
| **INV-05: In-Memory Key Lifetime** | Zero keys in `localStorage` or `IndexedDB` | `masterKeyHex` and `kekHex` stored in volatile memory (`auth.store.ts`). Wiped on logout or session expiration. | **PASS** | `auth-store.test.ts:11`, `auth.store.ts:85` |
| **INV-06: Tamper & Reorder Defenses** | Mathematical chunk swap/reorder/truncation defense | 27-byte AAD binds `file_id (16B)`, `chunk_index (4B)`, `total_chunks (4B)`, and `is_final (1B)`. | **PASS** | `vectors.test.ts:100` (Negative tests pass) |
| **INV-07: Service Worker Privacy** | Service Worker must never cache keys, API data, or blobs | `sw.js` explicitly bypasses `/api/*`, S3 presigned URLs, and volatile blob URLs. | **PASS** | `public/sw.js:38-50` |
| **INV-08: Cross-Platform Parity** | Byte-for-byte compatibility with M1 Spec | Matches PRK, AuthKey, KEK, MasterKey wrap, and chunk wire framing in `v1.json`. | **PASS** | `vectors.test.ts:25-85` (6 / 6 tests PASS) |

---

## 2. WEB TRUST PARADOX & THREAT MODEL MITIGATIONS

### 2.1 The Web Trust Paradox (Accepted Risk & Mitigations)
In web browsers, application code is delivered from the web server upon each page visit. If the web server or DNS were compromised, an attacker could theoretically serve modified JavaScript that exfiltrates decrypted keys from RAM.

**Mitigations Enforced:**
1. **Native Android App Primacy:** For high-assurance enterprise security, the Native Android app (APK signed, tamper-resistant, isolated in Android Keystore) serves as the primary tier.
2. **Strict Content Security Policy (CSP):** `index.html` restricts script sources, object sources, and worker script origins.
3. **No Key Persistence:** Closing the tab or refreshing the page instantly destroys all keys in memory.
4. **CSRF Mitigation:** `x-cloudvault-client: web` header and Origin verification protect session refresh against Cross-Site Request Forgery.

### 2.2 Memory Hardness & Side-Channel Protections
- **Argon2id Parameters:** $m=64\text{ MiB}, t=3, p=1$. WebAssembly execution prevents timing variations from revealing password lengths.
- **Constant-Time Verification:** Web Crypto's native AES-GCM implementation operates in constant time, verified against AES-NI hardware primitives.
- **Anti-User Enumeration:** Pre-login endpoint returns deterministic pseudorandom salts for non-existent email addresses to prevent user discovery.
