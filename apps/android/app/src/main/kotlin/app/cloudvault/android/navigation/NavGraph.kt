package app.cloudvault.android.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import app.cloudvault.android.di.AppContainer
import app.cloudvault.android.ui.screens.*

@Composable
fun CloudVaultNavGraph(
    navController: NavHostController,
    container: AppContainer,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = NavRoute.Splash.route,
        modifier = modifier
    ) {
        // 1. Splash Screen
        composable(NavRoute.Splash.route) {
            SplashScreen(
                onSplashFinished = {
                    if (container.authRepository.unlockVaultWithDeviceKey()) {
                        navController.navigate(NavRoute.Dashboard.route) {
                            popUpTo(NavRoute.Splash.route) { inclusive = true }
                        }
                    } else {
                        navController.navigate(NavRoute.Onboarding.route) {
                            popUpTo(NavRoute.Splash.route) { inclusive = true }
                        }
                    }
                }
            )
        }

        // 2. Onboarding Screen
        composable(NavRoute.Onboarding.route) {
            OnboardingScreen(
                onFinishOnboarding = {
                    navController.navigate(NavRoute.Landing.route) {
                        popUpTo(NavRoute.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        // 3. Landing Screen
        composable(NavRoute.Landing.route) {
            LandingScreen(
                onNavigateToLogin = { navController.navigate(NavRoute.Login.route) },
                onNavigateToRegister = { navController.navigate(NavRoute.Register.route) }
            )
        }

        // 4. Login Screen
        composable(NavRoute.Login.route) {
            LoginScreen(
                authRepository = container.authRepository,
                onLoginSuccess = {
                    navController.navigate(NavRoute.Dashboard.route) {
                        popUpTo(NavRoute.Landing.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = { navController.navigate(NavRoute.Register.route) },
                onForgotPasswordClick = { navController.navigate(NavRoute.KnownLimitations.route) }
            )
        }

        // 5. Register Screen
        composable(NavRoute.Register.route) {
            RegisterScreen(
                authRepository = container.authRepository,
                onRegisterSuccess = {
                    navController.navigate(NavRoute.RecoveryKitSetup.route)
                },
                onNavigateToLogin = { navController.navigate(NavRoute.Login.route) }
            )
        }

        // 6. Recovery Kit Setup Screen
        composable(NavRoute.RecoveryKitSetup.route) {
            RecoveryKitSetupScreen(
                authRepository = container.authRepository,
                onProceedToVerification = {
                    navController.navigate(NavRoute.RecoveryKitVerify.route)
                }
            )
        }

        // 7. Recovery Kit Verification Screen
        composable(NavRoute.RecoveryKitVerify.route) {
            RecoveryKitVerifyScreen(
                authRepository = container.authRepository,
                onVerificationSuccess = {
                    navController.navigate(NavRoute.VerifyEmail.route)
                }
            )
        }

        // 8. Verify Email Screen
        composable(NavRoute.VerifyEmail.route) {
            VerifyEmailScreen(
                authRepository = container.authRepository,
                onVerificationComplete = {
                    navController.navigate(NavRoute.Dashboard.route) {
                        popUpTo(NavRoute.Landing.route) { inclusive = true }
                    }
                }
            )
        }

        // 9. Dashboard Screen
        composable(NavRoute.Dashboard.route) {
            DashboardScreen(
                authRepository = container.authRepository,
                vaultRepository = container.vaultRepository,
                onNavigateToFileBrowser = { navController.navigate(NavRoute.FileBrowser.route) },
                onNavigateToUpload = { navController.navigate(NavRoute.UploadManager.route) },
                onNavigateToTrash = { navController.navigate(NavRoute.Trash.route) },
                onNavigateToSettings = { navController.navigate(NavRoute.AccountSettings.route) },
                onFileClick = { fileId ->
                    navController.navigate(NavRoute.FileDetails.createRoute(fileId))
                }
            )
        }

        // 10. File Browser Screen
        composable(NavRoute.FileBrowser.route) {
            FileBrowserScreen(
                vaultRepository = container.vaultRepository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToUpload = { navController.navigate(NavRoute.UploadManager.route) },
                onFolderClick = { folderId, folderName ->
                    navController.navigate(NavRoute.FolderBrowser.createRoute(folderId, folderName))
                },
                onFileClick = { fileId ->
                    navController.navigate(NavRoute.FileDetails.createRoute(fileId))
                }
            )
        }

        // 11. Folder Browser Screen
        composable(NavRoute.FolderBrowser.route) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId") ?: ""
            val folderName = backStackEntry.arguments?.getString("folderName") ?: "Folder"
            FolderBrowserScreen(
                folderId = folderId,
                folderName = folderName,
                vaultRepository = container.vaultRepository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToUpload = { navController.navigate(NavRoute.UploadManager.route) },
                onFileClick = { fileId ->
                    navController.navigate(NavRoute.FileDetails.createRoute(fileId))
                }
            )
        }

        // 12. File Details Screen
        composable(NavRoute.FileDetails.route) { backStackEntry ->
            val fileId = backStackEntry.arguments?.getString("fileId") ?: ""
            FileDetailsScreen(
                fileId = fileId,
                vaultRepository = container.vaultRepository,
                onNavigateBack = { navController.popBackStack() },
                onDownloadClick = { id, name, size ->
                    navController.navigate(NavRoute.DownloadManager.route)
                }
            )
        }

        // 13. Upload Manager Screen
        composable(NavRoute.UploadManager.route) {
            UploadManagerScreen(
                transferRepository = container.transferRepository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // 14. Download Manager Screen
        composable(NavRoute.DownloadManager.route) {
            DownloadManagerScreen(
                transferRepository = container.transferRepository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // 15. Trash Screen
        composable(NavRoute.Trash.route) {
            TrashScreen(
                vaultRepository = container.vaultRepository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // 16. Account Settings Screen
        composable(NavRoute.AccountSettings.route) {
            AccountSettingsScreen(
                authRepository = container.authRepository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToSecurity = { navController.navigate(NavRoute.SecuritySettings.route) },
                onNavigateToSessions = { navController.navigate(NavRoute.SessionManagement.route) },
                onNavigateToStorage = { navController.navigate(NavRoute.StorageUsage.route) },
                onNavigateToLimitations = { navController.navigate(NavRoute.KnownLimitations.route) },
                onLogoutComplete = {
                    navController.navigate(NavRoute.Landing.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // 17. Security Settings Screen
        composable(NavRoute.SecuritySettings.route) {
            SecuritySettingsScreen(
                keystoreManager = container.keystoreManager,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // 18. Session Management Screen
        composable(NavRoute.SessionManagement.route) {
            SessionManagementScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // 19. Storage Usage Screen
        composable(NavRoute.StorageUsage.route) {
            StorageUsageScreen(
                vaultRepository = container.vaultRepository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // 20. Known Limitations Screen
        composable(NavRoute.KnownLimitations.route) {
            KnownLimitationsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

