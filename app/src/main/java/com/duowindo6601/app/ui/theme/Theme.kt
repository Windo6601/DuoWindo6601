package com.duowindo6601.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = DuoColors.Green,
    onPrimary = DuoColors.White,
    primaryContainer = DuoColors.GreenLight,
    onPrimaryContainer = DuoColors.TextDark,
    secondary = DuoColors.Blue,
    onSecondary = DuoColors.White,
    secondaryContainer = DuoColors.BlueLight,
    onSecondaryContainer = DuoColors.TextDark,
    tertiary = DuoColors.Yellow,
    onTertiary = DuoColors.TextDark,
    error = DuoColors.Red,
    onError = DuoColors.White,
    errorContainer = DuoColors.RedLight,
    onErrorContainer = DuoColors.TextDark,
    background = DuoColors.White,
    onBackground = DuoColors.TextDark,
    surface = DuoColors.White,
    onSurface = DuoColors.TextDark,
    surfaceVariant = DuoColors.BgGray,
    onSurfaceVariant = DuoColors.TextGray,
    outline = DuoColors.Border
)

/** Light Material 3 theme — the app is light-theme by default. */
@Composable
fun DuoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        content = content
    )
}
