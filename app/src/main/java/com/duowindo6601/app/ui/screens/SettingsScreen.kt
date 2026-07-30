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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.data.Screen
import com.duowindo6601.app.ui.components.DuoButton
import com.duowindo6601.app.ui.components.Mascot
import com.duowindo6601.app.ui.theme.DuoColors
import com.duowindo6601.app.vm.GameViewModel

@Composable
fun SettingsScreen(vm: GameViewModel) {
    val progress by vm.progress.collectAsState()
    var nameDraft by remember(progress.name) { mutableStateOf(progress.name) }
    var showResetDialog by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
    ) {
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { vm.navigate(Screen.PROFILE) }) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = DuoColors.TextGray)
            }
            Text(
                "Settings",
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                color = DuoColors.TextDark
            )
        }
        Spacer(Modifier.height(14.dp))

        SettingsCard {
            Text("Profile name", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = DuoColors.TextDark)
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = nameDraft,
                    onValueChange = { if (it.length <= 20) nameDraft = it },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = DuoColors.Blue,
                        unfocusedBorderColor = DuoColors.Border,
                        focusedTextColor = DuoColors.TextDark,
                        unfocusedTextColor = DuoColors.TextDark
                    )
                )
                Spacer(Modifier.width(10.dp))
                DuoButton(
                    text = "SAVE",
                    onClick = { vm.rename(nameDraft) },
                    enabled = nameDraft.isNotBlank() && nameDraft.trim() != progress.name,
                    color = DuoColors.Blue,
                    darkColor = DuoColors.BlueDark,
                    height = 46.dp
                )
            }
        }
        Spacer(Modifier.height(14.dp))

        SettingsCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Sound effects", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = DuoColors.TextDark)
                    Text("Little beeps when you answer", fontSize = 12.sp, color = DuoColors.TextGray)
                }
                Switch(
                    checked = progress.soundOn,
                    onCheckedChange = { vm.setSound(it) },
                    colors = SwitchDefaults.colors(checkedTrackColor = DuoColors.Green)
                )
            }
        }
        Spacer(Modifier.height(14.dp))

        // About card.
        SettingsCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Mascot(Modifier.width(52.dp).height(52.dp))
                Spacer(Modifier.width(12.dp))
                Column {
                    Text("DuoWindo6601", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = DuoColors.TextDark)
                    Text("Version 1.0 · Native Android (Kotlin + Jetpack Compose)", fontSize = 12.sp, color = DuoColors.TextGray)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "100% offline — no account, no internet. All your data is stored only on this phone.",
                        fontSize = 12.sp,
                        color = DuoColors.TextGray
                    )
                }
            }
        }
        Spacer(Modifier.height(20.dp))

        DuoButton(
            text = "RESET ALL PROGRESS",
            onClick = { showResetDialog = true },
            color = DuoColors.Red,
            darkColor = DuoColors.RedDark,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(24.dp))
    }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = { Text("Reset everything?", fontWeight = FontWeight.Bold) },
            text = { Text("This deletes your XP, gems, streak and all lesson progress stored on this phone. This cannot be undone.") },
            confirmButton = {
                TextButton(onClick = {
                    showResetDialog = false
                    vm.resetProgress()
                }) { Text("RESET", color = DuoColors.Red, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("CANCEL", color = DuoColors.Blue, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

@Composable
private fun SettingsCard(content: @Composable () -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(DuoColors.White)
            .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column { content() }
    }
}
