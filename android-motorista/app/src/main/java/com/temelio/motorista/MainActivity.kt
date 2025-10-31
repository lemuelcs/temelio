package com.temelio.motorista

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.compose.rememberNavController
import com.temelio.motorista.data.repository.AuthRepository
import com.temelio.motorista.ui.navigation.Screen
import com.temelio.motorista.ui.navigation.TemelioNavigation
import com.temelio.motorista.ui.theme.TemelioTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TemelioTheme {
                val navController = rememberNavController()
                val isLoggedIn by authRepository.isLoggedIn.collectAsState(initial = false)

                val startDestination = if (isLoggedIn) {
                    Screen.Dashboard.route
                } else {
                    Screen.Login.route
                }

                TemelioNavigation(
                    navController = navController,
                    startDestination = startDestination
                )
            }
        }
    }
}
