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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.data.UserProgress
import com.duowindo6601.app.ui.components.DuoButton
import com.duowindo6601.app.ui.components.ScreenHeader
import com.duowindo6601.app.ui.theme.DuoColors
import com.duowindo6601.app.vm.GameViewModel
import com.duowindo6601.app.vm.ShopItem
import com.duowindo6601.app.vm.ShopResult

@Composable
fun ShopScreen(vm: GameViewModel) {
    val progress by vm.progress.collectAsState()
    var message by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
    ) {
        Spacer(Modifier.height(10.dp))
        ScreenHeader("Shop 💎", "Spend the gems you earn in lessons")
        Spacer(Modifier.height(14.dp))

        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(DuoColors.BlueLight)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("💎", fontSize = 22.sp)
            Spacer(Modifier.width(8.dp))
            Text(
                "You have ${progress.gems} gems",
                fontWeight = FontWeight.ExtraBold,
                color = DuoColors.BlueDark,
                fontSize = 16.sp
            )
        }
        Spacer(Modifier.height(18.dp))

        ShopCard(
            emoji = "❤️",
            title = "Refill hearts",
            description = "Get back to ${UserProgress.MAX_HEARTS} hearts instantly.",
            price = ShopItem.HEARTS_REFILL.price,
            buttonText = if (progress.hearts >= UserProgress.MAX_HEARTS) "FULL" else "BUY",
            enabled = progress.hearts < UserProgress.MAX_HEARTS,
            onBuy = {
                message = when (vm.buy(ShopItem.HEARTS_REFILL)) {
                    ShopResult.BOUGHT -> "Hearts refilled! ❤️"
                    ShopResult.NOT_ENOUGH_GEMS -> "Not enough gems. Finish lessons to earn more!"
                    ShopResult.NOT_NEEDED -> null
                }
            }
        )
        Spacer(Modifier.height(14.dp))

        ShopCard(
            emoji = "🧊",
            title = "Streak freeze",
            description = "Protects your streak for one missed day. You own ${progress.freezes}.",
            price = ShopItem.STREAK_FREEZE.price,
            buttonText = "BUY",
            enabled = true,
            onBuy = {
                message = when (vm.buy(ShopItem.STREAK_FREEZE)) {
                    ShopResult.BOUGHT -> "Streak freeze equipped! 🧊"
                    ShopResult.NOT_ENOUGH_GEMS -> "Not enough gems. Finish lessons to earn more!"
                    ShopResult.NOT_NEEDED -> null
                }
            }
        )
        Spacer(Modifier.height(14.dp))

        ShopCard(
            emoji = "⚡",
            title = "Double XP boost",
            description = if (progress.doubleXpNext) "Active! Your next lesson gives 2× XP."
                else "Your next lesson gives double XP.",
            price = ShopItem.DOUBLE_XP.price,
            buttonText = if (progress.doubleXpNext) "ACTIVE" else "BUY",
            enabled = !progress.doubleXpNext,
            onBuy = {
                message = when (vm.buy(ShopItem.DOUBLE_XP)) {
                    ShopResult.BOUGHT -> "Double XP armed for your next lesson! ⚡"
                    ShopResult.NOT_ENOUGH_GEMS -> "Not enough gems. Finish lessons to earn more!"
                    ShopResult.NOT_NEEDED -> null
                }
            }
        )

        message?.let {
            Spacer(Modifier.height(18.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(DuoColors.GreenLight)
                    .border(2.dp, DuoColors.Green, RoundedCornerShape(14.dp))
                    .padding(14.dp)
            ) {
                Text(it, color = DuoColors.GreenDark, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun ShopCard(
    emoji: String,
    title: String,
    description: String,
    price: Int,
    buttonText: String,
    enabled: Boolean,
    onBuy: () -> Unit
) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(DuoColors.White)
            .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(emoji, fontSize = 34.sp)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = DuoColors.TextDark)
            Spacer(Modifier.height(2.dp))
            Text(description, fontSize = 13.sp, color = DuoColors.TextGray)
        }
        Spacer(Modifier.width(10.dp))
        DuoButton(
            text = if (buttonText == "BUY") "$price 💎" else buttonText,
            onClick = onBuy,
            enabled = enabled,
            color = DuoColors.Blue,
            darkColor = DuoColors.BlueDark,
            height = 44.dp
        )
    }
}
