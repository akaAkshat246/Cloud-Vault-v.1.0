# CLOUDVAULT — M5 ARCHITECTURE & DESIGN SPECIFICATION
## React 18 Progressive Web Application (PWA)

> **Milestone:** M5 — Web Client Tier  
> **Status:** Implemented & Verified  
> **Date:** November 2026 (Environment: 13 Nov 2026)  
> **Author:** Principal Frontend Architect, Application Security Engineer  

---

## 1. ARCHITECTURAL OVERVIEW

Milestone M5 delivers the high-performance, zero-knowledge Progressive Web Application (PWA) for CloudVault. The web client is designed to operate as a completely untrusted compute agent with respect to the server: all encryption, decryption, key derivation, and metadata protection take place locally in the user's browser, preventing the server, database administrators, or cloud infrastructure from ever accessing user plaintext.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER APPLICATION BOUNDARY                     │
│                                                                        │
│  ┌──────────────────────┐         ┌─────────────────────────────────┐  │
│  │   React 18 Main UI   │         │    Web Worker (Crypto Engine)   │  │
│  │                      │         │                                 │  │
│  │ - VaultDashboard     │  Post   │ - Argon2id KDF (m=64MiB, t=3)   │  │
│  │ - FileList & Grid    │ Message │ - HKDF Domain Separation        │  │
│  │ - UploadManager      │────────>│ - AES-256-GCM Envelope Wrap     │  │
│  │ - Settings & Sessions│<────────│ - 5 MiB Chunk AEAD + 27B AAD    │  │
│  │ - In-Memory AuthStore│ Transfer│ - BIP-39 Recovery Kit PBKDF2    │  │
│  └──────────────────────┘         └─────────────────────────────────┘  │
│             │                                                          │
│             │ Direct Axios Calls (Presigned Multipart URLs)            │
└─────────────┼──────────────────────────────────────────────────────────┘
              │
              ├───> AWS S3 / MinIO (Port 9000): Raw Encrypted 5 MiB Chunks
              │
              └───> Express Backend (Port 4000): AuthKey & Encrypted Blobs
```

---

## 2. DIRECTORY STRUCTURE & COMPONENT ROLES

The application resides in `/apps/web` as an official workspace within the monorepo:

- **`src/crypto/`**:
  - `web-crypto-engine.ts`: Core cryptographic implementation combining WebAssembly Libsodium (`crypto_pwhash` Argon2id) and W3C Web Crypto (`crypto.subtle` for AES-256-GCM, HKDF-SHA256, PBKDF2, SHA-256).
  - `crypto-bridge.ts`: Asynchronous RPC bridge dispatching tasks to background Web Workers with transferables for zero-copy memory overhead.
  - `wordlist.ts`: 2,048 BIP-39 English mnemonic words for the Emergency Recovery Kit.
- **`src/workers/`**:
  - `crypto.worker.ts`: Off-main-thread worker thread handling memory-hard Argon2id computations and 5 MiB chunk streaming encryptions.
- **`src/api/`**:
  - `client.ts`: Axios client configured with `withCredentials: true`, CSRF protection header `x-cloudvault-client: web`, and silent refresh on 401.
  - `auth.api.ts`, `files.api.ts`, `folders.api.ts`: Typed REST services directly conforming to `docs/api/openapi.yaml`.
- **`src/store/`**:
  - `auth.store.ts`: Ephemeral in-memory key and session storage. Enforces the invariant that MasterKey and KEK are never written to disk or browser storage.
  - `vault.store.ts`: Decrypted directory tree cache and upload/download queue state.
- **`src/hooks/`**:
  - `useAuth.ts`: Zero-knowledge login, registration, password change, and session lifecycle.
  - `useVault.ts`: Decrypted directory tree traversal, search filtering, sorting, folder CRUD.
  - `useUpload.ts`: Two-phase quota reservation, 5 MiB chunk slicing, worker encryption, direct S3 upload, and multipart completion.
  - `useDownload.ts`: Download info fetch, FEK unwrap, direct S3 fetch, worker chunk decryption, and blob save.
  - `usePWA.ts`: Service worker registration, install prompt interception, and online/offline status.
- **`src/features/`**:
  - `landing/`: High-impact landing page with zero-knowledge architectural diagrams and commercial tiers.
  - `auth/`: Pre-login, LoginForm, RegisterForm, and RecoveryModal (3-word challenge).
  - `verification/`: Email verification token handler and anti-enumeration resend.
  - `vault/`: Responsive shell with collapsible drawer, quota progress bar, breadcrumbs, search, and view toggles.
  - `files/`, `folders/`: Decrypted item cards, icons by MIME type, context menus.
  - `upload/`: Drag-and-drop zone and floating dock upload manager.
  - `settings/`: Account profile, active session revocation, password re-wrapping, and 30-day grace period notice.

---

## 3. ZERO-KNOWLEDGE CRYPTOGRAPHIC LIFECYCLE

### 3.1 Dual-Key Domain Separation
1. User enters password.
2. Worker runs Argon2id:
   $$\text{PRK} = \text{Argon2id}(\text{password}, \text{salt}, t=3, m=65536, p=1, \text{outLen}=64)$$
3. Worker expands PRK via HKDF-SHA256:
   - $\text{AuthKey} = \text{HKDF-Expand}(\text{PRK}, \text{"cloudvault-auth-key-v1"}, 32)$
   - $\text{KEK} = \text{HKDF-Expand}(\text{PRK}, \text{"cloudvault-kek-v1"}, 32)$
4. Only $\text{AuthKey}$ is sent to the backend over TLS. The server hashes it with bcrypt + pepper. $\text{KEK}$ remains exclusively in browser volatile memory.

### 3.2 MasterKey Envelope Wrapping
- Registration generates 32 cryptographically random bytes ($\text{MasterKey}$).
- Wrapped with $\text{KEK}$:
  $$\text{wrapped\_master\_key} = \text{AES-256-GCM}(\text{KEK}, \text{IV}_{12}, \text{MasterKey}, \text{AAD}=\text{"cloudvault-master-key-wrap-v1"})$$
- Wrapped with BIP-39 $\text{RecoveryKey}$:
  $$\text{encrypted\_recovery\_master\_key} = \text{AES-256-GCM}(\text{RecoveryKey}, \text{IV}_{12}, \text{MasterKey}, \text{AAD}=\text{"cloudvault-recovery-master-key-v1"})$$

### 3.3 Chunk Slicing & Direct S3 Storage
- Standard chunk size: $5\text{ MiB} = 5,242,880\text{ bytes}$.
- Each file has a unique 256-bit random $\text{FEK}$.
- Each chunk binds a 27-byte AAD:
  $$\text{AAD} = \text{format\_version (2B)} \parallel \text{file\_id (16B)} \parallel \text{chunk\_index (4B)} \parallel \text{total\_chunks (4B)} \parallel \text{is\_final (1B)}$$
- Wire chunk format:
  $$\text{WireChunk} = \text{IV (12B)} \parallel \text{Ciphertext (N bytes)} \parallel \text{Tag (16B)}$$
  Total size for a standard chunk: $5,242,908\text{ bytes}$.
- Directly uploaded to S3 via presigned multipart PUT URLs. Node.js backend CPU is never consumed proxying payloads.

---

## 4. PWA APPLICATION SHELL & SERVICE WORKER SPECIFICATION

- **Web App Manifest (`public/manifest.json`)**: Configured with `standalone` display mode, `#0a0f1a` theme background, and SVG/PNG icon assets.
- **Service Worker (`public/sw.js`)**:
  - Implements a strict Cache-First strategy solely for immutable static application shell files (`.html`, `.js`, `.css`, `.svg`, fonts).
  - **Zero-Storage Security Invariant**: Strictly rejects caching any request to `/api/*`, presigned S3 URLs (`localhost:9000` or `*.amazonaws.com`), auth tokens, or decrypted blobs.
  - Ensures clean offline app shell fallback.
