package app.cloudvault.android.data.crypto

import java.util.Arrays

object VolatileKeyStore {

    private var masterKey: ByteArray? = null
    private var kek: ByteArray? = null
    private var authKey: ByteArray? = null

    @Synchronized
    fun setMasterKey(key: ByteArray) {
        clearMasterKey()
        masterKey = key.clone()
    }

    @Synchronized
    fun getMasterKey(): ByteArray? {
        return masterKey?.clone()
    }

    @Synchronized
    fun setSessionKeys(kekBytes: ByteArray, authKeyBytes: ByteArray) {
        clearSessionKeys()
        kek = kekBytes.clone()
        authKey = authKeyBytes.clone()
    }

    @Synchronized
    fun getKek(): ByteArray? = kek?.clone()

    @Synchronized
    fun getAuthKey(): ByteArray? = authKey?.clone()

    @Synchronized
    fun isVaultUnlocked(): Boolean = masterKey != null

    @Synchronized
    fun clearMasterKey() {
        masterKey?.let {
            Arrays.fill(it, 0.toByte())
        }
        masterKey = null
    }

    @Synchronized
    fun clearSessionKeys() {
        kek?.let { Arrays.fill(it, 0.toByte()) }
        kek = null
        authKey?.let { Arrays.fill(it, 0.toByte()) }
        authKey = null
    }

    @Synchronized
    fun clearAll() {
        clearMasterKey()
        clearSessionKeys()
    }
}

