package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KnownLimitationsScreen(
    onNavigateBack: () -> Unit
) {
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Known Limitations & Disclosures", color = HeadingDark, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryPurple)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = VoidDark)
            )
        },
        containerColor = VoidDark
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Notice 1: Recovery Restoration
            LimitationCard(
                title = "Account Recovery 30-Day Grace Period",
                statusBadge = "ACTIVE RESTORATION NOT YET AVAILABLE",
                badgeColor = WarningAmber,
                description = "Account reset moves all existing user data to an orphaned 30-day grace period in cold storage. Active automated recovery restoration requires manual operator verification and is intentionally not automated via self-service API in v1.0."
            )

            // Notice 2: Android Physical Benchmark
            LimitationCard(
                title = "Android Hardware KDF Latency",
                statusBadge = "ESTIMATE (~1.25s)",
                badgeColor = PrimaryPurple,
                description = "Pure JVM unit tests pass 100% of Argon2id known-answer test vectors. The physical low-end Android device unlock latency is estimated at ~1.25s (target < 1.5s) and will be formally verified during physical lab testing."
            )

            // Notice 3: Maximum Upload Size
            LimitationCard(
                title = "File Size Boundary (v1.0)",
                statusBadge = "~48.8 GiB Max",
                badgeColor = BrightAccentPurple,
                description = "With fixed 5 MiB wire chunks and AWS S3 10,000 part limit, maximum file size in v1.0 is ~48.83 GiB. Dynamic 16MB/64MB chunking will be enabled in enterprise tiers."
            )

            // Notice 4: High Assurance Tier
            LimitationCard(
                title = "Native Android Security Tier",
                statusBadge = "HIGH ASSURANCE",
                badgeColor = SuccessGreen,
                description = "Unlike the Web client which operates under the Web Trust Paradox (server could serve altered JS), the Native Android application is APK-signed, tamper-resistant, and protects hardware-bound keys using Android Keystore."
            )
        }
    }
}

@Composable
fun LimitationCard(
    title: String,
    statusBadge: String,
    badgeColor: androidx.compose.ui.graphics.Color,
    description: String
) {
    CosmicCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(title, color = HeadingDark, fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            }

            Box(
                modifier = Modifier
                    .background(badgeColor.copy(alpha = 0.2f), androidx.compose.foundation.shape.RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(statusBadge, color = badgeColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }

            Text(description, color = SecondaryTextDark, fontSize = 12.sp, lineHeight = 18.sp)
        }
    }
}

