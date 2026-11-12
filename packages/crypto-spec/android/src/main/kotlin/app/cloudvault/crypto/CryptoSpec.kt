package app.cloudvault.crypto

import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.security.SecureRandom
import java.util.Base64
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object CryptoSpec {
    const val FORMAT_VERSION: Short = 1
    const val PLAINTEXT_CHUNK_SIZE = 5 * 1024 * 1024 // 5 MiB
    const val IV_LENGTH = 12
    const val TAG_LENGTH = 16
    const val CHUNK_OVERHEAD = IV_LENGTH + TAG_LENGTH // 28 bytes
    const val KEY_LENGTH = 32

    object DomainTags {
        const val AUTH_KEY = "cloudvault-auth-key-v1"
        const val KEK = "cloudvault-kek-v1"
        const val MASTER_KEY_WRAP = "cloudvault-master-key-wrap-v1"
        const val RECOVERY_WRAP = "cloudvault-recovery-wrap-v1"
        const val METADATA_WRAP = "cloudvault-metadata-v1"
        const val SHARE_PASSWORD_WRAP = "cloudvault-share-pass-v1"
    }

    data class AesGcmResult(
        val iv: ByteArray,
        val ciphertext: ByteArray,
        val tag: ByteArray
    )

    data class KeyWrapPayload(
        val v: Int = 1,
        val iv: String,   // Base64
        val tag: String,  // Base64
        val ct: String    // Base64
    )

    /**
     * Build 27-byte AAD buffer binding format_version, file_id, chunk_index, total_chunks, is_final
     */
    fun buildChunkAAD(
        fileId: UUID,
        chunkIndex: Int,
        totalChunks: Int,
        isFinal: Boolean,
        formatVersion: Short = FORMAT_VERSION
    ): ByteArray {
        val buffer = ByteBuffer.allocate(27).order(ByteOrder.BIG_ENDIAN)
        buffer.putShort(formatVersion)
        buffer.putLong(fileId.mostSignificantBits)
        buffer.putLong(fileId.leastSignificantBits)
        buffer.putInt(chunkIndex)
        buffer.putInt(totalChunks)
        buffer.put(if (isFinal) 1.toByte() else 0.toByte())
        return buffer.array()
    }

    /**
     * Build AAD from string UUID
     */
    fun buildChunkAAD(
        fileIdStr: String,
        chunkIndex: Int,
        totalChunks: Int,
        isFinal: Boolean,
        formatVersion: Short = FORMAT_VERSION
    ): ByteArray {
        val uuid = UUID.fromString(fileIdStr)
        return buildChunkAAD(uuid, chunkIndex, totalChunks, isFinal, formatVersion)
    }

    /**
     * Build deterministic AAD for file/folder metadata:
     * format_version (2B) + file_id (16B UUID) + "cloudvault-metadata-v1"
     */
    fun buildMetadataAAD(fileId: UUID, formatVersion: Short = FORMAT_VERSION): ByteArray {
        val tagBytes = DomainTags.METADATA_WRAP.toByteArray(Charsets.UTF_8)
        val buffer = ByteBuffer.allocate(2 + 16 + tagBytes.size).order(ByteOrder.BIG_ENDIAN)
        buffer.putShort(formatVersion)
        buffer.putLong(fileId.mostSignificantBits)
        buffer.putLong(fileId.leastSignificantBits)
        buffer.put(tagBytes)
        return buffer.array()
    }

    fun buildMetadataAAD(fileIdStr: String, formatVersion: Short = FORMAT_VERSION): ByteArray {
        return buildMetadataAAD(UUID.fromString(fileIdStr), formatVersion)
    }

    /**
     * Pack components into S3 wire chunk: [12B IV] + [Ciphertext] + [16B Tag]
     */
    fun packChunk(iv: ByteArray, ciphertext: ByteArray, tag: ByteArray): ByteArray {
        require(iv.size == IV_LENGTH) { "IV must be 12 bytes" }
        require(tag.size == TAG_LENGTH) { "Tag must be 16 bytes" }

        val total = ByteArray(iv.size + ciphertext.size + tag.size)
        System.arraycopy(iv, 0, total, 0, iv.size)
        System.arraycopy(ciphertext, 0, total, iv.size, ciphertext.size)
        System.arraycopy(tag, 0, total, iv.size + ciphertext.size, tag.size)
        return total
    }

    /**
     * Unpack wire chunk into IV, ciphertext, and tag
     */
    fun unpackChunk(chunk: ByteArray): Triple<ByteArray, ByteArray, ByteArray> {
        require(chunk.size >= CHUNK_OVERHEAD) { "Chunk too small: minimum size is $CHUNK_OVERHEAD bytes" }
        val iv = chunk.copyOfRange(0, IV_LENGTH)
        val ciphertext = chunk.copyOfRange(IV_LENGTH, chunk.size - TAG_LENGTH)
        val tag = chunk.copyOfRange(chunk.size - TAG_LENGTH, chunk.size)
        return Triple(iv, ciphertext, tag)
    }

    /**
     * Encrypt with AES-256-GCM using standard Android / JVM JCA
     */
    fun encryptAesGcm(
        key: ByteArray,
        plaintext: ByteArray,
        aad: ByteArray? = null,
        explicitIv: ByteArray? = null
    ): AesGcmResult {
        require(key.size == KEY_LENGTH) { "Key must be 32 bytes" }
        val iv = explicitIv ?: ByteArray(IV_LENGTH).also { SecureRandom().nextBytes(it) }
        require(iv.size == IV_LENGTH) { "IV must be 12 bytes" }

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(key, "AES")
        val gcmSpec = GCMParameterSpec(TAG_LENGTH * 8, iv)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec)

        if (aad != null && aad.isNotEmpty()) {
            cipher.updateAAD(aad)
        }

        val combined = cipher.doFinal(plaintext)
        val ciphertext = combined.copyOfRange(0, combined.size - TAG_LENGTH)
        val tag = combined.copyOfRange(combined.size - TAG_LENGTH, combined.size)

        return AesGcmResult(iv, ciphertext, tag)
    }

    /**
     * Decrypt with AES-256-GCM and authenticate tag + AAD
     */
    fun decryptAesGcm(
        key: ByteArray,
        iv: ByteArray,
        ciphertext: ByteArray,
        tag: ByteArray,
        aad: ByteArray? = null
    ): ByteArray {
        require(key.size == KEY_LENGTH) { "Key must be 32 bytes" }
        require(iv.size == IV_LENGTH) { "IV must be 12 bytes" }
        require(tag.size == TAG_LENGTH) { "Tag must be 16 bytes" }

        val combined = ByteArray(ciphertext.size + tag.size)
        System.arraycopy(ciphertext, 0, combined, 0, ciphertext.size)
        System.arraycopy(tag, 0, combined, ciphertext.size, tag.size)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(key, "AES")
        val gcmSpec = GCMParameterSpec(TAG_LENGTH * 8, iv)
        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec)

        if (aad != null && aad.isNotEmpty()) {
            cipher.updateAAD(aad)
        }

        return cipher.doFinal(combined)
    }

    /**
     * HKDF-Extract with SHA-256 (RFC 5869)
     */
    fun hkdfExtract(salt: ByteArray = ByteArray(32), ikm: ByteArray): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(salt, "HmacSHA256"))
        return mac.doFinal(ikm)
    }

    /**
     * HKDF-Expand with SHA-256 (RFC 5869)
     */
    fun hkdfExpand(prk: ByteArray, info: String, length: Int = 32): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(prk, "HmacSHA256"))
        mac.update(info.toByteArray(Charsets.UTF_8))
        mac.update(0x01.toByte())
        val t1 = mac.doFinal()
        return if (length == 32) t1 else t1.copyOfRange(0, length)
    }

    /**
     * Complete RFC 5869 HKDF: Extract + Expand
     */
    fun hkdf(ikm: ByteArray, info: String, length: Int = 32, salt: ByteArray = ByteArray(32)): ByteArray {
        val prk = hkdfExtract(salt, ikm)
        return hkdfExpand(prk, info, length)
    }

    /**
     * Wrap key with AES-256-GCM
     */
    fun wrapKey(
        wrappingKey: ByteArray,
        targetKey: ByteArray,
        aadDomain: String,
        explicitIv: ByteArray? = null
    ): KeyWrapPayload {
        val aad = aadDomain.toByteArray(Charsets.UTF_8)
        val res = encryptAesGcm(wrappingKey, targetKey, aad, explicitIv)
        val encoder = Base64.getEncoder()
        return KeyWrapPayload(
            v = 1,
            iv = encoder.encodeToString(res.iv),
            tag = encoder.encodeToString(res.tag),
            ct = encoder.encodeToString(res.ciphertext)
        )
    }

    /**
     * Unwrap key with AES-256-GCM
     */
    fun unwrapKey(
        wrappingKey: ByteArray,
        payload: KeyWrapPayload,
        aadDomain: String
    ): ByteArray {
        require(payload.v == 1) { "Unsupported version: ${payload.v}" }
        val decoder = Base64.getDecoder()
        val iv = decoder.decode(payload.iv)
        val tag = decoder.decode(payload.tag)
        val ct = decoder.decode(payload.ct)
        val aad = aadDomain.toByteArray(Charsets.UTF_8)
        return decryptAesGcm(wrappingKey, iv, ct, tag, aad)
    }

    // Helper utilities
    fun hexToBytes(hex: String): ByteArray {
        val clean = hex.replace(" ", "")
        val result = ByteArray(clean.length / 2)
        for (i in result.indices) {
            val index = i * 2
            result[i] = clean.substring(index, index + 2).toInt(16).toByte()
        }
        return result
    }

    fun bytesToHex(bytes: ByteArray): String {
        val sb = StringBuilder()
        for (b in bytes) {
            sb.append(String.format("%02x", b))
        }
        return sb.toString()
    }
}

