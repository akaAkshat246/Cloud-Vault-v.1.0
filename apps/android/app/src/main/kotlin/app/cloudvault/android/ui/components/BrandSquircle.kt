package app.cloudvault.android.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import app.cloudvault.android.ui.theme.LogoGlowPurple
import app.cloudvault.android.ui.theme.SquircleGradient

@Composable
fun BrandSquircle(
    size: Dp = 80.dp,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val w = this.size.width
            val h = this.size.height
            val corner = w * 0.28f

            // 1. Draw rounded squircle background
            drawRoundRect(
                brush = SquircleGradient,
                topLeft = Offset.Zero,
                size = Size(w, h),
                cornerRadius = CornerRadius(corner, corner)
            )

            // 2. Draw subtle inner glow
            drawRoundRect(
                color = Color.White.copy(alpha = 0.15f),
                topLeft = Offset(1f, 1f),
                size = Size(w - 2f, h - 2f),
                cornerRadius = CornerRadius(corner, corner),
                style = Stroke(width = 2.5f)
            )

            // 3. Draw Stylized Cloud / Planet Vault and Orbital Ring
            val cx = w * 0.5f
            val cy = h * 0.5f
            val r = w * 0.22f

            // Planet Body
            drawCircle(
                color = Color.White.copy(alpha = 0.95f),
                radius = r,
                center = Offset(cx, cy),
                style = Stroke(width = w * 0.055f, cap = StrokeCap.Round)
            )

            // Planet Latitude / Longitude lines
            val path = Path().apply {
                moveTo(cx - r * 0.7f, cy - r * 0.4f)
                cubicTo(
                    cx, cy - r * 0.9f,
                    cx + r * 0.7f, cy + r * 0.4f,
                    cx + r * 0.3f, cy + r * 0.85f
                )
            }
            drawPath(
                path = path,
                color = Color.White.copy(alpha = 0.95f),
                style = Stroke(width = w * 0.045f, cap = StrokeCap.Round)
            )

            // Orbital Ring (Tilted Oval)
            drawOval(
                color = Color.White,
                topLeft = Offset(cx - r * 1.55f, cy - r * 0.55f),
                size = Size(r * 3.1f, r * 1.1f),
                style = Stroke(width = w * 0.06f, cap = StrokeCap.Round)
            )
        }
    }
}

