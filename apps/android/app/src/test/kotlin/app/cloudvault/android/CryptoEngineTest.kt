package app.cloudvault.android

import app.cloudvault.android.data.crypto.AndroidCryptoEngine
import app.cloudvault.android.data.crypto.Bip39Wordlist
import app.cloudvault.android.data.crypto.CryptoSpec
import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.BeforeClass
import org.junit.Test
import java.io.File
import java.nio.charset.StandardCharsets

class CryptoEngineTest {

    companion object {
        private lateinit var vectorJson: JsonObject

        @JvmStatic
        @BeforeClass
        fun setUp() {
            var vectorFile = File("test-vectors/v1.json")
            if (!vectorFile.exists()) {
                vectorFile = File("../../../packages/crypto-spec/test-vectors/v1.json")
            }
            if (!vectorFile.exists()) {
                vectorFile = File("packages/crypto-spec/test-vectors/v1.json")
            }
            assertTrue("Test vector file must exist at ${vectorFile.absolutePath}", vectorFile.exists())
            val content = vectorFile.readText(StandardCharsets.UTF_8)
            vectorJson = Json.parseToJsonElement(content).jsonObject
        }
    }

    private val engine = AndroidCryptoEngine()

    @Test
    fun testBip39WordlistCount() {
        assertEquals(2048, Bip39Wordlist.WORDS.size)
        assertEquals("abandon", Bip39Wordlist.getWord(0))
        assertEquals("zoo", Bip39Wordlist.getWord(2047))
    }

    @Test
    fun testArgon2idAndHkdfMatchesKnownAnswer() {
        val kdf = vectorJson["kdf"]!!.jsonObject
        val password = kdf["password"]!!.jsonPrimitive.content
        val salt = CryptoSpec.hexToBytes(kdf["salt_hex"]!!.jsonPrimitive.content)

        val derived = engine.deriveKeys(password, salt)

        assertEquals(kdf["raw_prk_hex"]!!.jsonPrimitive.content, CryptoSpec.bytesToHex(derived.prk))
        assertEquals(kdf["auth_key_hex"]!!.jsonPrimitive.content, CryptoSpec.bytesToHex(derived.authKey))
        assertEquals(kdf["kek_hex"]!!.jsonPrimitive.content, CryptoSpec.bytesToHex(derived.kek))
    }

    @Test
    fun testMasterKeyEnvelopeUnwrapping() {
        val masterWrap = vectorJson["master_key_wrap"]!!.jsonObject
        val kek = CryptoSpec.hexToBytes(masterWrap["kek_hex"]!!.jsonPrimitive.content)
        val expectedMasterKey = masterWrap["master_key_hex"]!!.jsonPrimitive.content
        val payloadObj = masterWrap["payload"]!!.jsonObject

        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj["v"]!!.jsonPrimitive.int,
            iv = payloadObj["iv"]!!.jsonPrimitive.content,
            tag = payloadObj["tag"]!!.jsonPrimitive.content,
            ct = payloadObj["ct"]!!.jsonPrimitive.content
        )

        val unwrapped = CryptoSpec.unwrapKey(kek, payload, masterWrap["aad_string"]!!.jsonPrimitive.content)
        assertEquals(expectedMasterKey, CryptoSpec.bytesToHex(unwrapped))
    }

    @Test
    fun testRecoveryKitUnwrapsMasterKey() {
        val recovery = vectorJson["recovery"]!!.jsonObject
        val words = recovery["mnemonic"]!!.jsonPrimitive.content.split(" ")
        assertEquals(24, words.size)

        val recoveryKek = engine.deriveRecoveryKey(words)
        val expectedRecoveryKeyHex = recovery["recovery_key_hex"]!!.jsonPrimitive.content
        assertEquals(expectedRecoveryKeyHex, CryptoSpec.bytesToHex(recoveryKek))

        val payloadObj = recovery["payload"]!!.jsonObject
        val payload = CryptoSpec.KeyWrapPayload(
            v = payloadObj["v"]!!.jsonPrimitive.int,
            iv = payloadObj["iv"]!!.jsonPrimitive.content,
            tag = payloadObj["tag"]!!.jsonPrimitive.content,
            ct = payloadObj["ct"]!!.jsonPrimitive.content
        )

        val unwrappedMasterKey = engine.unwrapRecoveryKey(recoveryKek, payload)
        val expectedMasterKeyHex = recovery["master_key_hex"]!!.jsonPrimitive.content
        assertEquals(expectedMasterKeyHex, CryptoSpec.bytesToHex(unwrappedMasterKey))
    }

    @Test
    fun testChunkEncryptionDecryptionWithAAD() {
        val chunksArray = vectorJson["chunks"]!!.jsonArray
        val chunk0 = chunksArray[0].jsonObject
        val meta = vectorJson["metadata"]!!.jsonObject
        val fek = CryptoSpec.hexToBytes(meta["fek_hex"]!!.jsonPrimitive.content)

        val wireChunk = CryptoSpec.hexToBytes(chunk0["wire_chunk_hex"]!!.jsonPrimitive.content)
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)

        assertEquals(chunk0["iv_hex"]!!.jsonPrimitive.content, CryptoSpec.bytesToHex(iv))
        assertEquals(chunk0["ciphertext_hex"]!!.jsonPrimitive.content, CryptoSpec.bytesToHex(ciphertext))
        assertEquals(chunk0["tag_hex"]!!.jsonPrimitive.content, CryptoSpec.bytesToHex(tag))

        val aad = CryptoSpec.hexToBytes(chunk0["aad_hex"]!!.jsonPrimitive.content)
        val decrypted = CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)

        assertEquals(chunk0["plaintext_ascii"]!!.jsonPrimitive.content, String(decrypted, StandardCharsets.UTF_8))
    }

    @Test(expected = Exception::class)
    fun testTamperedTagMustFail() {
        val chunksArray = vectorJson["chunks"]!!.jsonArray
        val chunk0 = chunksArray[0].jsonObject
        val meta = vectorJson["metadata"]!!.jsonObject
        val fek = CryptoSpec.hexToBytes(meta["fek_hex"]!!.jsonPrimitive.content)

        val wireChunk = CryptoSpec.hexToBytes(chunk0["wire_chunk_hex"]!!.jsonPrimitive.content)
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)
        tag[0] = (tag[0].toInt() xor 0xFF).toByte() // Tamper tag
        val aad = CryptoSpec.hexToBytes(chunk0["aad_hex"]!!.jsonPrimitive.content)

        CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)
    }

    @Test(expected = Exception::class)
    fun testTamperedAADMustFail() {
        val chunksArray = vectorJson["chunks"]!!.jsonArray
        val chunk0 = chunksArray[0].jsonObject
        val meta = vectorJson["metadata"]!!.jsonObject
        val fek = CryptoSpec.hexToBytes(meta["fek_hex"]!!.jsonPrimitive.content)

        val wireChunk = CryptoSpec.hexToBytes(chunk0["wire_chunk_hex"]!!.jsonPrimitive.content)
        val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunk)
        val aad = CryptoSpec.hexToBytes(chunk0["aad_hex"]!!.jsonPrimitive.content)
        aad[0] = (aad[0].toInt() xor 0xFF).toByte() // Tamper AAD format version

        CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)
    }
}
