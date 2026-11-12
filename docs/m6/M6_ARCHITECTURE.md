# CloudVault — Milestone M6 Architecture
## Native Android Application Architecture & Modern Android Engineering Guide

**Document Version:** 1.0.0  
**Target Milestone:** M6 (Native Android Application)  
**Author:** Principal Android Architect & Mobile Security Engineer  
**Status:** Approved for Milestone M6 Delivery

---

## 1. High-Level Architectural Overview

CloudVault Android is built in accordance with Google's **Modern Android Architecture (MAD)** guidelines, Clean Architecture, and Unidirectional Data Flow (UDF). It provides a high-assurance native tier complementing the React 18 PWA.

```
┌────────────────────────────────────────────────────────┐
│                   UI Layer (Compose)                   │
│   20 Canonical Screens ◄─── StateFlow ──── ViewModels  │
│   Theme Tokens, Custom Canvas Squircle, Donut Meters   │
└───────────────────────────▲────────────────────────────┘
                            │ (Events & States)
┌───────────────────────────▼────────────────────────────┐
│                      Domain Layer                      │
│   Domain Models: User, FileItem, FolderItem, Quota     │
│   Use Cases: Auth, Vault, Key Derivation, Transfers    │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                       Data Layer                       │
│  Repositories: AuthRepository, VaultRepository, etc.   │
│  Data Sources: CloudVaultApiClient, CloudVaultDatabase │
│  Background: WorkManager (FileUpload / FileDownload)   │
│  Security: AndroidCryptoEngine, KeystoreManager        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture & Responsibility Separation

### A. Presentation Layer (Jetpack Compose)
- **Single-Activity Architecture:** `MainActivity.kt` acts as the single host window.
- **Declarative Navigation:** `NavHost` inside `NavGraph.kt` routes between 20 canonical screens.
- **State Hoisting:** Screens are stateless where practical, receiving immutable UI state and forwarding user interaction callbacks.
- **Visual Design Identity:** Theme tokens in `Color.kt`, `Theme.kt`, and `Type.kt` faithfully reproduce the cosmic purple brand aesthetic defined in `image.png` and the 32 WhatsApp design screenshots.

### B. Cryptographic Core Layer (`data/crypto/`)
- **`CryptoSpec.kt`:** Pure Kotlin implementation of AES-256-GCM, 27-byte AAD generation, metadata AAD generation, RFC 5869 HKDF-SHA256, wire chunk packing/unpacking, and Base64 key wrapping.
- **`AndroidCryptoEngine.kt`:** High-level cryptographic coordinator. Executes Bouncy Castle Argon2id ($m=64\text{ MiB}, t=3, p=1$), derives AuthKey and KEK, generates 24-word BIP-39 recovery mnemonics, and wraps/unwraps MasterKey and FEKs.
- **`VolatileKeyStore.kt`:** RAM-only singleton holding transient MasterKey and KEK buffers. Enforces zeroization (clearing buffers with zeroes) upon logout or session invalidation.
- **`KeystoreManager.kt`:** Hardware-backed Android Keystore integration generating device-bound AES-256-GCM protection keys.

### C. Background Transfer Engine (`data/workers/`)
- **`FileUploadWorker`:** Background worker that reads file streams via `ContentResolver`, computes 5 MiB wire chunks, encrypts with FEK + 12B IV + 27B AAD, PUTs chunks directly to presigned S3 URLs, and calls backend upload completion.
- **`FileDownloadWorker`:** Downloads ciphertext chunks from presigned S3 URLs, validates 27-byte AAD, decrypts using unwrapped FEK, and writes plaintext bytes directly to user-selected Storage Access Framework (SAF) URIs.

### D. Local Persistence Layer (`data/db/`)
- **`CloudVaultDatabase`:** SQLite database helper managing `TransferTaskEntity` and `CachedFileEntity`.
- **Zero-Knowledge Invariant:** Zero cryptographic keys, passwords, or recovery mnemonics are stored in the local database.

---

## 3. Concurrency & Threading Model

CloudVault enforces strict thread isolation to ensure a 60/120 FPS UI:
- **`Dispatchers.Main`:** Jetpack Compose composition, UI event dispatching, and animation rendering.
- **`Dispatchers.Default`:** CPU-intensive cryptographic work (Argon2id KDF derivation, AES-256-GCM chunk encryption and decryption).
- **`Dispatchers.IO`:** Network requests (OkHttp API calls, direct-to-S3 uploads/downloads) and SQLite disk reads/writes.
