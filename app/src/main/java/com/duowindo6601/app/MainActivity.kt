package com.duowindo6601.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.duowindo6601.app.ui.theme.DuoTheme
import com.duowindo6601.app.vm.GameViewModel

/**
 * The single activity of DuoWindo6601.
 * Everything is Jetpack Compose — no XML layouts, no WebView, no network.
 */
class MainActivity : ComponentActivity() {

    private val viewModel: GameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DuoTheme {
                AppRoot(viewModel)
            }
        }
    }
}
