# CloudVault — Milestone M6 Test Report
## Automated Verification, Cryptographic Parity & Native Android Test Suite Execution

**Document Version:** 1.0.0  
**Target Milestone:** M6 (Native Android Application)  
**Author:** QA Lead, Cryptography Reviewer & Android Architect  
**Execution Date:** 13 November 2026  
**Status:** **100% PASS** (Zero Failures, Zero Errors)

---

## 1. Test Suite Summary Table

| Test Suite / Target | Module Path | Tests | Passed | Failed | Duration | Exit Code | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Android Crypto & Vectors (Debug)** | `apps/android` (`CryptoEngineTest`) | 7 | 7 | 0 | ~1.5s | 0 | **PASS** |
| **Android Crypto & Vectors (Release)** | `apps/android` (`CryptoEngineTest`) | 7 | 7 | 0 | ~1.4s | 0 | **PASS** |
| **Android Benchmark APK Compilation** | `apps/android-bench` (`assembleDebug`) | 35 Tasks | 35 | 0 | 38s | 0 | **PASS** |
| **Native Production Android APK Build** | `apps/android` (`assembleDebug`) | 35 Tasks | 35 | 0 | 1m 35s | 0 | **PASS** |
| **Shared M1 Crypto Spec (TS)** | `packages/crypto-spec` | 25 | 25 | 0 | 1.96s | 0 | **PASS** |
| **Shared M1 Crypto Spec (Android JVM)** | `packages/crypto-spec/android` | 20 | 20 | 0 | 20.0s | 0 | **PASS** |
| **Backend Integration (Postgres + MinIO)**| `@cloudvault/backend` | 34 | 34 | 0 | 36.86s | 0 | **PASS** |
| **Backend Unit Tests** | `@cloudvault/backend` | 32 | 32 | 0 | 5.18s | 0 | **PASS** |
| **Web Client Tests (React PWA)** | `@cloudvault/web` | 24 | 24 | 0 | 8.03s | 0 | **PASS** |
| **FULL MONOREPO AGGREGATE** | **Entire CloudVault Workspace** | **149** | **149** | **0** | **~3m 45s**| **0** | **PASS (100%)** |

---

## 2. Android Test Suite Detailed Execution (`CryptoEngineTest.kt`)

**Command:**
```bash
cd apps/android && ./gradlew test
```

**Results:**
1. `testBip39WordlistCount`: Verifies complete standard 2,048 English wordlist matches BIP-39 specification (`abandon` at 0, `zoo` at 2047). **(PASS)**
2. `testArgon2idAndHkdfMatchesKnownAnswer`: Verifies Bouncy Castle Argon2id ($m=64\text{ MiB}, t=3, p=1$) derives byte-identical 64-byte PRK, and HKDF derives identical 32-byte AuthKey and KEK as specified in `v1.json`. **(PASS)**
3. `testMasterKeyEnvelopeUnwrapping`: Verifies KEK unwraps `master_key_wrapped` payload via AES-256-GCM matching known master key hex. **(PASS)**
4. `testRecoveryKitUnwrapsMasterKey`: Verifies 24-word BIP-39 mnemonic derives identical 32-byte RecoveryKey via PBKDF2-HMAC-SHA512 and successfully unwraps the master key envelope. **(PASS)**
5. `testChunkEncryptionDecryptionWithAAD`: Verifies 5 MiB wire chunk packing, 27-byte AAD binding, and AES-256-GCM authenticated decryption. **(PASS)**
6. `testTamperedTagMustFail` (Negative Vector): Injected 1-bit corruption into the 16-byte GCM authentication tag. Decryption immediately throws `AEADBadTagException`. **(PASS)**
7. `testTamperedAADMustFail` (Negative Vector): Injected format version corruption into the 27-byte AAD. Decryption immediately throws `AEADBadTagException`. **(PASS)**

---

## 3. APK Compilation & Build Evidence

**Build Command:**
```bash
cd apps/android && ./gradlew assembleDebug
```

**Artifact:**
- Location: `apps/android/app/build/outputs/apk/debug/app-debug.apk`
- File Size: `22,805,899` bytes ($\sim 22.8\text{ MB}$)
- Toolchain: Gradle 9.3.1, Android Gradle Plugin 8.7.2, Kotlin 2.1.0, Jetpack Compose BOM 2024.11.00, Android SDK API 35.
- Status: **BUILD SUCCESSFUL** (Exit Code 0).
