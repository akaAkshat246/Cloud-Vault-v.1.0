package app.cloudvault.bench

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.bouncycastle.crypto.generators.Argon2BytesGenerator
import org.bouncycastle.crypto.params.Argon2Parameters
import java.nio.charset.StandardCharsets

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BenchmarkScreen()
                }
            }
        }
    }
}

@Composable
fun BenchmarkScreen() {
    val coroutineScope = rememberCoroutineScope()
    var isRunning by remember { mutableStateOf(false) }
    var currentTestName by remember { mutableStateOf("Idle") }
    var logOutput by remember { mutableStateOf("Ready to benchmark. Tap a test below to measure on this physical device.\n") }

    fun runArgon2(name: String, iterations: Int, memoryKiB: Int, parallelism: Int) {
        if (isRunning) return
        isRunning = true
        currentTestName = name
        logOutput += "\n▶ Running $name (t=$iterations, m=${memoryKiB / 1024}MiB, p=$parallelism)...\n"

        coroutineScope.launch {
            val resultText = withContext(Dispatchers.Default) {
                val password = "CloudVaultPhysicalBench2026!".toByteArray(StandardCharsets.UTF_8)
                val salt = ByteArray(16) { it.toByte() }

                val params = Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                    .withVersion(Argon2Parameters.ARGON2_VERSION_13)
                    .withIterations(iterations)
                    .withMemoryAsKB(memoryKiB)
                    .withParallelism(parallelism)
                    .withSalt(salt)
                    .build()

                val gen = Argon2BytesGenerator()
                gen.init(params)
                val result = ByteArray(64)

                // Benchmark execution
                val startTime = System.currentTimeMillis()
                gen.generateBytes(password, result, 0, result.size)
                val duration = System.currentTimeMillis() - startTime

                val hex = result.take(8).joinToString("") { "%02x".format(it) }
                "✔ Completed in ${duration} ms (Hash prefix: $hex...)"
            }

            logOutput += "$resultText\n"
            isRunning = false
            currentTestName = "Done"
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("CloudVault Argon2id Benchmark", fontSize = 22.sp, style = MaterialTheme.typography.headlineMedium)
        Text("Measures key derivation latency on physical Android hardware for ADR-002 parameter validation.", fontSize = 14.sp)

        if (isRunning) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            Text("Testing $currentTestName...", color = MaterialTheme.colorScheme.primary)
        }

        Divider()

        Button(
            onClick = { runArgon2("Target Spec: 64MiB / 3 iter", iterations = 3, memoryKiB = 65536, parallelism = 1) },
            enabled = !isRunning,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("1. Run Baseline (t=3, m=64MiB, p=1)")
        }

        Button(
            onClick = { runArgon2("Low-End Alternative A: 32MiB / 3 iter", iterations = 3, memoryKiB = 32768, parallelism = 1) },
            enabled = !isRunning,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("2. Run Alternative A (t=3, m=32MiB, p=1)")
        }

        Button(
            onClick = { runArgon2("Low-End Alternative B: 64MiB / 2 iter", iterations = 2, memoryKiB = 65536, parallelism = 1) },
            enabled = !isRunning,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("3. Run Alternative B (t=2, m=64MiB, p=1)")
        }

        OutlinedCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp)
        ) {
            Text(
                text = logOutput,
                fontSize = 13.sp,
                modifier = Modifier.padding(12.dp)
            )
        }
    }
}
