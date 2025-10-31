package com.temelio.motorista.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.temelio.motorista.ui.dashboard.DashboardScreen
import com.temelio.motorista.ui.login.LoginScreen
import com.temelio.motorista.ui.ofertas.OfertasScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object Ofertas : Screen("ofertas")
    object Rotas : Screen("rotas")
    object Disponibilidade : Screen("disponibilidade")
    object Perfil : Screen("perfil")
}

@Composable
fun TemelioNavigation(
    navController: NavHostController,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToOfertas = { navController.navigate(Screen.Ofertas.route) },
                onNavigateToRotas = { navController.navigate(Screen.Rotas.route) },
                onNavigateToDisponibilidade = { navController.navigate(Screen.Disponibilidade.route) },
                onNavigateToPerfil = { navController.navigate(Screen.Perfil.route) }
            )
        }

        composable(Screen.Ofertas.route) {
            OfertasScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Adicione outras telas aqui conforme necessário
    }
}
