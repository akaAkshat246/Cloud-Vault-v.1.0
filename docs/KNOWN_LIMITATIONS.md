# CloudVault — Known Limitations & Architectural Constraints

> **Classification:** Security Architecture & System Limits Single Source of Truth  
> **Last Updated:** March 2026  
> **Status:** Active  

---

## 1. Cryptographic & Operational Limits

| Item | Limit / Constraint | Architectural Reason & Impact | Mitigations / Roadmapped Work |
| :--- | :--- | :--- | :--- |
| **Maximum File Size (v1.0)** | ~48.83 GiB (52,428,800,000 bytes) | AWS S3 enforces a hard limit of 10,000 parts per multipart upload. At 5 MiB chunks, max size is $10,000 \times 5\text{ MiB} = 48.83\text{ GiB}$. | For Enterprise tiers in Phase 3, chunk size will dynamically scale to 16 MiB or 64 MiB for files $> 48\text{ GiB}$. |
| **Minimum Chunk Size** | 5,242,880 bytes (5 MiB) | AWS S3 Multipart API rejects any non-final part smaller than 5 MiB. | Files $< 5\text{ MiB}$ are uploaded as a single part ($N=1$). |
| **Chunk Framing Overhead** | 28 bytes per chunk | 12 bytes CSPRNG IV prepended + 16 bytes AES-GCM authentication tag appended. Ciphertext chunk is 5,242,908 bytes. | Negligible overhead (~0.0005% for 5 MiB chunk). |
| **Unknown-Length Streaming** | Local cache spooling required | 27-byte AAD binds `total_chunks` to prevent truncation attacks. Live microphone/camera streams must spool to cache before upload initialization. | Handled via browser Origin Private File System (OPFS) and Android app cache directory. |
| **Argon2id Unlock Latency** | ~1.25s (ESTIMATE) on mobile | $m=64\text{ MiB}, t=3, p=1$ parameter target on ARM cores. Verified on desktop (425ms), mobile physical benchmark pending reviewer test run. | Benchmark harness provided in `/packages/crypto-spec/android/src/main/kotlin/app/cloudvault/crypto/benchmark/`. |

---

## 2. Zero-Knowledge Metadata Limitations

| Item | Limitation | Architectural Impact | Client Handling |
| :--- | :--- | :--- | :--- |
| **Server-Side File Search** | Completely impossible | Server only stores opaque encrypted ciphertext and random IV. Cannot run `ILIKE '%query%'` in SQL. | Client decrypts file/folder names locally and searches in-memory / local Room/IndexedDB cache. |
| **Server-Side Directory Tree** | Flat UUID relationships | Server only knows `parent_id` hierarchy. Plaintext `path` is eliminated from database per ADR-004. | Client recursively constructs breadcrumb paths by traversing parent pointers and decrypting folder names. |
| **Duplicate Filename Enforcement** | Client-side only | Server cannot enforce SQL unique constraint on filename within a directory. | Client checks for duplicate names in local decrypted directory index before initializing upload session. |
| **Server-Side Thumbnails** | Completely impossible | Server cannot generate video/image thumbnails on ciphertext blobs. | Client generates encrypted thumbnail blobs during upload and stores them in encrypted metadata. |

---

## 3. Web Client Trust Paradox & Sharing Risks

| Item | Risk / Limitation | Honest Assessment | Mitigations |
| :--- | :--- | :--- | :--- |
| **Web Trust Paradox** | Malicious Server JavaScript | Web browsers receive application code from the server on every page load. A compromised web server could serve backdoored JS to steal decrypted keys in memory. | Native Android app (APK signed, code tamper-proof) is the primary high-assurance tier. Web client uses strict Content Security Policy (CSP), Subresource Integrity (SRI), and planned WebExtensions. |
| **URL Fragment Sharing** | Browser history / link leakage | In `#key=<fek>`, fragments are not sent to web server per RFC 3986, but may persist in browser history, shoulder surfing, or malicious browser extensions. | Optional password protection layer (Argon2id + AES-GCM wrap of FEK), configurable link expiration, and download count limits. |

---

## 4. Account Recovery & Data Loss Invariant

| Item | Constraint | System Policy |
| :--- | :--- | :--- |
| **Lost Password + Lost Recovery Kit** | Permanent, mathematically irreversible data loss | Zero-Knowledge invariant dictates that no administrator or system process can decrypt files. | **Path B (Account Reset):** User can reset password, but all existing encrypted files are orphaned. A 30-day grace period is provided before permanent deletion in case the 24-word phrase is recovered. |
| **CI / Environment Availability** | Remote CI not yet run | Workspace currently operates in a local environment without a configured remote Git repository. | `.github/workflows/backend-ci.yml` and `crypto-spec-ci.yml` prepared for immediate execution upon remote repository push. |
| **Local Docker Daemon** | Host Docker daemon inactive | Docker daemon was not running during local M2 verification on host; storage and migration logic verified against unit and mock test harnesses. | Docker compose files and automated MinIO provisioning scripts fully ready in `/infra/docker/`. |

