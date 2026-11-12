package app.cloudvault.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryPurple,
    onPrimary = Color.White,
    secondary = MediumLavender,
    onSecondary = Color.White,
    background = VoidDark,
    onBackground = HeadingDark,
    surface = SurfaceDark,
    onSurface = HeadingDark,
    surfaceVariant = ElevatedDark,
    onSurfaceVariant = SecondaryTextDark,
    outline = BorderDark
)

private val LightColorScheme = lightColorScheme(
    primary = DeepSoftPurple,
    onPrimary = Color.White,
    secondary = BrightAccentPurple,
    onSecondary = Color.White,
    background = AppBackgroundLight,
    onBackground = HeadingLight,
    surface = CardBackgroundLight,
    onSurface = HeadingLight,
    surfaceVariant = SecondaryBackgroundLight,
    onSurfaceVariant = SecondaryTextLight,
    outline = DividerBorderLight
)

@Composable
fun CloudVaultTheme(
    darkTheme: Boolean = true, // Default to CloudVault Cosmic Dark Theme
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = CloudVaultTypography,
        content = content
    )
}

