package com.duowindo6601.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.ui.components.ScreenHeader
import com.duowindo6601.app.ui.theme.DuoColors
import com.duowindo6601.app.vm.GameViewModel

private data class Rival(val name: String, val xp: Int, val color: Color)

/** Friendly offline rivals stored in the app — no server needed. */
private val rivals = listOf(
    Rival("Aisha", 1150, Color(0xFF1CB0F6)),
    Rival("Marco", 980, Color(0xFF58CC02)),
    Rival("Yuki", 860, Color(0xFFCE82FF)),
    Rival("Chen", 720, Color(0xFFFF9600)),
    Rival("Fatima", 610, Color(0xFFFF4B4B)),
    Rival("Diego", 480, Color(0xFF1899D6)),
    Rival("Anna", 350, Color(0xFF46A302)),
    Rival("Omar", 230, Color(0xFFE0A800)),
    Rival("Lena", 120, Color(0xFFEA2B2B))
)

@Composable
fun LeaderboardScreen(vm: GameViewModel) {
    val progress by vm.progress.collectAsState()

    val entries = (rivals + Rival(progress.name.ifBlank { "You" }, progress.xp, DuoColors.Green))
        .sortedByDescending { it.xp }

    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp)
    ) {
        Spacer(Modifier.height(10.dp))
        ScreenHeader("Leaderboard 🏆", "Climb the weekly league by earning XP")
        Spacer(Modifier.height(14.dp))

        LazyColumn {
            itemsIndexed(entries) { index, entry ->
                val isUser = entry.name == (progress.name.ifBlank { "You" })
                LeaderboardRow(rank = index + 1, entry = entry, isUser = isUser)
                Spacer(Modifier.height(10.dp))
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun LeaderboardRow(rank: Int, entry: Rival, isUser: Boolean) {
    val medal = when (rank) {
        1 -> "🥇"
        2 -> "🥈"
        3 -> "🥉"
        else -> null
    }

    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (isUser) DuoColors.GreenLight else DuoColors.White)
            .border(
                2.dp,
                if (isUser) DuoColors.Green else DuoColors.Border,
                RoundedCornerShape(16.dp)
            )
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(Modifier.width(34.dp), contentAlignment = Alignment.Center) {
            if (medal != null) {
                Text(medal, fontSize = 20.sp)
            } else {
                Text(
                    rank.toString(),
                    fontWeight = FontWeight.Bold,
                    color = DuoColors.TextGray,
                    fontSize = 15.sp
                )
            }
        }
        Box(
            Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(entry.color),
            contentAlignment = Alignment.Center
        ) {
            Text(
                entry.name.take(1).uppercase(),
                color = DuoColors.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 17.sp
            )
        }
        Spacer(Modifier.width(12.dp))
        Text(
            entry.name + if (isUser) " (you)" else "",
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp,
            color = DuoColors.TextDark,
            modifier = Modifier.weight(1f)
        )
        Text(
            "${entry.xp} XP",
            fontWeight = FontWeight.Bold,
            color = DuoColors.TextGray,
            fontSize = 14.sp
        )
    }
}
