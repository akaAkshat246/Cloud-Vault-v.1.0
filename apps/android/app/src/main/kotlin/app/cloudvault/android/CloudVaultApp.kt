package app.cloudvault.android

import android.app.Application
import app.cloudvault.android.di.AppContainer

class CloudVaultApp : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
