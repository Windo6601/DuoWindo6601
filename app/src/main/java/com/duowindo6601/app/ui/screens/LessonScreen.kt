package com.duowindo6601.app.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.data.Courses
import com.duowindo6601.app.data.Exercise
import com.duowindo6601.app.ui.components.DuoButton
import com.duowindo6601.app.ui.components.Mascot
import com.duowindo6601.app.ui.components.SoundFx
import com.duowindo6601.app.ui.components.rememberSpeaker
import com.duowindo6601.app.ui.theme.DuoColors
import com.duowindo6601.app.vm.Feedback
import com.duowindo6601.app.vm.GameViewModel
import com.duowindo6601.app.vm.LessonSession

@Composable
fun LessonScreen(vm: GameViewModel) {
    val session by vm.session.collectAsState()
    val progress by vm.progress.collectAsState()
    val s = session ?: return

    var showQuitDialog by remember { mutableStateOf(false) }
    BackHandler { showQuitDialog = true }

    val course = Courses.byId(s.courseId)
    val speak = rememberSpeaker(course.ttsLocale)
    val haptics = LocalHapticFeedback.current

    Column(
        Modifier
            .fillMaxSize()
            .background(DuoColors.White)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        // Top bar: close, progress, hearts.
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { showQuitDialog = true }) {
                Icon(Icons.Filled.Close, contentDescription = "Quit lesson", tint = DuoColors.TextGray)
            }
            LinearProgressIndicator(
                progress = { s.progressFraction },
                modifier = Modifier
                    .weight(1f)
                    .height(12.dp)
                    .clip(RoundedCornerShape(6.dp)),
                color = DuoColors.Green,
                trackColor = DuoColors.Border
            )
            Spacer(Modifier.width(10.dp))
            Icon(
                Icons.Filled.Favorite,
                contentDescription = "Hearts",
                tint = DuoColors.Red,
                modifier = Modifier.size(20.dp)
            )
            Spacer(Modifier.width(2.dp))
            Text(
                progress.hearts.toString(),
                color = DuoColors.Red,
                fontWeight = FontWeight.Bold
            )
        }

        if (s.finished) {
            LessonComplete(
                session = s,
                onContinue = { vm.quitLesson() }
            )
        } else {
            Column(
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp)
            ) {
                Spacer(Modifier.height(10.dp))
                ExerciseContent(session = s, vm = vm, speak = speak)
                Spacer(Modifier.height(16.dp))
            }

            // Bottom area: CHECK button or feedback banner.
            if (s.feedback == null) {
                Column(Modifier.padding(horizontal = 24.dp, vertical = 14.dp)) {
                    DuoButton(
                        text = "CHECK",
                        onClick = {
                            val correct = vm.checkAnswer()
                            if (correct != null) {
                                if (progress.soundOn) SoundFx.play(correct)
                                haptics.performHapticFeedback(
                                    if (correct) HapticFeedbackType.LongPress
                                    else HapticFeedbackType.LongPress
                                )
                            }
                        },
                        enabled = s.canCheck,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            } else {
                val correct = s.feedback == Feedback.CORRECT
                Column(
                    Modifier
                        .fillMaxWidth()
                        .background(if (correct) DuoColors.GreenLight else DuoColors.RedLight)
                        .padding(horizontal = 24.dp, vertical = 16.dp)
                ) {
                    Text(
                        if (correct) "Correct! 🎉" else "Oops, not quite",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 19.sp,
                        color = if (correct) DuoColors.GreenDark else DuoColors.RedDark
                    )
                    if (!correct && s.correctAnswer != null) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Correct answer:  ${s.correctAnswer}",
                            color = DuoColors.RedDark,
                            fontWeight = FontWeight.Medium,
                            fontSize = 15.sp
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    DuoButton(
                        text = "CONTINUE",
                        onClick = { vm.continueAfterFeedback() },
                        color = if (correct) DuoColors.Green else DuoColors.Red,
                        darkColor = if (correct) DuoColors.GreenDark else DuoColors.RedDark,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }

    if (showQuitDialog) {
        AlertDialog(
            onDismissRequest = { showQuitDialog = false },
            title = { Text("Quit lesson?", fontWeight = FontWeight.Bold) },
            text = { Text("Your progress in this lesson will be lost.") },
            confirmButton = {
                TextButton(onClick = {
                    showQuitDialog = false
                    vm.quitLesson()
                }) { Text("QUIT", color = DuoColors.Red, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showQuitDialog = false }) {
                    Text("KEEP LEARNING", color = DuoColors.Blue, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

@Composable
private fun ExerciseContent(
    session: LessonSession,
    vm: GameViewModel,
    speak: (String) -> Unit
) {
    val exercise = session.current

    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            exercise.instruction,
            fontSize = 22.sp,
            fontWeight = FontWeight.ExtraBold,
            color = DuoColors.TextDark,
            modifier = Modifier.weight(1f)
        )
        exercise.speakText?.let { text ->
            Box(
                Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(DuoColors.BlueLight)
                    .clickable { speak(text) },
                contentAlignment = Alignment.Center
            ) {
                Text("🔊", fontSize = 18.sp)
            }
        }
    }
    Spacer(Modifier.height(10.dp))

    when (exercise) {
        is Exercise.PickTarget -> {
            PromptCard(text = exercise.vocab.source)
            Spacer(Modifier.height(18.dp))
            exercise.options.forEach { option ->
                OptionCard(
                    text = option,
                    selected = session.selected == option,
                    locked = session.feedback != null,
                    onClick = {
                        vm.selectOption(option)
                        speak(option)
                    }
                )
                Spacer(Modifier.height(12.dp))
            }
        }

        is Exercise.PickSource -> {
            PromptCard(text = exercise.vocab.target, onSpeak = { speak(exercise.vocab.target) })
            Spacer(Modifier.height(18.dp))
            exercise.options.forEach { option ->
                OptionCard(
                    text = option,
                    selected = session.selected == option,
                    locked = session.feedback != null,
                    onClick = { vm.selectOption(option) }
                )
                Spacer(Modifier.height(12.dp))
            }
        }

        is Exercise.BuildSentence -> {
            PromptCard(text = exercise.sentence.source)
            Spacer(Modifier.height(18.dp))

            // Answer area with placed tokens.
            WordBankAnswerArea(
                placed = session.placed,
                locked = session.feedback != null,
                onRemove = { vm.tapPlacedToken(it) }
            )
            Spacer(Modifier.height(24.dp))

            // Token bank.
            WordBankBank(
                bank = session.bank,
                locked = session.feedback != null,
                onPick = { vm.tapBankToken(it) }
            )
        }
    }
}

@Composable
private fun PromptCard(text: String, onSpeak: (() -> Unit)? = null) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(DuoColors.White)
            .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
            .clickable(enabled = onSpeak != null) { onSpeak?.invoke() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text,
            fontSize = 19.sp,
            fontWeight = FontWeight.Bold,
            color = DuoColors.TextDark,
            modifier = Modifier.weight(1f)
        )
        if (onSpeak != null) Text("🔊", fontSize = 16.sp)
    }
}

@Composable
private fun OptionCard(
    text: String,
    selected: Boolean,
    locked: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (selected) DuoColors.Blue else DuoColors.Border
    val bg = if (selected) DuoColors.BlueLight else DuoColors.White
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(bg)
            .border(2.dp, borderColor, RoundedCornerShape(16.dp))
            .clickable(enabled = !locked, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text,
            fontSize = 16.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            color = DuoColors.TextDark
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WordBankAnswerArea(
    placed: List<String>,
    locked: Boolean,
    onRemove: (Int) -> Unit
) {
    Box(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 110.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(DuoColors.BgGray)
            .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
            .padding(12.dp)
    ) {
        if (placed.isEmpty()) {
            Text(
                "Tap the words below to build the sentence",
                color = DuoColors.TextGray,
                fontSize = 14.sp
            )
        } else {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                placed.forEachIndexed { index, token ->
                    TokenChip(
                        text = token,
                        filled = true,
                        enabled = !locked,
                        onClick = { onRemove(index) }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WordBankBank(
    bank: List<String>,
    locked: Boolean,
    onPick: (Int) -> Unit
) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        bank.forEachIndexed { index, token ->
            TokenChip(
                text = token,
                filled = false,
                enabled = !locked,
                onClick = { onPick(index) }
            )
        }
    }
}

@Composable
private fun TokenChip(text: String, filled: Boolean, enabled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (filled) DuoColors.BlueLight else DuoColors.White)
            .border(
                2.dp,
                if (filled) DuoColors.Blue else DuoColors.Border,
                RoundedCornerShape(12.dp)
            )
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 9.dp)
    ) {
        Text(text, fontSize = 16.sp, color = DuoColors.TextDark, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun LessonComplete(session: LessonSession, onContinue: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.weight(1f))
        Mascot(Modifier.size(120.dp))
        Spacer(Modifier.height(18.dp))
        Text(
            "Lesson complete! 🎉",
            fontSize = 26.sp,
            fontWeight = FontWeight.ExtraBold,
            color = DuoColors.Green
        )
        if (session.wasPerfect) {
            Spacer(Modifier.height(6.dp))
            Text(
                "PERFECT — no mistakes!",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = DuoColors.Orange
            )
        }
        Spacer(Modifier.height(22.dp))
        Row {
            RewardChip("⭐", "+${session.xpEarned} XP", DuoColors.Yellow, DuoColors.YellowDark)
            Spacer(Modifier.width(12.dp))
            RewardChip("💎", "+${session.gemsEarned}", DuoColors.Blue, DuoColors.BlueDark)
        }
        if (session.mistakes > 0) {
            Spacer(Modifier.height(12.dp))
            Text(
                "${session.mistakes} mistake${if (session.mistakes == 1) "" else "s"} — keep practicing!",
                color = DuoColors.TextGray,
                fontSize = 14.sp
            )
        }
        Spacer(Modifier.weight(1f))
        DuoButton(
            text = "CONTINUE",
            onClick = onContinue,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 18.dp)
        )
    }
}

@Composable
private fun RewardChip(emoji: String, text: String, color: androidx.compose.ui.graphics.Color, dark: androidx.compose.ui.graphics.Color) {
    Column(
        Modifier
            .width(130.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(color)
            .border(2.dp, dark, RoundedCornerShape(16.dp))
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(emoji, fontSize = 20.sp)
        Spacer(Modifier.height(4.dp))
        Text(text, color = DuoColors.White, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
    }
}
