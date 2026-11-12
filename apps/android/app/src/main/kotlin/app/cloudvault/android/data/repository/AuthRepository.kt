package app.cloudvault.android.data.repository

import app.cloudvault.android.data.api.CloudVaultApiClient
import app.cloudvault.android.data.api.model.KeyWrapPayloadDto
import app.cloudvault.android.data.api.model.RegisterRequest
import app.cloudvault.android.data.crypto.AndroidCryptoEngine
import app.cloudvault.android.data.crypto.CryptoSpec
import app.cloudvault.android.data.crypto.KeystoreManager
import app.cloudvault.android.data.crypto.RecoveryKit
import app.cloudvault.android.data.crypto.VolatileKeyStore
import app.cloudvault.android.domain.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.security.MessageDigest

class AuthRepository(
    private val api: CloudVaultApiClient,
    private val crypto: AndroidCryptoEngine,
    private val keystore: KeystoreManager
) {

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _isVaultUnlocked = MutableStateFlow(false)
    val isVaultUnlocked: StateFlow<Boolean> = _isVaultUnlocked.asStateFlow()

    // Transient cached registration recovery kit (held only during signup verification flow)
    var pendingRecoveryKit: RecoveryKit? = null
        private set

    fun isVaultReady(): Boolean = VolatileKeyStore.isVaultUnlocked()

    suspend fun register(
        email: String,
        password: String
    ): Result<Pair<User, RecoveryKit>> {
        return runCatching {
            // 1. Generate random salt and derive Argon2id keys
            val salt = ByteArray(16).also { java.security.SecureRandom().nextBytes(it) }
            val derived = crypto.deriveKeys(password, salt)

            // 2. Generate new MasterKey and wrap with KEK
            val masterKey = crypto.generateMasterKey()
            val wrappedMasterKey = crypto.wrapMasterKey(derived.kek, masterKey)

            // 3. Generate 24-word BIP-39 Recovery Kit and wrap MasterKey with RecoveryKey
            val recoveryKit = crypto.generateRecoveryKit()
            val recoveryWrappedMasterKey = crypto.wrapRecoveryKey(recoveryKit.recoveryKey, masterKey)

            // 4. Compute mnemonic hash for server-side recovery gate
            val mnemonicHash = MessageDigest.getInstance("SHA-256")
                .digest(recoveryKit.words.joinToString(" ").toByteArray(Charsets.UTF_8))

            val registerDto = RegisterRequest(
                email = email,
                authKeyHex = CryptoSpec.bytesToHex(derived.authKey),
                wrappedMasterKey = KeyWrapPayloadDto(
                    v = wrappedMasterKey.v,
                    iv = wrappedMasterKey.iv,
                    tag = wrappedMasterKey.tag,
                    ct = wrappedMasterKey.ct
                ),
                recoveryWrappedMasterKey = KeyWrapPayloadDto(
                    v = recoveryWrappedMasterKey.v,
                    iv = recoveryWrappedMasterKey.iv,
                    tag = recoveryWrappedMasterKey.tag,
                    ct = recoveryWrappedMasterKey.ct
                ),
                kdfSaltHex = CryptoSpec.bytesToHex(salt),
                recoveryMnemonicHash = CryptoSpec.bytesToHex(mnemonicHash)
            )

            val authResponse = api.register(registerDto).getOrThrow()
            VolatileKeyStore.setMasterKey(masterKey)
            VolatileKeyStore.setSessionKeys(derived.kek, derived.authKey)

            val domainUser = User(
                id = authResponse.user.id,
                email = authResponse.user.email,
                emailVerified = authResponse.user.emailVerified,
                storageQuotaBytes = authResponse.user.storageQuotaBytes,
                storageUsedBytes = authResponse.user.storageUsedBytes
            )
            _currentUser.value = domainUser
            _isVaultUnlocked.value = true
            pendingRecoveryKit = recoveryKit

            Pair(domainUser, recoveryKit)
        }
    }

    suspend fun login(
        email: String,
        password: String,
        enableDeviceQuickUnlock: Boolean = false
    ): Result<User> {
        return runCatching {
            // 1. Anti-user-enumeration pre-login to get user's Argon2id salt
            val preLogin = api.preLogin(email).getOrThrow()
            val salt = CryptoSpec.hexToBytes(preLogin.saltHex)

            // 2. Derive AuthKey and KEK locally
            val derived = crypto.deriveKeys(password, salt)

            // 3. Login with AuthKey
            val authResponse = api.login(email, CryptoSpec.bytesToHex(derived.authKey)).getOrThrow()
            val wrappedPayload = authResponse.wrappedMasterKey
                ?: throw IllegalStateException("Backend did not return wrapped MasterKey")

            // 4. Unwrap MasterKey in volatile memory
            val payload = CryptoSpec.KeyWrapPayload(
                v = wrappedPayload.v,
                iv = wrappedPayload.iv,
                tag = wrappedPayload.tag,
                ct = wrappedPayload.ct
            )
            val masterKey = crypto.unwrapMasterKey(derived.kek, payload)

            VolatileKeyStore.setMasterKey(masterKey)
            VolatileKeyStore.setSessionKeys(derived.kek, derived.authKey)

            if (enableDeviceQuickUnlock) {
                keystore.saveDeviceBoundMasterKey(masterKey)
            }

            val domainUser = User(
                id = authResponse.user.id,
                email = authResponse.user.email,
                emailVerified = authResponse.user.emailVerified,
                storageQuotaBytes = authResponse.user.storageQuotaBytes,
                storageUsedBytes = authResponse.user.storageUsedBytes
            )
            _currentUser.value = domainUser
            _isVaultUnlocked.value = true
            domainUser
        }
    }

    fun unlockVaultWithDeviceKey(): Boolean {
        val deviceMasterKey = keystore.loadDeviceBoundMasterKey() ?: return false
        VolatileKeyStore.setMasterKey(deviceMasterKey)
        _isVaultUnlocked.value = true
        return true
    }

    suspend fun verifyEmail(code: String): Result<Boolean> {
        return api.verifyEmail(code)
    }

    suspend fun resendVerification(email: String): Result<Boolean> {
        return api.resendVerification(email)
    }

    suspend fun logout(): Result<Boolean> {
        return runCatching {
            api.logout()
            VolatileKeyStore.clearAll()
            keystore.clearDeviceBoundMasterKey()
            _currentUser.value = null
            _isVaultUnlocked.value = false
            pendingRecoveryKit = null
            true
        }
    }
}

