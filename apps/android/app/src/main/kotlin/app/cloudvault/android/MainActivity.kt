package app.cloudvault.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController
import app.cloudvault.android.navigation.CloudVaultNavGraph
import app.cloudvault.android.ui.theme.CloudVaultTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as CloudVaultApp
        val container = app.container

        setContent {
            CloudVaultTheme {
                val navController = rememberNavController()
                CloudVaultNavGraph(
                    navController = navController,
                    container = container
                )
            }
        }
    }
}
