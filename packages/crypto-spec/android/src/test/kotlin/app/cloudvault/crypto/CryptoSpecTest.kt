package app.cloudvault.crypto

import org.json.JSONObject
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.bouncycastle.crypto.generators.Argon2BytesGenerator
import org.bouncycastle.crypto.params.Argon2Parameters
import java.io.File
import java.nio.charset.StandardCharsets

class CryptoSpecTest {

    companion object {
        private lateinit var vectorJson: JSONObject

        @JvmStatic
        @BeforeAll
        fun setUp() {
            var vectorFile = File("test-vectors/v1.json")
            if (!vectorFile.exists()) {
                vectorFile = File("../test-vectors/v1.json")
            }
            if (!vectorFile.exists()) {
                vectorFile = File("packages/crypto-spec/test-vectors/v1.json")
            }
            assertTrue(vectorFile.exists(), "Test vector file must exist at ${vectorFile.absolutePath}")
            val content = vectorFile.readText(StandardCharsets.UTF_8)
            vectorJson = JSONObject(content)
        }

        fun deriveArgon2id(
            password: ByteArray,
            salt: ByteArray,
            iterations: Int = 3,
            memKiB: Int = 65536,
            parallelism: Int = 1,
            outLen: Int = 64
        ): ByteArray {
            val params = Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withVersion(Argon2Parameters.ARGON2_VERSION_13)
                .withIterations(iterations)
                .withMemoryAsKB(memKiB)
                .withParallelism(parallelism)
                .withSalt(salt)
                .build()
            val gen = Argon2BytesGenerator()
            gen.init(params)
            val result = ByteArray(outLen)
            gen.generateBytes(password, result, 0, result.size)
            return result
        }
    }

    @Test
    fun `test Argon2id key derivation matches test vectors (pure JVM verification)`() {
        val kdf = vectorJson.getJSONObject("kdf")
        val password = kdf.getString("password").toByteArray(StandardCharsets.UTF_8)
        val salt = CryptoSpec.hexToBytes(kdf.getString("salt_hex"))
        val expectedPrk = kdf.getString("raw_prk_hex")
        val paramsObj = kdf.getJSONObject("params")

        val derivedPrk = deriveArgon2id(
            password,
            salt,
            paramsObj.getInt("iterations"),
            paramsObj.getInt("memory_kib"),
            paramsObj.getInt("parallelism"),
            paramsObj.optInt("key_length", 64)
        )
        assertEquals(expectedPrk, CryptoSpec.bytesToHex(derivedPrk))
    }

    @Test
    fun `test complete end-to-end chain from password to unwrapped MasterKey`() {
        val kdf = vectorJson.getJSONObject("kdf")
        val password = kdf.getString("password").toByteArray(StandardCharsets.UTF_8)
        val salt = CryptoSpec.hexToBytes(kdf.getString("salt_hex"))
        val paramsObj = kdf.getJSONObject("params")

        // 1. Password -> Argon2id PRK
        val prk = deriveArgon2id(
            password,
            salt,
            paramsObj.getInt("iterations"),
            paramsObj.getInt("memory_kib"),
            paramsObj.getInt("parallelism"),
            paramsObj.optInt("key_length", 64)
        )
        assertEquals(kdf.getString("raw_prk_hex"), CryptoSpec.bytesToHex(prk))

        // 2. PRK -> HKDF -> AuthKey & KEK
        val authKey = CryptoSpec.hkdf(prk, CryptoSpec.DomainTags.AUTH_KEY, 32)
        val kek = CryptoSpec.hkdf(prk, CryptoSpec.DomainTags.KEK, 32)
        assertEquals(kdf.getString("auth_key_hex"), CryptoSpec.bytesToHex(authKey))
        assertEquals(kdf.getString("kek_hex"), CryptoSpec.bytesToHex(kek))

        // 3. KEK -> AES-256-GCM Unwrap -> MasterKey
        val masterWrap = vectorJson.getJSONObject("master_key_wrap")
        val payloadObj = masterWrap.getJSONObject("payload")
        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj.getInt("v"),
            iv = payloadObj.getString("iv"),
            tag = payloadObj.getString("tag"),
            ct = payloadObj.getString("ct")
        )
        val unwrappedMasterKey = CryptoSpec.unwrapKey(kek, payload, masterWrap.getString("aad_string"))
        assertEquals(masterWrap.getString("master_key_hex"), CryptoSpec.bytesToHex(unwrappedMasterKey))
    }

    @Test
    fun `test HKDF-SHA256 dual key derivation matches test vectors`() {
        val kdf = vectorJson.getJSONObject("kdf")
        val rawPrk = CryptoSpec.hexToBytes(kdf.getString("raw_prk_hex"))
        val expectedAuthKey = kdf.getString("auth_key_hex")
        val expectedKek = kdf.getString("kek_hex")

        val derivedAuthKey = CryptoSpec.hkdf(rawPrk, CryptoSpec.DomainTags.AUTH_KEY, 32)
        val derivedKek = CryptoSpec.hkdf(rawPrk, CryptoSpec.DomainTags.KEK, 32)

        assertEquals(expectedAuthKey, CryptoSpec.bytesToHex(derivedAuthKey))
        assertEquals(expectedKek, CryptoSpec.bytesToHex(derivedKek))
    }

    @Test
    fun `test MasterKey envelope unwrapping matches test vectors`() {
        val masterWrap = vectorJson.getJSONObject("master_key_wrap")
        val kek = CryptoSpec.hexToBytes(masterWrap.getString("kek_hex"))
        val expectedMasterKey = masterWrap.getString("master_key_hex")
        val aadString = masterWrap.getString("aad_string")
        val payloadObj = masterWrap.getJSONObject("payload")

        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj.getInt("v"),
            iv = payloadObj.getString("iv"),
            tag = payloadObj.getString("tag"),
            ct = payloadObj.getString("ct")
        )

        val unwrapped = CryptoSpec.unwrapKey(kek, payload, aadString)
        assertEquals(expectedMasterKey, CryptoSpec.bytesToHex(unwrapped))
    }

    @Test
    fun `test Chunk 0 non-final decryption with AAD matches test vectors`() {
        val chunksArray = vectorJson.getJSONArray("chunks")
        val chunk0 = chunksArray.getJSONObject(0)
        val fekHex = vectorJson.getJSONObject("metadata").getString("fek_hex")
        val fek = CryptoSpec.hexToBytes(fekHex)

        val wireChunk = CryptoSpec.hexToBytes(chunk0.getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        assertEquals(chunk0.getString("iv_hex"), CryptoSpec.bytesToHex(iv))
        assertEquals(chunk0.getString("ciphertext_hex"), CryptoSpec.bytesToHex(ciphertext))
        assertEquals(chunk0.getString("tag_hex"), CryptoSpec.bytesToHex(tag))

        val aad = CryptoSpec.hexToBytes(chunk0.getString("aad_hex"))
        val decrypted = CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)

        assertEquals(chunk0.getString("plaintext_ascii"), String(decrypted, StandardCharsets.UTF_8))
    }

    @Test
    fun `test Chunk 1 final decryption with AAD matches test vectors`() {
        val chunksArray = vectorJson.getJSONArray("chunks")
        val chunk1 = chunksArray.getJSONObject(1)
        val fekHex = vectorJson.getJSONObject("metadata").getString("fek_hex")
        val fek = CryptoSpec.hexToBytes(fekHex)

        val wireChunk = CryptoSpec.hexToBytes(chunk1.getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        val aad = CryptoSpec.hexToBytes(chunk1.getString("aad_hex"))
        val decrypted = CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)

        assertEquals(chunk1.getString("plaintext_ascii"), String(decrypted, StandardCharsets.UTF_8))
    }

    @Test
    fun `test Zero-Knowledge metadata decryption matches test vectors`() {
        val metaObj = vectorJson.getJSONObject("metadata")
        val fek = CryptoSpec.hexToBytes(metaObj.getString("fek_hex"))
        val payloadObj = metaObj.getJSONObject("payload")
        val fileIdStr = metaObj.getString("file_id")

        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj.getInt("v"),
            iv = payloadObj.getString("iv"),
            tag = payloadObj.getString("tag"),
            ct = payloadObj.getString("ct")
        )

        val aad = CryptoSpec.buildMetadataAAD(fileIdStr)
        val decoder = java.util.Base64.getDecoder()
        val decryptedBytes = CryptoSpec.decryptAesGcm(
            fek,
            decoder.decode(payload.iv),
            decoder.decode(payload.ct),
            decoder.decode(payload.tag),
            aad
        )
        val jsonStr = String(decryptedBytes, StandardCharsets.UTF_8)
        val parsed = JSONObject(jsonStr)

        val expectedMeta = metaObj.getJSONObject("metadata_plaintext")
        assertEquals(expectedMeta.getString("name"), parsed.getString("name"))
        assertEquals(expectedMeta.getString("mime"), parsed.getString("mime"))
        assertEquals(expectedMeta.getLong("size"), parsed.getLong("size"))
    }

    @Test
    fun `test BIP-39 recovery kit unwraps MasterKey`() {
        val recovery = vectorJson.getJSONObject("recovery")
        val recoveryKey = CryptoSpec.hexToBytes(recovery.getString("recovery_key_hex"))
        val expectedMasterKey = recovery.getString("master_key_hex")
        val payloadObj = recovery.getJSONObject("payload")

        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj.getInt("v"),
            iv = payloadObj.getString("iv"),
            tag = payloadObj.getString("tag"),
            ct = payloadObj.getString("ct")
        )

        val unwrapped = CryptoSpec.unwrapKey(recoveryKey, payload, CryptoSpec.DomainTags.RECOVERY_WRAP)
        assertEquals(expectedMasterKey, CryptoSpec.bytesToHex(unwrapped))
    }

    @Test
    fun `test password change re-key preserves constant MasterKey`() {
        val pwChange = vectorJson.getJSONObject("password_change")
        val newKek = CryptoSpec.hexToBytes(pwChange.getString("new_kek_hex"))
        val expectedMasterKey = pwChange.getString("master_key_hex")
        val payloadObj = pwChange.getJSONObject("new_master_key_wrap_payload")

        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj.getInt("v"),
            iv = payloadObj.getString("iv"),
            tag = payloadObj.getString("tag"),
            ct = payloadObj.getString("ct")
        )

        val unwrapped = CryptoSpec.unwrapKey(newKek, payload, CryptoSpec.DomainTags.MASTER_KEY_WRAP)
        assertEquals(expectedMasterKey, CryptoSpec.bytesToHex(unwrapped))
    }

    @Test
    fun `test negative vector - tampered tag must fail authentication`() {
        val neg = vectorJson.getJSONObject("negative_tests").getJSONObject("tampered_tag")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val wireChunk = CryptoSpec.hexToBytes(neg.getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        val aad = CryptoSpec.buildChunkAAD(
            neg.getString("file_id"),
            neg.getInt("chunk_index"),
            neg.getInt("total_chunks"),
            neg.getBoolean("is_final")
        )

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)
        }
    }

    @Test
    fun `test negative vector - wrong chunk_index in AAD must fail`() {
        val neg = vectorJson.getJSONObject("negative_tests").getJSONObject("wrong_aad_chunk_index")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val wireChunk = CryptoSpec.hexToBytes(neg.getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        val aad = CryptoSpec.buildChunkAAD(
            neg.getString("file_id"),
            neg.getInt("chunk_index"),
            neg.getInt("total_chunks"),
            neg.getBoolean("is_final")
        )

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)
        }
    }

    @Test
    fun `test negative vector - wrong file_id in AAD must fail`() {
        val neg = vectorJson.getJSONObject("negative_tests").getJSONObject("wrong_file_id")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val wireChunk = CryptoSpec.hexToBytes(neg.getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        val aad = CryptoSpec.buildChunkAAD(
            neg.getString("file_id"),
            neg.getInt("chunk_index"),
            neg.getInt("total_chunks"),
            neg.getBoolean("is_final")
        )

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)
        }
    }

    @Test
    fun `test negative vector - tampered ciphertext body must fail`() {
        val neg = vectorJson.getJSONObject("negative_tests").getJSONObject("tampered_ciphertext")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val wireChunk = CryptoSpec.hexToBytes(neg.getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        val aad = CryptoSpec.buildChunkAAD(
            neg.getString("file_id"),
            neg.getInt("chunk_index"),
            neg.getInt("total_chunks"),
            neg.getBoolean("is_final")
        )

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)
        }
    }

    @Test
    fun `test negative vector - truncated chunk must fail unpacking`() {
        val neg = vectorJson.getJSONObject("negative_tests").getJSONObject("truncated_chunk")
        val wireChunk = CryptoSpec.hexToBytes(neg.getString("wire_chunk_hex"))

        assertThrows(IllegalArgumentException::class.java) {
            CryptoSpec.unpackChunk(wireChunk)
        }
    }

    @Test
    fun `test negative vector - wrong format_version in AAD must fail`() {
        val neg = vectorJson.getJSONObject("negative_tests").getJSONObject("wrong_format_version_aad")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val wireChunk = CryptoSpec.hexToBytes(neg.getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        val aad = CryptoSpec.buildChunkAAD(
            neg.getString("file_id"),
            neg.getInt("chunk_index"),
            neg.getInt("total_chunks"),
            neg.getBoolean("is_final"),
            neg.getInt("format_version").toShort()
        )

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)
        }
    }

    @Test
    fun `test negative vector - wrong password KEK unwrap must fail`() {
        val masterWrap = vectorJson.getJSONObject("master_key_wrap")
        val wrongKek = ByteArray(32) { 0x55.toByte() } // Wrong KEK
        val aadString = masterWrap.getString("aad_string")
        val payloadObj = masterWrap.getJSONObject("payload")

        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj.getInt("v"),
            iv = payloadObj.getString("iv"),
            tag = payloadObj.getString("tag"),
            ct = payloadObj.getString("ct")
        )

        assertThrows(Exception::class.java) {
            CryptoSpec.unwrapKey(wrongKek, payload, aadString)
        }
    }

    @Test
    fun `test negative vector - reordered stream chunks must fail AAD binding`() {
        val chunksArray = vectorJson.getJSONArray("chunks")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val fileIdStr = chunksArray.getJSONObject(0).getString("file_id")

        // Chunk 1 presented at chunkIndex 0
        val wireChunk1 = CryptoSpec.hexToBytes(chunksArray.getJSONObject(1).getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk1)
        val wrongAadForChunk0 = CryptoSpec.buildChunkAAD(fileIdStr, 0, 2, false)

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, wrongAadForChunk0)
        }
    }

    @Test
    fun `test negative vector - truncated stream missing final chunk must fail`() {
        val chunksArray = vectorJson.getJSONArray("chunks")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val fileIdStr = chunksArray.getJSONObject(0).getString("file_id")

        // Chunk 0 evaluated as only chunk (totalChunks=1, isFinal=true)
        val wireChunk0 = CryptoSpec.hexToBytes(chunksArray.getJSONObject(0).getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk0)
        val truncatedAad = CryptoSpec.buildChunkAAD(fileIdStr, 0, 1, true)

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, truncatedAad)
        }
    }

    @Test
    fun `test negative vector - duplicated chunk in stream must fail`() {
        val chunksArray = vectorJson.getJSONArray("chunks")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val fileIdStr = chunksArray.getJSONObject(0).getString("file_id")

        // Chunk 0 presented again at index 1
        val wireChunk0 = CryptoSpec.hexToBytes(chunksArray.getJSONObject(0).getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk0)
        val aadIndex1 = CryptoSpec.buildChunkAAD(fileIdStr, 1, 2, true)

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aadIndex1)
        }
    }

    @Test
    fun `test negative vector - extra extraneous chunk beyond total_chunks must fail`() {
        val chunksArray = vectorJson.getJSONArray("chunks")
        val fek = CryptoSpec.hexToBytes(vectorJson.getJSONObject("metadata").getString("fek_hex"))
        val fileIdStr = chunksArray.getJSONObject(0).getString("file_id")

        val wireChunk1 = CryptoSpec.hexToBytes(chunksArray.getJSONObject(1).getString("wire_chunk_hex"))
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk1)
        // If total_chunks is 3 instead of 2
        val extraChunkAad = CryptoSpec.buildChunkAAD(fileIdStr, 1, 3, false)

        assertThrows(Exception::class.java) {
            CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, extraChunkAad)
        }
    }
}
