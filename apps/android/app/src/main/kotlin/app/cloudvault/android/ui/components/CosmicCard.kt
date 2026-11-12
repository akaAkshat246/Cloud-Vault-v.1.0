package app.cloudvault.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import app.cloudvault.android.ui.theme.CardGlowBorder
import app.cloudvault.android.ui.theme.SurfaceDark

@Composable
fun CosmicCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 16.dp,
    backgroundColor: Color = SurfaceDark.copy(alpha = 0.85f),
    content: @Composable BoxScope.() -> Unit
) {
    val shape = RoundedCornerShape(cornerRadius)
    Box(
        modifier = modifier
            .clip(shape)
            .background(backgroundColor)
            .border(width = 1.dp, brush = CardGlowBorder, shape = shape)
            .padding(16.dp),
        content = content
    )
}

