# CLOUDVAULT — MILESTONE M5 KNOWN LIMITATIONS & ARCHITECTURAL CONSTRAINTS

> **Document Type:** M5 Technical Limits & Architectural Boundaries  
> **Status:** Active  
> **Date:** November 2026 (Environment: 13 Nov 2026)  

---

## 1. RECOVERY & 30-DAY GRACE PERIOD BOUNDARY

| Limitation / Invariant | Current State | Architectural Impact | Roadmap / Mitigation |
| :--- | :--- | :--- | :--- |
| **Account Recovery Restoration Endpoint** | **`NOT YET AVAILABLE`** | When an account reset occurs (Path B), the previous MasterKey envelope is retained in cold storage (`previous_key_bundle`) for a 30-day grace window. However, the automated active restoration API endpoint is not yet implemented. | In-flight roadmapped feature for Phase 3/4. The web UI explicitly documents this status and does NOT present restoration as a clickable working action. |
| **Permanent Data Loss without Recovery Kit** | Permanent & Irreversible | In a zero-knowledge architecture, if both password and 24-word phrase are lost, no admin or server mechanism can recover user files. | Mandatory 3-word challenge during signup enforces that users physically record their phrase before account creation. |

---

## 2. WEB BROWSER LIMITATIONS & CLIENT MITIGATIONS

| Limitation / Risk | Underlying Cause | Client Mitigation |
| :--- | :--- | :--- |
| **In-Memory Volatile Key Lifetime** | Page reload clears active session keys | By design, MasterKey and KEK are never written to `localStorage` or `IndexedDB`. Page refreshes require re-entering password or biometric unlock. | Prevents disk-forensic exfiltration and XSS extraction from browser storage. |
| **Maximum Upload File Size (v1.0)** | AWS S3 10,000 parts multipart limit with 5 MiB chunks | Max upload size is $\sim 48.83\text{ GiB}$. | Adequate for all MVP user tiers (Free 5GB, Personal 100GB, Pro 1TB). Dynamic chunk sizing (16MB / 64MB) will be introduced in Enterprise tiers. |
| **Web Trust Paradox** | Malicious server could serve altered JavaScript | Android Native application (APK signed, tamper-resistant) provides the primary high-assurance tier. | Web client uses strict Content Security Policy (CSP), Subresource Integrity (SRI), and memory zeroization. |
| **Large File Streaming in RAM** | Browser memory limits during download | File chunks are decrypted sequentially in 5 MiB pieces and written directly into stream buffers or Blob arrays, keeping resident RAM bounded. | Web Workers prevent UI thread locking during multi-gigabyte transfers. |
