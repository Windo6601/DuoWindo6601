package com.duowindo6601.app

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.duowindo6601.app.data.Screen
import com.duowindo6601.app.ui.screens.HomeScreen
import com.duowindo6601.app.ui.screens.LeaderboardScreen
import com.duowindo6601.app.ui.screens.LessonScreen
import com.duowindo6601.app.ui.screens.OnboardingScreen
import com.duowindo6601.app.ui.screens.ProfileScreen
import com.duowindo6601.app.ui.screens.SettingsScreen
import com.duowindo6601.app.ui.screens.ShopScreen
import com.duowindo6601.app.ui.screens.SplashScreen
import com.duowindo6601.app.ui.theme.DuoColors
import com.duowindo6601.app.vm.GameViewModel

private data class Tab(val screen: Screen, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab(Screen.LEARN, "Learn", Icons.Filled.Home),
    Tab(Screen.LEADERBOARD, "League", Icons.Filled.Star),
    Tab(Screen.SHOP, "Shop", Icons.Filled.ShoppingCart),
    Tab(Screen.PROFILE, "Profile", Icons.Filled.Person)
)

/** Root composable: single-activity navigation, no network, no web views. */
@Composable
fun AppRoot(vm: GameViewModel) {
    val screen by vm.screen.collectAsState()

    // Simple back handling for tab screens and settings.
    val interceptBack = screen == Screen.SETTINGS ||
        screen == Screen.LEADERBOARD || screen == Screen.SHOP || screen == Screen.PROFILE
    BackHandler(enabled = interceptBack) { vm.onBack() }

    when (screen) {
        Screen.SPLASH -> SplashScreen(onDone = { vm.onSplashDone() })

        Screen.ONBOARDING -> OnboardingScreen(onFinish = { courseId, name ->
            vm.completeOnboarding(courseId, name)
        })

        Screen.LESSON -> LessonScreen(vm)

        else -> Scaffold(
            containerColor = DuoColors.White,
            bottomBar = { DuoBottomBar(current = screen, onSelect = { vm.navigate(it) }) }
        ) { padding ->
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .statusBarsPadding()
            ) {
                when (screen) {
                    Screen.LEARN -> HomeScreen(vm)
                    Screen.LEADERBOARD -> LeaderboardScreen(vm)
                    Screen.SHOP -> ShopScreen(vm)
                    Screen.PROFILE -> ProfileScreen(vm)
                    Screen.SETTINGS -> SettingsScreen(vm)
                    else -> HomeScreen(vm)
                }
            }
        }
    }
}

@Composable
private fun DuoBottomBar(current: Screen, onSelect: (Screen) -> Unit) {
    NavigationBar(
        containerColor = DuoColors.White,
        contentColor = DuoColors.TextGray
    ) {
        tabs.forEach { tab ->
            val selected = current == tab.screen
            NavigationBarItem(
                selected = selected,
                onClick = { onSelect(tab.screen) },
                icon = { Icon(tab.icon, contentDescription = tab.label) },
                label = {
                    Text(
                        tab.label,
                        fontSize = 12.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = DuoColors.Blue,
                    selectedTextColor = DuoColors.Blue,
                    indicatorColor = DuoColors.BlueLight,
                    unselectedIconColor = DuoColors.TextGray,
                    unselectedTextColor = DuoColors.TextGray
                )
            )
        }
    }
}
