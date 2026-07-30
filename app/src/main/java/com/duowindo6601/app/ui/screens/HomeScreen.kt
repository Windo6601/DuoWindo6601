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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.data.Courses
import com.duowindo6601.app.data.UserProgress
import com.duowindo6601.app.ui.components.StatPill
import com.duowindo6601.app.ui.theme.DuoColors
import com.duowindo6601.app.vm.GameViewModel

enum class NodeState { COMPLETED, CURRENT, LOCKED }

private data class NodeStyle(
    val color: Color,
    val dark: Color,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val iconTint: Color
)

private fun nodeStyle(state: NodeState): NodeStyle = when (state) {
    NodeState.COMPLETED -> NodeStyle(DuoColors.Yellow, DuoColors.YellowDark, Icons.Filled.Check, DuoColors.White)
    NodeState.CURRENT -> NodeStyle(DuoColors.Green, DuoColors.GreenDark, Icons.Filled.Star, DuoColors.White)
    NodeState.LOCKED -> NodeStyle(DuoColors.LockedGray, DuoColors.LockedDark, Icons.Filled.Lock, Color(0xFF8A8A8A))
}

@Composable
fun HomeScreen(vm: GameViewModel) {
    val progress by vm.progress.collectAsState()
    val course = Courses.byId(progress.courseId)
    var outOfHearts by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        LearnTopBar(
            progress = progress,
            courseFlag = course.flag,
            courseName = course.name,
            onSelectCourse = { vm.selectCourse(it) }
        )

        LazyColumn(
            Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp)
        ) {
            course.units.forEachIndexed { unitIndex, unit ->
                item(key = "header-${unit.id}") {
                    Spacer(Modifier.height(14.dp))
                    UnitHeader(
                        title = unit.title,
                        done = unit.lessons.count { progress.completedLessons.contains(it.id) },
                        total = unit.lessons.size
                    )
                    Spacer(Modifier.height(22.dp))
                }

                unit.lessons.forEachIndexed { index, lesson ->
                    item(key = lesson.id) {
                        val state = when {
                            progress.completedLessons.contains(lesson.id) -> NodeState.COMPLETED
                            vm.isLessonUnlocked(course, lesson.id) -> NodeState.CURRENT
                            else -> NodeState.LOCKED
                        }
                        // Zig-zag path offsets.
                        val xOffsets = listOf(0, 46, 74, 46)
                        val x = xOffsets[((unitIndex + index) % xOffsets.size + xOffsets.size) % xOffsets.size]
                        LessonPathNode(
                            title = lesson.title,
                            state = state,
                            offsetX = x,
                            onClick = {
                                if (state != NodeState.LOCKED) {
                                    if (!vm.startLesson(course.id, lesson.id)) outOfHearts = true
                                }
                            }
                        )
                        Spacer(Modifier.height(18.dp))
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }

    if (outOfHearts) {
        AlertDialog(
            onDismissRequest = { outOfHearts = false },
            title = { Text("Out of hearts ❤️", fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "Hearts refill automatically over time. You can also refill them right away in the shop with gems."
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    outOfHearts = false
                    vm.navigate(com.duowindo6601.app.data.Screen.SHOP)
                }) { Text("GO TO SHOP", color = DuoColors.Blue, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { outOfHearts = false }) { Text("WAIT", color = DuoColors.TextGray) }
            }
        )
    }
}

@Composable
private fun LearnTopBar(
    progress: UserProgress,
    courseFlag: String,
    courseName: String,
    onSelectCourse: (String) -> Unit
) {
    var courseMenu by remember { mutableStateOf(false) }

    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box {
            Row(
                Modifier
                    .padding(vertical = 6.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { courseMenu = true }
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(courseFlag, fontSize = 22.sp)
                Spacer(Modifier.width(6.dp))
                Text(courseName, fontWeight = FontWeight.Bold, color = DuoColors.TextGray, fontSize = 14.sp)
                Text(" ▾", color = DuoColors.TextGray)
            }
            DropdownMenu(expanded = courseMenu, onDismissRequest = { courseMenu = false }) {
                Courses.all.forEach { c ->
                    DropdownMenuItem(
                        text = { Text("${c.flag}  ${c.name}") },
                        onClick = {
                            onSelectCourse(c.id)
                            courseMenu = false
                        }
                    )
                }
            }
        }

        Spacer(Modifier.weight(1f))
        StatPill("🔥", progress.streak.toString(), DuoColors.Orange)
        Spacer(Modifier.width(12.dp))
        StatPill("💎", progress.gems.toString(), DuoColors.Blue)
        Spacer(Modifier.width(12.dp))
        StatPill("❤️", progress.hearts.toString(), DuoColors.Red)
        Spacer(Modifier.width(4.dp))
    }
}

@Composable
private fun UnitHeader(title: String, done: Int, total: Int) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(DuoColors.Green)
            .padding(16.dp)
    ) {
        Text(title, color = DuoColors.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
        Spacer(Modifier.height(4.dp))
        Text(
            "$done of $total lessons completed",
            color = DuoColors.White.copy(alpha = 0.9f),
            fontSize = 13.sp
        )
        Spacer(Modifier.height(10.dp))
        LinearProgressIndicator(
            progress = { if (total == 0) 0f else done.toFloat() / total },
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp)),
            color = DuoColors.Yellow,
            trackColor = DuoColors.GreenDark
        )
    }
}

@Composable
private fun LessonPathNode(
    title: String,
    state: NodeState,
    offsetX: Int,
    onClick: () -> Unit
) {
    Box(Modifier.fillMaxWidth()) {
        Column(Modifier.offset(x = offsetX.dp)) {
            if (state == NodeState.CURRENT) {
                Box(
                    Modifier
                        .align(Alignment.CenterHorizontally)
                        .clip(RoundedCornerShape(10.dp))
                        .background(DuoColors.White)
                        .border(2.dp, DuoColors.Border, RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        "START",
                        color = DuoColors.Green,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 12.sp
                    )
                }
                Spacer(Modifier.height(6.dp))
            }

            val style = nodeStyle(state)

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(Modifier.size(70.dp)) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(style.dark)
                    )
                    Box(
                        Modifier
                            .fillMaxSize()
                            .padding(bottom = 6.dp)
                            .clip(CircleShape)
                            .background(style.color)
                            .clickable(enabled = state != NodeState.LOCKED, onClick = onClick),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = style.icon,
                            contentDescription = title,
                            tint = style.iconTint,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (state == NodeState.LOCKED) DuoColors.TextGray else DuoColors.TextDark
                )
            }
        }
    }
}
