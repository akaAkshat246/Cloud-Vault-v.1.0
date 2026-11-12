package app.cloudvault.android.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Primary Cosmic Void & Backgrounds
val VoidDark = Color(0xFF0D0B18)
val SurfaceDark = Color(0xFF161226)
val ElevatedDark = Color(0xFF221C38)
val BorderDark = Color(0xFF352C55)

// Light Theme Tokens
val AppBackgroundLight = Color(0xFFF0F0F0)
val SecondaryBackgroundLight = Color(0xFFE0E0F0)
val CardBackgroundLight = Color(0xFFF0E0F0)
val DividerBorderLight = Color(0xFFD0D0F0)

// Purple Brand Accents
val PrimaryPurple = Color(0xFFB090F0)
val BrightAccentPurple = Color(0xFFA080F0)
val HoverLavender = Color(0xFFC0B0F0)
val MediumLavender = Color(0xFFB4A8E8)
val DeepSoftPurple = Color(0xFF9070E0)
val LogoGlowPurple = Color(0xFFA890FF)
val LinkPurple = Color(0xFF8F6BFF)

// Typography
val HeadingLight = Color(0xFF2B2B3C)
val HeadingDark = Color(0xFFFFFFFF)
val SecondaryTextLight = Color(0xFF5E5E73)
val SecondaryTextDark = Color(0xFFA3A1BD)
val PlaceholderText = Color(0xFF8D8DA5)

// Status Colors
val SuccessGreen = Color(0xFF10B981)
val ErrorRed = Color(0xFFEF4444)
val WarningAmber = Color(0xFFF59E0B)

// Interactive Gradients
val PrimaryButtonGradient = Brush.horizontalGradient(
    colors = listOf(Color(0xFFA784FF), Color(0xFF8F6BFF))
)

val FabGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFFB090F0), Color(0xFF8F6BFF))
)

val SquircleGradient = Brush.radialGradient(
    colors = listOf(Color(0xFF7C3AED), Color(0xFF4C1D95))
)

val CardGlowBorder = Brush.linearGradient(
    colors = listOf(Color(0x66A890FF), Color(0x1AFFFFFF))
)

