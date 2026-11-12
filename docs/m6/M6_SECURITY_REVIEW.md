# CloudVault — Milestone M6 Mobile Security Review
## Comprehensive Threat Modeling, Cryptographic Boundaries & Memory Safety Audit

**Document Version:** 1.0.0  
**Target Milestone:** M6 (Native Android Application)  
**Author:** Mobile Application Security Engineer & Cryptography Auditor  
**Audit Status:** PASSED (Zero High/Critical Vulnerabilities)

---

## 1. Threat Model & Security Boundaries

The native Android platform offers a higher security assurance tier than web browsers because the application binary is signed, installed into a sandboxed environment, and executes native code without dynamically loading arbitrary remote scripts.

| Threat Scenario | Attack Vector | CloudVault Native Mitigation | Risk Level |
| :--- | :--- | :--- | :--- |
| **Server Compromise / Rogue Operator** | Attacker accesses backend database and object storage | Zero-knowledge design: server stores only bcrypt-hashed AuthKeys, wrapped MasterKeys, and encrypted chunks. Plaintext file contents and filenames are completely unrecoverable by the server. | **MITIGATED (Zero-Knowledge)** |
| **Man-in-the-Middle (MitM) Attack** | Attacker intercepts network communications | All traffic uses TLS 1.3 with certificate pinning compatibility. Even with compromised TLS, all file chunks and filenames are already end-to-end encrypted with AES-256-GCM prior to transmission. | **MITIGATED** |
| **Physical Device Theft (Locked Device)** | Attacker steals device with active PIN/Biometrics | Android Keystore protection key is hardware-backed (TEE). MasterKey on disk is encrypted with AES-256-GCM. Removal of lock screen or enrollment of new biometrics permanently invalidates the key. | **MITIGATED** |
| **Device Compromise (Root / Memory Scraping)** | Malicious process scrapes Android RAM | Raw MasterKey and KEK exist only in volatile Java heap during active unlocked sessions. Explicit zeroization (`Arrays.fill(bytes, 0)`) occurs on logout. No plaintext keys are ever saved to disk or SQLite. | **ACCEPTED RISK / DEFENSE-IN-DEPTH** |
| **Chunk Tampering / S3 Data Corruption** | Attacker flips bits in S3 ciphertext or swaps chunks | 27-byte AAD binds file ID, chunk index, and total chunks into the 16-byte GCM authentication tag. Any tampering or reordering throws immediate cryptographic validation errors. | **MATHEMATICALLY MITIGATED** |
| **App Backup Data Leakage** | Android Auto-Backup copies private app data to Google Cloud | `data_extraction_rules.xml` explicitly excludes `sharedpref`, `database`, and all private app files from cloud and device-to-device transfers. | **MITIGATED** |

---

## 2. In-Memory Key Lifecycle & Zeroization Audit

1. **Transient State:**
   - In `VolatileKeyStore.kt`, all cryptographic keys (`masterKey`, `kek`, `authKey`) are stored in private, synchronized byte arrays.
   - Keys are never persisted in Android SharedPreferences, SQLite, or WorkManager task parameters.
2. **Explicit Zeroization on Logout:**
   - Standard Java garbage collection does not immediately wipe memory. To prevent lingering keys from remaining in memory dumps, CloudVault explicitly overwrites key buffers with zeros:
     ```kotlin
     masterKey?.let { Arrays.fill(it, 0.toByte()) }
     masterKey = null
     ```
3. **No Logging of Sensitive Secrets:**
   - Automated regex audit verifies zero logging of passwords, AuthKeys, KEKs, MasterKeys, FEKs, or recovery mnemonics in logcat or crash dumps.
