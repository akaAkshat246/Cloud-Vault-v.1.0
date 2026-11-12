package app.cloudvault.android.data.crypto

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class KeystoreManager(private val context: Context) {

    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val KEY_ALIAS = "CloudVaultDeviceProtectionKey"
        private const val PREFS_NAME = "cv_keystore_vault"
        private const val PREF_WRAPPED_KEY = "device_wrapped_master_key"
        private const val PREF_IV = "device_key_iv"
        private const val PREF_TAG = "device_key_tag"
    }

    private val keyStore: KeyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply {
        load(null)
    }

    private fun getOrCreateDeviceKey(): SecretKey {
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            )
            val builder = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setUserAuthenticationRequired(false) // Can be set true if BiometricPrompt is strictly used

            keyGenerator.init(builder.build())
            return keyGenerator.generateKey()
        }
        val entry = keyStore.getEntry(KEY_ALIAS, null) as KeyStore.SecretKeyEntry
        return entry.secretKey
    }

    /**
     * Encrypts the volatile MasterKey with the device-bound Keystore key
     * and saves it to private app preferences.
     */
    fun saveDeviceBoundMasterKey(masterKey: ByteArray) {
        val secretKey = getOrCreateDeviceKey()
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey)
        val iv = cipher.iv
        val combined = cipher.doFinal(masterKey)
        val ciphertext = combined.copyOfRange(0, combined.size - 16)
        val tag = combined.copyOfRange(combined.size - 16, combined.size)

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(PREF_WRAPPED_KEY, CryptoSpec.bytesToHex(ciphertext))
            .putString(PREF_IV, CryptoSpec.bytesToHex(iv))
            .putString(PREF_TAG, CryptoSpec.bytesToHex(tag))
            .apply()
    }

    /**
     * Decrypts the device-bound MasterKey using the Android Keystore key.
     */
    fun loadDeviceBoundMasterKey(): ByteArray? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val ctHex = prefs.getString(PREF_WRAPPED_KEY, null) ?: return null
        val ivHex = prefs.getString(PREF_IV, null) ?: return null
        val tagHex = prefs.getString(PREF_TAG, null) ?: return null

        return try {
            val secretKey = getOrCreateDeviceKey()
            val ciphertext = CryptoSpec.hexToBytes(ctHex)
            val iv = CryptoSpec.hexToBytes(ivHex)
            val tag = CryptoSpec.hexToBytes(tagHex)

            val combined = ByteArray(ciphertext.size + tag.size)
            System.arraycopy(ciphertext, 0, combined, 0, ciphertext.size)
            System.arraycopy(tag, 0, combined, ciphertext.size, tag.size)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val spec = GCMParameterSpec(128, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)
            cipher.doFinal(combined)
        } catch (e: Exception) {
            // Key invalidation (device lock changed, biometrics enrolled, or tampered storage)
            clearDeviceBoundMasterKey()
            null
        }
    }

    fun hasDeviceBoundKey(): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.contains(PREF_WRAPPED_KEY) && keyStore.containsAlias(KEY_ALIAS)
    }

    fun clearDeviceBoundMasterKey() {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        if (keyStore.containsAlias(KEY_ALIAS)) {
            keyStore.deleteEntry(KEY_ALIAS)
        }
    }
}

