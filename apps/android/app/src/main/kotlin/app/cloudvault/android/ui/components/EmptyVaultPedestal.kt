package app.cloudvault.android.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.ui.theme.HeadingDark
import app.cloudvault.android.ui.theme.PrimaryPurple
import app.cloudvault.android.ui.theme.SecondaryTextDark

@Composable
fun EmptyVaultPedestal(
    modifier: Modifier = Modifier,
    onUploadClick: () -> Unit = {}
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(160.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val cx = size.width / 2f
                val cy = size.height * 0.75f
                val rx = size.width * 0.42f
                val ry = size.height * 0.16f

                // Diffuse purple shadow
                drawOval(
                    color = PrimaryPurple.copy(alpha = 0.25f),
                    topLeft = Offset(cx - rx * 1.15f, cy - ry * 0.9f),
                    size = Size(rx * 2.3f, ry * 2.1f)
                )

                // Glowing Pedestal top disc
                drawOval(
                    color = PrimaryPurple.copy(alpha = 0.45f),
                    topLeft = Offset(cx - rx, cy - ry),
                    size = Size(rx * 2f, ry * 2f)
                )
            }

            // Elevated 3D Folder Icon
            Icon(
                imageVector = Icons.Default.Folder,
                contentDescription = "Empty Vault",
                tint = PrimaryPurple,
                modifier = Modifier
                    .size(80.dp)
                    .offset(y = (-14).dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "No files uploaded yet",
            color = HeadingDark,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Your secure zero-knowledge vault is ready.\nUpload your first file to get started.",
            color = SecondaryTextDark,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )
    }
}

