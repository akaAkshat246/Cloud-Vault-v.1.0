package app.cloudvault.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import app.cloudvault.android.ui.theme.FabGradient
import app.cloudvault.android.ui.theme.LogoGlowPurple

@Composable
fun FloatingUploadFab(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    size: Dp = 64.dp
) {
    Box(
        modifier = modifier
            .size(size)
            .shadow(
                elevation = 12.dp,
                shape = CircleShape,
                ambientColor = LogoGlowPurple,
                spotColor = LogoGlowPurple
            )
            .clip(CircleShape)
            .background(FabGradient)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Default.CloudUpload,
            contentDescription = "Upload File",
            tint = Color.White,
            modifier = Modifier.size(size * 0.45f)
        )
    }
}

