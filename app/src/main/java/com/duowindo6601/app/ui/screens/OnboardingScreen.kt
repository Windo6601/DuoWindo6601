package com.duowindo6601.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.data.Courses
import com.duowindo6601.app.ui.components.DuoButton
import com.duowindo6601.app.ui.components.Mascot
import com.duowindo6601.app.ui.theme.DuoColors

/** Two-step onboarding: pick a course, then enter a name. */
@Composable
fun OnboardingScreen(onFinish: (courseId: String, name: String) -> Unit) {
    var step by remember { mutableIntStateOf(0) }
    var selectedCourse by remember { mutableStateOf(Courses.all.first().id) }
    var name by remember { mutableStateOf("") }

    Box(
        Modifier
            .fillMaxSize()
            .background(DuoColors.White)
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        Column(Modifier.fillMaxSize()) {
            Column(
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp)
            ) {
                Spacer(Modifier.height(24.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Mascot(Modifier.size(72.dp))
                    Spacer(Modifier.width(14.dp))
                    if (step == 0) {
                        SpeechBubble("Hi! I'm Windo.\nWhat do you want to learn?")
                    } else {
                        SpeechBubble("Great choice!\nWhat should I call you?")
                    }
                }
                Spacer(Modifier.height(28.dp))

                if (step == 0) {
                    Text(
                        "Choose your course",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = DuoColors.TextDark
                    )
                    Spacer(Modifier.height(14.dp))
                    Courses.all.forEach { course ->
                        val selected = course.id == selectedCourse
                        CoursePickCard(
                            flag = course.flag,
                            name = course.name,
                            localName = course.localName,
                            selected = selected,
                            onClick = { selectedCourse = course.id }
                        )
                        Spacer(Modifier.height(12.dp))
                    }
                } else {
                    Text(
                        "Your name",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = DuoColors.TextDark
                    )
                    Spacer(Modifier.height(14.dp))
                    OutlinedTextField(
                        value = name,
                        onValueChange = { if (it.length <= 20) name = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("e.g. Alex", color = DuoColors.TextGray) },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        keyboardOptions = KeyboardOptions(
                            capitalization = KeyboardCapitalization.Words,
                            imeAction = ImeAction.Done
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = DuoColors.Blue,
                            unfocusedBorderColor = DuoColors.Border,
                            focusedTextColor = DuoColors.TextDark,
                            unfocusedTextColor = DuoColors.TextDark
                        )
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        "Stored only on this phone. No account, no internet needed.",
                        fontSize = 13.sp,
                        color = DuoColors.TextGray
                    )
                }
                Spacer(Modifier.height(24.dp))
            }

            Box(Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
                if (step == 0) {
                    DuoButton(
                        text = "CONTINUE",
                        onClick = { step = 1 },
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    DuoButton(
                        text = "START LEARNING",
                        onClick = { onFinish(selectedCourse, name) },
                        enabled = name.isNotBlank(),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
private fun SpeechBubble(text: String) {
    Box(
        Modifier
            .clip(RoundedCornerShape(16.dp))
            .border(2.dp, DuoColors.Border, RoundedCornerShape(16.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Text(text, color = DuoColors.TextDark, fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun CoursePickCard(
    flag: String,
    name: String,
    localName: String,
    selected: Boolean,
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
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(flag, fontSize = 30.sp)
        Spacer(Modifier.width(14.dp))
        Column {
            Text(name, fontWeight = FontWeight.Bold, fontSize = 17.sp, color = DuoColors.TextDark)
            Text(localName, fontSize = 13.sp, color = DuoColors.TextGray)
        }
    }
}
