package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*

data class OnboardingPage(
    val icon: ImageVector,
    val title: String,
    val description: String
)

@Composable
fun OnboardingScreen(
    onFinishOnboarding: () -> Unit
) {
    val pages = listOf(
        OnboardingPage(
            icon = Icons.Default.Security,
            title = "Zero-Knowledge Encryption",
            description = "Your files are encrypted on your device before they are uploaded. Nobody else can read them — not even us."
        ),
        OnboardingPage(
            icon = Icons.Default.CloudDone,
            title = "Direct-to-S3 Transfer",
            description = "High-speed multi-chunk encrypted transfers directly to storage with 27-byte AAD binding and hardware acceleration."
        ),
        OnboardingPage(
            icon = Icons.Default.Key,
            title = "Emergency BIP-39 Recovery",
            description = "24-word cryptographic master recovery kit ensures you never lose access to your encrypted vault."
        )
    )

    var currentPage by remember { mutableStateOf(0) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(VoidDark)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 80.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            val page = pages[currentPage]

            CosmicCard(
                modifier = Modifier.size(120.dp),
                backgroundColor = ElevatedDark
            ) {
                Icon(
                    imageVector = page.icon,
                    contentDescription = null,
                    tint = PrimaryPurple,
                    modifier = Modifier
                        .size(64.dp)
                        .align(Alignment.Center)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = page.title,
                color = HeadingDark,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = page.description,
                color = SecondaryTextDark,
                fontSize = 15.sp,
                textAlign = TextAlign.Center,
                lineHeight = 22.sp,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Indicators
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (i in pages.indices) {
                    Box(
                        modifier = Modifier
                            .size(if (i == currentPage) 24.dp else 8.dp, 8.dp)
                            .clip(CircleShape)
                            .background(if (i == currentPage) BrightAccentPurple else BorderDark)
                    )
                }
            }
        }

        // Bottom Controls
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onFinishOnboarding) {
                Text("Skip", color = SecondaryTextDark)
            }

            Button(
                onClick = {
                    if (currentPage < pages.size - 1) {
                        currentPage++
                    } else {
                        onFinishOnboarding()
                    }
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
            ) {
                Text(
                    text = if (currentPage == pages.size - 1) "Get Started" else "Next",
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

