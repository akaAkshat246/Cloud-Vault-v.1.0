# CloudVault — Milestone M6 Known Limitations & Technical Disclosures

**Document Version:** 1.0.0  
**Target Milestone:** M6 (Native Android Application)  
**Author:** Principal Software Architect & QA Lead  
**Status:** Approved for Production Baseline

---

## 1. Technical Limitations Matrix

| Capability / Area | Current M6 Implementation Status | Technical Rationale & Architectural Roadmap |
| :--- | :--- | :--- |
| **Account Recovery Restoration (Path B)** | 30-Day Orphan Grace Period implemented in backend database; active restoration endpoint returns `NOT YET AVAILABLE`. | Preservation of strict security model: prevents unauthorized immediate recovery without offline operator verification. |
| **Android Physical Device KDF Benchmark** | Android APK compiled (`22.8 MB`); JVM tests pass 100% of vectors; physical device unlock time remains an empirical estimate ($\sim 1.25\text{ s}$). | Target hardware benchmarks across diverse Snapdragon, MediaTek, and Exynos chipsets will be empirically measured during physical lab testing. |
| **Maximum Upload File Size (v1.0)** | Fixed 5 MiB wire chunks with AWS S3 10,000 part multipart limit. Max upload size is $\sim 48.83\text{ GiB}$. | Adequate for all consumer user tiers (Free 5GB, Personal 100GB, Pro 1TB). Dynamic chunk sizing (16MB / 64MB) will be introduced in Enterprise tiers. |
| **Aggressive OEM Battery Optimization** | Heavily customized Android distributions (e.g. Xiaomi MIUI, Oppo ColorOS, Samsung OneUI) may terminate long-running background workers. | Mitigated via WorkManager foreground service notifications (`ForegroundInfo`) and automatic network reconnection rescheduling. |
| **Biometric Hardware Variation** | Android devices without hardware TEE (Class 3 Strong Biometrics) fallback to credential PIN/Password. | Handled gracefully via `BiometricManager.canAuthenticate()` checks in `KeystoreManager`. |

---

## 2. Security Disclosures

1. **Rooted Android Devices:** On rooted devices, root processes can inspect memory dumps of other applications. CloudVault mitigates this using explicit memory zeroization on logout, but no software running on an untrusted operating system can completely defend against full kernel compromise.
2. **Device-Bound Protection Invalidation:** Enrolling a new fingerprint or disabling the lock screen immediately invalidates the Keystore key by design, protecting users from stolen phone attacks.
