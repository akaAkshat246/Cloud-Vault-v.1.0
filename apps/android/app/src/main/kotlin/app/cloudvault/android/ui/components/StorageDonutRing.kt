package app.cloudvault.android.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.ui.theme.BorderDark
import app.cloudvault.android.ui.theme.HeadingDark
import app.cloudvault.android.ui.theme.PrimaryButtonGradient
import app.cloudvault.android.ui.theme.SecondaryTextDark

@Composable
fun StorageDonutRing(
    percentage: Double,
    usedText: String,
    totalText: String,
    size: Dp = 140.dp,
    strokeWidth: Dp = 14.dp,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val strokePx = strokeWidth.toPx()
            val arcSize = Size(this.size.width - strokePx, this.size.height - strokePx)
            val topLeft = Offset(strokePx / 2f, strokePx / 2f)

            // 1. Background full track ring
            drawArc(
                color = BorderDark,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = strokePx)
            )

            // 2. Active usage arc
            val sweep = (percentage.coerceIn(0.0, 100.0) / 100.0 * 360.0).toFloat()
            drawArc(
                brush = PrimaryButtonGradient,
                startAngle = -90f,
                sweepAngle = sweep,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = usedText,
                color = HeadingDark,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "of $totalText",
                color = SecondaryTextDark,
                fontSize = 11.sp
            )
        }
    }
}

