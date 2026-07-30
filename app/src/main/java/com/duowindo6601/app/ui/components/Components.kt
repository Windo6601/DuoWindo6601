package com.duowindo6601.app.ui.components

import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.ui.theme.DuoColors
import java.util.Locale

// ---------------------------------------------------------------------------
// Windo, the owl mascot, drawn with a Compose Canvas (no image assets needed).
// ---------------------------------------------------------------------------

@Composable
fun Mascot(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val sx = size.width / 108f
        val sy = size.height / 108f
        fun px(x: Float) = x * sx
        fun py(y: Float) = y * sy

        // Feet
        drawCircle(DuoColors.Orange, radius = 2.6f * sx, center = Offset(px(47f), py(81f)))
        drawCircle(DuoColors.Orange, radius = 2.6f * sx, center = Offset(px(61f), py(81f)))

        // Round body
        drawCircle(DuoColors.White, radius = 22f * sx, center = Offset(px(54f), py(60f)))

        // Eyes with sparkles
        drawCircle(DuoColors.TextDark, radius = 4.5f * sx, center = Offset(px(46.5f), py(52f)))
        drawCircle(DuoColors.TextDark, radius = 4.5f * sx, center = Offset(px(61.5f), py(52f)))
        drawCircle(DuoColors.White, radius = 1.3f * sx, center = Offset(px(45f), py(50.8f)))
        drawCircle(DuoColors.White, radius = 1.3f * sx, center = Offset(px(60f), py(50.8f)))

        // Beak
        val beak = Path().apply {
            moveTo(px(50f), py(60.5f))
            lineTo(px(58f), py(60.5f))
            lineTo(px(54f), py(68f))
            close()
        }
        drawPath(beak, DuoColors.Orange)
    }
}

// ---------------------------------------------------------------------------
// Chunky game-style button with a 3D bottom edge.
// ---------------------------------------------------------------------------

@Composable
fun DuoButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    color: Color = DuoColors.Green,
    darkColor: Color = DuoColors.GreenDark,
    enabled: Boolean = true,
    textColor: Color = DuoColors.White,
    height: Dp = 52.dp
) {
    val bg = if (enabled) color else DuoColors.LockedGray
    val bgDark = if (enabled) darkColor else DuoColors.LockedDark
    val shape = RoundedCornerShape(14.dp)

    Box(modifier.height(height)) {
        Box(
            Modifier
                .fillMaxSize()
                .clip(shape)
                .background(bgDark)
        )
        Box(
            Modifier
                .fillMaxSize()
                .padding(bottom = 5.dp)
                .clip(shape)
                .background(bg)
                .clickable(enabled = enabled, onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = text,
                color = if (enabled) textColor else Color(0xFFBFBFBF),
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                letterSpacing = 0.6.sp
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Small stat pill used in the top bar (streak 🔥, gems 💎, hearts ❤️).
// ---------------------------------------------------------------------------

@Composable
fun StatPill(emoji: String, value: String, tint: Color, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = emoji, fontSize = 17.sp)
        Spacer(Modifier.width(4.dp))
        Text(text = value, color = tint, fontWeight = FontWeight.Bold, fontSize = 15.sp)
    }
}

// ---------------------------------------------------------------------------
// Rounded card with the app's signature soft border.
// ---------------------------------------------------------------------------

@Composable
fun DuoCard(
    modifier: Modifier = Modifier,
    borderColor: Color = DuoColors.Border,
    content: @Composable () -> Unit
) {
    Box(
        modifier
            .clip(RoundedCornerShape(16.dp))
            .background(DuoColors.White)
            .border(2.dp, borderColor, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        content()
    }
}

// ---------------------------------------------------------------------------
// Title + subtitle header used on tab screens.
// ---------------------------------------------------------------------------

@Composable
fun ScreenHeader(title: String, subtitle: String) {
    Text(title, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = DuoColors.TextDark)
    Spacer(Modifier.height(2.dp))
    Text(subtitle, fontSize = 14.sp, color = DuoColors.TextGray)
}

// ---------------------------------------------------------------------------
// Tiny sound effects generated on-device (no audio files, no internet).
// ---------------------------------------------------------------------------

object SoundFx {
    private var toneGenerator: ToneGenerator? = null
    private val handler = Handler(Looper.getMainLooper())
    private val releaser = Runnable {
        try {
            toneGenerator?.release()
        } catch (_: Exception) {
        }
        toneGenerator = null
    }

    fun play(correct: Boolean) {
        try {
            handler.removeCallbacks(releaser)
            if (toneGenerator == null) {
                toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 60)
            }
            val tone = if (correct) ToneGenerator.TONE_PROP_ACK else ToneGenerator.TONE_PROP_NACK
            toneGenerator?.startTone(tone, 220)
            handler.postDelayed(releaser, 600)
        } catch (_: Exception) {
            // Sound is a nicety, never crash because of it.
        }
    }
}

// ---------------------------------------------------------------------------
// On-device text-to-speech for pronunciations (works offline, no permission).
// Returns a speak(text) lambda; failures are ignored gracefully.
// ---------------------------------------------------------------------------

@Composable
fun rememberSpeaker(localeTag: String): (String) -> Unit {
    val context = LocalContext.current
    val engineState = remember { mutableStateOf<TextToSpeech?>(null) }

    DisposableEffect(localeTag) {
        var engine: TextToSpeech? = null
        engine = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                try {
                    engine?.language = Locale.forLanguageTag(localeTag)
                } catch (_: Exception) {
                }
            }
        }
        engineState.value = engine
        onDispose {
            engineState.value = null
            try {
                engine.stop()
                engine.shutdown()
            } catch (_: Exception) {
            }
        }
    }

    return { text ->
        try {
            engineState.value?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "duo_tts")
        } catch (_: Exception) {
        }
    }
}
