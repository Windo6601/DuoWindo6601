package com.duowindo6601.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.data.Courses
import com.duowindo6601.app.data.Screen
import com.duowindo6601.app.data.UserProgress
import com.duowindo6601.app.data.buildAchievements
import com.duowindo6601.app.ui.components.StatPill
import com.duowindo6601.app.ui.theme.DuoColors
import com.duowindo6601.app.vm.GameViewModel

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(vm: GameViewModel) {
    val progress by vm.progress.collectAsState()
    val course = Courses.byId(progress.courseId)
    val achievements = buildAchievements(progress)

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
    ) {
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    "Profile",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = DuoColors.TextDark
                )
            }
            IconButton(onClick = { vm.navigate(Screen.SETTINGS) }) {
                Icon(Icons.Filled.Settings, contentDescription = "Settings", tint = DuoColors.TextGray)
            }
        }
        Spacer(Modifier.height(8.dp))

        // Identity card.
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(DuoColors.White)
                .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier
                    .size(62.dp)
                    .clip(CircleShape)
                    .background(DuoColors.Green),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    progress.name.take(1).uppercase().ifBlank { "?" },
                    color = DuoColors.White,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    progress.name.ifBlank { "Learner" },
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 19.sp,
                    color = DuoColors.TextDark
                )
                Text(
                    "Learning ${course.flag} ${course.name} · Level ${progress.level}",
                    color = DuoColors.TextGray,
                    fontSize = 13.sp
                )
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { progress.xpInLevel.toFloat() / UserProgress.XP_PER_LEVEL },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = DuoColors.Yellow,
                    trackColor = DuoColors.Border
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "${progress.xpInLevel}/${UserProgress.XP_PER_LEVEL} XP to level ${progress.level + 1}",
                    fontSize = 11.sp,
                    color = DuoColors.TextGray
                )
            }
        }
        Spacer(Modifier.height(18.dp))

        // Stats grid.
        Text("Statistics", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = DuoColors.TextDark)
        Spacer(Modifier.height(10.dp))
        Row {
            StatCard("🔥", progress.streak.toString(), "Day streak", Modifier.weight(1f))
            Spacer(Modifier.width(12.dp))
            StatCard("⚡", progress.xp.toString(), "Total XP", Modifier.weight(1f))
        }
        Spacer(Modifier.height(12.dp))
        Row {
            StatCard("📖", progress.totalLessons.toString(), "Lessons done", Modifier.weight(1f))
            Spacer(Modifier.width(12.dp))
            StatCard("📝", progress.learnedWords.size.toString(), "Words learned", Modifier.weight(1f))
        }
        Spacer(Modifier.height(18.dp))

        // Achievements.
        Text("Achievements", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = DuoColors.TextDark)
        Spacer(Modifier.height(10.dp))
        achievements.forEach { a ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (a.unlocked) DuoColors.YellowLight else DuoColors.White)
                    .border(
                        2.dp,
                        if (a.unlocked) DuoColors.Yellow else DuoColors.Border,
                        RoundedCornerShape(14.dp)
                    )
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(a.emoji, fontSize = 24.sp)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        a.title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = if (a.unlocked) DuoColors.TextDark else DuoColors.TextGray
                    )
                    Text(a.description, fontSize = 12.sp, color = DuoColors.TextGray)
                }
                Text(if (a.unlocked) "✅" else "🔒", fontSize = 16.sp)
            }
            Spacer(Modifier.height(10.dp))
        }
        Spacer(Modifier.height(8.dp))

        // Words learned so far, with a friendly empty state.
        Text("Your words", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = DuoColors.TextDark)
        Spacer(Modifier.height(10.dp))
        if (progress.learnedWords.isEmpty()) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(DuoColors.BgGray)
                    .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "No words yet — complete your first lesson to start your collection! 📚",
                    color = DuoColors.TextGray,
                    fontSize = 14.sp
                )
            }
        } else {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                progress.learnedWords.sorted().forEach { word ->
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(DuoColors.BlueLight)
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(word, color = DuoColors.BlueDark, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                    }
                }
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun StatCard(emoji: String, value: String, label: String, modifier: Modifier = Modifier) {
    Column(
        modifier
            .clip(RoundedCornerShape(16.dp))
            .background(DuoColors.White)
            .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(emoji, fontSize = 18.sp)
            Spacer(Modifier.width(6.dp))
            Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = DuoColors.TextDark)
        }
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 12.sp, color = DuoColors.TextGray)
    }
}
