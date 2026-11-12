package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.VaultRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.components.StorageDonutRing
import app.cloudvault.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorageUsageScreen(
    vaultRepository: VaultRepository,
    onNavigateBack: () -> Unit
) {
    val quota = vaultRepository.storageQuota.collectAsState().value
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Storage Usage", color = HeadingDark, fontWeight = FontWeight.Bold) },
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
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Main Donut Ring Card matching 8.12.29.jpeg
            CosmicCard(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Storage Usage", color = HeadingDark, fontSize = 16.sp, fontWeight = FontWeight.Bold)

                    Spacer(modifier = Modifier.height(16.dp))

                    StorageDonutRing(
                        percentage = quota?.percentage ?: 0.0,
                        usedText = quota?.usedGbString ?: "0.0 GB",
                        totalText = quota?.totalGbString ?: "5 GB",
                        size = 150.dp,
                        strokeWidth = 16.dp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "${String.format("%.1f", quota?.percentage ?: 0.0)}% of quota used",
                        color = PrimaryPurple,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // Storage Breakdown Card matching 8.12.29.jpeg
            CosmicCard(
                modifier = Modifier.fillMaxWidth(),
                backgroundColor = ElevatedDark
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Storage Usage Breakdown", color = HeadingDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                    BreakdownRow(label = "Encrypted Files", size = quota?.usedGbString ?: "0.0 GB", percentage = 85)
                    BreakdownRow(label = "Shared Links", size = "0.0 GB", percentage = 0)
                    BreakdownRow(label = "Trash & Retention", size = "0.0 GB", percentage = 0)
                    BreakdownRow(label = "Metadata Overhead", size = "< 1 MB", percentage = 1)
                }
            }

            // Tier Card
            CosmicCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Free Tier (5 GB)", color = HeadingDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("Zero-Knowledge Personal Cloud", color = SecondaryTextDark, fontSize = 11.sp)
                    }

                    Button(
                        onClick = { /* Upgrade Tier */ },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
                    ) {
                        Text("Upgrade", color = Color.White, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun BreakdownRow(label: String, size: String, percentage: Int) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = HeadingDark, fontSize = 12.sp)
            Text("$size ($percentage%)", color = SecondaryTextDark, fontSize = 11.sp)
        }
        LinearProgressIndicator(
            progress = { percentage / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = BrightAccentPurple,
            trackColor = BorderDark
        )
    }
}

