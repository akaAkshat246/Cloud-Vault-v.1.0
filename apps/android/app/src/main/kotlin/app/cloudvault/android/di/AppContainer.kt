package app.cloudvault.android.di

import android.content.Context
import app.cloudvault.android.data.api.CloudVaultApiClient
import app.cloudvault.android.data.crypto.AndroidCryptoEngine
import app.cloudvault.android.data.crypto.KeystoreManager
import app.cloudvault.android.data.db.CloudVaultDatabase
import app.cloudvault.android.data.repository.AuthRepository
import app.cloudvault.android.data.repository.TransferRepository
import app.cloudvault.android.data.repository.VaultRepository

class AppContainer(private val context: Context) {

    val apiClient: CloudVaultApiClient by lazy {
        CloudVaultApiClient()
    }

    val cryptoEngine: AndroidCryptoEngine by lazy {
        AndroidCryptoEngine()
    }

    val keystoreManager: KeystoreManager by lazy {
        KeystoreManager(context)
    }

    val database: CloudVaultDatabase by lazy {
        CloudVaultDatabase(context)
    }

    val authRepository: AuthRepository by lazy {
        AuthRepository(apiClient, cryptoEngine, keystoreManager)
    }

    val vaultRepository: VaultRepository by lazy {
        VaultRepository(apiClient, cryptoEngine, database)
    }

    val transferRepository: TransferRepository by lazy {
        TransferRepository(context, database)
    }
}

