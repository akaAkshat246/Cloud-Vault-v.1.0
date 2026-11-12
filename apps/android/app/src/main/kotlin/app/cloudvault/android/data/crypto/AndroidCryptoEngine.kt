package app.cloudvault.android.data.crypto

import org.bouncycastle.crypto.generators.Argon2BytesGenerator
import org.bouncycastle.crypto.params.Argon2Parameters
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.UUID
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

data class DerivedKeys(
    val prk: ByteArray,
    val authKey: ByteArray,
    val kek: ByteArray
)

data class RecoveryKit(
    val words: List<String>,
    val recoveryKey: ByteArray
)

class AndroidCryptoEngine {

    companion object {
        const val ARGON2_TIME_COST = 3
        const val ARGON2_MEMORY_KIB = 65536 // 64 MiB
        const val ARGON2_PARALLELISM = 1
        const val ARGON2_OUT_LEN = 64
    }

    private val secureRandom = SecureRandom()

    /**
     * Argon2id Key Derivation + HKDF Domain Separation
     */
    fun deriveKeys(password: String, salt: ByteArray): DerivedKeys {
        val passwordBytes = password.toByteArray(Charsets.UTF_8)
        val params = Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
            .withVersion(Argon2Parameters.ARGON2_VERSION_13)
            .withIterations(ARGON2_TIME_COST)
            .withMemoryAsKB(ARGON2_MEMORY_KIB)
            .withParallelism(ARGON2_PARALLELISM)
            .withSalt(salt)
            .build()

        val generator = Argon2BytesGenerator()
        generator.init(params)
        val fullOutput = ByteArray(ARGON2_OUT_LEN)
        generator.generateBytes(passwordBytes, fullOutput, 0, ARGON2_OUT_LEN)

        val authKey = CryptoSpec.hkdf(fullOutput, CryptoSpec.DomainTags.AUTH_KEY, 32)
        val kek = CryptoSpec.hkdf(fullOutput, CryptoSpec.DomainTags.KEK, 32)

        return DerivedKeys(prk = fullOutput, authKey = authKey, kek = kek)
    }

    /**
     * Generates a 24-word BIP-39 Recovery Kit with 256 bits of entropy
     */
    fun generateRecoveryKit(): RecoveryKit {
        val entropy = ByteArray(32).also { secureRandom.nextBytes(it) }
        val sha256 = MessageDigest.getInstance("SHA-256").digest(entropy)
        val checksumByte = sha256[0] // 8 bits checksum

        // Combine 256 bits of entropy + 8 bits checksum = 264 bits = 24 * 11 bits
        val words = mutableListOf<String>()
        val bits = BooleanArray(264)
        for (i in 0 until 32) {
            val b = entropy[i].toInt() and 0xFF
            for (j in 0 until 8) {
                bits[i * 8 + j] = ((b shr (7 - j)) and 1) == 1
            }
        }
        val cs = checksumByte.toInt() and 0xFF
        for (j in 0 until 8) {
            bits[256 + j] = ((cs shr (7 - j)) and 1) == 1
        }

        for (i in 0 until 24) {
            var wordIndex = 0
            for (j in 0 until 11) {
                if (bits[i * 11 + j]) {
                    wordIndex = wordIndex or (1 shl (10 - j))
                }
            }
            words.add(Bip39Wordlist.getWord(wordIndex))
        }

        val recoveryKey = deriveRecoveryKey(words)
        return RecoveryKit(words = words, recoveryKey = recoveryKey)
    }

    /**
     * Derives a 32-byte Recovery KEK from 24 BIP-39 mnemonic words
     */
    fun deriveRecoveryKey(words: List<String>): ByteArray {
        require(words.size == 24) { "Recovery kit must contain exactly 24 words" }
        val mnemonic = words.joinToString(" ").trim()
        val salt = "mnemonic".toByteArray(Charsets.UTF_8)
        val spec = PBEKeySpec(mnemonic.toCharArray(), salt, 2048, 512)
        val skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512")
        val fullSeed = skf.generateSecret(spec).encoded
        return fullSeed.copyOfRange(0, 32)
    }

    fun generateMasterKey(): ByteArray {
        return ByteArray(32).also { secureRandom.nextBytes(it) }
    }

    fun generateFek(): ByteArray {
        return ByteArray(32).also { secureRandom.nextBytes(it) }
    }

    fun wrapMasterKey(kek: ByteArray, masterKey: ByteArray): CryptoSpec.KeyWrapPayload {
        return CryptoSpec.wrapKey(kek, masterKey, CryptoSpec.DomainTags.MASTER_KEY_WRAP)
    }

    fun unwrapMasterKey(kek: ByteArray, payload: CryptoSpec.KeyWrapPayload): ByteArray {
        return CryptoSpec.unwrapKey(kek, payload, CryptoSpec.DomainTags.MASTER_KEY_WRAP)
    }

    fun wrapRecoveryKey(recoveryKek: ByteArray, masterKey: ByteArray): CryptoSpec.KeyWrapPayload {
        return CryptoSpec.wrapKey(recoveryKek, masterKey, CryptoSpec.DomainTags.RECOVERY_WRAP)
    }

    fun unwrapRecoveryKey(recoveryKek: ByteArray, payload: CryptoSpec.KeyWrapPayload): ByteArray {
        return CryptoSpec.unwrapKey(recoveryKek, payload, CryptoSpec.DomainTags.RECOVERY_WRAP)
    }

    fun wrapFek(masterKey: ByteArray, fek: ByteArray): CryptoSpec.KeyWrapPayload {
        return CryptoSpec.wrapKey(masterKey, fek, CryptoSpec.DomainTags.METADATA_WRAP)
    }

    fun unwrapFek(masterKey: ByteArray, payload: CryptoSpec.KeyWrapPayload): ByteArray {
        return CryptoSpec.unwrapKey(masterKey, payload, CryptoSpec.DomainTags.METADATA_WRAP)
    }

    fun encryptMetadata(masterKey: ByteArray, fileId: String, name: String): Pair<String, String> {
        val aad = CryptoSpec.buildMetadataAAD(fileId)
        val res = CryptoSpec.encryptAesGcm(masterKey, name.toByteArray(Charsets.UTF_8), aad)
        val combined = ByteArray(res.ciphertext.size + res.tag.size)
        System.arraycopy(res.ciphertext, 0, combined, 0, res.ciphertext.size)
        System.arraycopy(res.tag, 0, combined, res.ciphertext.size, res.tag.size)
        return Pair(CryptoSpec.bytesToHex(combined), CryptoSpec.bytesToHex(res.iv))
    }

    fun decryptMetadata(masterKey: ByteArray, fileId: String, nameEncryptedHex: String, ivHex: String): String {
        val combined = CryptoSpec.hexToBytes(nameEncryptedHex)
        val iv = CryptoSpec.hexToBytes(ivHex)
        require(combined.size >= 16) { "Ciphertext must include 16-byte tag" }
        val ciphertext = combined.copyOfRange(0, combined.size - 16)
        val tag = combined.copyOfRange(combined.size - 16, combined.size)
        val aad = CryptoSpec.buildMetadataAAD(fileId)
        val plaintextBytes = CryptoSpec.decryptAesGcm(masterKey, iv, ciphertext, tag, aad)
        return String(plaintextBytes, Charsets.UTF_8)
    }
}

