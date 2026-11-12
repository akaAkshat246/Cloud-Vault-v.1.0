package app.cloudvault.android.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.ui.components.BrandSquircle
import app.cloudvault.android.ui.theme.LogoGlowPurple
import app.cloudvault.android.ui.theme.SecondaryTextDark
import app.cloudvault.android.ui.theme.VoidDark
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onSplashFinished: (isLoggedIn: Boolean) -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    LaunchedEffect(Unit) {
        delay(1500)
        onSplashFinished(false)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(VoidDark),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            BrandSquircle(
                size = 110.dp,
                modifier = Modifier.scale(scale)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "CloudVault",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Zero-Knowledge Encrypted Storage",
                color = LogoGlowPurple,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )
        }

        Text(
            text = "v1.0.0 (Native Android M6)",
            color = SecondaryTextDark,
            fontSize = 11.sp,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp)
        )
    }
}

