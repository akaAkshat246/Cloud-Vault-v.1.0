package app.cloudvault.crypto.benchmark

/**
 * CloudVault Android Benchmark Harness for Argon2id KDF Evaluation
 * Target: Verify whether t=3, m=64MiB, p=1 unlocks in < 1.5s on physical Android devices.
 *
 * To run on physical Android device:
 * Copy this runner or execute via Android Studio instrumentation test:
 * ./gradlew connectedAndroidTest
 */
data class BenchmarkResult(
    val iterations: Int,
    val memoryMiB: Int,
    val parallelism: Int,
    val runTimesMs: List<Long>,
    val averageMs: Double,
    val minMs: Long,
    val maxMs: Long
)

object Argon2BenchmarkHarness {

    /**
     * Executes Argon2id benchmark using the reference algorithm parameters
     * @param argon2Runner Lambda executing the platform Argon2id binding (e.g. Argon2Kt or Lazysodium)
     */
    fun runBenchmark(
        rounds: Int = 5,
        timeCost: Int = 3,
        memoryKiB: Int = 65536,
        parallelism: Int = 1,
        argon2Runner: (password: ByteArray, salt: ByteArray) -> ByteArray
    ): BenchmarkResult {
        println("=== Starting CloudVault Android Argon2id Benchmark ===")
        println("Parameters: t=$timeCost, m=${memoryKiB / 1024}MiB ($memoryKiB KiB), p=$parallelism, runs=$rounds")

        val dummyPassword = "UserBenchmarkPassword123!@#".toByteArray(Charsets.UTF_8)
        val dummySalt = ByteArray(16) { it.toByte() }

        // Warmup round
        println("Warming up JIT / native runtime...")
        argon2Runner(dummyPassword, dummySalt)

        val runTimes = mutableListOf<Long>()
        for (i in 1..rounds) {
            val start = System.currentTimeMillis()
            val output = argon2Runner(dummyPassword, dummySalt)
            val duration = System.currentTimeMillis() - start
            runTimes.add(duration)
            println("  [Run $i/$rounds] Completed in ${duration}ms (output length: ${output.size} bytes)")
        }

        val avg = runTimes.average()
        val min = runTimes.minOrNull() ?: 0L
        val max = runTimes.maxOrNull() ?: 0L

        println("-------------------------------------------------------")
        println("Benchmark Summary:")
        println("  Average: ${String.format("%.1f", avg)} ms")
        println("  Min: ${min} ms | Max: ${max} ms")
        println("  Target Requirement (< 1500 ms): ${if (avg < 1500) "MET (PASS)" else "EXCEEDED (ADJUST PARAMS)"}")
        println("=======================================================")

        return BenchmarkResult(
            iterations = timeCost,
            memoryMiB = memoryKiB / 1024,
            parallelism = parallelism,
            runTimesMs = runTimes,
            averageMs = avg,
            minMs = min,
            maxMs = max
        )
    }
}

