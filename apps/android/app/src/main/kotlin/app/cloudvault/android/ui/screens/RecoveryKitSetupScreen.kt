package app.cloudvault.android.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.AuthRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.components.RecoveryKitWordGrid
import app.cloudvault.android.ui.theme.*

@Composable
fun RecoveryKitSetupScreen(
    authRepository: AuthRepository,
    onProceedToVerification: () -> Unit
) {
    val context = LocalContext.current
    val words = authRepository.pendingRecoveryKit?.words ?: emptyList()
    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(VoidDark)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(bottom = 80.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Emergency Recovery Kit",
                color = HeadingDark,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Write down these 24 words in exact order. Store them in a safe place. If you lose your password, this is the ONLY way to recover your data.",
                color = SecondaryTextDark,
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Warning Notice
            CosmicCard(
                modifier = Modifier.fillMaxWidth(),
                backgroundColor = ElevatedDark
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "CloudVault never stores your recovery phrase on our servers. Nobody can restore your files without it.",
                        color = HeadingDark,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 24 Word Grid
            RecoveryKitWordGrid(words = words)

            Spacer(modifier = Modifier.height(16.dp))

            // Copy to Clipboard
            OutlinedButton(
                onClick = {
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newPlainText("CloudVault Recovery Words", words.joinToString(" "))
                    clipboard.setPrimaryClip(clip)
                    Toast.makeText(context, "Recovery words copied to clipboard", Toast.LENGTH_SHORT).show()
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryPurple)
            ) {
                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Copy Words to Clipboard", fontSize = 13.sp)
            }
        }

        // Proceed Button
        Button(
            onClick = onProceedToVerification,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .align(Alignment.BottomCenter),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
        ) {
            Text(
                text = "I Have Saved My Recovery Kit",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        }
    }
}

