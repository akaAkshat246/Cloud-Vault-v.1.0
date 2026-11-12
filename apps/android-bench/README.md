# CloudVault Android Benchmark Harness (`apps/android-bench`)

Minimal Jetpack Compose Android app to measure real **Argon2id** key derivation performance on physical Android hardware (as requested for ADR-002 parameter validation).

---

## Benchmark Profiles Tested

1. **Target Spec (Recommended Baseline):**
   - Memory: $64\text{ MiB}$ ($65,536\text{ KiB}$)
   - Iterations: $t = 3$
   - Parallelism: $p = 1$
   - Target Unlock Threshold: $< 1.5\text{ seconds}$

2. **Alternative A (Memory-Constrained Devices):**
   - Memory: $32\text{ MiB}$ ($32,768\text{ KiB}$)
   - Iterations: $t = 3$
   - Parallelism: $p = 1$

3. **Alternative B (CPU-Constrained Devices):**
   - Memory: $64\text{ MiB}$ ($65,536\text{ KiB}$)
   - Iterations: $t = 2$
   - Parallelism: $p = 1$

---

## Instructions for Physical Device Run

### Prerequisites
- Android Studio Hedgehog+ or Android SDK command line tools.
- Physical Android phone with **USB Debugging** enabled (Developer Options).
- Connect via USB or Wi-Fi adb.

### Steps to Build and Install
```bash
# 1. Verify device connection
adb devices

# 2. Build and install debug APK onto physical phone
cd apps/android-bench
./gradlew installDebug

# Or generate standalone APK:
./gradlew assembleDebug
# Output APK: apps/android-bench/app/build/outputs/apk/debug/app-debug.apk
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Execution
1. Launch the **CloudVault Bench** app on your phone.
2. Tap **1. Run Baseline (t=3, m=64MiB, p=1)**.
3. Observe the measured duration in milliseconds printed on-screen and paste the number back to update `docs/benchmarks/M1.md` from **ESTIMATE** to **MEASURED**.
